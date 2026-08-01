/**
 * Docker Service for MCP Server Control
 * Manages Docker container lifecycle from Electron
 */

import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import Store from 'electron-store';
import path from 'path';
import { app } from 'electron';

const execFileAsync = promisify(execFile);
const store = new Store();

const CONTAINER_NAME = 'bytepad-mcp';
const IMAGE_NAME = 'bytepad/mcp-server';
const IMAGE_TAG = '0.24.3';
const DEFAULT_PORT = 3847;
const DEFAULT_LOG_LINES = 100;
const MIN_PORT = 1;
const MAX_PORT = 65535;
const MIN_LOG_LINES = 1;
const MAX_LOG_LINES = 100000;

// Docker CLI paths to check on different platforms
const DOCKER_PATHS = [
  'docker', // Default PATH
  '/usr/local/bin/docker', // macOS Intel / Homebrew
  '/opt/homebrew/bin/docker', // macOS Apple Silicon
  '/Applications/Docker.app/Contents/Resources/bin/docker', // Docker Desktop direct
];

export interface DockerStatus {
  installed: boolean;
  running: boolean;
  containerId: string | null;
  containerStatus: string | null;
  port: number;
  error: string | null;
}

// Cache the resolved docker path
let resolvedDockerPath: string | null = null;

/**
 * Extract a readable error message, including stderr when available, from a
 * failed child_process invocation.
 */
function extractErrorMessage(err: unknown): string {
  const e = err as (Error & { stderr?: string }) | undefined;
  if (!e) return 'Unknown error';
  return [e.message, e.stderr].filter(Boolean).join('\n');
}

/**
 * Clamp/validate a port value coming from persisted settings. Falls back to
 * the default port for anything that isn't a valid TCP port number.
 */
function sanitizePort(value: unknown): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < MIN_PORT || n > MAX_PORT) {
    return DEFAULT_PORT;
  }
  return n;
}

/**
 * Clamp/validate the number of log lines requested. Falls back to the
 * default line count for anything that isn't a sane positive integer.
 */
function sanitizeLogLines(value: unknown): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < MIN_LOG_LINES || n > MAX_LOG_LINES) {
    return DEFAULT_LOG_LINES;
  }
  return n;
}

/**
 * Validate a data directory path coming from persisted settings. Only
 * accepts non-empty absolute paths; anything else is treated as "not set".
 */
function sanitizeDataDir(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || !path.isAbsolute(trimmed)) return '';
  return trimmed;
}

/**
 * Find the Docker CLI path
 */
async function findDockerPath(): Promise<string | null> {
  if (resolvedDockerPath) {
    return resolvedDockerPath;
  }

  for (const dockerPath of DOCKER_PATHS) {
    try {
      await execFileAsync(dockerPath, ['--version']);
      resolvedDockerPath = dockerPath;
      return dockerPath;
    } catch {
      // Try next path
    }
  }
  return null;
}

/**
 * Run a docker CLI command with an argv array (no shell involved), so
 * arguments are never subject to shell interpretation/injection.
 */
async function runDocker(args: string[]): Promise<{ stdout: string; stderr: string }> {
  const dockerPath = await findDockerPath();
  if (!dockerPath) {
    throw new Error('Docker CLI not found');
  }
  return execFileAsync(dockerPath, args);
}

/**
 * Check if Docker is installed and running
 */
export async function isDockerInstalled(): Promise<boolean> {
  const dockerPath = await findDockerPath();
  return dockerPath !== null;
}

/**
 * Check if Docker daemon is running
 */
export async function isDockerRunning(): Promise<boolean> {
  try {
    await runDocker(['info']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get Docker container status
 */
export async function getDockerStatus(): Promise<DockerStatus> {
  const status: DockerStatus = {
    installed: false,
    running: false,
    containerId: null,
    containerStatus: null,
    port: sanitizePort(store.get('mcp.docker.port', DEFAULT_PORT)),
    error: null,
  };

  try {
    status.installed = await isDockerInstalled();
    if (!status.installed) {
      status.error = 'Docker is not installed';
      return status;
    }

    const dockerRunning = await isDockerRunning();
    if (!dockerRunning) {
      status.error = 'Docker daemon is not running';
      return status;
    }

    // Check if container exists
    const { stdout } = await runDocker([
      'ps',
      '-a',
      '--filter',
      `name=${CONTAINER_NAME}`,
      '--format',
      '{{.ID}}|{{.Status}}',
    ]);

    if (stdout.trim()) {
      const [containerId, containerStatus] = stdout.trim().split('|');
      status.containerId = containerId;
      status.containerStatus = containerStatus;
      status.running = containerStatus?.toLowerCase().includes('up') || false;
    }

    return status;
  } catch (err) {
    status.error = extractErrorMessage(err);
    return status;
  }
}

/**
 * Build Docker image from local Dockerfile
 */
export async function buildDockerImage(
  onProgress?: (message: string) => void
): Promise<boolean> {
  const dockerfilePath = path.join(app.getAppPath(), 'docker', 'mcp-server');
  const dockerPath = await findDockerPath();

  if (!dockerPath) {
    onProgress?.('Docker CLI not found');
    return false;
  }

  return new Promise((resolve) => {
    const buildProcess = spawn(dockerPath, [
      'build',
      '-t',
      `${IMAGE_NAME}:${IMAGE_TAG}`,
      dockerfilePath,
    ]);

    buildProcess.stdout.on('data', (data) => {
      onProgress?.(data.toString());
    });

    buildProcess.stderr.on('data', (data) => {
      onProgress?.(data.toString());
    });

    buildProcess.on('close', (code) => {
      resolve(code === 0);
    });

    buildProcess.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Write the MCP API key to a private (0600) temp file so it can be passed to
 * `docker run` via --env-file instead of as a CLI argument, which would
 * otherwise be visible to any local user via `ps aux`.
 */
async function writeApiKeyEnvFile(apiKey: string): Promise<string> {
  const filePath = path.join(
    os.tmpdir(),
    `bytepad-mcp-env-${crypto.randomBytes(16).toString('hex')}`
  );
  await fs.promises.writeFile(filePath, `BYTEPAD_API_KEY=${apiKey}\n`, { mode: 0o600 });
  return filePath;
}

/**
 * Start MCP Docker container
 */
export async function startDockerContainer(): Promise<{ success: boolean; error?: string }> {
  let envFilePath: string | null = null;
  try {
    const status = await getDockerStatus();

    if (!status.installed) {
      return { success: false, error: 'Docker is not installed' };
    }

    if (status.error && status.error.includes('daemon')) {
      return { success: false, error: 'Docker daemon is not running. Please start Docker Desktop.' };
    }

    const port = sanitizePort(store.get('mcp.docker.port', DEFAULT_PORT));
    const apiKey = store.get('mcp.apiKey', '') as string;
    const dataDir = sanitizeDataDir(store.get('mcp.docker.dataDir', ''));

    // If container exists but stopped, start it
    if (status.containerId && !status.running) {
      await runDocker(['start', CONTAINER_NAME]);
      store.set('mcp.docker.enabled', true);
      return { success: true };
    }

    // If container is already running, return success
    if (status.running) {
      return { success: true };
    }

    // Create and start new container
    const volumeArgs = dataDir
      ? ['-v', `${dataDir}:/app/data`]
      : ['-v', 'bytepad-mcp-data:/app/data'];

    envFilePath = await writeApiKeyEnvFile(apiKey);

    const runArgs = [
      'run',
      '-d',
      '--name',
      CONTAINER_NAME,
      '-p',
      `${port}:3847`,
      '-e',
      'MCP_PORT=3847',
      '-e',
      'MCP_HOST=0.0.0.0',
      '--env-file',
      envFilePath,
      '-e',
      'LOG_LEVEL=info',
      ...volumeArgs,
      '--restart',
      'unless-stopped',
      `${IMAGE_NAME}:${IMAGE_TAG}`,
    ];

    await runDocker(runArgs);
    store.set('mcp.docker.enabled', true);
    return { success: true };
  } catch (err) {
    const errorMessage = extractErrorMessage(err);

    // Check if image doesn't exist
    if (errorMessage.includes('Unable to find image') || errorMessage.includes('No such image')) {
      return {
        success: false,
        error: `Docker image not found. Please build it first with: docker-compose build`,
      };
    }

    // Check if port is in use
    if (errorMessage.includes('port is already allocated')) {
      return {
        success: false,
        error: `Port ${sanitizePort(store.get('mcp.docker.port', DEFAULT_PORT))} is already in use`,
      };
    }

    return { success: false, error: errorMessage };
  } finally {
    if (envFilePath) {
      await fs.promises.unlink(envFilePath).catch(() => {});
    }
  }
}

/**
 * Stop MCP Docker container
 */
export async function stopDockerContainer(): Promise<{ success: boolean; error?: string }> {
  try {
    const status = await getDockerStatus();

    if (!status.containerId) {
      store.set('mcp.docker.enabled', false);
      return { success: true };
    }

    await runDocker(['stop', CONTAINER_NAME]);
    store.set('mcp.docker.enabled', false);
    return { success: true };
  } catch (err) {
    return { success: false, error: extractErrorMessage(err) };
  }
}

/**
 * Remove MCP Docker container
 */
export async function removeDockerContainer(): Promise<{ success: boolean; error?: string }> {
  try {
    await stopDockerContainer();
    await runDocker(['rm', CONTAINER_NAME]);
    return { success: true };
  } catch (err) {
    const errorMessage = extractErrorMessage(err);
    // Ignore error if container doesn't exist
    if (errorMessage.includes('No such container')) {
      return { success: true };
    }
    return { success: false, error: errorMessage };
  }
}

/**
 * Get container logs
 */
export async function getContainerLogs(lines: number = DEFAULT_LOG_LINES): Promise<string> {
  try {
    const safeLines = sanitizeLogLines(lines);
    const { stdout } = await runDocker(['logs', '--tail', String(safeLines), CONTAINER_NAME]);
    return stdout;
  } catch {
    return '';
  }
}

/**
 * Pull latest image from registry
 */
export async function pullDockerImage(): Promise<{ success: boolean; error?: string }> {
  try {
    await runDocker(['pull', `${IMAGE_NAME}:${IMAGE_TAG}`]);
    return { success: true };
  } catch (err) {
    return { success: false, error: extractErrorMessage(err) };
  }
}

/**
 * Check if image exists locally
 */
export async function imageExists(): Promise<boolean> {
  try {
    const { stdout } = await runDocker(['images', '-q', `${IMAGE_NAME}:${IMAGE_TAG}`]);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}
