/**
 * Single source of truth for "what version is this running build" in the
 * renderer.
 *
 * Two paths feed it, both ultimately derived from package.json's `version`
 * field - neither is a second source of truth, just two ways of reaching it:
 *
 *  - Electron: authoritative and live. Read via `app.getVersion()` in the
 *    main process, exposed to the renderer over the *existing* preload
 *    bridge - `electron/main.ts` already registers an `app:version` IPC
 *    handler and `electron/preload.ts` already exposes it as
 *    `window.electronAPI.getVersion()`. Nothing new was added to the bridge
 *    for this.
 *  - Web/PWA (and as the synchronous value before the IPC round-trip above
 *    resolves, in Electron): `__APP_VERSION__`, a compile-time constant
 *    injected by Vite's `define` from package.json (see the `define` block
 *    in vite.config.ts and electron.vite.config.ts). There is no running
 *    "app" object to ask in a plain browser tab, so build time is the
 *    latest point this can be resolved at - and it still traces back to the
 *    same package.json field.
 */

// __APP_VERSION__ is declared globally in src/vite-env.d.ts.
export const BUILD_VERSION = __APP_VERSION__;

let resolved = BUILD_VERSION;
let resolving: Promise<string> | null = null;

/**
 * Best version known synchronously right now. Correct immediately on the
 * web build; in Electron it starts as the build-time value and flips to the
 * live `app.getVersion()` result once `resolveAppVersion()` has completed.
 */
export function getKnownVersion(): string {
  return resolved;
}

/**
 * Resolves (and caches) the authoritative version for this running build.
 * Safe to call repeatedly - only the first call does any IPC work.
 */
export function resolveAppVersion(): Promise<string> {
  if (!resolving) {
    resolving = (async () => {
      if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
        try {
          resolved = await window.electronAPI.getVersion();
        } catch {
          // Keep the build-time fallback - a broken IPC call shouldn't crash
          // version display, just leave it slightly less "live".
        }
      }
      return resolved;
    })();
  }
  return resolving;
}
