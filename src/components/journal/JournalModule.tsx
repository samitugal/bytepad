import { useState, useEffect } from 'react'
import { useJournalStore } from '../../stores/journalStore'

const MOODS = [
  { value: 1, label: '😫', desc: 'Terrible' },
  { value: 2, label: '😔', desc: 'Bad' },
  { value: 3, label: '😐', desc: 'Okay' },
  { value: 4, label: '🙂', desc: 'Good' },
  { value: 5, label: '😄', desc: 'Great' },
] as const

const ENERGY = [
  { value: 1, label: '🪫', desc: 'Drained' },
  { value: 2, label: '😴', desc: 'Low' },
  { value: 3, label: '⚡', desc: 'Normal' },
  { value: 4, label: '💪', desc: 'High' },
  { value: 5, label: '🚀', desc: 'Energized' },
] as const

const getToday = () => new Date().toISOString().split('T')[0]

export function JournalModule() {
  const { entries, addEntry, updateEntry, getEntryByDate } = useJournalStore()
  const [selectedDate, setSelectedDate] = useState(getToday())
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [tags, setTags] = useState('')

  const currentEntry = getEntryByDate(selectedDate)

  useEffect(() => {
    if (currentEntry) {
      setContent(currentEntry.content)
      setMood(currentEntry.mood)
      setEnergy(currentEntry.energy)
      setTags(currentEntry.tags.join(', '))
    } else {
      setContent('')
      setMood(3)
      setEnergy(3)
      setTags('')
    }
  }, [currentEntry, selectedDate])

  const handleSave = () => {
    const entryData = {
      date: selectedDate,
      content,
      mood,
      energy,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    }

    if (currentEntry) {
      updateEntry(currentEntry.id, entryData)
    } else {
      addEntry(entryData)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const goToDate = (offset: number) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + offset)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Entry list sidebar */}
      <div className="w-48 border-r border-np-border bg-np-bg-secondary flex flex-col">
        <div className="p-2 border-b border-np-border">
          <button
            onClick={() => setSelectedDate(getToday())}
            className="w-full np-btn text-np-green"
          >
            Today
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {entries.length === 0 ? (
            <div className="p-3 text-xs text-np-text-secondary text-center">
              No entries yet
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => setSelectedDate(entry.date)}
                className={`px-3 py-2 border-b border-np-border cursor-pointer text-sm
                  ${selectedDate === entry.date ? 'bg-np-selection' : 'hover:bg-np-bg-tertiary'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-np-text-primary">
                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span>{MOODS.find(m => m.value === entry.mood)?.label}</span>
                </div>
                <div className="text-xs text-np-text-secondary truncate mt-1">
                  {entry.content.substring(0, 30) || 'No content'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {/* Date navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-np-border bg-np-bg-secondary">
          <button onClick={() => goToDate(-1)} className="np-btn">← Prev</button>
          <div className="text-center">
            <div className="text-np-text-primary">{formatDate(selectedDate)}</div>
            <div className="text-xs text-np-text-secondary">
              {selectedDate === getToday() && '(Today)'}
            </div>
          </div>
          <button onClick={() => goToDate(1)} className="np-btn">Next →</button>
        </div>

        {/* Mood & Energy */}
        <div className="px-4 py-3 border-b border-np-border bg-np-bg-secondary">
          <div className="flex gap-8">
            {/* Mood */}
            <div>
              <div className="text-xs text-np-text-secondary mb-2">Mood</div>
              <div className="flex gap-1">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value as typeof mood)}
                    title={m.desc}
                    className={`w-8 h-8 text-lg flex items-center justify-center rounded transition-colors
                      ${mood === m.value ? 'bg-np-selection' : 'hover:bg-np-bg-tertiary'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Energy */}
            <div>
              <div className="text-xs text-np-text-secondary mb-2">Energy</div>
              <div className="flex gap-1">
                {ENERGY.map((e) => (
                  <button
                    key={e.value}
                    onClick={() => setEnergy(e.value as typeof energy)}
                    title={e.desc}
                    className={`w-8 h-8 text-lg flex items-center justify-center rounded transition-colors
                      ${energy === e.value ? 'bg-np-selection' : 'hover:bg-np-bg-tertiary'}`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="px-4 py-2 border-b border-np-border bg-np-bg-secondary">
          <div className="flex items-center gap-2">
            <span className="text-xs text-np-text-secondary">Tags:</span>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="work, reflection, gratitude..."
              className="flex-1 bg-transparent border-none text-np-purple text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write about your day..."
            className="w-full h-full bg-np-bg-primary text-np-text-primary font-mono text-sm
                       p-4 resize-none focus:outline-none leading-6"
            spellCheck={false}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-np-border bg-np-bg-secondary">
          <div className="text-xs text-np-text-secondary">
            {content.length} characters
          </div>
          <button onClick={handleSave} className="np-btn text-np-green">
            Save Entry
          </button>
        </div>
      </div>
    </div>
  )
}
