import { useEffect } from 'react'
import { MenuBar, Sidebar, TabBar, StatusBar, MainContent } from './components/layout'
import { CommandPalette, FocusMode, MiniTimer, SettingsPanel, ErrorBoundary, NotificationCenter, Onboarding, GlobalSearch, ShortcutsModal } from './components/common'
import { ChatWindow } from './components/chat'
import { LevelUpModal, AchievementToast } from './components/gamification'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { initializeNotifications } from './services/notificationService'
import { startAutoSync, stopAutoSync, syncWithGist, forcePushToGist } from './services/gistSyncService'
import { useSettingsStore, FONT_SIZES, FONT_FAMILIES } from './stores/settingsStore'
import { useUIStore } from './stores/uiStore'
import { useAuthStore } from './stores/authStore'
import { useGamificationStore } from './stores/gamificationStore'

function App() {
  const fontSize = useSettingsStore((state) => state.fontSize)
  const fontFamily = useSettingsStore((state) => state.fontFamily)
  const gamificationEnabled = useSettingsStore((state) => state.gamificationEnabled)
  const globalSearchOpen = useUIStore((state) => state.globalSearchOpen)
  const setGlobalSearchOpen = useUIStore((state) => state.setGlobalSearchOpen)
  const shortcutsModalOpen = useUIStore((state) => state.shortcutsModalOpen)
  const setShortcutsModalOpen = useUIStore((state) => state.setShortcutsModalOpen)
  const settingsOpen = useUIStore((state) => state.settingsOpen)
  const setSettingsOpen = useUIStore((state) => state.setSettingsOpen)
  const initializeAuth = useAuthStore((state) => state.initialize)
  const { checkStreak, resetDailyStats, lastActiveDate } = useGamificationStore()
  const gistSync = useSettingsStore((state) => state.gistSync)

  useKeyboardShortcuts()

  // Apply font size to document root
  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZES[fontSize].value
  }, [fontSize])

  // Apply font family to document root
  useEffect(() => {
    document.documentElement.style.fontFamily = FONT_FAMILIES[fontFamily].value
  }, [fontFamily])

  // Initialize notifications on mount
  useEffect(() => {
    initializeNotifications()
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

  // Initialize Gist sync on mount
  useEffect(() => {
    if (gistSync.enabled && gistSync.githubToken && gistSync.gistId) {
      // Pull from Gist on startup
      syncWithGist().then(result => {
        console.log('[Gist Sync] Startup sync:', result.message)
      })

      // Start auto-sync if enabled
      if (gistSync.autoSync && gistSync.syncInterval > 0) {
        startAutoSync()
      }
    }

    // Push to Gist on app close
    const handleBeforeUnload = () => {
      if (gistSync.enabled && gistSync.githubToken && gistSync.gistId) {
        // Use sendBeacon for reliable sync on close
        forcePushToGist()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      stopAutoSync()
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [gistSync.enabled, gistSync.githubToken, gistSync.gistId, gistSync.autoSync, gistSync.syncInterval])

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
        <FocusMode />
        <MiniTimer />
        <ChatWindow />
        <NotificationCenter />
        <Onboarding />
        <GlobalSearch 
          isOpen={globalSearchOpen} 
          onClose={() => setGlobalSearchOpen(false)} 
        />
        <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <ShortcutsModal isOpen={shortcutsModalOpen} onClose={() => setShortcutsModalOpen(false)} />
        {gamificationEnabled && (
          <>
            <LevelUpModal />
            <AchievementToast />
          </>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App
