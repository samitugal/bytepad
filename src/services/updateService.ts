/**
 * Update Service
 * Checks GitHub Releases for new versions
 */

import { logger } from '../utils/logger';
import { getKnownVersion, resolveAppVersion } from '../utils/appVersion';

const GITHUB_REPO = 'samitugal/bytepad';
const CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours
const CACHE_KEY = 'bytepad-update-check';

export interface ReleaseInfo {
  version: string;
  name: string;
  body: string;
  htmlUrl: string;
  publishedAt: string;
  assets: {
    name: string;
    downloadUrl: string;
    size: number;
  }[];
}

interface CachedCheck {
  lastCheck: number;
  latestVersion: string | null;
  releaseInfo: ReleaseInfo | null;
}

interface ParsedVersion {
  core: number[]; // [major, minor, patch, ...] - as many components as present
  prerelease: string | null; // e.g. "beta.1", or null for a plain release
}

/**
 * Parse a version string into comparable parts.
 *
 * Accepts an optional leading "v" (GitHub tags here are "vX.Y.Z") and an
 * optional "-prerelease" suffix (e.g. "1.2.0-beta.1"). Each dot-separated
 * numeric component is compared on its own - NOT folded into a single
 * number, which is what let ordering silently break once any component hit
 * 100 (e.g. the old `major*10000 + minor*100 + patch` ranked 0.25.150 above
 * 0.26.0, and tied 0.25.0 with 0.24.100).
 */
function parseVersion(version: string): ParsedVersion {
  const clean = version.trim().replace(/^v/i, '');
  const [corePart, ...prereleaseParts] = clean.split('-');
  const core = corePart.split('.').map((part) => {
    const n = Number(part);
    return Number.isFinite(n) ? n : 0;
  });
  const prerelease = prereleaseParts.length > 0 ? prereleaseParts.join('-') : null;
  return { core, prerelease };
}

/**
 * Compare two version strings component-by-component (proper semver-ish
 * ordering, not a single encoded number).
 * Returns: 1 if a > b, -1 if a < b, 0 if equal.
 *
 * Pre-release handling follows semver's intent: a pre-release is *lower*
 * than the same core version without one (e.g. "1.2.0-beta" < "1.2.0"),
 * since a prerelease build is not yet the release it's tagged for. Beyond
 * that, pre-release suffixes are compared as plain strings - good enough
 * for update-availability checks, which only need a stable, correct
 * ordering, not full semver precedence semantics.
 */
function compareVersions(a: string, b: string): number {
  const vA = parseVersion(a);
  const vB = parseVersion(b);

  const len = Math.max(vA.core.length, vB.core.length);
  for (let i = 0; i < len; i++) {
    const partA = vA.core[i] ?? 0;
    const partB = vB.core[i] ?? 0;
    if (partA !== partB) return partA > partB ? 1 : -1;
  }

  if (vA.prerelease === vB.prerelease) return 0;
  if (vA.prerelease === null) return 1; // release > prerelease of the same core version
  if (vB.prerelease === null) return -1;
  return vA.prerelease > vB.prerelease ? 1 : -1;
}

/**
 * Get cached check result
 */
function getCachedCheck(): CachedCheck | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Save check result to cache
 */
function setCachedCheck(data: CachedCheck): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Fetch latest release from GitHub API
 */
async function fetchLatestRelease(): Promise<ReleaseInfo | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      logger.warn('[Update] Failed to fetch release:', response.status);
      return null;
    }

    const data = await response.json();

    return {
      version: data.tag_name?.replace(/^v/, '') || '',
      name: data.name || data.tag_name || '',
      body: data.body || '',
      htmlUrl: data.html_url || '',
      publishedAt: data.published_at || '',
      assets: (data.assets || []).map((asset: {
        name: string;
        browser_download_url: string;
        size: number;
      }) => ({
        name: asset.name,
        downloadUrl: asset.browser_download_url,
        size: asset.size,
      })),
    };
  } catch (error) {
    logger.warn('[Update] Error fetching release:', error);
    return null;
  }
}

/**
 * Check for updates
 * Returns release info if update available, null otherwise
 */
export async function checkForUpdates(force = false): Promise<ReleaseInfo | null> {
  // Resolve the live running version first (a no-op after the first call -
  // see src/utils/appVersion.ts). Every comparison below uses this, not the
  // build-time fallback, so Electron always compares against app.getVersion().
  const currentVersion = await resolveAppVersion();

  // Check cache first (unless forced)
  if (!force) {
    const cached = getCachedCheck();
    if (cached && Date.now() - cached.lastCheck < CHECK_INTERVAL) {
      // Return cached result
      if (cached.releaseInfo && compareVersions(cached.latestVersion || '', currentVersion) > 0) {
        return cached.releaseInfo;
      }
      return null;
    }
  }

  // Fetch latest release
  const release = await fetchLatestRelease();

  // Update cache
  setCachedCheck({
    lastCheck: Date.now(),
    latestVersion: release?.version || null,
    releaseInfo: release,
  });

  // Check if newer version
  if (release && compareVersions(release.version, currentVersion) > 0) {
    logger.info(`[Update] New version available: ${release.version} (current: ${currentVersion})`);
    return release;
  }

  logger.info(`[Update] No updates available (current: ${currentVersion})`);
  return null;
}

/**
 * Get current app version - best value known synchronously right now (see
 * src/utils/appVersion.ts). Use `resolveCurrentVersion()` when you need the
 * guaranteed-live value and can await it.
 */
export function getCurrentVersion(): string {
  return getKnownVersion();
}

/**
 * Resolves the authoritative current version (live app.getVersion() in
 * Electron, build-time constant on the web). Re-exported here so consumers
 * of this service don't need to reach into src/utils/appVersion directly.
 */
export const resolveCurrentVersion = resolveAppVersion;

/**
 * Dismiss update notification (for this version)
 */
export function dismissUpdate(version: string): void {
  try {
    localStorage.setItem('bytepad-dismissed-update', version);
  } catch {
    // Ignore
  }
}

/**
 * Check if update was dismissed
 */
export function isUpdateDismissed(version: string): boolean {
  try {
    return localStorage.getItem('bytepad-dismissed-update') === version;
  } catch {
    return false;
  }
}
