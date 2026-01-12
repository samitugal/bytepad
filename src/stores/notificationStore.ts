import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface NotificationPreferences {
  enabled: boolean
  habitReminders: boolean
  taskDeadlines: boolean
  streakAlerts: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string // HH:mm
  quietHoursEnd: string // HH:mm
}

export interface ScheduledNotification {
  id: string
  type: 'habit' | 'task' | 'streak'
  title: string
  body: string
  scheduledTime: Date
  entityId: string // habit or task id
  fired: boolean
}

interface NotificationState {
  preferences: NotificationPreferences
  scheduledNotifications: ScheduledNotification[]
  permissionGranted: boolean

  // Actions
  setPreferences: (prefs: Partial<NotificationPreferences>) => void
  setPermissionGranted: (granted: boolean) => void
  addScheduledNotification: (notification: Omit<ScheduledNotification, 'id' | 'fired'>) => void
  markNotificationFired: (id: string) => void
  removeScheduledNotification: (id: string) => void
  clearFiredNotifications: () => void
  snoozeNotification: (id: string, minutes: number) => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      preferences: {
        enabled: false,
        habitReminders: true,
        taskDeadlines: true,
        streakAlerts: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
      },
      scheduledNotifications: [],
      permissionGranted: false,
      
      setPreferences: (prefs) => set((state) => ({
        preferences: { ...state.preferences, ...prefs }
      })),
      
      setPermissionGranted: (granted) => set({ permissionGranted: granted }),
      
      addScheduledNotification: (notification) => set((state) => ({
        scheduledNotifications: [
          ...state.scheduledNotifications,
          {
            ...notification,
            id: crypto.randomUUID(),
            fired: false,
          }
        ]
      })),
      
      markNotificationFired: (id) => set((state) => ({
        scheduledNotifications: state.scheduledNotifications.map(n =>
          n.id === id ? { ...n, fired: true } : n
        )
      })),
      
      removeScheduledNotification: (id) => set((state) => ({
        scheduledNotifications: state.scheduledNotifications.filter(n => n.id !== id)
      })),
      
      clearFiredNotifications: () => set((state) => ({
        scheduledNotifications: state.scheduledNotifications.filter(n => !n.fired)
      })),

      snoozeNotification: (id, minutes) => set((state) => ({
        scheduledNotifications: state.scheduledNotifications.map(n => {
          if (n.id === id) {
            const newTime = new Date(n.scheduledTime)
            newTime.setMinutes(newTime.getMinutes() + minutes)
            return { ...n, scheduledTime: newTime, fired: false }
          }
          return n
        })
      })),
    }),
    {
      name: 'bytepad-notifications',
    }
  )
)
