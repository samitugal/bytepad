import { useGamificationStore, formatXP } from '../../stores/gamificationStore'
import { useTranslation } from '../../i18n'

interface XPProgressBarProps {
  compact?: boolean
}

export function XPProgressBar({ compact = false }: XPProgressBarProps) {
  const { t } = useTranslation()
  const {
    level,
    currentXP,
    currentStreak,
    getXPForNextLevel,
    getXPProgress,
    getLevelTitle,
    getStreakMultiplier,
  } = useGamificationStore()

  const xpNeeded = getXPForNextLevel()
  const progress = getXPProgress()
  const multiplier = getStreakMultiplier()

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-np-cyan">Lv.{level}</span>
        <div className="w-16 h-1.5 bg-np-bg-tertiary rounded-full overflow-hidden">
          <div
            className="h-full bg-np-cyan transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {currentStreak > 0 && (
          <span className="text-np-orange">🔥{currentStreak}</span>
        )}
      </div>
    )
  }

  return (
    <div className="bg-np-bg-secondary border border-np-border p-3">
      {/* Level and Title */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-np-cyan font-mono font-bold">
            [Lv.{level}]
          </span>
          <span className="text-np-text-primary text-sm">
            {getLevelTitle()}
          </span>
        </div>
        {currentStreak > 0 && (
          <div className="flex items-center gap-1 text-np-orange text-sm">
            <span>🔥</span>
            <span className="font-mono">{currentStreak}</span>
            {multiplier > 1 && (
              <span className="text-xs text-np-text-secondary">
                ({multiplier}x)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-np-bg-tertiary rounded-full overflow-hidden mb-1">
        <div
          className="h-full bg-gradient-to-r from-np-blue to-np-cyan transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* XP text */}
      <div className="flex justify-between text-xs text-np-text-secondary font-mono">
        <span>{formatXP(currentXP)} XP</span>
        <span>{formatXP(xpNeeded)} {t('gamification.toNextLevel')}</span>
      </div>
    </div>
  )
}
