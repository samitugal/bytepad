/**
 * Docker Service for MCP Server Control
 * Manages Docker container lifecycle from Electron
 */

import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import Store from 'electron-store';
import path from 'path';
import { app } from 'electron';

const execAsync = promisify(exec);
const store = new Store();

const CONTAINER_NAME = 'bytepad-mcp';
const IMAGE_NAME = 'bytepad/mcp-server';
const IMAGE_TAG = '0.24.3';
const DEFAULT_PORT = 3847;

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
 * Find the Docker CLI path
 */
async function findDockerPath(): Promise<string | null> {
  if (resolvedDockerPath) {
    return resolvedDockerPath;
  }

  for (const dockerPath of DOCKER_PATHS) {
    try {
      await execAsync(`"${dockerPath}" --version`);
      resolvedDockerPath = dockerPath;
      return dockerPath;
    } catch {
      // Try next path
    }
  }
  return null;
}

/**
 * Get docker command with resolved path
 */
async function getDockerCommand(args: string): Promise<string> {
  const dockerPath = await findDockerPath();
  if (!dockerPath) {
    throw new Error('Docker CLI not found');
  }
  return `"${dockerPath}" ${args}`;
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
    const cmd = await getDockerCommand('info');
    await execAsync(cmd);
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
    port: store.get('mcp.docker.port', DEFAULT_PORT) as number,
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
    const cmd = await getDockerCommand(`ps -a --filter "name=${CONTAINER_NAME}" --format "{{.ID}}|{{.Status}}"`);
    const { stdout } = await execAsync(cmd);

    if (stdout.trim()) {
      const [containerId, containerStatus] = stdout.trim().split('|');
      status.containerId = containerId;
      status.containerStatus = containerStatus;
      status.running = containerStatus?.toLowerCase().includes('up') || false;
    }

    return status;
  } catch (err) {
    status.error = (err as Error).message;
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
 * Start MCP Docker container
 */
export async function startDockerContainer(): Promise<{ success: boolean; error?: string }> {
  try {
    const status = await getDockerStatus();

    if (!status.installed) {
      return { success: false, error: 'Docker is not installed' };
    }

    if (status.error && status.error.includes('daemon')) {
      return { success: false, error: 'Docker daemon is not running. Please start Docker Desktop.' };
    }

    const port = store.get('mcp.docker.port', DEFAULT_PORT) as number;
    const apiKey = store.get('mcp.apiKey', '') as string;
    const dataDir = store.get('mcp.docker.dataDir', '') as string;

    // If container exists but stopped, start it
    if (status.containerId && !status.running) {
      const startCmd = await getDockerCommand(`start ${CONTAINER_NAME}`);
      await execAsync(startCmd);
      store.set('mcp.docker.enabled', true);
      return { success: true };
    }

    // If container is already running, return success
    if (status.running) {
      return { success: true };
    }

    // Create and start new container
    const volumeMount = dataDir
      ? `-v "${dataDir}:/app/data"`
      : '-v bytepad-mcp-data:/app/data';

    const runCmd = await getDockerCommand([
      'run -d',
      `--name ${CONTAINER_NAME}`,
      `-p ${port}:3847`,
      `-e MCP_PORT=3847`,
      `-e MCP_HOST=0.0.0.0`,
      `-e BYTEPAD_API_KEY=${apiKey}`,
      `-e LOG_LEVEL=info`,
      volumeMount,
      '--restart unless-stopped',
      `${IMAGE_NAME}:${IMAGE_TAG}`,
    ].join(' '));

    await execAsync(runCmd);
    store.set('mcp.docker.enabled', true);
    return { success: true };
  } catch (err) {
    const errorMessage = (err as Error).message;

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
        error: `Port ${store.get('mcp.docker.port', DEFAULT_PORT)} is already in use`,
      };
    }

    return { success: false, error: errorMessage };
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

    const cmd = await getDockerCommand(`stop ${CONTAINER_NAME}`);
    await execAsync(cmd);
    store.set('mcp.docker.enabled', false);
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Remove MCP Docker container
 */
export async function removeDockerContainer(): Promise<{ success: boolean; error?: string }> {
  try {
    await stopDockerContainer();
    const cmd = await getDockerCommand(`rm ${CONTAINER_NAME}`);
    await execAsync(cmd);
    return { success: true };
  } catch (err) {
    // Ignore error if container doesn't exist
    if ((err as Error).message.includes('No such container')) {
      return { success: true };
    }
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Get container logs
 */
export async function getContainerLogs(lines: number = 100): Promise<string> {
  try {
    const cmd = await getDockerCommand(`logs --tail ${lines} ${CONTAINER_NAME}`);
    const { stdout } = await execAsync(cmd);
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
    const cmd = await getDockerCommand(`pull ${IMAGE_NAME}:${IMAGE_TAG}`);
    await execAsync(cmd);
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Check if image exists locally
 */
export async function imageExists(): Promise<boolean> {
  try {
    const cmd = await getDockerCommand(`images -q ${IMAGE_NAME}:${IMAGE_TAG}`);
    const { stdout } = await execAsync(cmd);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}
