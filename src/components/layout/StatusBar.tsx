import { useUIStore } from '../../stores/uiStore'

export function StatusBar() {
  const { activeModule } = useUIStore()

  const getStatusText = () => {
    switch (activeModule) {
      case 'notes':
        return 'Ln 1, Col 0 | UTF-8'
      case 'habits':
        return '0/0 habits completed today'
      case 'tasks':
        return '0 tasks pending'
      case 'journal':
        return new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
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
        <span>MyFlowSpace v0.1.0</span>
      </div>
    </div>
  )
}
