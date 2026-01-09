import { useUIStore } from '../../stores/uiStore'
import type { ModuleType } from '../../types'

const MODULE_NAMES: Record<ModuleType, string> = {
  notes: 'Notes',
  habits: 'Habits',
  tasks: 'Tasks',
  journal: 'Journal',
  analysis: 'Analysis',
}

export function TabBar() {
  const { activeModule } = useUIStore()

  return (
    <div className="h-8 bg-np-bg-tertiary border-b border-np-border flex items-center px-1">
      <div className="flex items-center">
        <div className="px-3 py-1 bg-np-bg-primary border-t border-l border-r border-np-border text-np-text-primary text-sm flex items-center gap-2">
          <span>{MODULE_NAMES[activeModule]}</span>
          <span className="text-np-text-secondary text-xs">×</span>
        </div>
        <button className="px-2 py-1 text-np-text-secondary hover:text-np-text-primary text-sm">
          +
        </button>
      </div>
    </div>
  )
}
