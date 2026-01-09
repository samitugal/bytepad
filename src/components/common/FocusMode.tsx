import { useState, useEffect, useCallback } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { useTaskStore } from '../../stores/taskStore'

const FOCUS_DURATIONS = [
  { label: '15 min', minutes: 15 },
  { label: '25 min', minutes: 25 },
  { label: '45 min', minutes: 45 },
  { label: '60 min', minutes: 60 },
]

export function FocusMode() {
  const { focusMode, toggleFocusMode } = useUIStore()
  const { tasks, toggleTask } = useTaskStore()

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [timerMinutes, setTimerMinutes] = useState(25)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const activeTasks = tasks.filter(t => !t.completed).sort((a, b) => {
    const order = { P1: 1, P2: 2, P3: 3, P4: 4 }
    return order[a.priority] - order[b.priority]
  })

  const selectedTask = tasks.find(t => t.id === selectedTaskId)

  const startTimer = useCallback(() => {
    setTimeLeft(timerMinutes * 60)
    setIsRunning(true)
  }, [timerMinutes])

  const stopTimer = () => {
    setIsRunning(false)
    setTimeLeft(null)
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const resumeTimer = () => {
    setIsRunning(true)
  }

  useEffect(() => {
    if (!isRunning || timeLeft === null) return

    if (timeLeft <= 0) {
      setIsRunning(false)
      // Play notification sound or show alert
      if (Notification.permission === 'granted') {
        new Notification('Focus session complete!', {
          body: 'Take a short break before your next session.',
        })
      }
      return
    }

    const interval = setInterval(() => {
      setTimeLeft(t => (t !== null ? t - 1 : null))
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  // Request notification permission
  useEffect(() => {
    if (focusMode && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [focusMode])

  // Keyboard shortcut to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusMode) {
        toggleFocusMode()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusMode, toggleFocusMode])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleCompleteTask = () => {
    if (selectedTaskId) {
      toggleTask(selectedTaskId)
      setSelectedTaskId(null)
      stopTimer()
    }
  }

  if (!focusMode) return null

  return (
    <div className="fixed inset-0 bg-np-bg-primary z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-np-border">
        <div className="text-np-green font-mono">// Focus Mode</div>
        <button
          onClick={toggleFocusMode}
          className="np-btn text-np-text-secondary"
        >
          Exit (Esc)
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          {!selectedTaskId ? (
            // Task selection
            <div>
              <h2 className="text-xl text-np-text-primary mb-6 text-center">
                What do you want to focus on?
              </h2>

              {activeTasks.length === 0 ? (
                <div className="text-center text-np-text-secondary">
                  <p>No active tasks. Create a task first!</p>
                  <button onClick={toggleFocusMode} className="np-btn mt-4">
                    Go to Tasks
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeTasks.slice(0, 5).map(task => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="w-full p-4 bg-np-bg-secondary border border-np-border
                                 hover:border-np-blue text-left transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${
                          task.priority === 'P1' ? 'text-np-error' :
                          task.priority === 'P2' ? 'text-np-orange' :
                          task.priority === 'P3' ? 'text-np-blue' : 'text-np-text-secondary'
                        }`}>[{task.priority}]</span>
                        <span className="text-np-text-primary">{task.title}</span>
                      </div>
                      {task.description && (
                        <p className="text-sm text-np-text-secondary mt-1 ml-12">
                          {task.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Duration selection */}
              <div className="mt-8">
                <div className="text-sm text-np-text-secondary mb-3 text-center">
                  Session duration:
                </div>
                <div className="flex justify-center gap-2">
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
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Focus session
            <div className="text-center">
              {/* Timer */}
              <div className="mb-8">
                {timeLeft !== null ? (
                  <div className="text-6xl font-mono text-np-cyan mb-4">
                    {formatTime(timeLeft)}
                  </div>
                ) : (
                  <div className="text-4xl font-mono text-np-text-secondary mb-4">
                    {timerMinutes}:00
                  </div>
                )}

                <div className="flex justify-center gap-3">
                  {timeLeft === null ? (
                    <button onClick={startTimer} className="np-btn text-np-green text-lg px-6 py-2">
                      Start Focus
                    </button>
                  ) : isRunning ? (
                    <button onClick={pauseTimer} className="np-btn text-np-orange text-lg px-6 py-2">
                      Pause
                    </button>
                  ) : (
                    <>
                      <button onClick={resumeTimer} className="np-btn text-np-green text-lg px-6 py-2">
                        Resume
                      </button>
                      <button onClick={stopTimer} className="np-btn text-np-error text-lg px-6 py-2">
                        Stop
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Current task */}
              <div className="bg-np-bg-secondary border border-np-border p-6 mb-6">
                <div className="text-sm text-np-text-secondary mb-2">Currently focusing on:</div>
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
                  ✓ Mark Complete
                </button>
                <button
                  onClick={() => { setSelectedTaskId(null); stopTimer(); }}
                  className="np-btn text-np-text-secondary px-6 py-2"
                >
                  Change Task
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer tips */}
      <div className="px-6 py-3 border-t border-np-border text-center text-xs text-np-text-secondary">
        <span className="mr-6">💡 Tip: Break tasks into smaller chunks for better focus</span>
        <span>Press <kbd className="bg-np-bg-tertiary px-1">Esc</kbd> to exit</span>
      </div>
    </div>
  )
}
