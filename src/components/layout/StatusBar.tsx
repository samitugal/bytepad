import { useState, useEffect } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { useNoteStore } from '../../stores/noteStore'
import { useHabitStore } from '../../stores/habitStore'
import { useTaskStore } from '../../stores/taskStore'
import { useTranslation } from '../../i18n'

export function StatusBar() {
  const { t, language } = useTranslation()
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
    const locale = language === 'tr' ? 'tr-TR' : 'en-US'
    switch (activeModule) {
      case 'notes':
        return `${notes.length} ${t('nav.notes').toLowerCase()} | UTF-8`
      case 'habits': {
        const completed = habitStore.getCompletedToday()
        const total = habitStore.getTotalHabits()
        return `${completed}/${total} ${t('nav.habits').toLowerCase()} ${t('common.completed').toLowerCase()}`
      }
      case 'tasks': {
        const pending = taskStore.getPendingCount()
        return `${pending} ${t('nav.tasks').toLowerCase()} ${t('common.pending').toLowerCase()}`
      }
      case 'journal':
        return new Date().toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' })
      case 'analysis':
        return t('analysis.weeklyStats')
      default:
        return t('common.loading').replace('...', '')
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
            <span>⚡</span> {language === 'tr' ? 'Çevrimdışı' : 'Offline'}
          </span>
        )}
        <span>bytepad v0.15.0</span>
      </div>
    </div>
  )
}
