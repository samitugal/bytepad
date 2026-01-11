import { useMemo } from 'react'

interface CircularTimerProps {
  /** Time remaining in seconds */
  timeLeft: number
  /** Total time for the session in seconds */
  totalTime: number
  /** Whether the timer is currently running */
  isRunning: boolean
  /** Whether the session is complete (timer reached 0) */
  isComplete?: boolean
  /** Size of the timer in pixels */
  size?: number
}

export function CircularTimer({
  timeLeft,
  totalTime,
  isRunning,
  isComplete = false,
  size = 280,
}: CircularTimerProps) {
  const progress = useMemo(() => {
    if (totalTime === 0) return 0
    return ((totalTime - timeLeft) / totalTime) * 100
  }, [timeLeft, totalTime])

  const timeLeftPercent = useMemo(() => {
    if (totalTime === 0) return 100
    return (timeLeft / totalTime) * 100
  }, [timeLeft, totalTime])

  // Color based on time remaining
  const strokeColor = useMemo(() => {
    if (isComplete) return '#6A9955' // Green for complete
    if (timeLeftPercent > 50) return '#6A9955' // Green
    if (timeLeftPercent > 25) return '#D7BA7D' // Yellow
    return '#F14C4C' // Red for urgency
  }, [timeLeftPercent, isComplete])

  // SVG calculations
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  // Format time display
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className={`transform -rotate-90 ${isRunning ? 'animate-pulse-subtle' : ''}`}
        style={{ filter: isComplete ? 'drop-shadow(0 0 10px rgba(106, 153, 85, 0.5))' : undefined }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--np-border)"
          strokeWidth={strokeWidth}
          className="opacity-30"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
          style={{
            filter: isRunning ? `drop-shadow(0 0 6px ${strokeColor})` : undefined,
          }}
        />

        {/* Pulsing glow effect when running */}
        {isRunning && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth / 2}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="animate-pulse opacity-50"
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className={`font-mono font-bold transition-all duration-300 ${
            isComplete
              ? 'text-np-green text-5xl animate-bounce-subtle'
              : isRunning
              ? 'text-np-cyan text-6xl'
              : 'text-np-text-secondary text-5xl'
          }`}
          style={{
            textShadow: isRunning ? `0 0 20px ${strokeColor}` : undefined,
          }}
        >
          {formatTime(timeLeft)}
        </div>

        {isComplete && (
          <div className="text-np-green text-sm mt-2 animate-fade-in">
            Session complete!
          </div>
        )}

        {!isComplete && isRunning && (
          <div className="text-np-text-secondary text-xs mt-2 opacity-60">
            {Math.round(progress)}% complete
          </div>
        )}
      </div>
    </div>
  )
}
