import { useState, useRef, useEffect, useCallback } from 'react'
import { useUIStore } from '../../stores/uiStore'
import type { ModuleType } from '../../types'

const MODULES: { id: ModuleType; label: string; shortcut: string }[] = [
  { id: 'notes', label: 'Notes', shortcut: '1' },
  { id: 'habits', label: 'Habits', shortcut: '2' },
  { id: 'tasks', label: 'Tasks', shortcut: '3' },
  { id: 'journal', label: 'Journal', shortcut: '4' },
  { id: 'bookmarks', label: 'Bookmarks', shortcut: '5' },
  { id: 'calendar', label: 'Calendar', shortcut: '6' },
  { id: 'analysis', label: 'Analyze', shortcut: '7' },
]

const MIN_WIDTH = 80
const MAX_WIDTH = 250
const DEFAULT_WIDTH = 128

export function Sidebar() {
  const { activeModule, setActiveModule } = useUIStore()
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem('myflowspace-sidebar-width')
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH
  })
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Save width to localStorage
  useEffect(() => {
    localStorage.setItem('myflowspace-sidebar-width', width.toString())
  }, [width])

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizing(false)
  }, [])

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing || !sidebarRef.current) return
    
    const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left
    if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
      setWidth(newWidth)
    }
  }, [isResizing])

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize)
      window.addEventListener('mouseup', stopResizing)
    }
    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [isResizing, resize, stopResizing])

  return (
    <div 
      ref={sidebarRef}
      className="bg-np-bg-secondary border-r border-np-border flex flex-col relative"
      style={{ width: `${width}px` }}
    >
      <div className="flex-1 py-2 overflow-hidden">
        {MODULES.map((module) => (
          <button
            key={module.id}
            onClick={() => setActiveModule(module.id)}
            className={`w-full px-3 py-1.5 text-left text-sm flex items-center justify-between transition-colors ${
              activeModule === module.id
                ? 'bg-np-selection text-np-text-primary'
                : 'text-np-text-secondary hover:bg-np-bg-tertiary hover:text-np-text-primary'
            }`}
          >
            <span className="truncate">{activeModule === module.id ? '>' : ' '} {module.label}</span>
            <span className="text-xs text-np-text-secondary flex-shrink-0">^{module.shortcut}</span>
          </button>
        ))}
      </div>
      <div className="border-t border-np-border p-2 text-xs text-np-text-secondary">
        <div className="truncate">Ctrl+K: Palette</div>
      </div>
      
      {/* Resize handle */}
      <div
        className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-np-blue/50 transition-colors ${
          isResizing ? 'bg-np-blue' : ''
        }`}
        onMouseDown={startResizing}
      />
    </div>
  )
}
