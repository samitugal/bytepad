import { useGamificationStore, ACHIEVEMENTS, formatXP } from '../../stores/gamificationStore'
import { useTranslation } from '../../i18n'
import { XPProgressBar } from './XPProgressBar'

export function StatsPanel() {
  const { t } = useTranslation()
  const {
    totalXP,
    tasksCompleted,
    habitsCompleted,
    pomodorosCompleted,
    notesCreated,
    journalEntries,
    currentStreak,
    bestStreak,
    achievements,
  } = useGamificationStore()

  const unlockedAchievements = ACHIEVEMENTS.filter(a => achievements.includes(a.id))
  const lockedAchievements = ACHIEVEMENTS.filter(a => !achievements.includes(a.id))

  return (
    <div className="bg-np-bg-secondary border border-np-border p-6">
      <h3 className="text-np-green font-mono mb-4">// {t('gamification.stats')}</h3>

      {/* XP Progress */}
      <div className="mb-6">
        <XPProgressBar />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-np-bg-tertiary border border-np-border p-3 text-center">
          <div className="text-2xl font-mono text-np-cyan">{formatXP(totalXP)}</div>
          <div className="text-xs text-np-text-secondary">{t('gamification.totalXP')}</div>
        </div>

        <div className="bg-np-bg-tertiary border border-np-border p-3 text-center">
          <div className="text-2xl font-mono text-np-orange">
            {currentStreak}<span className="text-sm">/{bestStreak}</span>
          </div>
          <div className="text-xs text-np-text-secondary">{t('gamification.streak')}</div>
        </div>
      </div>

      {/* Activity Counts */}
      <div className="mb-6">
        <div className="text-sm text-np-text-secondary mb-2">{t('gamification.activity')}</div>
        <div className="space-y-1 text-sm font-mono">
          <div className="flex justify-between p-2 bg-np-bg-tertiary">
            <span className="text-np-text-secondary">{t('gamification.tasksCompleted')}</span>
            <span className="text-np-text-primary">{tasksCompleted}</span>
          </div>
          <div className="flex justify-between p-2 bg-np-bg-tertiary">
            <span className="text-np-text-secondary">{t('gamification.habitsCompleted')}</span>
            <span className="text-np-text-primary">{habitsCompleted}</span>
          </div>
          <div className="flex justify-between p-2 bg-np-bg-tertiary">
            <span className="text-np-text-secondary">{t('gamification.focusSessions')}</span>
            <span className="text-np-text-primary">{pomodorosCompleted}</span>
          </div>
          <div className="flex justify-between p-2 bg-np-bg-tertiary">
            <span className="text-np-text-secondary">{t('gamification.notesCreated')}</span>
            <span className="text-np-text-primary">{notesCreated}</span>
          </div>
          <div className="flex justify-between p-2 bg-np-bg-tertiary">
            <span className="text-np-text-secondary">{t('gamification.journalEntries')}</span>
            <span className="text-np-text-primary">{journalEntries}</span>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <div className="text-sm text-np-text-secondary mb-2">
          {t('gamification.achievements')} ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
        </div>

        {/* Unlocked */}
        {unlockedAchievements.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {unlockedAchievements.map((a) => (
              <div
                key={a.id}
                className="bg-np-selection border border-np-green/50 px-2 py-1 text-xs font-mono"
                title={`${a.name}: ${a.description}`}
              >
                <span className="text-np-green">{a.badge}</span>
              </div>
            ))}
          </div>
        )}

        {/* Locked */}
        {lockedAchievements.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {lockedAchievements.map((a) => (
              <div
                key={a.id}
                className="bg-np-bg-tertiary border border-np-border px-2 py-1 text-xs font-mono opacity-50"
                title={`${a.name}: ${a.description}`}
              >
                <span className="text-np-text-secondary">[?]</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
