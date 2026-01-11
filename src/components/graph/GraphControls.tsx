import { useTranslation } from '../../i18n'
import { nodeColors, nodeLabels } from '../../utils/graphUtils'
import type { GraphEntityType } from '../../types'

interface GraphControlsProps {
  filters: Record<string, boolean>
  onFilterChange: (key: string, value: boolean) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  counts: Record<GraphEntityType, number>
}

export function GraphControls({
  filters,
  onFilterChange,
  searchQuery,
  onSearchChange,
  counts,
}: GraphControlsProps) {
  const { t } = useTranslation()

  const filterItems: { key: string; type: GraphEntityType }[] = [
    { key: 'showNotes', type: 'note' },
    { key: 'showTasks', type: 'task' },
    { key: 'showHabits', type: 'habit' },
    { key: 'showJournals', type: 'journal' },
    { key: 'showBookmarks', type: 'bookmark' },
    { key: 'showTags', type: 'tag' },
  ]

  return (
    <div className="bg-np-bg-secondary border-r border-np-border w-56 flex flex-col">
      <div className="p-3 border-b border-np-border">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('common.search') + '...'}
          className="w-full bg-np-bg-tertiary border border-np-border text-np-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-np-blue"
        />
      </div>

      <div className="flex-1 p-3 overflow-y-auto">
        <div className="text-xs text-np-text-secondary uppercase tracking-wide mb-2">
          {t('graph.filters')}
        </div>

        <div className="space-y-1">
          {filterItems.map(({ key, type }) => (
            <label
              key={key}
              className="flex items-center gap-2 py-1 px-2 hover:bg-np-bg-tertiary cursor-pointer rounded"
            >
              <input
                type="checkbox"
                checked={filters[key]}
                onChange={(e) => onFilterChange(key, e.target.checked)}
                className="accent-np-blue"
              />
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: nodeColors[type] }}
              />
              <span className="text-sm text-np-text-primary flex-1">
                {nodeLabels[type]}
              </span>
              <span className="text-xs text-np-text-secondary">
                ({counts[type] || 0})
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-np-border text-xs text-np-text-secondary">
        <div className="mb-2">{t('graph.legend')}</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-np-text-secondary opacity-50" />
            <span>{t('graph.wikilink')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-[#DCDCAA] opacity-50" />
            <span>{t('graph.tagConnection')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
