export type ModuleType = 'notes' | 'habits' | 'tasks' | 'journal' | 'analysis'

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
}

export interface Task {
  id: string
  title: string
  description?: string
  priority: 'P1' | 'P2' | 'P3' | 'P4'
  deadline?: Date
  completed: boolean
  completedAt?: Date
  subtasks: SubTask[]
  createdAt: Date
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
