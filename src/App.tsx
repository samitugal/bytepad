import { useEffect, lazy, Suspense } from 'react'
import { MenuBar, Sidebar, TabBar, StatusBar, MainContent } from './components/layout'
import { CommandPalette, MiniTimer, ErrorBoundary, NotificationCenter, Onboarding, GlobalSearch, ShortcutsModal } from './components/common'
import { PageSearch } from './components/common/PageSearch'
import { UpdateBanner } from './components/common/UpdateBanner'

// Lazy load heavy components
const SettingsPanel = lazy(() => import('./components/common/SettingsPanel').then(m => ({ default: m.SettingsPanel })))
const FocusMode = lazy(() => import('./components/common/FocusMode').then(m => ({ default: m.FocusMode })))
const ChatWindow = lazy(() => import('./components/chat/ChatWindow').then(m => ({ default: m.ChatWindow })))
const LevelUpModal = lazy(() => import('./components/gamification/LevelUpModal').then(m => ({ default: m.LevelUpModal })))
const AchievementToast = lazy(() => import('./components/gamification/AchievementToast').then(m => ({ default: m.AchievementToast })))
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useUpdateCheck } from './hooks/useUpdateCheck'
import { initializeNotifications } from './services/notificationService'
import { initializeSync, pushOnClose } from './services/gistSyncService'
import { initializeIpcStoreService } from './services/ipcStoreService'
import { useSettingsStore, FONT_SIZES, FONT_FAMILIES } from './stores/settingsStore'
import { useUIStore } from './stores/uiStore'
import { useAuthStore } from './stores/authStore'
import { useGamificationStore } from './stores/gamificationStore'
import { useTaskStore } from './stores/taskStore'

function App() {
  const fontSize = useSettingsStore((state) => state.fontSize)
  const fontFamily = useSettingsStore((state) => state.fontFamily)
  const gamificationEnabled = useSettingsStore((state) => state.gamificationEnabled)
  const globalSearchOpen = useUIStore((state) => state.globalSearchOpen)
  const setGlobalSearchOpen = useUIStore((state) => state.setGlobalSearchOpen)
  const pageSearchOpen = useUIStore((state) => state.pageSearchOpen)
  const setPageSearchOpen = useUIStore((state) => state.setPageSearchOpen)
  const shortcutsModalOpen = useUIStore((state) => state.shortcutsModalOpen)
  const setShortcutsModalOpen = useUIStore((state) => state.setShortcutsModalOpen)
  const settingsOpen = useUIStore((state) => state.settingsOpen)
  const setSettingsOpen = useUIStore((state) => state.setSettingsOpen)
  const initializeAuth = useAuthStore((state) => state.initialize)
  const { checkStreak, resetDailyStats, lastActiveDate } = useGamificationStore()
  const autoArchiveOldTasks = useTaskStore((state) => state.autoArchiveOldTasks)
  const gistSync = useSettingsStore((state) => state.gistSync)

  // GitHub Releases update check
  const { isUpdateAvailable, releaseInfo, currentVersion, dismissCurrentUpdate, openReleasePage } = useUpdateCheck()

  useKeyboardShortcuts()

  // Apply font size to document root
  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZES[fontSize].value
  }, [fontSize])

  // Apply font family via CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--font-family', FONT_FAMILIES[fontFamily].value)
  }, [fontFamily])

  // Initialize notifications on mount
  useEffect(() => {
    initializeNotifications()
  }, [])

  // Initialize IPC store bridge for MCP server
  useEffect(() => {
    initializeIpcStoreService()
  }, [])

  // Initialize auth and cloud sync
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Initialize gamification on mount
  useEffect(() => {
    if (gamificationEnabled) {
      // Check streak on app load
      checkStreak()

      // Reset daily stats if it's a new day
      const today = new Date().toISOString().split('T')[0]
      if (lastActiveDate && lastActiveDate !== today) {
        resetDailyStats()
      }
    }
  }, [gamificationEnabled, checkStreak, resetDailyStats, lastActiveDate])

  // Auto-archive old completed tasks (3 days default)
  useEffect(() => {
    autoArchiveOldTasks(3)
  }, [autoArchiveOldTasks])

  // Initialize Gist sync on mount - simplified: pull on open, push on close
  useEffect(() => {
    if (gistSync.enabled && gistSync.githubToken && gistSync.gistId) {
      // Pull from Gist on startup (with delay for store hydration)
      initializeSync()
    }

    // Push on browser/tab close
    const handleBeforeUnload = () => {
      if (gistSync.enabled && gistSync.githubToken && gistSync.gistId) {
        pushOnClose()
      }
    }

    // Listen for Electron app quit event
    if (window.electronAPI?.onBeforeQuit) {
      window.electronAPI.onBeforeQuit(() => {
        if (gistSync.enabled && gistSync.githubToken && gistSync.gistId) {
          pushOnClose()
        }
      })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (window.electronAPI?.removeBeforeQuitListener) {
        window.electronAPI.removeBeforeQuitListener()
      }
    }
  }, [gistSync.enabled, gistSync.githubToken, gistSync.gistId])

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-np-bg-primary">
        <MenuBar onSettingsClick={() => setSettingsOpen(true)} />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <TabBar />
            <MainContent />
          </div>
        </div>
        <StatusBar />
        <CommandPalette />
        <Suspense fallback={null}>
          <FocusMode />
        </Suspense>
        <MiniTimer />
        <Suspense fallback={null}>
          <ChatWindow />
        </Suspense>
        <NotificationCenter />
        <Onboarding />
        <GlobalSearch
          isOpen={globalSearchOpen}
          onClose={() => setGlobalSearchOpen(false)}
        />
        <PageSearch
          isOpen={pageSearchOpen}
          onClose={() => setPageSearchOpen(false)}
        />
        <Suspense fallback={null}>
          <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </Suspense>
        <ShortcutsModal isOpen={shortcutsModalOpen} onClose={() => setShortcutsModalOpen(false)} />
        {gamificationEnabled && (
          <Suspense fallback={null}>
            <LevelUpModal />
            <AchievementToast />
          </Suspense>
        )}
        {/* GitHub Release Update Banner */}
        {isUpdateAvailable && releaseInfo && (
          <UpdateBanner
            releaseInfo={releaseInfo}
            currentVersion={currentVersion}
            onViewRelease={openReleasePage}
            onDismiss={dismissCurrentUpdate}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App
