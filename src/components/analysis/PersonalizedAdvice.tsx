import { useTranslation } from '../../i18n'
import type { ProductivityReport, ReportAdvice } from '../../types'

interface PersonalizedAdviceProps {
  report: ProductivityReport
}

const CATEGORY_ICONS: Record<ReportAdvice['category'], string> = {
  focus: 'F',
  habits: 'H',
  tasks: 'T',
  wellbeing: 'W',
  general: 'G',
}

const CATEGORY_COLORS: Record<ReportAdvice['category'], string> = {
  focus: 'text-np-cyan border-np-cyan',
  habits: 'text-np-green border-np-green',
  tasks: 'text-np-blue border-np-blue',
  wellbeing: 'text-np-purple border-np-purple',
  general: 'text-np-orange border-np-orange',
}

export function PersonalizedAdvice({ report }: PersonalizedAdviceProps) {
  const { t } = useTranslation()

  if (report.advice.length === 0) {
    return null
  }

  return (
    <div className="bg-np-bg-secondary border border-np-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-np-purple">{'*'}</span>
        <span className="text-sm text-np-purple">{t('report.advice')}</span>
      </div>

      <div className="space-y-4">
        {report.advice.map((advice, i) => (
          <div key={i} className="bg-np-bg-tertiary p-3">
            <div className="flex items-start gap-3">
              {/* Category Badge */}
              <div
                className={`w-8 h-8 flex items-center justify-center border text-xs font-bold shrink-0 ${CATEGORY_COLORS[advice.category]}`}
              >
                {CATEGORY_ICONS[advice.category]}
              </div>

              <div className="flex-1">
                <div className="text-sm text-np-text-primary font-medium">
                  {advice.title}
                </div>
                <div className="text-xs text-np-text-secondary mt-1">
                  {advice.description}
                </div>

                {/* Action Items */}
                {advice.actionItems.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {advice.actionItems.map((item, j) => (
                      <div
                        key={j}
                        className="flex items-center gap-2 text-xs text-np-text-primary"
                      >
                        <span className="text-np-cyan">{j + 1}.</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
