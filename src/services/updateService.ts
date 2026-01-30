/**
 * Update Service
 * Checks GitHub Releases for new versions
 */

const GITHUB_REPO = 'samitugal/bytepad';
const CURRENT_VERSION = '0.24.0';
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

/**
 * Parse version string to comparable number
 * "0.23.2" -> 23002
 */
function parseVersion(version: string): number {
  const clean = version.replace(/^v/, '');
  const parts = clean.split('.').map(Number);
  return (parts[0] || 0) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);
}

/**
 * Compare two versions
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
  const vA = parseVersion(a);
  const vB = parseVersion(b);
  if (vA > vB) return 1;
  if (vA < vB) return -1;
  return 0;
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
      console.warn('[Update] Failed to fetch release:', response.status);
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
    console.warn('[Update] Error fetching release:', error);
    return null;
  }
}

/**
 * Check for updates
 * Returns release info if update available, null otherwise
 */
export async function checkForUpdates(force = false): Promise<ReleaseInfo | null> {
  // Check cache first (unless forced)
  if (!force) {
    const cached = getCachedCheck();
    if (cached && Date.now() - cached.lastCheck < CHECK_INTERVAL) {
      // Return cached result
      if (cached.releaseInfo && compareVersions(cached.latestVersion || '', CURRENT_VERSION) > 0) {
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
  if (release && compareVersions(release.version, CURRENT_VERSION) > 0) {
    console.log(`[Update] New version available: ${release.version} (current: ${CURRENT_VERSION})`);
    return release;
  }

  console.log(`[Update] No updates available (current: ${CURRENT_VERSION})`);
  return null;
}

/**
 * Get current app version
 */
export function getCurrentVersion(): string {
  return CURRENT_VERSION;
}

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
