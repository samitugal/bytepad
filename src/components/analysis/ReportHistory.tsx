import { useTranslation } from '../../i18n'
import { useReportStore } from '../../stores/reportStore'
import type { ProductivityReport } from '../../types'

interface ReportHistoryProps {
  reports: ProductivityReport[]
  onSelect: (report: ProductivityReport) => void
  onBack: () => void
}

export function ReportHistory({ reports, onSelect, onBack }: ReportHistoryProps) {
  const { t } = useTranslation()
  const { deleteReport } = useReportStore()

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-np-green'
    if (score >= 50) return 'text-np-orange'
    return 'text-np-error'
  }

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="np-btn text-xs">
            {'<'} {t('common.previous')}
          </button>
          <h2 className="text-lg text-np-text-primary">
            <span className="text-np-purple">{'//'} </span>
            {t('report.history')}
          </h2>
        </div>
        <div className="text-sm text-np-text-secondary">
          {reports.length} {t('report.reportsTotal')}
        </div>
      </div>

      {/* Report List */}
      {reports.length > 0 ? (
        <div className="space-y-2">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-np-bg-secondary border border-np-border p-3 hover:border-np-purple transition-colors cursor-pointer"
              onClick={() => onSelect(report)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Period Badge */}
                  <div
                    className={`px-2 py-1 text-xs ${
                      report.period === 'daily'
                        ? 'bg-np-blue/20 text-np-blue'
                        : 'bg-np-purple/20 text-np-purple'
                    }`}
                  >
                    {report.period === 'daily' ? t('report.daily') : t('report.weekly')}
                  </div>

                  {/* Date Range */}
                  <div className="text-sm text-np-text-primary">
                    {report.dateRange.start} - {report.dateRange.end}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Score */}
                  <div className={`text-lg font-bold ${getScoreColor(report.productivityScore)}`}>
                    {report.productivityScore}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteReport(report.id)
                    }}
                    className="text-np-text-secondary hover:text-np-error transition-colors"
                    title={t('common.delete')}
                  >
                    x
                  </button>
                </div>
              </div>

              {/* Generated At */}
              <div className="text-xs text-np-text-secondary mt-2">
                {t('report.generatedAt')}: {formatDate(report.generatedAt)}
              </div>

              {/* Summary Preview */}
              <div className="text-xs text-np-text-secondary mt-1 line-clamp-1">
                {report.summary}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-np-text-secondary">
            <div className="text-4xl mb-4">{'[]'}</div>
            <div className="text-lg">{t('report.noHistory')}</div>
          </div>
        </div>
      )}
    </div>
  )
}
