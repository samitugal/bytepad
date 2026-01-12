import { useNotificationStore } from '../stores/notificationStore'
import { useHabitStore } from '../stores/habitStore'
import { useTaskStore } from '../stores/taskStore'

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return false
  }
  
  if (Notification.permission === 'granted') {
    useNotificationStore.getState().setPermissionGranted(true)
    return true
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    const granted = permission === 'granted'
    useNotificationStore.getState().setPermissionGranted(granted)
    return granted
  }
  
  return false
}

export function showNotification(title: string, body: string, icon?: string): void {
  const { preferences, permissionGranted } = useNotificationStore.getState()
  
  if (!preferences.enabled || !permissionGranted) return
  
  // Check quiet hours
  if (preferences.quietHoursEnabled) {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const { quietHoursStart, quietHoursEnd } = preferences
    
    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (quietHoursStart > quietHoursEnd) {
      if (currentTime >= quietHoursStart || currentTime < quietHoursEnd) {
        return // In quiet hours
      }
    } else {
      if (currentTime >= quietHoursStart && currentTime < quietHoursEnd) {
        return // In quiet hours
      }
    }
  }
  
  new Notification(title, {
    body,
    icon: icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: `bytepad-${Date.now()}`,
  })
}

export function scheduleHabitReminders(): void {
  const habits = useHabitStore.getState().habits
  const { addScheduledNotification, scheduledNotifications } = useNotificationStore.getState()
  const today = new Date().toISOString().split('T')[0]
  
  habits.forEach(habit => {
    if (!habit.reminderEnabled || !habit.reminderTime) return
    if (habit.completions[today]) return // Already completed today
    
    // Check if already scheduled
    const alreadyScheduled = scheduledNotifications.some(
      n => n.entityId === habit.id && !n.fired && n.type === 'habit'
    )
    if (alreadyScheduled) return
    
    const [hours, minutes] = habit.reminderTime.split(':').map(Number)
    const scheduledTime = new Date()
    scheduledTime.setHours(hours, minutes, 0, 0)
    
    // If time has passed today, skip
    if (scheduledTime < new Date()) return
    
    addScheduledNotification({
      type: 'habit',
      title: '🎯 Habit Reminder',
      body: `Time to complete: ${habit.name}`,
      scheduledTime,
      entityId: habit.id,
    })
  })
}

export function scheduleTaskReminders(): void {
  const tasks = useTaskStore.getState().tasks
  const { addScheduledNotification, scheduledNotifications } = useNotificationStore.getState()
  
  tasks.forEach(task => {
    if (task.completed) return
    if (!task.reminderEnabled || !task.deadline) return
    
    // Check if already scheduled
    const alreadyScheduled = scheduledNotifications.some(
      n => n.entityId === task.id && !n.fired && n.type === 'task'
    )
    if (alreadyScheduled) return
    
    const deadline = new Date(task.deadline)
    if (task.deadlineTime) {
      const [hours, minutes] = task.deadlineTime.split(':').map(Number)
      deadline.setHours(hours, minutes, 0, 0)
    }
    
    const reminderMinutes = task.reminderMinutesBefore || 30
    const scheduledTime = new Date(deadline.getTime() - reminderMinutes * 60 * 1000)
    
    // If time has passed, skip
    if (scheduledTime < new Date()) return
    
    addScheduledNotification({
      type: 'task',
      title: '⏰ Task Deadline',
      body: `"${task.title}" is due in ${reminderMinutes} minutes`,
      scheduledTime,
      entityId: task.id,
    })
  })
}

let notificationInterval: number | null = null

export function startNotificationChecker(): void {
  if (notificationInterval) return
  
  // Check every minute
  notificationInterval = window.setInterval(() => {
    const { scheduledNotifications, markNotificationFired, preferences } = useNotificationStore.getState()
    
    if (!preferences.enabled) return
    
    const now = new Date()
    
    scheduledNotifications.forEach(notification => {
      if (notification.fired) return
      
      const scheduledTime = new Date(notification.scheduledTime)
      if (scheduledTime <= now) {
        showNotification(notification.title, notification.body)
        markNotificationFired(notification.id)
      }
    })
    
    // Re-schedule reminders
    scheduleHabitReminders()
    scheduleTaskReminders()
  }, 60000) // Every minute
  
  // Initial scheduling
  scheduleHabitReminders()
  scheduleTaskReminders()
}

export function stopNotificationChecker(): void {
  if (notificationInterval) {
    clearInterval(notificationInterval)
    notificationInterval = null
  }
}

export function initializeNotifications(): void {
  const { preferences, permissionGranted } = useNotificationStore.getState()
  
  if (preferences.enabled && permissionGranted) {
    startNotificationChecker()
  }
}
