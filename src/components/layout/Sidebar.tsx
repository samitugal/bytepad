import { useState, useRef, useEffect, useCallback } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { useTranslation } from '../../i18n'
import type { ModuleType } from '../../types'

const MODULE_IDS: { id: ModuleType; shortcut: string }[] = [
  { id: 'notes', shortcut: '1' },
  { id: 'dailynotes', shortcut: '2' },
  { id: 'habits', shortcut: '3' },
  { id: 'tasks', shortcut: '4' },
  { id: 'journal', shortcut: '5' },
  { id: 'bookmarks', shortcut: '6' },
  { id: 'calendar', shortcut: '7' },
  { id: 'analysis', shortcut: '8' },
]

const MIN_WIDTH = 80
const MAX_WIDTH = 250
const DEFAULT_WIDTH = 128

export function Sidebar() {
  const { t } = useTranslation()
  const { activeModule, setActiveModule } = useUIStore()
  
  // Map module IDs to translated labels
  const getModuleLabel = (id: ModuleType): string => {
    const labelMap: Record<ModuleType, string> = {
      notes: t('nav.notes'),
      dailynotes: t('dailyNotes.title'),
      habits: t('nav.habits'),
      tasks: t('nav.tasks'),
      journal: t('nav.journal'),
      bookmarks: t('nav.bookmarks'),
      calendar: t('nav.calendar'),
      analysis: t('nav.analysis'),
    }
    return labelMap[id] || id
  }
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
        {MODULE_IDS.map((module) => (
          <button
            key={module.id}
            onClick={() => setActiveModule(module.id)}
            className={`w-full px-3 py-1.5 text-left text-sm flex items-center justify-between transition-colors ${
              activeModule === module.id
                ? 'bg-np-selection text-np-text-primary'
                : 'text-np-text-secondary hover:bg-np-bg-tertiary hover:text-np-text-primary'
            }`}
          >
            <span className="truncate">{activeModule === module.id ? '>' : ' '} {getModuleLabel(module.id)}</span>
            <span className="text-xs text-np-text-secondary flex-shrink-0">^{module.shortcut}</span>
          </button>
        ))}
      </div>
      <div className="border-t border-np-border p-2 text-xs text-np-text-secondary">
        <div className="truncate">Ctrl+K: {t('settings.general.commandPalette')}</div>
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
