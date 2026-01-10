import { useUIStore } from '../../stores/uiStore'
import { useTranslation } from '../../i18n'
import type { ModuleType } from '../../types'

export function TabBar() {
  const { t } = useTranslation()
  const { activeModule } = useUIStore()

  const getModuleName = (id: ModuleType): string => {
    const nameMap: Record<ModuleType, string> = {
      notes: t('nav.notes'),
      habits: t('nav.habits'),
      tasks: t('nav.tasks'),
      journal: t('nav.journal'),
      bookmarks: t('nav.bookmarks'),
      calendar: t('nav.calendar'),
      analysis: t('nav.analysis'),
      dailynotes: t('dailyNotes.title'),
    }
    return nameMap[id] || id
  }

  return (
    <div className="h-8 bg-np-bg-tertiary border-b border-np-border flex items-center px-1">
      <div className="flex items-center">
        <div className="px-3 py-1 bg-np-bg-primary border-t border-l border-r border-np-border text-np-text-primary text-sm flex items-center gap-2">
          <span>{getModuleName(activeModule)}</span>
          <span className="text-np-text-secondary text-xs">×</span>
        </div>
        <button className="px-2 py-1 text-np-text-secondary hover:text-np-text-primary text-sm">
          +
        </button>
      </div>
    </div>
  )
}
