import { useNotificationStore } from '../../stores/notificationStore'
import { useUIStore } from '../../stores/uiStore'

export function NotificationCenter() {
  const { isNotificationCenterOpen, setNotificationCenterOpen } = useUIStore()
  const {
    scheduledNotifications,
    snoozeNotification,
    removeScheduledNotification,
    clearFiredNotifications
  } = useNotificationStore()

  if (!isNotificationCenterOpen) return null

  const pendingNotifications = scheduledNotifications.filter(n => !n.fired)
  const firedNotifications = scheduledNotifications.filter(n => n.fired)

  const formatTime = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'habit': return '~'
      case 'task': return '>'
      case 'streak': return '*'
      default: return '!'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'habit': return 'text-np-purple'
      case 'task': return 'text-np-blue'
      case 'streak': return 'text-np-yellow'
      default: return 'text-np-text-primary'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setNotificationCenterOpen(false)}
      />

      <div className="relative w-full max-w-md bg-np-bg-secondary border border-np-border shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-np-border bg-np-bg-tertiary">
          <span className="text-np-text-primary font-mono text-sm">
            // Notification Center
          </span>
          <button
            onClick={() => setNotificationCenterOpen(false)}
            className="text-np-text-secondary hover:text-np-text-primary"
          >
            [x]
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {/* Pending Notifications */}
          {pendingNotifications.length > 0 && (
            <div className="p-2">
              <div className="text-xs text-np-text-secondary mb-2 px-2">
                /* Upcoming */
              </div>
              {pendingNotifications.map(notification => (
                <div
                  key={notification.id}
                  className="flex items-start gap-2 p-2 hover:bg-np-bg-tertiary group"
                >
                  <span className={`${getTypeColor(notification.type)} font-mono`}>
                    {getTypeIcon(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-np-text-primary text-sm truncate">
                      {notification.title}
                    </div>
                    <div className="text-np-text-secondary text-xs truncate">
                      {notification.body}
                    </div>
                    <div className="text-np-text-secondary text-xs mt-1">
                      {formatTime(notification.scheduledTime)}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => snoozeNotification(notification.id, 15)}
                      className="text-xs text-np-blue hover:text-np-text-primary px-1"
                      title="Snooze 15 min"
                    >
                      +15m
                    </button>
                    <button
                      onClick={() => snoozeNotification(notification.id, 60)}
                      className="text-xs text-np-blue hover:text-np-text-primary px-1"
                      title="Snooze 1 hour"
                    >
                      +1h
                    </button>
                    <button
                      onClick={() => removeScheduledNotification(notification.id)}
                      className="text-xs text-np-error hover:text-np-text-primary px-1"
                      title="Dismiss"
                    >
                      x
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fired Notifications */}
          {firedNotifications.length > 0 && (
            <div className="p-2 border-t border-np-border">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-xs text-np-text-secondary">
                  /* Recent */
                </span>
                <button
                  onClick={clearFiredNotifications}
                  className="text-xs text-np-text-secondary hover:text-np-text-primary"
                >
                  Clear all
                </button>
              </div>
              {firedNotifications.slice(0, 5).map(notification => (
                <div
                  key={notification.id}
                  className="flex items-start gap-2 p-2 opacity-60"
                >
                  <span className={`${getTypeColor(notification.type)} font-mono`}>
                    {getTypeIcon(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-np-text-primary text-sm truncate">
                      {notification.title}
                    </div>
                    <div className="text-np-text-secondary text-xs">
                      {formatTime(notification.scheduledTime)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {scheduledNotifications.length === 0 && (
            <div className="p-8 text-center">
              <div className="text-2xl mb-2">~</div>
              <div className="text-np-text-secondary text-sm">
                No notifications
              </div>
              <div className="text-np-text-secondary text-xs mt-1">
                Enable reminders in Settings
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-np-border bg-np-bg-tertiary">
          <div className="text-xs text-np-text-secondary text-center">
            Press <kbd className="np-kbd">Ctrl+Shift+N</kbd> to toggle
          </div>
        </div>
      </div>
    </div>
  )
}
