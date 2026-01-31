# Sprint 40: Auto-Update Feature

**Goal:** Implement automatic app updates via GitHub Releases
**Duration:** 3-4 days
**Priority:** HIGH
**Status:** PLANNED

---

## Problem Statement

Currently, when a new version is available:
- User sees "New version available" banner
- Clicking opens GitHub releases page in browser
- User must manually download and install

**Desired behavior:**
- User clicks "Update" button
- App automatically downloads and installs the new version
- App restarts with the new version

---

## Technical Approach

### Option 1: electron-updater (Recommended)

**Pros:**
- Official electron-builder solution
- Works with GitHub Releases (already using)
- Handles differential updates
- Cross-platform support
- Well documented

**Cons:**
- Requires code signing for macOS (notarization)
- Windows may show SmartScreen warning without EV certificate

**Implementation:**
```bash
npm install electron-updater
```

### Option 2: Manual Download + Replace

**Pros:**
- No code signing required
- Full control over process

**Cons:**
- More complex implementation
- Must handle platform differences manually
- No differential updates

---

## Implementation Plan

### Phase 1: Setup electron-updater

1. **Install dependency**
   ```bash
   npm install electron-updater
   ```

2. **Configure electron-builder** (`electron-builder.yml`)
   ```yaml
   publish:
     provider: github
     owner: samitugal
     repo: bytepad
   ```

3. **Create autoUpdater service** (`electron/services/autoUpdater.ts`)
   ```typescript
   import { autoUpdater } from 'electron-updater';
   import { BrowserWindow } from 'electron';

   export function initAutoUpdater(mainWindow: BrowserWindow) {
     autoUpdater.autoDownload = false;
     autoUpdater.autoInstallOnAppQuit = true;

     autoUpdater.on('update-available', (info) => {
       mainWindow.webContents.send('update:available', info);
     });

     autoUpdater.on('download-progress', (progress) => {
       mainWindow.webContents.send('update:progress', progress);
     });

     autoUpdater.on('update-downloaded', (info) => {
       mainWindow.webContents.send('update:downloaded', info);
     });

     autoUpdater.on('error', (error) => {
       mainWindow.webContents.send('update:error', error.message);
     });
   }

   export function checkForUpdates() {
     autoUpdater.checkForUpdates();
   }

   export function downloadUpdate() {
     autoUpdater.downloadUpdate();
   }

   export function installUpdate() {
     autoUpdater.quitAndInstall();
   }
   ```

### Phase 2: IPC Bridge

4. **Add IPC handlers** (`electron/main.ts`)
   ```typescript
   ipcMain.handle('update:check', () => checkForUpdates());
   ipcMain.handle('update:download', () => downloadUpdate());
   ipcMain.handle('update:install', () => installUpdate());
   ```

5. **Add to preload** (`electron/preload.ts`)
   ```typescript
   autoUpdate: {
     check: () => ipcRenderer.invoke('update:check'),
     download: () => ipcRenderer.invoke('update:download'),
     install: () => ipcRenderer.invoke('update:install'),
     onAvailable: (cb) => ipcRenderer.on('update:available', (_, info) => cb(info)),
     onProgress: (cb) => ipcRenderer.on('update:progress', (_, progress) => cb(progress)),
     onDownloaded: (cb) => ipcRenderer.on('update:downloaded', (_, info) => cb(info)),
     onError: (cb) => ipcRenderer.on('update:error', (_, error) => cb(error)),
   }
   ```

### Phase 3: UI Components

6. **Update Banner component** (`src/components/common/UpdateBanner.tsx`)
   - Add "Download" button (shows progress)
   - Add "Install & Restart" button (after download)
   - Show download progress bar
   - Handle error states

7. **Update hook** (`src/hooks/useAutoUpdate.ts`)
   ```typescript
   export function useAutoUpdate() {
     const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'ready'>('idle');
     const [progress, setProgress] = useState(0);
     const [error, setError] = useState<string | null>(null);

     // ... implementation
   }
   ```

### Phase 4: Code Signing (Optional but Recommended)

8. **macOS Code Signing**
   - Apple Developer account required ($99/year)
   - Create Developer ID Application certificate
   - Configure notarization in electron-builder

9. **Windows Code Signing**
   - EV certificate recommended (expensive)
   - Or accept SmartScreen warnings

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `electron/services/autoUpdater.ts` | CREATE | Auto-updater service |
| `electron/main.ts` | MODIFY | Add IPC handlers |
| `electron/preload.ts` | MODIFY | Expose update API |
| `src/hooks/useAutoUpdate.ts` | CREATE | React hook for updates |
| `src/components/common/UpdateBanner.tsx` | MODIFY | Add download/install UI |
| `electron-builder.yml` | MODIFY | Add publish config |
| `package.json` | MODIFY | Add electron-updater dep |

---

## UI Flow

```
┌─────────────────────────────────────────────────────────┐
│  🎉 New version v0.25.0 available!                      │
│                                                          │
│  [View Changes]  [Download Update]  [Dismiss]           │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼ (click Download)
┌─────────────────────────────────────────────────────────┐
│  ⬇️ Downloading v0.25.0...                              │
│  ████████████████░░░░░░░░░░░░░░ 45%                    │
│                                                          │
│  [Cancel]                                                │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼ (download complete)
┌─────────────────────────────────────────────────────────┐
│  ✅ Update ready! Restart to apply v0.25.0             │
│                                                          │
│  [Restart Now]  [Later]                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

- [ ] Check for updates works
- [ ] Download progress shows correctly
- [ ] Download can be cancelled
- [ ] Install & restart works
- [ ] Error handling (network failure, corrupt download)
- [ ] Works on Windows
- [ ] Works on macOS
- [ ] Works on Linux

---

## Considerations

### Without Code Signing

**macOS:**
- App will show "unidentified developer" warning
- Users need to right-click > Open
- Auto-update may be blocked by Gatekeeper

**Windows:**
- SmartScreen warning on first run
- "Windows protected your PC" message
- Users can click "More info" > "Run anyway"

### With Code Signing

- Seamless updates
- No security warnings
- Professional appearance
- Required for Mac App Store (if ever needed)

---

## Estimated Effort

| Task | Time |
|------|------|
| Setup electron-updater | 2h |
| IPC bridge | 1h |
| UI components | 3h |
| Testing on all platforms | 4h |
| Code signing setup (optional) | 4h |
| **Total** | **10-14h** |

---

## References

- [electron-updater docs](https://www.electron.build/auto-update)
- [GitHub Releases as update source](https://www.electron.build/configuration/publish#githuboptions)
- [Code signing guide](https://www.electron.build/code-signing)

---

*Created: v0.24.3*
