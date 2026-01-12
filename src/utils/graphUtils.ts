import type { Note, Task, Habit, JournalEntry, Bookmark, GraphNode, GraphEdge, GraphEntityType } from '../types'

export function extractWikilinks(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g
  const links: string[] = []
  let match
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1].toLowerCase())
  }
  return links
}

export function collectAllTags(
  notes: Note[],
  tasks: Task[],
  habits: Habit[],
  journals: JournalEntry[],
  bookmarks: Bookmark[]
): Set<string> {
  const tags = new Set<string>()
  
  notes.forEach(n => n.tags.forEach(t => tags.add(t)))
  tasks.forEach(t => (t.tags || []).forEach(tag => tags.add(tag)))
  journals.forEach(j => j.tags.forEach(t => tags.add(t)))
  bookmarks.forEach(b => b.tags.forEach(t => tags.add(t)))
  habits.forEach(h => tags.add(h.category))
  
  return tags
}

export function buildGraphData(
  notes: Note[],
  tasks: Task[],
  habits: Habit[],
  journals: JournalEntry[],
  bookmarks: Bookmark[],
  filters: {
    showNotes: boolean
    showTasks: boolean
    showHabits: boolean
    showJournals: boolean
    showBookmarks: boolean
    showTags: boolean
  }
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const nodeMap = new Map<string, GraphNode>()
  const edgeSet = new Set<string>()
  const connectionCount = new Map<string, number>()

  const addNode = (
    id: string,
    type: GraphEntityType,
    label: string,
    tags: string[],
    createdAt: string
  ) => {
    if (nodeMap.has(id)) return
    const node: GraphNode = {
      id,
      type,
      label,
      tags,
      createdAt,
      x: Math.random() * 600 + 100,
      y: Math.random() * 400 + 50,
      vx: 0,
      vy: 0,
      connections: 0,
    }
    nodeMap.set(id, node)
    nodes.push(node)
  }

  const addEdge = (source: string, target: string, type: GraphEdge['type']) => {
    const key = [source, target].sort().join('|') + '|' + type
    if (edgeSet.has(key)) return
    if (source === target) return
    if (!nodeMap.has(source) || !nodeMap.has(target)) return
    
    edgeSet.add(key)
    edges.push({ source, target, type })
    
    connectionCount.set(source, (connectionCount.get(source) || 0) + 1)
    connectionCount.set(target, (connectionCount.get(target) || 0) + 1)
  }

  if (filters.showNotes) {
    notes.forEach(note => {
      addNode(
        `note:${note.id}`,
        'note',
        note.title || 'Untitled',
        note.tags,
        note.createdAt.toString()
      )
    })
  }

  if (filters.showTasks) {
    tasks.forEach(task => {
      addNode(
        `task:${task.id}`,
        'task',
        task.title,
        task.tags || [],
        task.createdAt.toString()
      )
    })
  }

  if (filters.showHabits) {
    habits.forEach(habit => {
      addNode(
        `habit:${habit.id}`,
        'habit',
        habit.name,
        [habit.category],
        habit.createdAt.toString()
      )
    })
  }

  if (filters.showJournals) {
    journals.forEach(journal => {
      addNode(
        `journal:${journal.id}`,
        'journal',
        `Journal ${journal.date}`,
        journal.tags,
        journal.date
      )
    })
  }

  if (filters.showBookmarks) {
    bookmarks.forEach(bookmark => {
      addNode(
        `bookmark:${bookmark.id}`,
        'bookmark',
        bookmark.title,
        bookmark.tags,
        bookmark.createdAt.toString()
      )
    })
  }

  if (filters.showTags) {
    const allTags = collectAllTags(notes, tasks, habits, journals, bookmarks)
    allTags.forEach(tag => {
      addNode(`tag:${tag}`, 'tag', `#${tag}`, [], new Date().toISOString())
    })
  }

  if (filters.showNotes) {
    notes.forEach(note => {
      const wikilinks = extractWikilinks(note.content)
      wikilinks.forEach(linkTitle => {
        const targetNote = notes.find(n => n.title.toLowerCase() === linkTitle)
        if (targetNote) {
          addEdge(`note:${note.id}`, `note:${targetNote.id}`, 'wikilink')
        }
      })
    })
  }

  if (filters.showTags) {
    if (filters.showNotes) {
      notes.forEach(note => {
        note.tags.forEach(tag => {
          addEdge(`note:${note.id}`, `tag:${tag}`, 'tag')
        })
      })
    }

    if (filters.showJournals) {
      journals.forEach(journal => {
        journal.tags.forEach(tag => {
          addEdge(`journal:${journal.id}`, `tag:${tag}`, 'tag')
        })
      })
    }

    if (filters.showBookmarks) {
      bookmarks.forEach(bookmark => {
        bookmark.tags.forEach(tag => {
          addEdge(`bookmark:${bookmark.id}`, `tag:${tag}`, 'tag')
        })
      })
    }

    if (filters.showHabits) {
      habits.forEach(habit => {
        addEdge(`habit:${habit.id}`, `tag:${habit.category}`, 'tag')
      })
    }

    if (filters.showTasks) {
      tasks.forEach(task => {
        (task.tags || []).forEach(tag => {
          addEdge(`task:${task.id}`, `tag:${tag}`, 'tag')
        })
      })
    }
  }

  // Task-Bookmark links (linkedBookmarkIds)
  if (filters.showTasks && filters.showBookmarks) {
    tasks.forEach(task => {
      (task.linkedBookmarkIds || []).forEach(bookmarkId => {
        addEdge(`task:${task.id}`, `bookmark:${bookmarkId}`, 'wikilink')
      })
    })
  }

  // Bookmark-Task links (linkedTaskId)
  if (filters.showBookmarks && filters.showTasks) {
    bookmarks.forEach(bookmark => {
      if (bookmark.linkedTaskId) {
        addEdge(`bookmark:${bookmark.id}`, `task:${bookmark.linkedTaskId}`, 'wikilink')
      }
    })
  }

  nodes.forEach(node => {
    node.connections = connectionCount.get(node.id) || 0
  })

  return { nodes, edges }
}

export const nodeColors: Record<GraphEntityType, string> = {
  note: '#569CD6',
  task: '#6A9955',
  habit: '#CE9178',
  journal: '#C586C0',
  bookmark: '#4EC9B0',
  tag: '#DCDCAA',
}

export const nodeLabels: Record<GraphEntityType, string> = {
  note: 'Notes',
  task: 'Tasks',
  habit: 'Habits',
  journal: 'Journal',
  bookmark: 'Bookmarks',
  tag: 'Tags',
}
