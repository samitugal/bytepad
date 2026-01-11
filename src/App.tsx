import { useState, useEffect } from 'react'
import { MenuBar, Sidebar, TabBar, StatusBar, MainContent } from './components/layout'
import { CommandPalette, FocusMode, SettingsPanel, ErrorBoundary, NotificationCenter, Onboarding, GlobalSearch } from './components/common'
import { ChatWindow } from './components/chat'
import { LevelUpModal, AchievementToast } from './components/gamification'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { initializeNotifications } from './services/notificationService'
import { useSettingsStore, FONT_SIZES } from './stores/settingsStore'
import { useUIStore } from './stores/uiStore'
import { useAuthStore } from './stores/authStore'
import { useGamificationStore } from './stores/gamificationStore'

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const fontSize = useSettingsStore((state) => state.fontSize)
  const gamificationEnabled = useSettingsStore((state) => state.gamificationEnabled)
  const globalSearchOpen = useUIStore((state) => state.globalSearchOpen)
  const setGlobalSearchOpen = useUIStore((state) => state.setGlobalSearchOpen)
  const initializeAuth = useAuthStore((state) => state.initialize)
  const { checkStreak, resetDailyStats, lastActiveDate } = useGamificationStore()

  useKeyboardShortcuts()

  // Apply font size to document root
  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZES[fontSize].value
  }, [fontSize])

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
        <ChatWindow />
        <NotificationCenter />
        <Onboarding />
        <GlobalSearch 
          isOpen={globalSearchOpen} 
          onClose={() => setGlobalSearchOpen(false)} 
        />
        <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
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
