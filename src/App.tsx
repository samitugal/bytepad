import { useState, useEffect } from 'react'
import { MenuBar, Sidebar, TabBar, StatusBar, MainContent } from './components/layout'
import { CommandPalette, FocusMode, SettingsPanel, ErrorBoundary, NotificationCenter, Onboarding } from './components/common'
import { ChatWindow } from './components/chat'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { initializeNotifications } from './services/notificationService'

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  useKeyboardShortcuts()
  
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
        <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </ErrorBoundary>
  )
}

export default App
