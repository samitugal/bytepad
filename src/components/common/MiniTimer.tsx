import { useUIStore } from '../../stores/uiStore'
import { useFocusStore } from '../../stores/focusStore'

export function MiniTimer() {
  const { focusMode, focusModeMinimized, expandFocusMode, setFocusMode } = useUIStore()
  const { currentSession } = useFocusStore()

  // Only show when focus mode is active and minimized
  if (!focusMode || !focusModeMinimized || !currentSession) return null

  const timeLeft = currentSession.targetDuration - currentSession.duration
  const minutes = Math.floor(Math.max(0, timeLeft) / 60)
  const seconds = Math.max(0, timeLeft) % 60

  const handleExpand = () => {
    expandFocusMode()
  }

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFocusMode(false)
  }

  return (
    <div 
      className="fixed bottom-4 right-4 z-40 bg-np-bg-secondary border border-np-border 
                 shadow-lg cursor-pointer hover:border-np-blue transition-colors"
      onClick={handleExpand}
    >
      <div className="flex items-center gap-3 px-4 py-2">
        {/* Timer icon */}
        <span className="text-lg">🍅</span>
        
        {/* Time display */}
        <span className="font-mono text-np-green text-lg">
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </span>
        
        {/* Task name (truncated) */}
        <span className="text-np-text-secondary text-sm max-w-32 truncate">
          {currentSession.taskTitle}
        </span>

        {/* Stop button */}
        <button
          onClick={handleStop}
          className="text-np-text-secondary hover:text-np-error ml-2 text-xs"
          title="Stop focus session"
        >
          ✕
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="h-1 bg-np-bg-tertiary">
        <div 
          className="h-full bg-np-green transition-all duration-1000"
          style={{ 
            width: `${Math.min(100, (currentSession.duration / currentSession.targetDuration) * 100)}%` 
          }}
        />
      </div>
    </div>
  )
}
