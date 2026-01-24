// Data types matching Bytepad's Zustand stores

export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  folderId?: string
  pinned?: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Habit {
  id: string
  name: string
  frequency: 'daily' | 'weekly'
  category: string
  tags?: string[]
  completions: Record<string, boolean>
  streak: number
  createdAt: Date | string
  reminderEnabled?: boolean
  reminderTime?: string
}

export interface SubTask {
  id: string
  title: string
  completed: boolean
}

export interface Task {
  id: string
  title: string
  description?: string
  priority: 'P1' | 'P2' | 'P3' | 'P4'
  startDate?: Date | string
  startTime?: string
  deadline?: Date | string
  deadlineTime?: string
  endDate?: Date | string
  allDay?: boolean
  completed: boolean
  completedAt?: Date | string
  archivedAt?: Date | string
  subtasks: SubTask[]
  createdAt: Date | string
  order?: number
  reminderEnabled?: boolean
  reminderMinutesBefore?: number
  tags?: string[]
  linkedBookmarkIds?: string[]
  linkedNoteIds?: string[]
  kanbanStatus?: 'todo' | 'in_progress'
}

export interface JournalEntry {
  id: string
  date: string
  mood: 1 | 2 | 3 | 4 | 5
  energy: 1 | 2 | 3 | 4 | 5
  content: string
  tags: string[]
}

export interface Bookmark {
  id: string
  url: string
  title: string
  description?: string
  favicon?: string
  image?: string
  tags: string[]
  collection?: string
  isRead: boolean
  createdAt: Date | string
  domain: string
  linkedTaskId?: string
  linkedNoteId?: string
  sourceQuery?: string
}

export interface DailyNoteCard {
  id: string
  title: string
  content: string
  icon?: string
  pinned: boolean
  tags: string[]
  createdAt: Date | string
  updatedAt: Date | string
}

export interface DailyNote {
  id: string
  date: string
  cards: DailyNoteCard[]
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Idea {
  id: string
  title: string
  content: string
  color: 'yellow' | 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'cyan'
  tags: string[]
  linkedNoteIds: string[]
  linkedTaskIds: string[]
  status: 'active' | 'archived' | 'converted'
  order: number
  createdAt: Date | string
  updatedAt: Date | string
}

export interface FocusSession {
  id: string
  taskId: string
  taskTitle: string
  startedAt: Date | string
  endedAt?: Date | string
  duration: number
  targetDuration: number
  completed: boolean
  interrupted: boolean
}

export interface GamificationStats {
  level: number
  currentXP: number
  totalXP: number
  tasksCompleted: number
  tasksCompletedToday: number
  habitsCompleted: number
  habitsCompletedToday: number
  pomodorosCompleted: number
  notesCreated: number
  journalEntries: number
  perfectDays: number
  currentStreak: number
  bestStreak: number
  lastActiveDate: string | null
  achievements: string[]
}

export interface FocusStats {
  totalSessions: number
  totalFocusTime: number
  todayFocusTime: number
  weekFocusTime: number
  averageSessionLength: number
  longestSession: number
  sessionsPerTask: Record<string, { taskTitle: string; totalTime: number; sessionCount: number }>
}

// Main data structure matching Gist sync format
export interface StoreData {
  version: number
  lastModified: string
  data: {
    notes: Note[]
    tasks: Task[]
    habits: Habit[]
    journal: JournalEntry[]
    bookmarks: Bookmark[]
    dailyNotes: DailyNote[]
    ideas: Idea[]
    focusSessions: FocusSession[]
    gamification: GamificationStats
    focusStats: FocusStats
  }
}

// Gist Sync configuration
export interface GistConfig {
  token: string | null
  gistId: string | null
  autoSync: boolean
  syncInterval: number // minutes
  lastSyncAt: string | null
}

// Tool result interface
export interface ToolResult {
  success: boolean
  message: string
  data?: unknown
}
