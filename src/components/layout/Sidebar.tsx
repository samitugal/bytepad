import { useUIStore } from '../../stores/uiStore'
import type { ModuleType } from '../../types'

const MODULES: { id: ModuleType; label: string; shortcut: string }[] = [
  { id: 'notes', label: 'Notes', shortcut: '1' },
  { id: 'habits', label: 'Habits', shortcut: '2' },
  { id: 'tasks', label: 'Tasks', shortcut: '3' },
  { id: 'journal', label: 'Journal', shortcut: '4' },
  { id: 'analysis', label: 'Analyze', shortcut: '5' },
]

export function Sidebar() {
  const { activeModule, setActiveModule } = useUIStore()

  return (
    <div className="w-32 bg-np-bg-secondary border-r border-np-border flex flex-col">
      <div className="flex-1 py-2">
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
            <span>{activeModule === module.id ? '>' : ' '} {module.label}</span>
            <span className="text-xs text-np-text-secondary">^{module.shortcut}</span>
          </button>
        ))}
      </div>
      <div className="border-t border-np-border p-2 text-xs text-np-text-secondary">
        <div>Ctrl+K: Palette</div>
      </div>
    </div>
  )
}
