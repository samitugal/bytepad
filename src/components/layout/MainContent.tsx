import { useUIStore } from '../../stores/uiStore'
import { NotesModule } from '../notes'
import { HabitsModule } from '../habits'
import { TasksModule } from '../tasks'
import { JournalModule } from '../journal'

export function MainContent() {
  const { activeModule } = useUIStore()

  const renderContent = () => {
    switch (activeModule) {
      case 'notes':
        return <NotesModule />
      case 'habits':
        return <HabitsModule />
      case 'tasks':
        return <TasksModule />
      case 'journal':
        return <JournalModule />
      case 'analysis':
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-np-green mb-2">// Weekly Analysis</div>
              <div className="text-np-text-secondary text-sm">
                <span className="text-np-purple">AI-powered</span> insights coming soon...
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex-1 bg-np-bg-primary overflow-hidden flex">
      {renderContent()}
    </div>
  )
}
