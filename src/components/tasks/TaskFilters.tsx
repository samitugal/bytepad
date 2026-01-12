
type FilterType = 'all' | 'active' | 'completed'
type SortType = 'priority' | 'deadline' | 'created' | 'manual'

interface TaskFiltersProps {
  filter: FilterType
  sortBy: SortType
  onFilterChange: (filter: FilterType) => void
  onSortChange: (sort: SortType) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export function TaskFilters({ filter, sortBy, onFilterChange, onSortChange, t }: TaskFiltersProps) {
  return (
    <div className="flex items-center gap-4 mb-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-np-text-secondary">{t('tasks.filter')}:</span>
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`px-2 py-0.5 ${filter === f ? 'bg-np-selection text-np-text-primary' : 'text-np-text-secondary hover:text-np-text-primary'}`}
          >
            {t(`tasks.${f}`)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-np-text-secondary">{t('tasks.sort')}:</span>
        {(['priority', 'deadline', 'created', 'manual'] as const).map((s) => (
          <button
            key={s}
            onClick={() => onSortChange(s)}
            className={`px-2 py-0.5 ${sortBy === s ? 'bg-np-selection text-np-text-primary' : 'text-np-text-secondary hover:text-np-text-primary'}`}
          >
            {s === 'manual' ? (t('tasks.manual') || 'Manual') : t(`tasks.${s}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
