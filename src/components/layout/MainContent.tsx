import { useUIStore } from '../../stores/uiStore'

export function MainContent() {
  const { activeModule } = useUIStore()

  const renderContent = () => {
    switch (activeModule) {
      case 'notes':
        return (
          <div className="p-4">
            <div className="text-np-green">// Notes Module</div>
            <div className="text-np-text-secondary mt-2">
              <span className="text-np-purple">const</span>{' '}
              <span className="text-np-light-blue">notes</span>{' '}
              <span className="text-np-text-primary">=</span>{' '}
              <span className="text-np-orange">"Coming soon..."</span>
            </div>
          </div>
        )
      case 'habits':
        return (
          <div className="p-4">
            <div className="text-np-green">// Habits Module</div>
            <div className="text-np-text-secondary mt-2">
              <span className="text-np-purple">const</span>{' '}
              <span className="text-np-light-blue">habits</span>{' '}
              <span className="text-np-text-primary">=</span>{' '}
              <span className="text-np-orange">"Coming soon..."</span>
            </div>
          </div>
        )
      case 'tasks':
        return (
          <div className="p-4">
            <div className="text-np-green">// Tasks Module</div>
            <div className="text-np-text-secondary mt-2">
              <span className="text-np-purple">const</span>{' '}
              <span className="text-np-light-blue">tasks</span>{' '}
              <span className="text-np-text-primary">=</span>{' '}
              <span className="text-np-orange">"Coming soon..."</span>
            </div>
          </div>
        )
      case 'journal':
        return (
          <div className="p-4">
            <div className="text-np-green">// Journal Module</div>
            <div className="text-np-text-secondary mt-2">
              <span className="text-np-purple">const</span>{' '}
              <span className="text-np-light-blue">journal</span>{' '}
              <span className="text-np-text-primary">=</span>{' '}
              <span className="text-np-orange">"Coming soon..."</span>
            </div>
          </div>
        )
      case 'analysis':
        return (
          <div className="p-4">
            <div className="text-np-green">// Weekly Analysis Module</div>
            <div className="text-np-text-secondary mt-2">
              <span className="text-np-purple">const</span>{' '}
              <span className="text-np-light-blue">analysis</span>{' '}
              <span className="text-np-text-primary">=</span>{' '}
              <span className="text-np-orange">"Coming soon..."</span>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex-1 bg-np-bg-primary overflow-auto">
      {renderContent()}
    </div>
  )
}
