import { MenuBar, Sidebar, TabBar, StatusBar, MainContent } from './components/layout'
import { CommandPalette } from './components/common'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

function App() {
  useKeyboardShortcuts()

  return (
    <div className="h-screen flex flex-col bg-np-bg-primary">
      <MenuBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TabBar />
          <MainContent />
        </div>
      </div>
      <StatusBar />
      <CommandPalette />
    </div>
  )
}

export default App
