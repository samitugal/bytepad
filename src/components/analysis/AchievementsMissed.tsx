import { useTranslation } from '../../i18n'
import type { ProductivityReport } from '../../types'

interface AchievementsMissedProps {
  report: ProductivityReport
}

export function AchievementsMissed({ report }: AchievementsMissedProps) {
  const { t } = useTranslation()

  if (report.achievements.length === 0 && report.missed.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Achievements */}
      <div className="bg-np-bg-secondary border border-np-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-np-cyan">{'#'}</span>
          <span className="text-sm text-np-cyan">{t('report.achievements')}</span>
        </div>
        <div className="space-y-2">
          {report.achievements.length > 0 ? (
            report.achievements.map((achievement, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-np-green mt-0.5">{'>'}</span>
                <div>
                  <div className="text-sm text-np-text-primary">
                    {achievement.title}
                  </div>
                  <div className="text-xs text-np-text-secondary">
                    {achievement.description}
                  </div>
                  {achievement.impact && (
                    <div className="text-xs text-np-green mt-1">
                      {achievement.impact}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-np-text-secondary italic">
              {t('report.noAchievements')}
            </div>
          )}
        </div>
      </div>

      {/* Missed Items */}
      <div className="bg-np-bg-secondary border border-np-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-np-error">{'x'}</span>
          <span className="text-sm text-np-error">{t('report.missed')}</span>
        </div>
        <div className="space-y-2">
          {report.missed.length > 0 ? (
            report.missed.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-np-error mt-0.5">{'>'}</span>
                <div>
                  <div className="text-sm text-np-text-primary">
                    {item.title}
                  </div>
                  <div className="text-xs text-np-text-secondary">
                    {item.description}
                  </div>
                  {item.recovery && (
                    <div className="text-xs text-np-cyan mt-1 flex items-start gap-1">
                      <span>{'>'}</span>
                      <span>{item.recovery}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-np-text-secondary italic">
              {t('report.noMissed')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
