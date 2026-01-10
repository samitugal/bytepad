// Email Service - EmailJS integration for notifications
import emailjs from '@emailjs/browser'

// EmailJS Configuration - User needs to set these in Settings
interface EmailConfig {
    serviceId: string
    templateIdDailySummary: string
    templateIdWeeklyReport: string
    templateIdStreakAlert: string
    publicKey: string
    userEmail: string
}

export interface DailySummaryData {
    userName: string
    date: string
    tasksCompleted: number
    tasksPending: number
    habitsCompleted: number
    habitsTotal: number
    currentStreak: number
    mood?: string
    energy?: string
    topPriorityTasks: string[]
}

export interface WeeklyReportData {
    userName: string
    weekRange: string
    tasksCompletedTotal: number
    habitCompletionRate: number
    averageMood: number
    averageEnergy: number
    longestStreak: number
    topHabits: string[]
    insights: string[]
    recommendations: string[]
}

export interface StreakAlertData {
    userName: string
    habitName: string
    currentStreak: number
    lastCompletedDate: string
    message: string
}

// Initialize EmailJS
export function initEmailJS(publicKey: string): void {
    emailjs.init(publicKey)
}

// Send Daily Summary Email
export async function sendDailySummaryEmail(
    config: EmailConfig,
    data: DailySummaryData
): Promise<{ success: boolean; message: string }> {
    try {
        const templateParams = {
            to_email: config.userEmail,
            user_name: data.userName,
            date: data.date,
            tasks_completed: data.tasksCompleted,
            tasks_pending: data.tasksPending,
            habits_completed: data.habitsCompleted,
            habits_total: data.habitsTotal,
            current_streak: data.currentStreak,
            mood: data.mood || 'Not recorded',
            energy: data.energy || 'Not recorded',
            top_priority_tasks: data.topPriorityTasks.join('\n• ') || 'No pending tasks',
        }

        await emailjs.send(
            config.serviceId,
            config.templateIdDailySummary,
            templateParams,
            config.publicKey
        )

        return { success: true, message: 'Daily summary email sent successfully' }
    } catch (error) {
        console.error('Failed to send daily summary email:', error)
        return {
            success: false,
            message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
    }
}

// Send Weekly Report Email
export async function sendWeeklyReportEmail(
    config: EmailConfig,
    data: WeeklyReportData
): Promise<{ success: boolean; message: string }> {
    try {
        const templateParams = {
            to_email: config.userEmail,
            user_name: data.userName,
            week_range: data.weekRange,
            tasks_completed_total: data.tasksCompletedTotal,
            habit_completion_rate: `${Math.round(data.habitCompletionRate)}%`,
            average_mood: getMoodEmoji(data.averageMood),
            average_energy: getEnergyEmoji(data.averageEnergy),
            longest_streak: data.longestStreak,
            top_habits: data.topHabits.join(', ') || 'No habits tracked',
            insights: data.insights.map(i => `• ${i}`).join('\n') || 'No insights available',
            recommendations: data.recommendations.map(r => `• ${r}`).join('\n') || 'Keep up the good work!',
        }

        await emailjs.send(
            config.serviceId,
            config.templateIdWeeklyReport,
            templateParams,
            config.publicKey
        )

        return { success: true, message: 'Weekly report email sent successfully' }
    } catch (error) {
        console.error('Failed to send weekly report email:', error)
        return {
            success: false,
            message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
    }
}

// Send Streak Alert Email
export async function sendStreakAlertEmail(
    config: EmailConfig,
    data: StreakAlertData
): Promise<{ success: boolean; message: string }> {
    try {
        const templateParams = {
            to_email: config.userEmail,
            user_name: data.userName,
            habit_name: data.habitName,
            current_streak: data.currentStreak,
            last_completed: data.lastCompletedDate,
            message: data.message,
        }

        await emailjs.send(
            config.serviceId,
            config.templateIdStreakAlert,
            templateParams,
            config.publicKey
        )

        return { success: true, message: 'Streak alert email sent successfully' }
    } catch (error) {
        console.error('Failed to send streak alert email:', error)
        return {
            success: false,
            message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
    }
}

// Helper functions
function getMoodEmoji(mood: number): string {
    const moods = ['😫', '😔', '😐', '🙂', '😊']
    return moods[Math.round(mood) - 1] || '😐'
}

function getEnergyEmoji(energy: number): string {
    const energies = ['🪫', '🔋', '⚡', '💪', '🚀']
    return energies[Math.round(energy) - 1] || '⚡'
}

// Generate daily summary data from stores
export function generateDailySummaryData(
    tasks: { completed: boolean; priority: string; title: string }[],
    habits: { completions: Record<string, boolean>; streak: number }[],
    journalEntry?: { mood?: number; energy?: number }
): Omit<DailySummaryData, 'userName' | 'date'> {
    const today = new Date().toISOString().split('T')[0]

    const completedTasks = tasks.filter(t => t.completed).length
    const pendingTasks = tasks.filter(t => !t.completed).length
    const completedHabits = habits.filter(h => h.completions[today]).length
    const maxStreak = Math.max(...habits.map(h => h.streak), 0)

    const topPriorityTasks = tasks
        .filter(t => !t.completed && (t.priority === 'P1' || t.priority === 'P2'))
        .slice(0, 5)
        .map(t => `[${t.priority}] ${t.title}`)

    return {
        tasksCompleted: completedTasks,
        tasksPending: pendingTasks,
        habitsCompleted: completedHabits,
        habitsTotal: habits.length,
        currentStreak: maxStreak,
        mood: journalEntry?.mood ? getMoodEmoji(journalEntry.mood) : undefined,
        energy: journalEntry?.energy ? getEnergyEmoji(journalEntry.energy) : undefined,
        topPriorityTasks,
    }
}

// Check if daily summary should be sent (based on user preferences)
export function shouldSendDailySummary(
    lastSentDate: string | null,
    preferredTime: string,
    enabled: boolean
): boolean {
    if (!enabled) return false

    const today = new Date().toISOString().split('T')[0]
    if (lastSentDate === today) return false

    const now = new Date()
    const [hours, minutes] = preferredTime.split(':').map(Number)
    const preferredDateTime = new Date()
    preferredDateTime.setHours(hours, minutes, 0, 0)

    return now >= preferredDateTime
}
