import { useState, useEffect } from 'react'
import { MenuBar, Sidebar, TabBar, StatusBar, MainContent } from './components/layout'
import { CommandPalette, FocusMode, SettingsPanel, ErrorBoundary, NotificationCenter, Onboarding, GlobalSearch } from './components/common'
import { ChatWindow } from './components/chat'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { initializeNotifications } from './services/notificationService'
import { useSettingsStore, FONT_SIZES } from './stores/settingsStore'
import { useUIStore } from './stores/uiStore'

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const fontSize = useSettingsStore((state) => state.fontSize)
  const globalSearchOpen = useUIStore((state) => state.globalSearchOpen)
  const setGlobalSearchOpen = useUIStore((state) => state.setGlobalSearchOpen)

  useKeyboardShortcuts()

  // Apply font size to document root
  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZES[fontSize].value
  }, [fontSize])

  // Initialize notifications on mount
  useEffect(() => {
    initializeNotifications()
  }, [])

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
      </div>
    </ErrorBoundary>
  )
}

export default App
