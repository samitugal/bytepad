import { lazy, Suspense } from 'react'
import { useUIStore } from '../../stores/uiStore'

// Eager load frequently used modules
import { NotesModule } from '../notes'
import { TasksModule } from '../tasks'
import { HabitsModule } from '../habits'

// Lazy load less frequently used modules
const JournalModule = lazy(() => import('../journal').then(m => ({ default: m.JournalModule })))
const AnalysisModule = lazy(() => import('../analysis').then(m => ({ default: m.AnalysisModule })))
const BookmarksModule = lazy(() => import('../bookmarks').then(m => ({ default: m.BookmarksModule })))
const CalendarModule = lazy(() => import('../calendar').then(m => ({ default: m.CalendarModule })))
const DailyNotesModule = lazy(() => import('../dailynotes/DailyNotesModule').then(m => ({ default: m.DailyNotesModule })))
const IdeasModule = lazy(() => import('../ideas').then(m => ({ default: m.IdeasModule })))
const GraphModule = lazy(() => import('../graph').then(m => ({ default: m.GraphModule })))

function LoadingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center text-np-text-secondary">
      <span className="animate-pulse">Loading...</span>
    </div>
  )
}

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
      case 'ideas':
        return <IdeasModule />
      case 'graph':
        return <GraphModule />
      default:
        return null
    }
  }

  return (
    <div className="flex-1 bg-np-bg-primary overflow-hidden flex">
      <Suspense fallback={<LoadingFallback />}>
        {renderContent()}
      </Suspense>
    </div>
  )
}
