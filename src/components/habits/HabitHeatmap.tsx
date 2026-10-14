import { useMemo } from 'react'
import { useTranslation } from '../../i18n'
import { useHabitStore } from '../../stores/habitStore'

const WEEKS_TO_SHOW = 53
const CELL_SIZE = 11
const CELL_GAP = 3
const LEVEL_CLASSES = [
  'bg-np-bg-tertiary',
  'bg-np-green/25',
  'bg-np-green/50',
  'bg-np-green/75',
  'bg-np-green',
]

interface HeatmapDay {
  date: string
  count: number
  level: number
}

function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getLevel(count: number, maxCount: number): number {
  if (count === 0) return 0
  const ratio = count / maxCount
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

export function HabitHeatmap() {
  const { t, language } = useTranslation()
  const habits = useHabitStore((state) => state.habits)

  const weeks = useMemo(() => {
    const completionCounts: Record<string, number> = {}
    for (const habit of habits) {
      for (const [date, done] of Object.entries(habit.completions)) {
        if (done) completionCounts[date] = (completionCounts[date] || 0) + 1
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const gridStart = new Date(today)
    gridStart.setDate(gridStart.getDate() - (WEEKS_TO_SHOW * 7 - 1))
    gridStart.setDate(gridStart.getDate() - gridStart.getDay())

    const maxCount = Math.max(1, ...Object.values(completionCounts))

    const columns: (HeatmapDay | null)[][] = []
    const cursor = new Date(gridStart)
    for (let week = 0; week < WEEKS_TO_SHOW; week++) {
      const column: (HeatmapDay | null)[] = []
      for (let day = 0; day < 7; day++) {
        if (cursor > today) {
          column.push(null)
        } else {
          const dateKey = toDateKey(cursor)
          const count = completionCounts[dateKey] || 0
          column.push({ date: dateKey, count, level: getLevel(count, maxCount) })
        }
        cursor.setDate(cursor.getDate() + 1)
      }
      columns.push(column)
    }
    return columns
  }, [habits])

  const monthLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(language, { month: 'short' })
    const labels: (string | null)[] = []
    let lastMonth = -1
    for (const column of weeks) {
      const firstDay = column.find((day) => day !== null)
      if (!firstDay) {
        labels.push(null)
        continue
      }
      const month = new Date(firstDay.date).getUTCMonth()
      if (month !== lastMonth) {
        labels.push(formatter.format(new Date(firstDay.date)))
        lastMonth = month
      } else {
        labels.push(null)
      }
    }
    return labels
  }, [weeks, language])

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-[3px] mb-1" style={{ marginLeft: CELL_SIZE + CELL_GAP }}>
        {monthLabels.map((label, i) => (
          <div
            key={i}
            className="text-[9px] text-np-text-secondary whitespace-nowrap"
            style={{ width: CELL_SIZE }}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="inline-flex gap-[3px]">
        {weeks.map((column, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-[3px]">
            {column.map((day, dayIndex) =>
              day ? (
                <div
                  key={dayIndex}
                  title={t('habits.heatmap.tooltip', { date: day.date, count: day.count })}
                  className={`rounded-sm ${LEVEL_CLASSES[day.level]}`}
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                />
              ) : (
                <div key={dayIndex} style={{ width: CELL_SIZE, height: CELL_SIZE }} />
              )
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-2 text-[9px] text-np-text-secondary">
        <span>{t('habits.heatmap.less')}</span>
        {LEVEL_CLASSES.map((cls, level) => (
          <div key={level} className={`rounded-sm ${cls}`} style={{ width: CELL_SIZE, height: CELL_SIZE }} />
        ))}
        <span>{t('habits.heatmap.more')}</span>
      </div>
    </div>
  )
}
