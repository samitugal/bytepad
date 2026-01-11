import { useEffect } from 'react'
import { useTranslation } from '../../i18n'

interface ShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutItem {
  keys: string
  description: string
}

interface ShortcutGroup {
  title: string
  shortcuts: ShortcutItem[]
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const { t } = useTranslation()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'Navigation',
      shortcuts: [
        { keys: 'Ctrl+1', description: 'Go to Notes' },
        { keys: 'Ctrl+2', description: 'Go to Daily Notes' },
        { keys: 'Ctrl+3', description: 'Go to Habits' },
        { keys: 'Ctrl+4', description: 'Go to Tasks' },
        { keys: 'Ctrl+5', description: 'Go to Journal' },
        { keys: 'Ctrl+6', description: 'Go to Bookmarks' },
        { keys: 'Ctrl+7', description: 'Go to Calendar' },
        { keys: 'Ctrl+8', description: 'Go to Knowledge Graph' },
        { keys: 'Ctrl+9', description: 'Go to Analysis' },
      ],
    },
    {
      title: 'Actions',
      shortcuts: [
        { keys: 'Ctrl+N', description: 'New item (context-aware)' },
        { keys: 'Ctrl+S', description: 'Save current item' },
        { keys: 'Ctrl+K', description: 'Command Palette' },
        { keys: 'Alt+U', description: 'Global Search' },
      ],
    },
    {
      title: 'Focus Mode',
      shortcuts: [
        { keys: 'Ctrl+Shift+F', description: 'Toggle Focus Mode' },
        { keys: 'Space', description: 'Pause/Resume timer (in Focus Mode)' },
        { keys: 'C', description: 'Complete task (in Focus Mode)' },
        { keys: 'R', description: 'Reset timer (in Focus Mode)' },
      ],
    },
    {
      title: 'FlowBot & Modals',
      shortcuts: [
        { keys: 'Ctrl+/', description: 'Open FlowBot' },
        { keys: 'Ctrl+Shift+N', description: 'Notification Center' },
        { keys: 'Ctrl+?', description: 'Keyboard Shortcuts (this modal)' },
        { keys: 'Escape', description: 'Close modal / Blur input' },
      ],
    },
  ]

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="w-[600px] max-h-[80vh] bg-np-bg-secondary border border-np-border shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-np-border">
          <h2 className="text-np-text-primary font-mono">
            ⌨️ {t('shortcuts.title') || 'Keyboard Shortcuts'}
          </h2>
          <button
            onClick={onClose}
            className="text-np-text-secondary hover:text-np-text-primary"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-6">
            {shortcutGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-np-blue font-mono text-sm mb-3 border-b border-np-border pb-1">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.keys}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-np-text-secondary">
                        {shortcut.description}
                      </span>
                      <kbd className="bg-np-bg-tertiary text-np-text-primary px-2 py-0.5 border border-np-border font-mono text-xs">
                        {shortcut.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-np-border text-xs text-np-text-secondary text-center">
          {t('shortcuts.hint') || 'Press Escape to close'}
        </div>
      </div>
    </div>
  )
}
