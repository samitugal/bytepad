import { useState } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { useChatStore } from '../../stores/chatStore'
import { useSettingsStore, PROVIDER_INFO } from '../../stores/settingsStore'
import { useGamificationStore, LEVELS, ACHIEVEMENTS, formatXP } from '../../stores/gamificationStore'

interface MenuBarProps {
  onSettingsClick?: () => void
}

// Window control functions - call Electron API if available
const handleMinimize = () => {
  if (window.electronAPI?.minimize) {
    window.electronAPI.minimize()
  }
}

const handleMaximize = () => {
  if (window.electronAPI?.maximize) {
    window.electronAPI.maximize()
  }
}

const handleClose = () => {
  if (window.electronAPI?.close) {
    window.electronAPI.close()
  } else {
    // Fallback for when electronAPI is not available
    window.close()
  }
}

export function MenuBar({ onSettingsClick }: MenuBarProps) {
  const { toggleFocusMode } = useUIStore()
  const { toggleOpen: toggleChat } = useChatStore()
  const { llmProvider, apiKeys } = useSettingsStore()
  const [showProfile, setShowProfile] = useState(false)

  // Gamification data
  const {
    level,
    currentXP,
    totalXP,
    currentStreak,
    achievements,
    getXPProgress,
    getXPForNextLevel,
    getLevelTitle,
  } = useGamificationStore()

  const xpProgress = getXPProgress()
  const xpForNext = getXPForNextLevel()
  const levelTitle = getLevelTitle()
  const unlockedAchievements = ACHIEVEMENTS.filter(a => achievements.includes(a.id))

  // Check if API key is configured
  const hasApiKey = llmProvider === 'ollama' || !!apiKeys[llmProvider]
  const requiresKey = PROVIDER_INFO[llmProvider].requiresKey

  return (
    <div className="h-8 bg-np-bg-secondary border-b border-np-border flex items-center justify-between px-2 text-sm select-none app-drag-region">
      <div className="flex items-center gap-4 app-no-drag">
        <span className="text-np-text-primary font-medium">bytepad</span>
        <div className="flex items-center gap-3 text-np-text-secondary">
          <span className="hover:text-np-text-primary cursor-pointer">File</span>
          <span className="hover:text-np-text-primary cursor-pointer">Edit</span>
          <span className="hover:text-np-text-primary cursor-pointer">View</span>
          <span
            className="hover:text-np-text-primary cursor-pointer"
            onClick={toggleFocusMode}
            title="Focus Mode (Ctrl+Shift+F)"
          >
            Focus
          </span>
          <span
            className={`cursor-pointer ${hasApiKey || !requiresKey
              ? 'hover:text-np-text-primary text-np-green'
              : 'text-np-text-secondary/50 cursor-not-allowed'
              }`}
            onClick={hasApiKey || !requiresKey ? toggleChat : undefined}
            title={
              hasApiKey || !requiresKey
                ? 'FlowBot AI Coach (Ctrl+/)'
                : 'Configure API key in Settings → AI'
            }
          >
            🤖 Chat {!hasApiKey && requiresKey && <span className="text-np-error text-xs">!</span>}
          </span>
          <span
            className="hover:text-np-text-primary cursor-pointer"
            onClick={onSettingsClick}
            title="Settings"
          >
            Settings
          </span>
        </div>
      </div>

      {/* Right side: Profile + Window controls */}
      <div className="flex items-center gap-2 app-no-drag">
        {/* User Profile Button */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 px-2 py-1 hover:bg-np-bg-tertiary transition-colors rounded"
            title="Your Profile & Achievements"
          >
            <span className="text-np-purple font-bold text-xs">Lv.{level}</span>
            <div className="w-16 h-1.5 bg-np-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-np-purple transition-all"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            {currentStreak > 0 && (
              <span className="text-np-orange text-xs">🔥{currentStreak}</span>
            )}
          </button>

          {/* Profile Dropdown */}
          {showProfile && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfile(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-72 bg-np-bg-primary border border-np-border shadow-xl z-50">
                {/* Header */}
                <div className="p-3 border-b border-np-border bg-np-bg-secondary">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🎮</span>
                      <div>
                        <div className="text-np-text-primary font-bold">Level {level}</div>
                        <div className="text-xs text-np-purple">{levelTitle}</div>
                      </div>
                    </div>
                    {currentStreak > 0 && (
                      <div className="text-right">
                        <div className="text-np-orange font-bold">🔥 {currentStreak}</div>
                        <div className="text-xs text-np-text-secondary">day streak</div>
                      </div>
                    )}
                  </div>
                  {/* XP Progress */}
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-np-text-secondary mb-1">
                      <span>{formatXP(currentXP)} XP</span>
                      <span>{formatXP(xpForNext)} XP to next</span>
                    </div>
                    <div className="h-2 bg-np-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-np-purple to-np-cyan transition-all"
                        style={{ width: `${xpProgress}%` }}
                      />
                    </div>
                    <div className="text-xs text-np-text-secondary mt-1 text-center">
                      Total: {formatXP(totalXP)} XP
                    </div>
                  </div>
                </div>

                {/* Achievements */}
                <div className="p-3 max-h-64 overflow-y-auto">
                  <div className="text-xs text-np-green mb-2">
                    Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
                  </div>
                  {unlockedAchievements.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {unlockedAchievements.map(a => (
                        <div
                          key={a.id}
                          className="flex flex-col items-center p-2 bg-np-bg-secondary border border-np-border hover:border-np-purple transition-colors"
                          title={`${a.name}: ${a.description}`}
                        >
                          <span className="text-lg">{a.badge}</span>
                          <span className="text-xs text-np-text-secondary truncate w-full text-center">
                            {a.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-np-text-secondary text-xs py-4">
                      Complete tasks and habits to unlock achievements!
                    </div>
                  )}

                  {/* Locked achievements preview */}
                  {unlockedAchievements.length < ACHIEVEMENTS.length && (
                    <div className="mt-3 pt-3 border-t border-np-border">
                      <div className="text-xs text-np-text-secondary mb-2">
                        Next achievements:
                      </div>
                      <div className="space-y-1">
                        {ACHIEVEMENTS.filter(a => !achievements.includes(a.id))
                          .slice(0, 3)
                          .map(a => (
                            <div
                              key={a.id}
                              className="flex items-center gap-2 text-xs text-np-text-secondary/60"
                            >
                              <span className="opacity-50">{a.badge}</span>
                              <span>{a.name}</span>
                              <span className="text-np-cyan ml-auto">+{a.xpReward} XP</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Level Progress */}
                <div className="p-2 border-t border-np-border bg-np-bg-tertiary">
                  <div className="flex justify-between text-xs">
                    {LEVELS.slice(0, 5).map(l => (
                      <div
                        key={l.level}
                        className={`text-center ${level >= l.level ? 'text-np-purple' : 'text-np-text-secondary/40'}`}
                      >
                        <div className="font-bold">{l.level}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-0 text-np-text-secondary">
          <button
            onClick={handleMinimize}
            className="w-10 h-8 hover:bg-np-bg-tertiary flex items-center justify-center transition-colors app-no-drag"
            title="Minimize"
          >
            ─
          </button>
          <button
            onClick={handleMaximize}
            className="w-10 h-8 hover:bg-np-bg-tertiary flex items-center justify-center transition-colors app-no-drag"
            title="Maximize"
          >
            □
          </button>
          <button
            onClick={handleClose}
            className="w-10 h-8 hover:bg-np-error hover:text-white flex items-center justify-center transition-colors app-no-drag"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
