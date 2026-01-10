# Sprint 21: Electron Desktop Application
**Goal:** Convert MyFlowSpace from a web app to a native desktop application using Electron
**Duration:** 4-5 days
**Priority:** CRITICAL
**Status:** PLANNED

---

## Background

### Current State
- React + Vite web application
- Runs via `npm run dev` (development server)
- Data stored in localStorage (browser-dependent)
- No native OS integration
- Requires browser to be open

### Why Desktop App?
1. **Convenience**: Double-click to launch, no terminal needed
2. **Native Experience**: System tray, notifications, keyboard shortcuts
3. **Data Persistence**: Independent of browser, survives cache clears
4. **Offline First**: Works without internet (except AI features)
5. **Auto-start**: Can launch on system startup
6. **Better Focus**: Dedicated window, no browser distractions

---

## Technical Analysis

### Current Tech Stack
```
Frontend:     React 18 + TypeScript
Build Tool:   Vite 6
Styling:      TailwindCSS
State:        Zustand (localStorage persist)
AI:           LangChain + OpenAI/Anthropic APIs
```

### Electron Integration Options

#### Option 1: Electron + Vite (Recommended)
**Package:** `electron-vite` or `vite-plugin-electron`

**Pros:**
- Keeps existing Vite setup
- Fast HMR in development
- Modern tooling
- Good TypeScript support

**Cons:**
- Some configuration complexity

#### Option 2: Electron Forge
**Package:** `@electron-forge/cli`

**Pros:**
- Official Electron tooling
- Built-in packaging/distribution
- Well documented

**Cons:**
- May require more migration work
- Heavier setup

#### Option 3: Electron Builder
**Package:** `electron-builder`

**Pros:**
- Flexible packaging options
- Auto-update support
- Cross-platform builds

**Cons:**
- Configuration can be complex

### Recommended Approach
**`electron-vite`** - Purpose-built for Vite + Electron integration

---

## 21.1: Project Setup

### Install Dependencies
```bash
npm install electron electron-vite -D
npm install electron-store  # Better than localStorage
```

### New File Structure
```
myflowspace/
├── electron/                    # NEW - Electron main process
│   ├── main.ts                  # Main process entry
│   ├── preload.ts               # Preload script (IPC bridge)
│   └── utils/
│       ├── store.ts             # electron-store wrapper
│       ├── tray.ts              # System tray
│       └── shortcuts.ts         # Global shortcuts
├── src/                         # Existing React app (renderer)
│   ├── App.tsx
│   ├── components/
│   └── ...
├── electron.vite.config.ts      # NEW - Electron Vite config
├── electron-builder.yml         # NEW - Build configuration
└── package.json                 # Updated scripts
```

### Tasks:
- [ ] Install electron and electron-vite
- [ ] Create `electron/` directory structure
- [ ] Create `electron.vite.config.ts`
- [ ] Update `package.json` scripts

---

## 21.2: Main Process (`electron/main.ts`)

### Core Functionality
```typescript
import { app, BrowserWindow, Tray, Menu, globalShortcut } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'MyFlowSpace',
    icon: path.join(__dirname, '../resources/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // Notepad++ style dark frame
    backgroundColor: '#1E1E1E',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1E1E1E',
      symbolColor: '#FFFFFF',
      height: 32
    }
  })

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  createTray()
  registerShortcuts()
})
```

### Tasks:
- [ ] Create main process with window management
- [ ] Configure window appearance (dark theme)
- [ ] Handle app lifecycle events
- [ ] Implement single instance lock

---

## 21.3: Preload Script (`electron/preload.ts`)

### IPC Bridge
```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  
  // Data persistence
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value),
    delete: (key: string) => ipcRenderer.invoke('store:delete', key),
  },
  
  // Notifications
  showNotification: (title: string, body: string) => 
    ipcRenderer.send('notification:show', { title, body }),
  
  // System
  getVersion: () => ipcRenderer.invoke('app:version'),
  openExternal: (url: string) => ipcRenderer.send('shell:openExternal', url),
})
```

### Tasks:
- [ ] Create preload script with IPC methods
- [ ] Expose safe APIs to renderer
- [ ] Add TypeScript definitions for window.electronAPI

---

## 21.4: Data Migration (localStorage → electron-store)

### Current: Zustand + localStorage
```typescript
// Current approach
persist(
  (set, get) => ({ ... }),
  { name: 'task-storage' }
)
```

### New: Zustand + electron-store
```typescript
// New approach - works in both web and Electron
const storage = {
  getItem: async (name: string) => {
    if (window.electronAPI) {
      return await window.electronAPI.store.get(name)
    }
    return localStorage.getItem(name)
  },
  setItem: async (name: string, value: string) => {
    if (window.electronAPI) {
      await window.electronAPI.store.set(name, value)
    } else {
      localStorage.setItem(name, value)
    }
  },
  removeItem: async (name: string) => {
    if (window.electronAPI) {
      await window.electronAPI.store.delete(name)
    } else {
      localStorage.removeItem(name)
    }
  },
}
```

### Migration Script
- [ ] Create data migration utility
- [ ] Import existing localStorage data on first Electron launch
- [ ] Verify data integrity after migration

### Tasks:
- [ ] Install `electron-store`
- [ ] Create storage abstraction layer
- [ ] Update all Zustand stores to use new storage
- [ ] Test data persistence

---

## 21.5: System Tray

### Tray Features
```typescript
function createTray() {
  tray = new Tray(path.join(__dirname, '../resources/tray-icon.png'))
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open MyFlowSpace', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Quick Add Task', click: () => quickAddTask() },
    { label: 'Start Focus Mode', click: () => startFocusMode() },
    { type: 'separator' },
    { label: 'Settings', click: () => openSettings() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])
  
  tray.setToolTip('MyFlowSpace')
  tray.setContextMenu(contextMenu)
  
  // Click to show/hide
  tray.on('click', () => {
    mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show()
  })
}
```

### Tasks:
- [ ] Create tray icon (16x16, 32x32)
- [ ] Implement tray menu
- [ ] Add quick actions (add task, focus mode)
- [ ] Show/hide on tray click

---

## 21.6: Global Keyboard Shortcuts

### Shortcuts
```typescript
function registerShortcuts() {
  // Show/hide app
  globalShortcut.register('CommandOrControl+Shift+F', () => {
    mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show()
  })
  
  // Quick add task
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    mainWindow?.show()
    mainWindow?.webContents.send('shortcut:quickAddTask')
  })
  
  // Start focus mode
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    mainWindow?.show()
    mainWindow?.webContents.send('shortcut:focusMode')
  })
}
```

### Tasks:
- [ ] Register global shortcuts
- [ ] Handle shortcuts in renderer
- [ ] Add settings to customize shortcuts
- [ ] Unregister on app quit

---

## 21.7: Native Notifications

### Enhanced Notifications
```typescript
import { Notification } from 'electron'

function showNotification(title: string, body: string, options?: {
  silent?: boolean
  urgency?: 'normal' | 'critical' | 'low'
  actions?: { type: 'button', text: string }[]
}) {
  const notification = new Notification({
    title,
    body,
    icon: path.join(__dirname, '../resources/icon.png'),
    silent: options?.silent,
    urgency: options?.urgency,
    actions: options?.actions,
  })
  
  notification.show()
  
  notification.on('click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}
```

### Use Cases:
- Focus session complete
- Task reminder
- Habit reminder
- Daily report ready

### Tasks:
- [ ] Implement native notifications
- [ ] Replace web Notification API
- [ ] Add notification actions (snooze, complete)
- [ ] Respect system notification settings

---

## 21.8: Auto-Start on Login

### Implementation
```typescript
import { app } from 'electron'

// Enable auto-start
app.setLoginItemSettings({
  openAtLogin: true,
  openAsHidden: true, // Start minimized to tray
})

// Settings toggle
ipcMain.handle('autostart:get', () => {
  return app.getLoginItemSettings().openAtLogin
})

ipcMain.handle('autostart:set', (_, enabled: boolean) => {
  app.setLoginItemSettings({ openAtLogin: enabled, openAsHidden: true })
})
```

### Tasks:
- [ ] Implement auto-start functionality
- [ ] Add toggle in Settings
- [ ] Start minimized to tray option

---

## 21.9: Window State Persistence

### Remember Window Position/Size
```typescript
import Store from 'electron-store'

const windowStateStore = new Store({ name: 'window-state' })

function getWindowState() {
  return windowStateStore.get('windowState', {
    width: 1400,
    height: 900,
    x: undefined,
    y: undefined,
  })
}

function saveWindowState() {
  if (!mainWindow) return
  const bounds = mainWindow.getBounds()
  windowStateStore.set('windowState', bounds)
}

// Save on close
mainWindow.on('close', saveWindowState)
```

### Tasks:
- [ ] Save window position and size
- [ ] Restore on app launch
- [ ] Handle multi-monitor scenarios

---

## 21.10: Build & Distribution

### electron-builder Configuration
```yaml
# electron-builder.yml
appId: com.myflowspace.app
productName: MyFlowSpace
copyright: Copyright © 2026

directories:
  output: dist-electron
  buildResources: resources

files:
  - out/**/*
  - resources/**/*

win:
  target:
    - nsis
    - portable
  icon: resources/icon.ico

mac:
  target:
    - dmg
    - zip
  icon: resources/icon.icns
  category: public.app-category.productivity

linux:
  target:
    - AppImage
    - deb
  icon: resources/icon.png
  category: Office

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
```

### Build Scripts
```json
{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "package": "electron-vite build && electron-builder",
    "package:win": "electron-vite build && electron-builder --win",
    "package:mac": "electron-vite build && electron-builder --mac",
    "package:linux": "electron-vite build && electron-builder --linux"
  }
}
```

### Tasks:
- [ ] Create app icons (ico, icns, png)
- [ ] Configure electron-builder
- [ ] Test Windows build
- [ ] Test portable version
- [ ] Create installer

---

## 21.11: App Icons & Branding

### Required Icons
```
resources/
├── icon.ico          # Windows (256x256)
├── icon.icns         # macOS
├── icon.png          # Linux (512x512)
├── tray-icon.png     # System tray (16x16, 32x32)
└── tray-icon@2x.png  # Retina tray
```

### Design Guidelines
- Notepad++ inspired aesthetic
- Dark theme compatible
- Recognizable at small sizes
- Monochrome tray icon option

### Tasks:
- [ ] Design app icon
- [ ] Create all icon sizes
- [ ] Create tray icons
- [ ] Add splash screen (optional)

---

## 21.12: Settings Integration

### New Desktop Settings
```typescript
interface DesktopSettings {
  launchAtStartup: boolean
  startMinimized: boolean
  minimizeToTray: boolean
  showInTaskbar: boolean
  globalShortcuts: {
    toggleApp: string
    quickAddTask: string
    focusMode: string
  }
}
```

### Settings UI Updates
- [ ] Add "Desktop" section in Settings
- [ ] Auto-start toggle
- [ ] Minimize to tray toggle
- [ ] Global shortcut configuration
- [ ] Check for updates option

---

## 21.13: Auto-Update (Future)

### electron-updater Setup
```typescript
import { autoUpdater } from 'electron-updater'

autoUpdater.checkForUpdatesAndNotify()

autoUpdater.on('update-available', () => {
  // Notify user
})

autoUpdater.on('update-downloaded', () => {
  // Prompt to restart
})
```

### Tasks (Phase 2):
- [ ] Set up GitHub releases
- [ ] Configure auto-updater
- [ ] Add update notification UI
- [ ] Test update flow

---

## File Changes Summary

### New Files
```
electron/
├── main.ts
├── preload.ts
└── utils/
    ├── store.ts
    ├── tray.ts
    ├── shortcuts.ts
    └── notifications.ts

resources/
├── icon.ico
├── icon.icns
├── icon.png
├── tray-icon.png
└── tray-icon@2x.png

electron.vite.config.ts
electron-builder.yml
```

### Modified Files
```
package.json          # New scripts and dependencies
src/stores/*.ts       # Storage abstraction
src/types/electron.d.ts  # Type definitions
```

---

## Acceptance Criteria

1. ✅ App launches as standalone desktop application
2. ✅ No terminal/browser required
3. ✅ Data persists independently of browser
4. ✅ System tray with quick actions
5. ✅ Global keyboard shortcuts work
6. ✅ Native notifications
7. ✅ Auto-start on login (optional)
8. ✅ Window state remembered
9. ✅ Windows installer created
10. ✅ Portable version available

---

## Development Workflow

### Development
```bash
npm run dev          # Starts Electron with hot reload
```

### Production Build
```bash
npm run build        # Build for production
npm run package:win  # Create Windows installer
```

### Testing
```bash
npm run preview      # Preview production build
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data migration issues | HIGH | Backup localStorage before migration |
| Build size too large | MEDIUM | Use electron-builder optimization |
| Cross-platform issues | MEDIUM | Test on Windows first, then others |
| API key security | HIGH | Use electron-store encryption |

---

## Sprint Dependencies

- None (can start immediately)
- Recommended after Sprint 17 (Localization) for stable codebase

---

## Estimated Timeline

| Day | Tasks |
|-----|-------|
| 1 | Setup electron-vite, main process, preload |
| 2 | Data migration, storage abstraction |
| 3 | System tray, global shortcuts, notifications |
| 4 | Build configuration, icons, installer |
| 5 | Testing, bug fixes, documentation |

---

*Sprint 21 - Electron Desktop Application*
*Estimated: 4-5 days*
*Priority: CRITICAL*
