import { useTranslation } from '../../i18n'
import type { ProductivityReport } from '../../types'

interface StrengthsWeaknessesProps {
  report: ProductivityReport
}

export function StrengthsWeaknesses({ report }: StrengthsWeaknessesProps) {
  const { t } = useTranslation()

  if (report.strengths.length === 0 && report.weaknesses.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Strengths */}
      <div className="bg-np-bg-secondary border border-np-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-np-green text-lg">{'+'}</span>
          <span className="text-sm text-np-green">{t('report.strengths')}</span>
        </div>
        <div className="space-y-3">
          {report.strengths.length > 0 ? (
            report.strengths.map((strength, i) => (
              <div key={i} className="bg-np-bg-tertiary p-3 border-l-2 border-np-green">
                <div className="text-sm text-np-text-primary font-medium">
                  {strength.title}
                </div>
                <div className="text-xs text-np-text-secondary mt-1">
                  {strength.description}
                </div>
                {strength.evidence && (
                  <div className="text-xs text-np-green mt-2">
                    {'>'} {strength.evidence}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-sm text-np-text-secondary italic">
              {t('report.noStrengths')}
            </div>
          )}
        </div>
      </div>

      {/* Weaknesses */}
      <div className="bg-np-bg-secondary border border-np-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-np-orange text-lg">{'!'}</span>
          <span className="text-sm text-np-orange">{t('report.weaknesses')}</span>
        </div>
        <div className="space-y-3">
          {report.weaknesses.length > 0 ? (
            report.weaknesses.map((weakness, i) => (
              <div key={i} className="bg-np-bg-tertiary p-3 border-l-2 border-np-orange">
                <div className="text-sm text-np-text-primary font-medium">
                  {weakness.title}
                </div>
                <div className="text-xs text-np-text-secondary mt-1">
                  {weakness.description}
                </div>
                {weakness.suggestion && (
                  <div className="text-xs text-np-cyan mt-2 flex items-start gap-1">
                    <span>{'>'}</span>
                    <span>{weakness.suggestion}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-sm text-np-text-secondary italic">
              {t('report.noWeaknesses')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
