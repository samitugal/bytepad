import { useUIStore } from '../../stores/uiStore'
import { NotesModule } from '../notes'
import { HabitsModule } from '../habits'
import { TasksModule } from '../tasks'
import { JournalModule } from '../journal'
import { AnalysisModule } from '../analysis'

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
        return <AnalysisModule />
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
