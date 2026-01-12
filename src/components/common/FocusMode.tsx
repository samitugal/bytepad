import { useState, useEffect, useCallback, useRef } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { useTaskStore } from '../../stores/taskStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useFocusStore, formatFocusTimeVerbose } from '../../stores/focusStore'
import { CircularTimer, BreakTimer, FocusStats } from '../focus'
import { useTranslation } from '../../i18n'

type FocusPhase = 'select' | 'focus' | 'break' | 'stats'

export function FocusMode() {
  const { t } = useTranslation()
  const { focusMode, focusModeMinimized, toggleFocusMode, minimizeFocusMode, setFocusMode } = useUIStore()
  const { tasks, toggleTask } = useTaskStore()
  const { focusPreferences } = useSettingsStore()
  const {
    currentSession,
    consecutiveSessions,
    startSession,
    updateSessionDuration,
    endSession,
    getTaskFocusTime,
    getTodaySessions,
  } = useFocusStore()

  const [phase, setPhase] = useState<FocusPhase>('select')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [timerMinutes, setTimerMinutes] = useState(focusPreferences.defaultDuration)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showStats, setShowStats] = useState(false)
  const [lastCompletedSession, setLastCompletedSession] = useState<{ duration: number } | null>(null)

  const originalTitle = useRef(document.title)
  const beforeUnloadHandler = useRef<((e: BeforeUnloadEvent) => void) | null>(null)

  const activeTasks = tasks.filter(t => !t.completed).sort((a, b) => {
    const order = { P1: 1, P2: 2, P3: 3, P4: 4 }
    return order[a.priority] - order[b.priority]
  })

  const selectedTask = tasks.find(t => t.id === selectedTaskId)
  const todaySessions = getTodaySessions()
  const dailyGoalProgress = Math.min(todaySessions.length / focusPreferences.dailyGoalSessions * 100, 100)

  const FOCUS_DURATIONS = [
    { label: '15', minutes: 15 },
    { label: '25', minutes: 25 },
    { label: '45', minutes: 45 },
    { label: '60', minutes: 60 },
  ]

  // Start timer
  const startTimer = useCallback(() => {
    if (!selectedTaskId || !selectedTask) return

    const targetDuration = timerMinutes * 60
    setTimeLeft(targetDuration)
    setElapsedTime(0)
    setIsRunning(true)
    setPhase('focus')

    startSession(selectedTaskId, selectedTask.title, targetDuration)
  }, [timerMinutes, selectedTaskId, selectedTask, startSession])

  // Stop timer
  const stopTimer = useCallback((completed: boolean = false) => {
    if (currentSession) {
      setLastCompletedSession({ duration: elapsedTime })
      endSession(completed)
    }
    setIsRunning(false)
    setTimeLeft(null)
    setElapsedTime(0)

    if (completed && elapsedTime > 60) {
      // Only show break if session was at least 1 minute
      setPhase('break')
    } else {
      setPhase('select')
      setSelectedTaskId(null)
    }
  }, [currentSession, elapsedTime, endSession])

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const resumeTimer = () => {
    setIsRunning(true)
  }

  // Timer countdown
  useEffect(() => {
    if (!isRunning || timeLeft === null) return

    if (timeLeft <= 0) {
      setIsRunning(false)
      stopTimer(true)

      // Play completion sound
      if (focusPreferences.playCompletionSound && Notification.permission === 'granted') {
        new Notification(t('focus.sessionComplete') || 'Focus session complete!', {
          body: t('focus.takeBreakMessage') || 'Take a short break before your next session.',
        })
      }
      return
    }

    const interval = setInterval(() => {
      setTimeLeft(t => (t !== null ? t - 1 : null))
      setElapsedTime(e => e + 1)

      // Update session duration in store
      if (currentSession) {
        updateSessionDuration(elapsedTime + 1)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, timeLeft, elapsedTime, currentSession, updateSessionDuration, stopTimer, focusPreferences.playCompletionSound, t])

  // Browser tab title update
  useEffect(() => {
    if (!focusPreferences.showTimeInTitle) return

    if (isRunning && timeLeft !== null) {
      const m = Math.floor(timeLeft / 60)
      const s = timeLeft % 60
      document.title = `🍅 ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} - Focus | BytePad`
    } else if (focusMode) {
      document.title = '🎯 Focus Mode | BytePad'
    }

    return () => {
      document.title = originalTitle.current
    }
  }, [isRunning, timeLeft, focusMode, focusPreferences.showTimeInTitle])

  // Beforeunload warning
  useEffect(() => {
    if (isRunning) {
      beforeUnloadHandler.current = (e: BeforeUnloadEvent) => {
        e.preventDefault()
        e.returnValue = t('focus.leaveWarning') || 'You have an active focus session. Are you sure you want to leave?'
        return e.returnValue
      }
      window.addEventListener('beforeunload', beforeUnloadHandler.current)
    }

    return () => {
      if (beforeUnloadHandler.current) {
        window.removeEventListener('beforeunload', beforeUnloadHandler.current)
        beforeUnloadHandler.current = null
      }
    }
  }, [isRunning, t])

  // Request notification permission
  useEffect(() => {
    if (focusMode && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [focusMode])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === 'Escape' && focusMode) {
        if (isRunning) {
          pauseTimer()
        } else {
          toggleFocusMode()
        }
      }

      if (phase === 'focus') {
        if (e.code === 'Space') {
          e.preventDefault()
          if (isRunning) {
            pauseTimer()
          } else if (timeLeft !== null) {
            resumeTimer()
          }
        }

        if (e.key.toLowerCase() === 'r' && !isRunning && timeLeft !== null) {
          // Reset timer
          setTimeLeft(timerMinutes * 60)
          setElapsedTime(0)
        }

        if (e.key.toLowerCase() === 'c') {
          handleCompleteTask()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusMode, toggleFocusMode, isRunning, timeLeft, timerMinutes, phase])

  // Reset state when focus mode is fully closed (not minimized)
  useEffect(() => {
    if (!focusMode) {
      if (isRunning && currentSession) {
        // Save session if exiting while running
        endSession(false)
      }
      setPhase('select')
      setSelectedTaskId(null)
      setTimeLeft(null)
      setElapsedTime(0)
      setIsRunning(false)
      setShowStats(false)
    }
  }, [focusMode, isRunning, currentSession, endSession])

  // Handle minimize - don't reset timer, just hide UI
  const handleMinimize = useCallback(() => {
    minimizeFocusMode()
  }, [minimizeFocusMode])

  // Handle full exit - stop timer and reset
  const handleExit = useCallback(() => {
    if (isRunning && currentSession) {
      endSession(false)
    }
    setFocusMode(false)
  }, [isRunning, currentSession, endSession, setFocusMode])

  const handleCompleteTask = () => {
    if (selectedTaskId) {
      toggleTask(selectedTaskId)
      stopTimer(true)
    }
  }

  const handleBreakComplete = () => {
    setPhase('select')
    setSelectedTaskId(null)
    setLastCompletedSession(null)
  }

  const handleBreakSkip = () => {
    setPhase('select')
    setSelectedTaskId(null)
    setLastCompletedSession(null)
  }

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId)
  }

  // Don't render full UI if minimized or not active
  if (!focusMode || focusModeMinimized) return null

  return (
    <div className="fixed inset-0 bg-np-bg-primary z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-np-border">
        <div className="flex items-center gap-4">
          <div className="text-np-green font-mono">// {t('focus.title')}</div>

          {/* Daily goal progress */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-np-text-secondary">{t('focus.dailyGoal')}:</span>
            <div className="w-24 h-2 bg-np-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-np-green transition-all duration-300"
                style={{ width: `${dailyGoalProgress}%` }}
              />
            </div>
            <span className="text-np-text-secondary font-mono">
              {todaySessions.length}/{focusPreferences.dailyGoalSessions}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStats(!showStats)}
            className={`np-btn ${showStats ? 'text-np-cyan' : 'text-np-text-secondary'}`}
          >
            📊 {t('focus.stats')}
          </button>
          {/* Minimize button - only show when timer is running */}
          {isRunning && (
            <button
              onClick={handleMinimize}
              className="np-btn text-np-blue"
              title="Minimize to mini timer"
            >
              ⬇ {t('focus.minimize') || 'Minimize'}
            </button>
          )}
          <button
            onClick={handleExit}
            className="np-btn text-np-text-secondary"
          >
            {t('focus.exit')} (Esc)
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Focus area */}
        <div className={`flex-1 flex items-center justify-center p-8 ${showStats ? 'w-2/3' : 'w-full'}`}>
          <div className="max-w-2xl w-full">
            {/* Task Selection Phase */}
            {phase === 'select' && (
              <div>
                <h2 className="text-xl text-np-text-primary mb-6 text-center">
                  {t('focus.selectTask')}
                </h2>

                {activeTasks.length === 0 ? (
                  <div className="text-center text-np-text-secondary">
                    <p>{t('focus.noTasks')}</p>
                    <button onClick={toggleFocusMode} className="np-btn mt-4">
                      {t('tasks.title')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeTasks.slice(0, 5).map(task => {
                      const taskFocusTime = getTaskFocusTime(task.id)
                      return (
                        <button
                          key={task.id}
                          onClick={() => handleSelectTask(task.id)}
                          className={`w-full p-4 bg-np-bg-secondary border transition-colors text-left ${
                            selectedTaskId === task.id
                              ? 'border-np-blue bg-np-selection'
                              : 'border-np-border hover:border-np-blue'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-bold ${
                                task.priority === 'P1' ? 'text-np-error' :
                                task.priority === 'P2' ? 'text-np-orange' :
                                task.priority === 'P3' ? 'text-np-blue' : 'text-np-text-secondary'
                              }`}>[{task.priority}]</span>
                              <span className="text-np-text-primary">{task.title}</span>
                            </div>
                            {taskFocusTime > 0 && (
                              <span className="text-xs text-np-cyan font-mono">
                                ⏱️ {formatFocusTimeVerbose(taskFocusTime)}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-np-text-secondary mt-1 ml-12">
                              {task.description}
                            </p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Duration selection */}
                {selectedTaskId && (
                  <div className="mt-8">
                    <div className="text-sm text-np-text-secondary mb-3 text-center">
                      {t('focus.sessionDuration')}:
                    </div>
                    <div className="flex justify-center gap-2 mb-6">
                      {FOCUS_DURATIONS.map(d => (
                        <button
                          key={d.minutes}
                          onClick={() => setTimerMinutes(d.minutes)}
                          className={`px-4 py-2 border ${
                            timerMinutes === d.minutes
                              ? 'bg-np-selection border-np-blue text-np-text-primary'
                              : 'border-np-border text-np-text-secondary hover:border-np-text-secondary'
                          }`}
                        >
                          {d.label} {t('focus.min')}
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={startTimer}
                        className="np-btn text-np-green text-lg px-8 py-3"
                      >
                        ▶ {t('focus.startFocus')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Focus Phase */}
            {phase === 'focus' && timeLeft !== null && (
              <div className="text-center">
                {/* Circular Timer */}
                <div className="mb-8">
                  <CircularTimer
                    timeLeft={timeLeft}
                    totalTime={timerMinutes * 60}
                    isRunning={isRunning}
                    isComplete={timeLeft <= 0}
                  />
                </div>

                {/* Timer controls */}
                <div className="flex justify-center gap-3 mb-8">
                  {isRunning ? (
                    <button onClick={pauseTimer} className="np-btn text-np-orange text-lg px-6 py-2">
                      ⏸ {t('focus.pause')}
                    </button>
                  ) : (
                    <>
                      <button onClick={resumeTimer} className="np-btn text-np-green text-lg px-6 py-2">
                        ▶ {t('focus.resume')}
                      </button>
                      <button onClick={() => stopTimer(false)} className="np-btn text-np-error text-lg px-6 py-2">
                        ⏹ {t('focus.stop')}
                      </button>
                    </>
                  )}
                </div>

                {/* Current task */}
                <div className="bg-np-bg-secondary border border-np-border p-6 mb-6">
                  <div className="text-sm text-np-text-secondary mb-2">{t('focus.focusingOn')}:</div>
                  <div className="flex items-center justify-center gap-3">
                    <span className={`text-sm font-bold ${
                      selectedTask?.priority === 'P1' ? 'text-np-error' :
                      selectedTask?.priority === 'P2' ? 'text-np-orange' :
                      selectedTask?.priority === 'P3' ? 'text-np-blue' : 'text-np-text-secondary'
                    }`}>[{selectedTask?.priority}]</span>
                    <span className="text-xl text-np-text-primary">{selectedTask?.title}</span>
                  </div>
                  {selectedTask?.description && (
                    <p className="text-np-text-secondary mt-2">{selectedTask.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-3">
                  <button
                    onClick={handleCompleteTask}
                    className="np-btn text-np-green px-6 py-2"
                  >
                    ✓ {t('focus.complete')}
                  </button>
                  <button
                    onClick={() => {
                      stopTimer(false)
                      setPhase('select')
                    }}
                    className="np-btn text-np-text-secondary px-6 py-2"
                  >
                    {t('focus.changeTask')}
                  </button>
                </div>

                {/* Keyboard hints */}
                <div className="mt-8 text-xs text-np-text-secondary">
                  <kbd className="bg-np-bg-tertiary px-1 mx-1">Space</kbd> {t('focus.pauseResume')} |
                  <kbd className="bg-np-bg-tertiary px-1 mx-1">C</kbd> {t('focus.completeTask')} |
                  <kbd className="bg-np-bg-tertiary px-1 mx-1">Esc</kbd> {t('focus.pause')}
                </div>
              </div>
            )}

            {/* Break Phase */}
            {phase === 'break' && lastCompletedSession && (
              <BreakTimer
                sessionDuration={lastCompletedSession.duration}
                consecutiveSessions={consecutiveSessions}
                sessionsUntilLongBreak={focusPreferences.sessionsUntilLongBreak}
                shortBreakDuration={focusPreferences.shortBreakDuration}
                longBreakDuration={focusPreferences.longBreakDuration}
                autoStartBreak={focusPreferences.autoStartBreak}
                onSkip={handleBreakSkip}
                onComplete={handleBreakComplete}
              />
            )}
          </div>
        </div>

        {/* Stats panel */}
        {showStats && (
          <div className="w-1/3 border-l border-np-border p-6 overflow-y-auto">
            <FocusStats />
          </div>
        )}
      </div>

      {/* Footer tips */}
      <div className="px-6 py-3 border-t border-np-border text-center text-xs text-np-text-secondary">
        <span className="mr-6">💡 {t('focus.tip')}</span>
        <span>{t('focus.pressEsc')}</span>
      </div>
    </div>
  )
}
