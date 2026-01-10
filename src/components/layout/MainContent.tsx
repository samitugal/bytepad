import { useUIStore } from '../../stores/uiStore'
import { NotesModule } from '../notes'
import { HabitsModule } from '../habits'
import { TasksModule } from '../tasks'
import { JournalModule } from '../journal'
import { AnalysisModule } from '../analysis'
import { BookmarksModule } from '../bookmarks'
import { CalendarModule } from '../calendar'
import { DailyNotesModule } from '../dailynotes/DailyNotesModule'

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
      case 'bookmarks':
        return <BookmarksModule />
      case 'calendar':
        return <CalendarModule />
      case 'analysis':
        return <AnalysisModule />
      case 'dailynotes':
        return <DailyNotesModule />
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
