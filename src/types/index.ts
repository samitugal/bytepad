export type ModuleType = 'notes' | 'habits' | 'tasks' | 'journal' | 'analysis' | 'bookmarks' | 'calendar'

export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  folderId?: string
  createdAt: Date
  updatedAt: Date
}

export interface Habit {
  id: string
  name: string
  frequency: 'daily' | 'weekly'
  category: string
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
  deadline?: Date
  deadlineTime?: string // HH:mm format for specific time
  endDate?: Date // End date for multi-day tasks (Calendar)
  allDay?: boolean // Is this an all-day task? (Calendar)
  completed: boolean
  completedAt?: Date
  subtasks: SubTask[]
  createdAt: Date
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
}
