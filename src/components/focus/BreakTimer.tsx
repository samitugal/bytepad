import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '../../i18n'

interface BreakTimerProps {
  /** Session duration in seconds that just completed */
  sessionDuration: number
  /** Number of consecutive sessions completed */
  consecutiveSessions: number
  /** Sessions until long break */
  sessionsUntilLongBreak: number
  /** Short break duration in minutes */
  shortBreakDuration: number
  /** Long break duration in minutes */
  longBreakDuration: number
  /** Auto-start break timer */
  autoStartBreak: boolean
  /** Callback when break is skipped */
  onSkip: () => void
  /** Callback when break is complete */
  onComplete: () => void
}

export function BreakTimer({
  sessionDuration,
  consecutiveSessions,
  sessionsUntilLongBreak,
  shortBreakDuration,
  longBreakDuration,
  autoStartBreak,
  onSkip,
  onComplete,
}: BreakTimerProps) {
  const { t } = useTranslation()

  // Determine break duration based on session length and consecutive sessions
  const calculateBreakDuration = useCallback(() => {
    // Long break every N sessions
    if (consecutiveSessions > 0 && consecutiveSessions % sessionsUntilLongBreak === 0) {
      return longBreakDuration * 60
    }

    // Break duration based on session length
    if (sessionDuration >= 3600) {
      // 60+ min session = 15 min break
      return 15 * 60
    } else if (sessionDuration >= 2700) {
      // 45+ min session = 10 min break
      return 10 * 60
    }
    // Default: short break
    return shortBreakDuration * 60
  }, [sessionDuration, consecutiveSessions, sessionsUntilLongBreak, shortBreakDuration, longBreakDuration])

  const [breakDuration] = useState(calculateBreakDuration)
  const [timeLeft, setTimeLeft] = useState(breakDuration)
  const [isRunning, setIsRunning] = useState(autoStartBreak)
  const [isComplete, setIsComplete] = useState(false)

  const isLongBreak = consecutiveSessions > 0 && consecutiveSessions % sessionsUntilLongBreak === 0

  // Timer countdown
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          setIsComplete(true)
          // Play a gentle notification
          if (Notification.permission === 'granted') {
            new Notification(t('focus.breakComplete') || 'Break complete!', {
              body: t('focus.readyToFocus') || 'Ready to focus again?',
            })
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, timeLeft, t])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleStartBreak = () => {
    setIsRunning(true)
  }

  const handleSkip = () => {
    setIsRunning(false)
    onSkip()
  }

  const handleContinue = () => {
    onComplete()
  }

  return (
    <div className="text-center py-8">
      {/* Celebration header */}
      <div className="mb-8">
        <div className="text-4xl mb-2">🎉</div>
        <h2 className="text-2xl text-np-green font-mono mb-2">
          {t('focus.sessionComplete')}
        </h2>
        <p className="text-np-text-secondary">
          {t('focus.focusedFor')} {Math.round(sessionDuration / 60)} {t('focus.minutes')}.
        </p>
      </div>

      {/* Break timer */}
      <div className="bg-np-bg-secondary border border-np-border p-8 max-w-md mx-auto">
        <div className="text-sm text-np-text-secondary mb-4">
          {isLongBreak ? (
            <span className="text-np-orange">
              🌟 {t('focus.longBreak')} ({Math.round(breakDuration / 60)} {t('focus.min')})
            </span>
          ) : (
            <span>
              {t('focus.takeBreak')} ({Math.round(breakDuration / 60)} {t('focus.min')})
            </span>
          )}
        </div>

        {/* Timer display */}
        <div
          className={`text-5xl font-mono mb-6 transition-colors ${
            isComplete ? 'text-np-green' : isRunning ? 'text-np-cyan' : 'text-np-text-secondary'
          }`}
        >
          {formatTime(timeLeft)}
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-np-bg-tertiary rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-np-cyan transition-all duration-1000 ease-linear"
            style={{
              width: `${((breakDuration - timeLeft) / breakDuration) * 100}%`,
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-3">
          {!isRunning && !isComplete && (
            <button
              onClick={handleStartBreak}
              className="np-btn text-np-green text-lg px-6 py-2"
            >
              {t('focus.startBreak')}
            </button>
          )}

          {isRunning && (
            <button
              onClick={handleSkip}
              className="np-btn text-np-text-secondary px-6 py-2"
            >
              {t('focus.skipBreak')}
            </button>
          )}

          {isComplete && (
            <button
              onClick={handleContinue}
              className="np-btn text-np-green text-lg px-6 py-2"
            >
              {t('focus.continueWorking')}
            </button>
          )}

          {!isComplete && (
            <button
              onClick={handleSkip}
              className="np-btn text-np-text-secondary px-4 py-2"
            >
              {t('focus.skipBreak')}
            </button>
          )}
        </div>
      </div>

      {/* Session count */}
      <div className="mt-6 text-sm text-np-text-secondary">
        <span className="mr-4">
          📊 {t('focus.sessionsToday')}: {consecutiveSessions}
        </span>
        {consecutiveSessions > 0 && (
          <span>
            {sessionsUntilLongBreak - (consecutiveSessions % sessionsUntilLongBreak)} {t('focus.untilLongBreak')}
          </span>
        )}
      </div>
    </div>
  )
}
