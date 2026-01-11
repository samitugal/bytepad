import { useEffect, useState } from 'react'
import { useGamificationStore, Achievement } from '../../stores/gamificationStore'
import { useTranslation } from '../../i18n'

export function AchievementToast() {
  const { t } = useTranslation()
  const { pendingAchievements, clearPendingAchievement } = useGamificationStore()
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (pendingAchievements.length > 0 && !currentAchievement) {
      const achievement = pendingAchievements[0]
      setCurrentAchievement(achievement)
      setIsVisible(true)

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => {
          clearPendingAchievement(achievement.id)
          setCurrentAchievement(null)
        }, 300)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [pendingAchievements, currentAchievement, clearPendingAchievement])

  if (!currentAchievement) return null

  return (
    <div
      className={`fixed bottom-4 right-4 z-[90] transition-all duration-300 ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <div
        className="bg-np-bg-primary border-2 border-np-green p-4 font-mono min-w-[280px] cursor-pointer"
        onClick={() => {
          setIsVisible(false)
          setTimeout(() => {
            clearPendingAchievement(currentAchievement.id)
            setCurrentAchievement(null)
          }, 300)
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="text-2xl bg-np-selection border border-np-green/50 px-2 py-1">
            {currentAchievement.badge}
          </div>
          <div>
            <div className="text-np-green text-sm">
              🏆 {t('gamification.achievement.unlocked')}
            </div>
            <div className="text-np-text-primary font-bold">
              {currentAchievement.name}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="text-np-text-secondary text-sm mb-2">
          {currentAchievement.description}
        </div>

        {/* XP Reward */}
        <div className="text-np-cyan text-xs">
          +{currentAchievement.xpReward} XP
        </div>
      </div>
    </div>
  )
}
