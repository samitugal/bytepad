import { useEffect, useState } from 'react'
import { useGamificationStore, LEVELS } from '../../stores/gamificationStore'
import { useTranslation } from '../../i18n'

export function LevelUpModal() {
  const { t } = useTranslation()
  const { pendingLevelUp, clearPendingLevelUp } = useGamificationStore()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (pendingLevelUp) {
      setIsVisible(true)

      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(clearPendingLevelUp, 300) // Wait for fade animation
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [pendingLevelUp, clearPendingLevelUp])

  if (!pendingLevelUp) return null

  const newLevelInfo = LEVELS.find(l => l.level === pendingLevelUp.newLevel)

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/50 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => {
        setIsVisible(false)
        setTimeout(clearPendingLevelUp, 300)
      }}
    >
      <div
        className={`bg-np-bg-primary border-2 border-np-cyan p-8 max-w-md text-center font-mono transition-transform duration-300 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ASCII Art Header */}
        <pre className="text-np-cyan text-xs mb-4">
{`╔═══════════════════════════════╗
║      ★ LEVEL UP! ★            ║
╚═══════════════════════════════╝`}
        </pre>

        {/* Level Display */}
        <div className="mb-4">
          <div className="text-np-text-secondary text-sm mb-2">
            {t('gamification.levelUp.from')} Lv.{pendingLevelUp.oldLevel}
          </div>
          <div className="text-4xl text-np-cyan font-bold mb-2">
            Lv.{pendingLevelUp.newLevel}
          </div>
          <div className="text-xl text-np-green">
            {newLevelInfo?.title}
          </div>
        </div>

        {/* Decorative Line */}
        <div className="text-np-border mb-4">
          ════════════════════════
        </div>

        {/* Message */}
        <p className="text-np-text-secondary text-sm mb-4">
          {t('gamification.levelUp.message')}
        </p>

        {/* Dismiss hint */}
        <div className="text-xs text-np-text-secondary">
          {t('gamification.levelUp.dismiss')}
        </div>
      </div>
    </div>
  )
}
