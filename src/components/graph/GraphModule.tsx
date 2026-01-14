import { useState, useMemo, useEffect } from 'react'
import { useNoteStore } from '../../stores/noteStore'
import { useTaskStore } from '../../stores/taskStore'
import { useHabitStore } from '../../stores/habitStore'
import { useJournalStore } from '../../stores/journalStore'
import { useBookmarkStore } from '../../stores/bookmarkStore'
import { useIdeaStore } from '../../stores/ideaStore'
import { useUIStore } from '../../stores/uiStore'
import { useTranslation } from '../../i18n'
import { GraphVisualization } from './GraphVisualization'
import { GraphControls } from './GraphControls'
import { buildGraphData, collectAllTags } from '../../utils/graphUtils'
import type { GraphEntityType } from '../../types'

const GRAPH_FILTERS_KEY = 'bytepad-graph-filters'

const defaultFilters = {
  showNotes: true,
  showTasks: true,
  showHabits: true,
  showJournals: false,
  showBookmarks: false,
  showIdeas: true,
  showTags: true,
}

function loadFilters() {
  try {
    const saved = localStorage.getItem(GRAPH_FILTERS_KEY)
    if (saved) {
      return { ...defaultFilters, ...JSON.parse(saved) }
    }
  } catch (e) {
    console.error('Failed to load graph filters:', e)
  }
  return defaultFilters
}

export function GraphModule() {
  const { t } = useTranslation()
  const notes = useNoteStore((s) => s.notes)
  const setActiveNote = useNoteStore((s) => s.setActiveNote)
  const tasks = useTaskStore((s) => s.tasks)
  const habits = useHabitStore((s) => s.habits)
  const journals = useJournalStore((s) => s.entries)
  const bookmarks = useBookmarkStore((s) => s.bookmarks)
  const ideas = useIdeaStore((s) => s.ideas)
  const setActiveModule = useUIStore((s) => s.setActiveModule)

  const [filters, setFilters] = useState(loadFilters)
  const [searchQuery, setSearchQuery] = useState('')

  // Persist filters to localStorage
  useEffect(() => {
    localStorage.setItem(GRAPH_FILTERS_KEY, JSON.stringify(filters))
  }, [filters])

  const { nodes, edges } = useMemo(
    () => buildGraphData(notes, tasks, habits, journals, bookmarks, filters, ideas),
    [notes, tasks, habits, journals, bookmarks, filters, ideas]
  )

  const counts = useMemo(() => {
    const allTags = collectAllTags(notes, tasks, habits, journals, bookmarks, ideas)
    return {
      note: notes.length,
      task: tasks.length,
      habit: habits.length,
      journal: journals.length,
      bookmark: bookmarks.length,
      idea: ideas.filter(i => i.status === 'active').length,
      tag: allTags.size,
    } as Record<GraphEntityType, number>
  }, [notes, tasks, habits, journals, bookmarks, ideas])

  const handleFilterChange = (key: string, value: boolean) => {
    setFilters((prev: typeof defaultFilters) => ({ ...prev, [key]: value }))
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
      case 'idea':
        setActiveModule('ideas')
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
