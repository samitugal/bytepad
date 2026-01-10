// Smart Task Scheduling Service
// AI-powered task scheduling based on energy levels and productivity patterns

import { useTaskStore } from '../stores/taskStore'
import { useJournalStore } from '../stores/journalStore'
import { useHabitStore } from '../stores/habitStore'
import type { Task } from '../types'

interface ProductivityPattern {
    avgMorningEnergy: number
    avgAfternoonEnergy: number
    avgEveningEnergy: number
    bestProductivityHour: number
    worstProductivityHour: number
    avgTasksCompletedPerDay: number
}

interface ScheduledTask {
    task: Task
    suggestedTime: string
    reason: string
    energyMatch: 'high' | 'medium' | 'low'
}

interface DaySchedule {
    date: string
    currentEnergy: number
    scheduledTasks: ScheduledTask[]
    insights: string[]
    recommendations: string[]
}

// Helper to convert priority string to number
function priorityToNumber(priority: string): number {
    const map: Record<string, number> = { P1: 1, P2: 2, P3: 3, P4: 4 }
    return map[priority] || 4
}

// Analyze user's productivity patterns from journal entries
export function analyzeProductivityPatterns(): ProductivityPattern {
    const entries = useJournalStore.getState().entries
    const tasks = useTaskStore.getState().tasks

    // Default pattern if no data
    const defaultPattern: ProductivityPattern = {
        avgMorningEnergy: 3,
        avgAfternoonEnergy: 3,
        avgEveningEnergy: 2,
        bestProductivityHour: 10,
        worstProductivityHour: 15,
        avgTasksCompletedPerDay: 3,
    }

    if (entries.length < 3) return defaultPattern

    // Analyze energy patterns from journal
    const recentEntries = entries.slice(-30)

    let morningCount = 0
    let afternoonCount = 0
    let eveningCount = 0
    let morningEnergy = 0
    let afternoonEnergy = 0
    let eveningEnergy = 0

    recentEntries.forEach((entry) => {
        const entryDate = new Date(entry.date)
        const hour = entryDate.getHours() || 12 // Default to noon if no time
        const energy = entry.energy || 3

        if (hour >= 6 && hour < 12) {
            morningEnergy += energy
            morningCount++
        } else if (hour >= 12 && hour < 18) {
            afternoonEnergy += energy
            afternoonCount++
        } else {
            eveningEnergy += energy
            eveningCount++
        }
    })

    // Calculate completed tasks per day
    const completedTasks = tasks.filter((t) => t.completed)
    const uniqueDays = new Set(
        completedTasks.map((t) => {
            const date = t.completedAt || t.createdAt
            return new Date(date).toDateString()
        })
    )
    const avgTasksPerDay =
        uniqueDays.size > 0 ? completedTasks.length / uniqueDays.size : 3

    // Calculate averages
    const avgMorning = morningCount > 0 ? morningEnergy / morningCount : 3
    const avgAfternoon = afternoonCount > 0 ? afternoonEnergy / afternoonCount : 3
    const avgEvening = eveningCount > 0 ? eveningEnergy / eveningCount : 2

    let bestHour = 10
    let worstHour = 15

    if (avgMorning >= avgAfternoon && avgMorning >= avgEvening) {
        bestHour = 10
        worstHour = avgAfternoon < avgEvening ? 15 : 20
    } else if (avgAfternoon >= avgMorning && avgAfternoon >= avgEvening) {
        bestHour = 14
        worstHour = avgMorning < avgEvening ? 9 : 20
    } else {
        bestHour = 20
        worstHour = avgMorning < avgAfternoon ? 9 : 15
    }

    return {
        avgMorningEnergy: Math.round(avgMorning * 10) / 10,
        avgAfternoonEnergy: Math.round(avgAfternoon * 10) / 10,
        avgEveningEnergy: Math.round(avgEvening * 10) / 10,
        bestProductivityHour: bestHour,
        worstProductivityHour: worstHour,
        avgTasksCompletedPerDay: Math.round(avgTasksPerDay * 10) / 10,
    }
}

// Get current energy level from today's journal or estimate
export function getCurrentEnergy(): number {
    const entries = useJournalStore.getState().entries
    const today = new Date().toDateString()

    const todayEntry = entries.find(
        (e) => new Date(e.date).toDateString() === today
    )

    if (todayEntry?.energy) return todayEntry.energy

    // Estimate based on time of day and patterns
    const pattern = analyzeProductivityPatterns()
    const hour = new Date().getHours()

    if (hour >= 6 && hour < 12) return pattern.avgMorningEnergy
    if (hour >= 12 && hour < 18) return pattern.avgAfternoonEnergy
    return pattern.avgEveningEnergy
}

// Calculate task difficulty score
function getTaskDifficulty(task: Task): number {
    let difficulty = 0

    // Priority affects difficulty
    const priorityNum = priorityToNumber(task.priority)
    difficulty += (5 - priorityNum) * 2 // P1 = 8, P4 = 2

    // Description length as proxy for complexity
    if (task.description) {
        difficulty += Math.min(task.description.length / 100, 3)
    }

    return Math.min(difficulty, 10)
}

// Match task to energy level
function getEnergyMatch(
    taskDifficulty: number,
    currentEnergy: number
): 'high' | 'medium' | 'low' {
    const ratio = currentEnergy / (taskDifficulty / 2)
    if (ratio >= 1.2) return 'high'
    if (ratio >= 0.8) return 'medium'
    return 'low'
}

// Generate smart schedule for today
export function generateSmartSchedule(currentEnergy?: number): DaySchedule {
    const tasks = useTaskStore.getState().tasks
    const pattern = analyzeProductivityPatterns()
    const energy = currentEnergy ?? getCurrentEnergy()

    const today = new Date().toDateString()
    const now = new Date()

    // Get pending tasks
    const pendingTasks = tasks.filter((t) => {
        if (t.completed) return false
        if (!t.deadline) return true
        const deadlineDate = new Date(t.deadline)
        return (
            deadlineDate.toDateString() === today || deadlineDate < now
        )
    })

    // Sort by priority and deadline
    const sortedTasks = [...pendingTasks].sort((a, b) => {
        // Overdue tasks first
        const aOverdue = a.deadline && new Date(a.deadline) < now
        const bOverdue = b.deadline && new Date(b.deadline) < now
        if (aOverdue && !bOverdue) return -1
        if (!aOverdue && bOverdue) return 1

        // Then by priority
        return priorityToNumber(a.priority) - priorityToNumber(b.priority)
    })

    const scheduledTasks: ScheduledTask[] = []
    const insights: string[] = []
    const recommendations: string[] = []

    // Schedule tasks based on energy
    const hour = now.getHours()

    sortedTasks.slice(0, 5).forEach((task, index) => {
        const difficulty = getTaskDifficulty(task)
        const energyMatch = getEnergyMatch(difficulty, energy)
        const priorityNum = priorityToNumber(task.priority)

        let suggestedTime = ''
        let reason = ''

        if (energy >= 4 && priorityNum <= 2) {
            suggestedTime = 'Now'
            reason = 'High energy - tackle important tasks'
        } else if (energy >= 3) {
            suggestedTime = `${hour + index}:00`
            reason = 'Good energy level for this task'
        } else if (energy <= 2 && priorityNum >= 3) {
            suggestedTime = 'Now'
            reason = 'Low energy - good for lighter tasks'
        } else {
            suggestedTime = 'Later (when energy is higher)'
            reason = 'Save for when you have more energy'
        }

        scheduledTasks.push({
            task,
            suggestedTime,
            reason,
            energyMatch,
        })
    })

    // Generate insights
    if (energy <= 2) {
        insights.push(
            'Your energy is low. Consider taking a break or doing lighter tasks.'
        )
        recommendations.push('Try a 5-minute walk or stretch')
        recommendations.push('Focus on P3/P4 tasks that require less mental effort')
    } else if (energy >= 4) {
        insights.push('Great energy! This is a good time for challenging work.')
        recommendations.push('Tackle your most important P1 task now')
        recommendations.push("Avoid distractions - this is your peak time")
    }

    if (pattern.avgMorningEnergy > pattern.avgAfternoonEnergy) {
        insights.push(
            `Your data shows you're most productive in the morning (avg energy: ${pattern.avgMorningEnergy})`
        )
    }

    const overdueCount = pendingTasks.filter(
        (t) => t.deadline && new Date(t.deadline) < now
    ).length

    if (overdueCount > 0) {
        insights.push(
            `You have ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''}`
        )
        recommendations.push(
            'Consider rescheduling or breaking down overdue tasks'
        )
    }

    return {
        date: today,
        currentEnergy: energy,
        scheduledTasks,
        insights,
        recommendations,
    }
}

// Get task recommendations based on current state
export function getTaskRecommendations(): {
    nextTask: Task | null
    reason: string
    alternatives: Task[]
} {
    const schedule = generateSmartSchedule()

    if (schedule.scheduledTasks.length === 0) {
        return {
            nextTask: null,
            reason: 'No pending tasks for today!',
            alternatives: [],
        }
    }

    const highMatchTasks = schedule.scheduledTasks.filter(
        (st) => st.energyMatch === 'high'
    )
    const mediumMatchTasks = schedule.scheduledTasks.filter(
        (st) => st.energyMatch === 'medium'
    )

    const bestMatch =
        highMatchTasks[0] || mediumMatchTasks[0] || schedule.scheduledTasks[0]

    return {
        nextTask: bestMatch.task,
        reason: bestMatch.reason,
        alternatives: schedule.scheduledTasks
            .filter((st) => st.task.id !== bestMatch.task.id)
            .slice(0, 2)
            .map((st) => st.task),
    }
}

// Predict streak risk for habits
export function predictStreakRisk(): {
    atRiskHabits: {
        habitId: string
        habitName: string
        risk: 'high' | 'medium' | 'low'
        reason: string
    }[]
} {
    const habits = useHabitStore.getState().habits
    const today = new Date().toDateString()
    const currentHour = new Date().getHours()

    const atRiskHabits: {
        habitId: string
        habitName: string
        risk: 'high' | 'medium' | 'low'
        reason: string
    }[] = []

    habits.forEach((habit) => {
        // Check if completed today using completions record
        const completedToday = habit.completions[today] === true

        if (!completedToday) {
            let risk: 'high' | 'medium' | 'low' = 'low'
            let reason = ''

            // High risk if it's late and habit not done
            if (currentHour >= 20) {
                risk = 'high'
                reason = `It's ${currentHour}:00 and "${habit.name}" is not completed. Streak at risk!`
            } else if (currentHour >= 17) {
                risk = 'medium'
                reason = `Evening approaching - don't forget "${habit.name}"`
            } else if (habit.streak >= 7) {
                risk = 'medium'
                reason = `${habit.streak}-day streak for "${habit.name}" - keep it going!`
            }

            if (risk !== 'low') {
                atRiskHabits.push({
                    habitId: habit.id,
                    habitName: habit.name,
                    risk,
                    reason,
                })
            }
        }
    })

    // Sort by risk level
    return {
        atRiskHabits: atRiskHabits.sort((a, b) => {
            const riskOrder = { high: 0, medium: 1, low: 2 }
            return riskOrder[a.risk] - riskOrder[b.risk]
        }),
    }
}

// Format schedule as text for FlowBot
export function formatScheduleForChat(): string {
    const schedule = generateSmartSchedule()
    const streakRisk = predictStreakRisk()

    let text = `📊 **Smart Schedule** (Energy: ${schedule.currentEnergy}/5)\n\n`

    if (schedule.scheduledTasks.length > 0) {
        text += '**Recommended Tasks:**\n'
        schedule.scheduledTasks.forEach((st, i) => {
            const match =
                st.energyMatch === 'high' ? '🟢' : st.energyMatch === 'medium' ? '🟡' : '🔴'
            text += `${i + 1}. ${match} ${st.task.title} - ${st.suggestedTime}\n`
            text += `   _${st.reason}_\n`
        })
    } else {
        text += '✅ No pending tasks for today!\n'
    }

    if (streakRisk.atRiskHabits.length > 0) {
        text += '\n**⚠️ Streak Alerts:**\n'
        streakRisk.atRiskHabits.forEach((h) => {
            const icon = h.risk === 'high' ? '🔴' : '🟡'
            text += `${icon} ${h.reason}\n`
        })
    }

    if (schedule.insights.length > 0) {
        text += '\n**💡 Insights:**\n'
        schedule.insights.forEach((i) => {
            text += `• ${i}\n`
        })
    }

    if (schedule.recommendations.length > 0) {
        text += '\n**📌 Recommendations:**\n'
        schedule.recommendations.forEach((r) => {
            text += `• ${r}\n`
        })
    }

    return text
}
