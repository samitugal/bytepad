export type ModuleType = 'notes' | 'habits' | 'tasks' | 'journal' | 'analysis' | 'bookmarks' | 'calendar' | 'dailynotes' | 'graph'

// Re-export report types
export * from './report'

export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  folderId?: string
  pinned?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Habit {
  id: string
  name: string
  frequency: 'daily' | 'weekly'
  category: string
  tags?: string[] // Custom tags
  completions: Record<string, boolean>
  streak: number
  createdAt: Date
  // Reminder settings
  reminderEnabled?: boolean
  reminderTime?: string // HH:mm format
}

export interface Task {
  id: string
  title: string
  description?: string
  priority: 'P1' | 'P2' | 'P3' | 'P4'
  startDate?: Date // Start date for task
  startTime?: string // HH:mm format for specific start time
  deadline?: Date // End/due date (kept for backward compatibility)
  deadlineTime?: string // HH:mm format for specific time
  endDate?: Date // Alias for deadline (Calendar uses this)
  allDay?: boolean // Is this an all-day task? (Calendar)
  completed: boolean
  completedAt?: Date
  subtasks: SubTask[]
  createdAt: Date
  order?: number // Manual sort order for drag & drop (lower = higher in list)
  // Reminder settings
  reminderEnabled?: boolean
  reminderMinutesBefore?: number // minutes before deadline to remind
}

export interface SubTask {
  id: string
  title: string
  completed: boolean
}

export interface JournalEntry {
  id: string
  date: string
  mood: 1 | 2 | 3 | 4 | 5
  energy: 1 | 2 | 3 | 4 | 5
  content: string
  tags: string[]
}

export interface WeeklyAnalysis {
  weekStart: string
  weekEnd: string
  habitStats: HabitStat[]
  taskStats: TaskStat
  moodTrend: number[]
  energyTrend: number[]
  aiInsights: string[]
  recommendations: string[]
  generatedAt: Date
}

export interface HabitStat {
  habitId: string
  habitName: string
  completionRate: number
  streak: number
}

export interface TaskStat {
  total: number
  completed: number
  byPriority: Record<string, { total: number; completed: number }>
}

// Chat / AI Coach types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export interface ChatContext {
  pendingTasks: number
  completedTasksToday: number
  habitsCompletedToday: number
  totalHabitsToday: number
  currentStreak: number
  lastMood?: number
  lastEnergy?: number
  // Rich context for better AI responses
  taskList?: Array<{ title: string; priority: string; deadline?: string }>
  habitList?: Array<{ name: string; completed: boolean }>
}

// Daily Notes types
export interface DailyNote {
  id: string
  date: string // YYYY-MM-DD
  cards: DailyNoteCard[]
  createdAt: Date
  updatedAt: Date
}

export interface DailyNoteCard {
  id: string
  title: string
  content: string
  icon?: string // emoji
  pinned: boolean
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

// Bookmark types
export interface Bookmark {
  id: string
  url: string
  title: string
  description?: string
  favicon?: string
  image?: string // Preview image/thumbnail
  tags: string[]
  collection?: string // e.g., "Gold", "Silver", "Bronze", "Unsorted"
  isRead: boolean
  createdAt: Date
  domain: string // Extracted from URL
  // Cross-linking support
  linkedTaskId?: string // Link to related task
  linkedNoteId?: string // Link to related note
  sourceQuery?: string // Original search query that found this bookmark
}

// Knowledge Graph types
export type GraphEntityType = 'note' | 'task' | 'habit' | 'journal' | 'bookmark' | 'tag'

export interface GraphNode {
  id: string
  type: GraphEntityType
  label: string
  tags: string[]
  createdAt: string
  x: number
  y: number
  vx: number
  vy: number
  connections: number
}

export interface GraphEdge {
  source: string
  target: string
  type: 'wikilink' | 'tag' | 'reference'
}
