import { useState } from 'react'
import { MenuBar, Sidebar, TabBar, StatusBar, MainContent } from './components/layout'
import { CommandPalette, FocusMode, SettingsPanel } from './components/common'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  useKeyboardShortcuts()

  return (
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
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default App
