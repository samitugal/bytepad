import { useTranslation } from '../../i18n'
import type { ProductivityReport } from '../../types'

interface ReportSummaryProps {
  report: ProductivityReport
}

export function ReportSummary({ report }: ReportSummaryProps) {
  const { t } = useTranslation()

  const formatDateRange = () => {
    const start = new Date(report.dateRange.start)
    const end = new Date(report.dateRange.end)
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  const getScoreColor = () => {
    if (report.productivityScore >= 70) return 'text-np-green'
    if (report.productivityScore >= 50) return 'text-np-orange'
    return 'text-np-error'
  }

  const getProgressColor = () => {
    if (report.productivityScore >= 70) return 'bg-np-green'
    if (report.productivityScore >= 50) return 'bg-np-orange'
    return 'bg-np-error'
  }

  return (
    <div className="bg-np-bg-secondary border border-np-border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-np-text-secondary uppercase">
            {report.period === 'daily' ? t('report.daily') : t('report.weekly')}
          </div>
          <div className="text-sm text-np-text-primary mt-1">{formatDateRange()}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-np-text-secondary">{t('report.score')}</div>
          <div className={`text-3xl font-bold ${getScoreColor()}`}>
            {report.productivityScore}
            <span className="text-lg text-np-text-secondary">/100</span>
          </div>
        </div>
      </div>

      {/* Score Bar */}
      <div className="mb-4">
        <div className="h-3 bg-np-bg-tertiary rounded-sm overflow-hidden">
          <div
            className={`h-full ${getProgressColor()} transition-all`}
            style={{ width: `${report.productivityScore}%` }}
          />
        </div>
        {report.comparisonToPrevious !== null && (
          <div className="text-xs text-np-text-secondary mt-1">
            {report.comparisonToPrevious > 0 ? '+' : ''}
            {report.comparisonToPrevious}% {t('report.comparedToPrevious')}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-np-bg-tertiary p-3 border-l-2 border-np-purple">
        <div className="text-xs text-np-purple mb-1">{t('report.summary')}</div>
        <div className="text-sm text-np-text-primary">{report.summary}</div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3 mt-4">
        <QuickStat
          label={t('tasks.completed')}
          value={`${report.rawData.tasks.completed}/${report.rawData.tasks.total}`}
          color="text-np-blue"
        />
        <QuickStat
          label={t('habits.streak')}
          value={`${report.rawData.habits.completionRate}%`}
          color="text-np-green"
        />
        <QuickStat
          label={t('focus.totalTime')}
          value={`${Math.round(report.rawData.focus.totalMinutes / 60)}h`}
          color="text-np-cyan"
        />
        <QuickStat
          label={t('journal.mood')}
          value={report.rawData.journal.avgMood > 0 ? report.rawData.journal.avgMood.toFixed(1) : '-'}
          color="text-np-purple"
        />
      </div>
    </div>
  )
}

function QuickStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-np-text-secondary">{label}</div>
    </div>
  )
}
