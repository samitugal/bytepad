import { useRef, useState, useEffect } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { useTabStore, Tab } from '../../stores/tabStore'
import { useNoteStore } from '../../stores/noteStore'
import { useTranslation } from '../../i18n'

const TAB_ICONS: Record<string, string> = {
  note: '📝',
  task: '☑️',
  dailynote: '📅',
  journal: '📔',
  bookmark: '🔖',
  home: '🏠',
}

export function TabBar() {
  const { t } = useTranslation()
  const { activeModule } = useUIStore()
  const { tabs, activeTabId, addTab, closeTab, setActiveTab, pinTab, unpinTab, closeOtherTabs, closeTabsToRight } = useTabStore()
  const { setActiveNote } = useNoteStore()
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null)
  const tabsContainerRef = useRef<HTMLDivElement>(null)

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  const handleAddTab = () => {
    if (activeModule === 'notes') {
      const noteId = useNoteStore.getState().addNote({
        title: '',
        content: '',
        tags: [],
      })
      addTab('note', noteId, 'Untitled')
      setActiveNote(noteId)
    }
  }

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab.id)
    if (tab.type === 'note' && tab.entityId) {
      setActiveNote(tab.entityId)
    }
  }

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    closeTab(tabId)
  }

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, tabId })
  }

  const handleMiddleClick = (e: React.MouseEvent, tabId: string) => {
    if (e.button === 1) {
      e.preventDefault()
      closeTab(tabId)
    }
  }

  const getTabTitle = (tab: Tab): string => {
    if (tab.title && tab.title !== 'Untitled') return tab.title
    if (tab.type === 'home') return t('nav.notes')
    return t('notes.untitled')
  }

  // Show module name if no tabs
  if (tabs.length === 0) {
    return (
      <div className="h-8 bg-np-bg-tertiary border-b border-np-border flex items-center px-1">
        <div className="flex items-center">
          <div className="px-3 py-1 bg-np-bg-primary border-t border-l border-r border-np-border text-np-text-primary text-sm flex items-center gap-2">
            <span>{t(`nav.${activeModule}`) || activeModule}</span>
            <span className="text-np-text-secondary text-xs">×</span>
          </div>
          <button 
            onClick={handleAddTab}
            className="px-2 py-1 text-np-text-secondary hover:text-np-text-primary text-sm"
            title="New Tab"
          >
            +
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-8 bg-np-bg-tertiary border-b border-np-border flex items-center px-1 overflow-hidden">
      <div ref={tabsContainerRef} className="flex items-center overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            onMouseDown={(e) => handleMiddleClick(e, tab.id)}
            onContextMenu={(e) => handleContextMenu(e, tab.id)}
            className={`group px-3 py-1 text-sm flex items-center gap-2 cursor-pointer border-t border-l border-r min-w-0 max-w-48 ${
              tab.id === activeTabId
                ? 'bg-np-bg-primary border-np-border text-np-text-primary'
                : 'bg-np-bg-tertiary border-transparent text-np-text-secondary hover:bg-np-bg-secondary hover:text-np-text-primary'
            }`}
          >
            <span className="text-xs">{TAB_ICONS[tab.type] || '📄'}</span>
            <span className="truncate flex-1">{getTabTitle(tab)}</span>
            {tab.isPinned && <span className="text-xs">📌</span>}
            <button
              onClick={(e) => handleTabClose(e, tab.id)}
              className="text-np-text-secondary hover:text-np-error text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              title="Close tab"
            >
              ×
            </button>
          </div>
        ))}
        <button 
          onClick={handleAddTab}
          className="px-2 py-1 text-np-text-secondary hover:text-np-text-primary text-sm flex-shrink-0"
          title="New Tab (Ctrl+T)"
        >
          +
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-np-bg-secondary border border-np-border shadow-lg z-50 py-1 min-w-32"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { closeTab(contextMenu.tabId); setContextMenu(null) }}
            className="w-full px-3 py-1 text-left text-sm text-np-text-primary hover:bg-np-bg-hover"
          >
            Close
          </button>
          <button
            onClick={() => { closeOtherTabs(contextMenu.tabId); setContextMenu(null) }}
            className="w-full px-3 py-1 text-left text-sm text-np-text-primary hover:bg-np-bg-hover"
          >
            Close Others
          </button>
          <button
            onClick={() => { closeTabsToRight(contextMenu.tabId); setContextMenu(null) }}
            className="w-full px-3 py-1 text-left text-sm text-np-text-primary hover:bg-np-bg-hover"
          >
            Close to the Right
          </button>
          <div className="border-t border-np-border my-1" />
          {tabs.find(t => t.id === contextMenu.tabId)?.isPinned ? (
            <button
              onClick={() => { unpinTab(contextMenu.tabId); setContextMenu(null) }}
              className="w-full px-3 py-1 text-left text-sm text-np-text-primary hover:bg-np-bg-hover"
            >
              Unpin
            </button>
          ) : (
            <button
              onClick={() => { pinTab(contextMenu.tabId); setContextMenu(null) }}
              className="w-full px-3 py-1 text-left text-sm text-np-text-primary hover:bg-np-bg-hover"
            >
              Pin
            </button>
          )}
        </div>
      )}
    </div>
  )
}
