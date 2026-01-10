import { useState, useEffect } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { useNoteStore } from '../../stores/noteStore'
import { useHabitStore } from '../../stores/habitStore'
import { useTaskStore } from '../../stores/taskStore'

export function StatusBar() {
  const { activeModule } = useUIStore()
  const { notes } = useNoteStore()
  const habitStore = useHabitStore()
  const taskStore = useTaskStore()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const getStatusText = () => {
    switch (activeModule) {
      case 'notes':
        return `${notes.length} note${notes.length !== 1 ? 's' : ''} | UTF-8`
      case 'habits': {
        const completed = habitStore.getCompletedToday()
        const total = habitStore.getTotalHabits()
        return `${completed}/${total} habits completed today`
      }
      case 'tasks': {
        const pending = taskStore.getPendingCount()
        return `${pending} task${pending !== 1 ? 's' : ''} pending`
      }
      case 'journal':
        return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      case 'analysis':
        return 'Weekly analysis ready'
      default:
        return 'Ready'
    }
  }

  return (
    <div className="h-6 bg-np-bg-secondary border-t border-np-border flex items-center justify-between px-3 text-xs text-np-text-secondary select-none">
      <div className="flex items-center gap-4">
        <span>{getStatusText()}</span>
      </div>
      <div className="flex items-center gap-4">
        {!isOnline && (
          <span className="text-np-orange flex items-center gap-1">
            <span>⚡</span> Offline
          </span>
        )}
        <span>MyFlowSpace v0.1.0</span>
      </div>
    </div>
  )
}
