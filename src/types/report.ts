// Productivity Report Types

export interface ProductivityData {
  period: 'daily' | 'weekly'
  dateRange: { start: string; end: string }

  tasks: {
    total: number
    completed: number
    pending: number
    overdue: number
    completionRate: number
    byPriority: Record<string, { completed: number; total: number }>
    avgCompletionTimeHours: number
    peakProductivityHours: number[]
  }

  habits: {
    total: number
    completionRate: number
    streaks: { name: string; current: number; best: number }[]
    mostConsistent: string[]
    leastConsistent: string[]
    dailyPattern: number[] // completion by day of week (0-6)
  }

  focus: {
    totalMinutes: number
    sessions: number
    avgSessionMinutes: number
    mostFocusedTasks: { taskId: string; title: string; minutes: number }[]
    focusByDayOfWeek: number[] // minutes per day
    consecutiveSessions: number
    focusStreak: number
  }

  notes: {
    created: number
    totalWords: number
    topTags: string[]
    linkedNotes: number
  }

  journal: {
    entries: number
    avgMood: number
    avgEnergy: number
    moodTrend: 'improving' | 'declining' | 'stable'
    energyTrend: 'improving' | 'declining' | 'stable'
  }

  gamification: {
    xpEarned: number
    levelProgress: number
    achievementsUnlocked: string[]
    currentStreak: number
    bestStreak: number
  }
}

export interface ReportStrength {
  title: string
  description: string
  evidence: string
}

export interface ReportWeakness {
  title: string
  description: string
  suggestion: string
}

export interface ReportAchievement {
  title: string
  description: string
  impact: string
}

export interface ReportMissed {
  title: string
  description: string
  recovery: string
}

export interface ReportAdvice {
  category: 'focus' | 'habits' | 'tasks' | 'wellbeing' | 'general'
  title: string
  description: string
  actionItems: string[]
}

export interface ADHDInsights {
  hyperfocusDetected: boolean
  energyPatterns: string
  consistencyScore: number
  dopamineManagement: string
}

export interface ProductivityReport {
  id: string
  period: 'daily' | 'weekly'
  dateRange: { start: string; end: string }
  generatedAt: string

  summary: string
  productivityScore: number
  comparisonToPrevious: number | null

  strengths: ReportStrength[]
  weaknesses: ReportWeakness[]
  achievements: ReportAchievement[]
  missed: ReportMissed[]
  advice: ReportAdvice[]
  adhdInsights: ADHDInsights

  rawData: ProductivityData
}
