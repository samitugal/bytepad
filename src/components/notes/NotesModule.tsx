import { NoteList } from './NoteList'
import { NoteEditor } from './NoteEditor'

export function NotesModule() {
  return (
    <div className="flex-1 flex overflow-hidden">
      <NoteList />
      <NoteEditor />
    </div>
  )
}
