import { useState, useMemo } from 'react'
import { useNoteStore } from '../../stores/noteStore'
import { useTaskStore } from '../../stores/taskStore'
import { useHabitStore } from '../../stores/habitStore'
import { useJournalStore } from '../../stores/journalStore'
import { useBookmarkStore } from '../../stores/bookmarkStore'
import { useUIStore } from '../../stores/uiStore'
import { useTranslation } from '../../i18n'
import { GraphVisualization } from './GraphVisualization'
import { GraphControls } from './GraphControls'
import { buildGraphData, collectAllTags } from '../../utils/graphUtils'
import type { GraphEntityType } from '../../types'

export function GraphModule() {
  const { t } = useTranslation()
  const notes = useNoteStore((s) => s.notes)
  const setActiveNote = useNoteStore((s) => s.setActiveNote)
  const tasks = useTaskStore((s) => s.tasks)
  const habits = useHabitStore((s) => s.habits)
  const journals = useJournalStore((s) => s.entries)
  const bookmarks = useBookmarkStore((s) => s.bookmarks)
  const setActiveModule = useUIStore((s) => s.setActiveModule)

  const [filters, setFilters] = useState({
    showNotes: true,
    showTasks: true,
    showHabits: true,
    showJournals: false,
    showBookmarks: false,
    showTags: true,
  })
  const [searchQuery, setSearchQuery] = useState('')

  const { nodes, edges } = useMemo(
    () => buildGraphData(notes, tasks, habits, journals, bookmarks, filters),
    [notes, tasks, habits, journals, bookmarks, filters]
  )

  const counts = useMemo(() => {
    const allTags = collectAllTags(notes, tasks, habits, journals, bookmarks)
    return {
      note: notes.length,
      task: tasks.length,
      habit: habits.length,
      journal: journals.length,
      bookmark: bookmarks.length,
      tag: allTags.size,
    } as Record<GraphEntityType, number>
  }, [notes, tasks, habits, journals, bookmarks])

  const handleFilterChange = (key: string, value: boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleNodeClick = (nodeId: string, nodeType: GraphEntityType) => {
    const [, entityId] = nodeId.split(':')

    switch (nodeType) {
      case 'note':
        setActiveModule('notes')
        setActiveNote(entityId)
        break
      case 'task':
        setActiveModule('tasks')
        break
      case 'habit':
        setActiveModule('habits')
        break
      case 'journal':
        setActiveModule('journal')
        break
      case 'bookmark':
        setActiveModule('bookmarks')
        break
      case 'tag':
        break
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-np-border bg-np-bg-secondary">
        <h2 className="text-np-text-primary font-mono flex items-center gap-2">
          <span className="text-np-green">//</span>
          <span>{t('graph.title')}</span>
        </h2>
        <div className="flex items-center gap-4 text-xs text-np-text-secondary">
          <span>{nodes.length} {t('graph.nodes')}</span>
          <span>{edges.length} {t('graph.connections')}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <GraphControls
          filters={filters}
          onFilterChange={handleFilterChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          counts={counts}
        />
        <GraphVisualization
          nodes={nodes}
          edges={edges}
          searchQuery={searchQuery}
          onNodeClick={handleNodeClick}
        />
      </div>
    </div>
  )
}
