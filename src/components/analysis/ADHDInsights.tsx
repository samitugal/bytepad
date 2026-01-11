import { useTranslation } from '../../i18n'
import type { ProductivityReport } from '../../types'

interface ADHDInsightsProps {
  report: ProductivityReport
}

export function ADHDInsights({ report }: ADHDInsightsProps) {
  const { t } = useTranslation()
  const { adhdInsights } = report

  return (
    <div className="bg-np-bg-secondary border border-np-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-np-purple">{'~'}</span>
        <span className="text-sm text-np-purple">{t('report.adhdInsights')}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Hyperfocus Detection */}
        <div className="bg-np-bg-tertiary p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className={adhdInsights.hyperfocusDetected ? 'text-np-cyan' : 'text-np-text-secondary'}>
              {adhdInsights.hyperfocusDetected ? '[x]' : '[ ]'}
            </span>
            <span className="text-sm text-np-text-primary">{t('report.hyperfocus')}</span>
          </div>
          <div className="text-xs text-np-text-secondary">
            {adhdInsights.hyperfocusDetected
              ? t('report.hyperfocusDetected')
              : t('report.noHyperfocus')}
          </div>
        </div>

        {/* Consistency Score */}
        <div className="bg-np-bg-tertiary p-3">
          <div className="text-xs text-np-text-secondary mb-2">{t('report.consistency')}</div>
          <div className="flex items-center gap-3">
            <div className={`text-2xl font-bold ${getConsistencyColor(adhdInsights.consistencyScore)}`}>
              {adhdInsights.consistencyScore}%
            </div>
            <div className="flex-1">
              <div className="h-2 bg-np-bg-primary rounded-sm overflow-hidden">
                <div
                  className={`h-full ${getConsistencyBgColor(adhdInsights.consistencyScore)} transition-all`}
                  style={{ width: `${adhdInsights.consistencyScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Energy Patterns */}
      <div className="bg-np-bg-tertiary p-3 mt-4">
        <div className="text-xs text-np-text-secondary mb-1">{t('report.energyPatterns')}</div>
        <div className="text-sm text-np-text-primary">{adhdInsights.energyPatterns}</div>
      </div>

      {/* Dopamine Management */}
      <div className="bg-np-bg-tertiary p-3 mt-3 border-l-2 border-np-purple">
        <div className="text-xs text-np-purple mb-1">{t('report.dopamineManagement')}</div>
        <div className="text-sm text-np-text-primary">{adhdInsights.dopamineManagement}</div>
      </div>
    </div>
  )
}

function getConsistencyColor(score: number): string {
  if (score >= 70) return 'text-np-green'
  if (score >= 50) return 'text-np-orange'
  return 'text-np-error'
}

function getConsistencyBgColor(score: number): string {
  if (score >= 70) return 'bg-np-green'
  if (score >= 50) return 'bg-np-orange'
  return 'bg-np-error'
}
