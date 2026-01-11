import { useFocusStore, formatFocusTimeVerbose } from '../../stores/focusStore'
import { useTranslation } from '../../i18n'

interface FocusStatsProps {
  /** Whether to show compact version */
  compact?: boolean
}

export function FocusStats({ compact = false }: FocusStatsProps) {
  const { t } = useTranslation()
  const { getStats, getTodaySessions, focusStreak, getMostFocusedTasks } = useFocusStore()

  const stats = getStats()
  const todaySessions = getTodaySessions()
  const topTasks = getMostFocusedTasks(3)

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-np-text-secondary">{t('focus.todayTime')}:</span>
          <span className="text-np-cyan font-mono">
            {formatFocusTimeVerbose(stats.todayFocusTime)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-np-text-secondary">{t('focus.sessions')}:</span>
          <span className="text-np-green font-mono">{todaySessions.length}</span>
        </div>
        {focusStreak > 1 && (
          <div className="flex items-center gap-1">
            <span>🔥</span>
            <span className="text-np-orange font-mono">{focusStreak} {t('focus.dayStreak')}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-np-bg-secondary border border-np-border p-6">
      <h3 className="text-np-green font-mono mb-4">// {t('focus.stats')}</h3>

      {/* Main stats grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-np-bg-tertiary border border-np-border">
          <div className="text-2xl font-mono text-np-cyan">
            {formatFocusTimeVerbose(stats.todayFocusTime)}
          </div>
          <div className="text-xs text-np-text-secondary mt-1">{t('focus.todayTime')}</div>
        </div>

        <div className="text-center p-3 bg-np-bg-tertiary border border-np-border">
          <div className="text-2xl font-mono text-np-blue">
            {formatFocusTimeVerbose(stats.weekFocusTime)}
          </div>
          <div className="text-xs text-np-text-secondary mt-1">{t('focus.weekTime')}</div>
        </div>

        <div className="text-center p-3 bg-np-bg-tertiary border border-np-border">
          <div className="text-2xl font-mono text-np-purple">
            {formatFocusTimeVerbose(stats.totalFocusTime)}
          </div>
          <div className="text-xs text-np-text-secondary mt-1">{t('focus.totalTime')}</div>
        </div>
      </div>

      {/* Session stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div className="flex justify-between p-2 border-b border-np-border">
          <span className="text-np-text-secondary">{t('focus.sessionsToday')}:</span>
          <span className="text-np-text-primary font-mono">{todaySessions.length}</span>
        </div>

        <div className="flex justify-between p-2 border-b border-np-border">
          <span className="text-np-text-secondary">{t('focus.totalSessions')}:</span>
          <span className="text-np-text-primary font-mono">{stats.totalSessions}</span>
        </div>

        <div className="flex justify-between p-2 border-b border-np-border">
          <span className="text-np-text-secondary">{t('focus.avgSession')}:</span>
          <span className="text-np-text-primary font-mono">
            {formatFocusTimeVerbose(stats.averageSessionLength)}
          </span>
        </div>

        <div className="flex justify-between p-2 border-b border-np-border">
          <span className="text-np-text-secondary">{t('focus.longestSession')}:</span>
          <span className="text-np-text-primary font-mono">
            {formatFocusTimeVerbose(stats.longestSession)}
          </span>
        </div>
      </div>

      {/* Focus streak */}
      {focusStreak > 0 && (
        <div className="flex items-center justify-center gap-2 p-3 bg-np-bg-tertiary border border-np-orange/30 mb-6">
          <span className="text-2xl">🔥</span>
          <span className="text-np-orange font-mono text-lg">
            {focusStreak} {t('focus.dayStreak')}
          </span>
        </div>
      )}

      {/* Most focused tasks */}
      {topTasks.length > 0 && (
        <div>
          <div className="text-xs text-np-text-secondary mb-2">{t('focus.mostFocused')}:</div>
          <div className="space-y-2">
            {topTasks.map((task, index) => (
              <div
                key={task.taskId}
                className="flex items-center justify-between p-2 bg-np-bg-tertiary border border-np-border text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-np-text-secondary">#{index + 1}</span>
                  <span className="text-np-text-primary truncate max-w-[180px]">
                    {task.taskTitle}
                  </span>
                </div>
                <span className="text-np-cyan font-mono">
                  {formatFocusTimeVerbose(task.totalTime)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats.totalSessions === 0 && (
        <div className="text-center text-np-text-secondary py-8">
          <div className="text-3xl mb-2">🎯</div>
          <p>{t('focus.noSessionsYet')}</p>
          <p className="text-xs mt-1">{t('focus.startFirstSession')}</p>
        </div>
      )}
    </div>
  )
}
