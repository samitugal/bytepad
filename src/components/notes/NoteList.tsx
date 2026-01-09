import { useNoteStore } from '../../stores/noteStore'

export function NoteList() {
  const { notes, activeNoteId, searchQuery, setActiveNote, setSearchQuery, addNote } = useNoteStore()

  const filteredNotes = searchQuery
    ? notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : notes

  const handleNewNote = () => {
    addNote({
      title: 'Untitled',
      content: '',
      tags: [],
    })
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="w-56 border-r border-np-border flex flex-col bg-np-bg-secondary">
      {/* Search */}
      <div className="p-2 border-b border-np-border">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes..."
          className="w-full bg-np-bg-primary border border-np-border text-np-text-primary
                     px-2 py-1 text-sm font-mono focus:border-np-blue focus:outline-none"
        />
      </div>

      {/* New note button */}
      <div className="p-2 border-b border-np-border">
        <button
          onClick={handleNewNote}
          className="w-full np-btn text-left flex items-center gap-2"
        >
          <span className="text-np-green">+</span> New Note
        </button>
      </div>

      {/* Note list */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="p-4 text-np-text-secondary text-sm text-center">
            {searchQuery ? 'No notes found' : 'No notes yet'}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => setActiveNote(note.id)}
              className={`px-3 py-2 border-b border-np-border cursor-pointer transition-colors
                ${activeNoteId === note.id
                  ? 'bg-np-selection'
                  : 'hover:bg-np-bg-tertiary'
                }`}
            >
              <div className="text-sm text-np-text-primary truncate">
                {note.title || 'Untitled'}
              </div>
              <div className="text-xs text-np-text-secondary mt-1 flex items-center justify-between">
                <span className="truncate max-w-[120px]">
                  {note.content.substring(0, 30) || 'Empty note'}
                </span>
                <span>{formatDate(note.updatedAt)}</span>
              </div>
              {note.tags.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {note.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-np-bg-tertiary text-np-purple px-1"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="p-2 border-t border-np-border text-xs text-np-text-secondary">
        {notes.length} note{notes.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
