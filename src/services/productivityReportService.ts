// Productivity Report Service
// Collects data from all stores and generates AI-powered reports

import { useTaskStore } from '../stores/taskStore'
import { useHabitStore } from '../stores/habitStore'
import { useJournalStore } from '../stores/journalStore'
import { useNoteStore } from '../stores/noteStore'
import { useFocusStore } from '../stores/focusStore'
import { useGamificationStore } from '../stores/gamificationStore'
import { useSettingsStore, PROVIDER_INFO } from '../stores/settingsStore'
import { useReportStore } from '../stores/reportStore'
import type {
  ProductivityData,
  ProductivityReport,
  ReportStrength,
  ReportWeakness,
  ReportAchievement,
  ReportMissed,
  ReportAdvice,
  ADHDInsights,
} from '../types'

const generateId = () => Math.random().toString(36).substring(2, 15)

// Get date range for period
export function getDateRange(period: 'daily' | 'weekly'): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  const start = new Date(now)
  if (period === 'daily') {
    start.setHours(0, 0, 0, 0)
  } else {
    // Weekly: last 7 days
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
  }

  return { start, end }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function isInRange(date: Date | string, start: Date, end: Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return d >= start && d <= end
}

// Collect productivity data from all stores
export function collectProductivityData(period: 'daily' | 'weekly'): ProductivityData {
  const { start, end } = getDateRange(period)
  const dateRange = { start: formatDate(start), end: formatDate(end) }

  // Get all store states
  const tasks = useTaskStore.getState().tasks
  const habits = useHabitStore.getState().habits
  const journalEntries = useJournalStore.getState().entries
  const notes = useNoteStore.getState().notes
  const focusState = useFocusStore.getState()
  const gamificationState = useGamificationStore.getState()

  // Task data
  const periodTasks = tasks.filter((t) => isInRange(t.createdAt, start, end))
  const completedTasks = periodTasks.filter((t) => t.completed)
  const pendingTasks = periodTasks.filter((t) => !t.completed)
  const overdueTasks = tasks.filter(
    (t) => !t.completed && t.deadline && new Date(t.deadline) < new Date()
  )

  const byPriority: Record<string, { completed: number; total: number }> = {
    P1: { completed: 0, total: 0 },
    P2: { completed: 0, total: 0 },
    P3: { completed: 0, total: 0 },
    P4: { completed: 0, total: 0 },
  }
  periodTasks.forEach((t) => {
    byPriority[t.priority].total++
    if (t.completed) byPriority[t.priority].completed++
  })

  // Calculate avg completion time
  const completionTimes = completedTasks
    .filter((t) => t.completedAt)
    .map((t) => {
      const created = new Date(t.createdAt).getTime()
      const completed = new Date(t.completedAt!).getTime()
      return (completed - created) / (1000 * 60 * 60) // hours
    })
  const avgCompletionTimeHours =
    completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0

  // Peak productivity hours (from completed tasks)
  const hourCounts: Record<number, number> = {}
  completedTasks.forEach((t) => {
    if (t.completedAt) {
      const hour = new Date(t.completedAt).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    }
  })
  const peakProductivityHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => parseInt(hour))

  // Habit data
  const dates: string[] = []
  const current = new Date(start)
  while (current <= end) {
    dates.push(formatDate(current))
    current.setDate(current.getDate() + 1)
  }

  let habitCompletions = 0
  let habitTotal = 0
  const dailyPattern = [0, 0, 0, 0, 0, 0, 0]
  const habitConsistency: Record<string, number> = {}

  habits.forEach((h) => {
    let completedDays = 0
    dates.forEach((date) => {
      habitTotal++
      if (h.completions[date]) {
        habitCompletions++
        completedDays++
        const dayOfWeek = new Date(date).getDay()
        dailyPattern[dayOfWeek]++
      }
    })
    habitConsistency[h.name] = dates.length > 0 ? (completedDays / dates.length) * 100 : 0
  })

  const sortedByConsistency = Object.entries(habitConsistency).sort((a, b) => b[1] - a[1])
  const mostConsistent = sortedByConsistency.slice(0, 3).map(([name]) => name)
  const leastConsistent = sortedByConsistency
    .slice(-3)
    .reverse()
    .map(([name]) => name)

  const streaks = habits
    .map((h) => ({ name: h.name, current: h.streak, best: h.streak }))
    .filter((s) => s.current > 0)
    .sort((a, b) => b.current - a.current)

  // Focus data
  const periodSessions = focusState.sessions.filter((s) =>
    isInRange(s.startedAt, start, end)
  )
  const totalFocusMinutes = Math.round(
    periodSessions.reduce((sum, s) => sum + s.duration, 0) / 60
  )
  const avgSessionMinutes =
    periodSessions.length > 0
      ? Math.round(totalFocusMinutes / periodSessions.length)
      : 0

  // Focus by day of week
  const focusByDayOfWeek = [0, 0, 0, 0, 0, 0, 0]
  periodSessions.forEach((s) => {
    const day = new Date(s.startedAt).getDay()
    focusByDayOfWeek[day] += Math.round(s.duration / 60)
  })

  // Most focused tasks
  const taskFocusTime: Record<string, { title: string; minutes: number }> = {}
  periodSessions.forEach((s) => {
    if (!taskFocusTime[s.taskId]) {
      taskFocusTime[s.taskId] = { title: s.taskTitle, minutes: 0 }
    }
    taskFocusTime[s.taskId].minutes += Math.round(s.duration / 60)
  })
  const mostFocusedTasks = Object.entries(taskFocusTime)
    .map(([taskId, data]) => ({ taskId, ...data }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 5)

  // Note data
  const periodNotes = notes.filter((n) => isInRange(n.createdAt, start, end))
  const totalWords = periodNotes.reduce(
    (sum, n) => sum + n.content.split(/\s+/).filter(Boolean).length,
    0
  )

  // Count tags
  const tagCounts: Record<string, number> = {}
  periodNotes.forEach((n) => {
    n.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag)

  // Count linked notes
  const linkedNotes = notes.filter((n) => n.content.includes('[[')).length

  // Journal data
  const periodJournals = journalEntries.filter((e) => dates.includes(e.date))
  const moods = periodJournals.map((e) => e.mood).filter((m) => m > 0)
  const energies = periodJournals.map((e) => e.energy).filter((e) => e > 0)
  const avgMood = moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 0
  const avgEnergy =
    energies.length > 0 ? energies.reduce((a, b) => a + b, 0) / energies.length : 0

  // Calculate trends
  const getMoodTrend = (): 'improving' | 'declining' | 'stable' => {
    if (moods.length < 3) return 'stable'
    const firstHalf = moods.slice(0, Math.floor(moods.length / 2))
    const secondHalf = moods.slice(Math.floor(moods.length / 2))
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    if (avgSecond - avgFirst > 0.3) return 'improving'
    if (avgFirst - avgSecond > 0.3) return 'declining'
    return 'stable'
  }

  const getEnergyTrend = (): 'improving' | 'declining' | 'stable' => {
    if (energies.length < 3) return 'stable'
    const firstHalf = energies.slice(0, Math.floor(energies.length / 2))
    const secondHalf = energies.slice(Math.floor(energies.length / 2))
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    if (avgSecond - avgFirst > 0.3) return 'improving'
    if (avgFirst - avgSecond > 0.3) return 'declining'
    return 'stable'
  }

  // Gamification data (estimate XP earned in period)
  const xpEarned =
    completedTasks.length * 10 + habitCompletions * 5 + periodSessions.length * 15

  return {
    period,
    dateRange,
    tasks: {
      total: periodTasks.length,
      completed: completedTasks.length,
      pending: pendingTasks.length,
      overdue: overdueTasks.length,
      completionRate:
        periodTasks.length > 0
          ? Math.round((completedTasks.length / periodTasks.length) * 100)
          : 0,
      byPriority,
      avgCompletionTimeHours: Math.round(avgCompletionTimeHours * 10) / 10,
      peakProductivityHours,
    },
    habits: {
      total: habits.length,
      completionRate:
        habitTotal > 0 ? Math.round((habitCompletions / habitTotal) * 100) : 0,
      streaks,
      mostConsistent,
      leastConsistent,
      dailyPattern,
    },
    focus: {
      totalMinutes: totalFocusMinutes,
      sessions: periodSessions.length,
      avgSessionMinutes,
      mostFocusedTasks,
      focusByDayOfWeek,
      consecutiveSessions: focusState.consecutiveSessions,
      focusStreak: focusState.focusStreak,
    },
    notes: {
      created: periodNotes.length,
      totalWords,
      topTags,
      linkedNotes,
    },
    journal: {
      entries: periodJournals.length,
      avgMood: Math.round(avgMood * 10) / 10,
      avgEnergy: Math.round(avgEnergy * 10) / 10,
      moodTrend: getMoodTrend(),
      energyTrend: getEnergyTrend(),
    },
    gamification: {
      xpEarned,
      levelProgress: gamificationState.getXPProgress(),
      achievementsUnlocked: gamificationState.achievements,
      currentStreak: gamificationState.currentStreak,
      bestStreak: gamificationState.bestStreak,
    },
  }
}

// Build AI prompt for report generation
function buildReportPrompt(data: ProductivityData): string {
  const periodLabel = data.period === 'daily' ? 'Bugünkü' : 'Haftalık'

  return `Sen bir ADHD-uzmanı productivity koçusun. Aşağıdaki ${periodLabel.toLowerCase()} verileri analiz et ve kapsamlı bir rapor oluştur.

## Dönem: ${data.dateRange.start} - ${data.dateRange.end}

## Task Verileri
- Toplam: ${data.tasks.total} task
- Tamamlanan: ${data.tasks.completed} (%${data.tasks.completionRate})
- Bekleyen: ${data.tasks.pending}
- Geciken: ${data.tasks.overdue}
- P1 (Kritik): ${data.tasks.byPriority.P1.completed}/${data.tasks.byPriority.P1.total}
- P2 (Yüksek): ${data.tasks.byPriority.P2.completed}/${data.tasks.byPriority.P2.total}
- P3 (Normal): ${data.tasks.byPriority.P3.completed}/${data.tasks.byPriority.P3.total}
- Ortalama tamamlama süresi: ${data.tasks.avgCompletionTimeHours} saat
- En verimli saatler: ${data.tasks.peakProductivityHours.join(', ')}

## Habit Verileri
- ${data.habits.total} habit takip ediliyor
- Tamamlama oranı: %${data.habits.completionRate}
- Aktif streak'ler: ${data.habits.streaks.map((s) => `${s.name} (${s.current} gün)`).join(', ') || 'Yok'}
- En tutarlı: ${data.habits.mostConsistent.join(', ') || 'N/A'}
- En az tutarlı: ${data.habits.leastConsistent.join(', ') || 'N/A'}

## Focus Verileri
- Toplam: ${data.focus.totalMinutes} dakika (${Math.round(data.focus.totalMinutes / 60 * 10) / 10} saat)
- ${data.focus.sessions} session
- Ortalama session: ${data.focus.avgSessionMinutes} dakika
- Focus streak: ${data.focus.focusStreak} gün
- En çok odaklanılan: ${data.focus.mostFocusedTasks.map((t) => `${t.title} (${t.minutes} dk)`).join(', ') || 'N/A'}

## Note Verileri
- ${data.notes.created} not oluşturuldu
- Toplam ${data.notes.totalWords} kelime
- Popüler tag'ler: ${data.notes.topTags.join(', ') || 'Yok'}

## Journal Verileri
- ${data.journal.entries} günlük yazıldı
- Ortalama mood: ${data.journal.avgMood}/5 (${data.journal.moodTrend === 'improving' ? 'yükseliyor' : data.journal.moodTrend === 'declining' ? 'düşüyor' : 'stabil'})
- Ortalama enerji: ${data.journal.avgEnergy}/5 (${data.journal.energyTrend === 'improving' ? 'yükseliyor' : data.journal.energyTrend === 'declining' ? 'düşüyor' : 'stabil'})

## Gamification
- Tahmini XP: ${data.gamification.xpEarned}
- Günlük streak: ${data.gamification.currentStreak} gün
- En iyi streak: ${data.gamification.bestStreak} gün

## Rapor Formatı (JSON olarak yanıt ver)
{
  "summary": "2-3 cümle genel özet",
  "productivityScore": 0-100 arası puan,
  "strengths": [
    {"title": "Başlık", "description": "Açıklama", "evidence": "Somut veri"}
  ],
  "weaknesses": [
    {"title": "Başlık", "description": "Açıklama", "suggestion": "Çözüm önerisi"}
  ],
  "achievements": [
    {"title": "Başlık", "description": "Açıklama", "impact": "Etkisi"}
  ],
  "missed": [
    {"title": "Başlık", "description": "Açıklama", "recovery": "Telafi planı"}
  ],
  "advice": [
    {"category": "focus|habits|tasks|wellbeing|general", "title": "Başlık", "description": "Açıklama", "actionItems": ["Adım 1", "Adım 2"]}
  ],
  "adhdInsights": {
    "hyperfocusDetected": true/false,
    "energyPatterns": "Enerji pattern'i açıklaması",
    "consistencyScore": 0-100,
    "dopamineManagement": "Dopamin yönetimi önerisi"
  }
}

## Kurallar
- Pozitif ve motive edici ol, ama gerçekçi
- ADHD perspektifinden değerlendir
- Somut, ölçülebilir öneriler ver
- Küçük kazanımları kutla
- Sadece JSON döndür`
}

// Call LLM for report generation
async function callLLMForReport(prompt: string): Promise<string> {
  const settings = useSettingsStore.getState()
  const { llmProvider, llmModel, apiKeys, ollamaBaseUrl } = settings

  const messages = [
    { role: 'system', content: 'Sen bir ADHD productivity koçusun. JSON formatında yanıt ver.' },
    { role: 'user', content: prompt },
  ]

  if (llmProvider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKeys.openai}`,
      },
      body: JSON.stringify({
        model: llmModel,
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error.message)
    return data.choices[0].message.content
  }

  if (llmProvider === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKeys.anthropic,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: llmModel,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error.message)
    return data.content[0].text
  }

  if (llmProvider === 'google') {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${llmModel}:generateContent?key=${apiKeys.google}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2000, temperature: 0.7 },
        }),
      }
    )
    const data = await response.json()
    if (data.error) throw new Error(data.error.message)
    return data.candidates[0].content.parts[0].text
  }

  if (llmProvider === 'groq') {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKeys.groq}`,
      },
      body: JSON.stringify({
        model: llmModel,
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error.message)
    return data.choices[0].message.content
  }

  if (llmProvider === 'ollama') {
    const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: llmModel,
        messages,
        stream: false,
      }),
    })
    const data = await response.json()
    return data.message.content
  }

  throw new Error('Unsupported provider')
}

// Parse AI response into structured report
function parseAIResponse(
  response: string,
  data: ProductivityData
): Omit<ProductivityReport, 'id' | 'generatedAt' | 'rawData'> {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])

      return {
        period: data.period,
        dateRange: data.dateRange,
        summary: parsed.summary || 'Report generated successfully.',
        productivityScore: parsed.productivityScore || calculateFallbackScore(data),
        comparisonToPrevious: null,
        strengths: (parsed.strengths || []) as ReportStrength[],
        weaknesses: (parsed.weaknesses || []) as ReportWeakness[],
        achievements: (parsed.achievements || []) as ReportAchievement[],
        missed: (parsed.missed || []) as ReportMissed[],
        advice: (parsed.advice || []) as ReportAdvice[],
        adhdInsights: (parsed.adhdInsights || generateFallbackADHDInsights(data)) as ADHDInsights,
      }
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e)
  }

  // Fallback if parsing fails
  return generateFallbackReport(data)
}

// Calculate fallback score
function calculateFallbackScore(data: ProductivityData): number {
  let score = 50

  // Task completion (max +20)
  score += Math.min(20, data.tasks.completionRate * 0.2)

  // Habit completion (max +15)
  score += Math.min(15, data.habits.completionRate * 0.15)

  // Focus time (max +15)
  const targetMinutes = data.period === 'daily' ? 120 : 840
  score += Math.min(15, (data.focus.totalMinutes / targetMinutes) * 15)

  // P1 completion bonus (+10)
  const p1 = data.tasks.byPriority.P1
  if (p1.total > 0 && p1.completed === p1.total) {
    score += 10
  }

  // Overdue penalty (-10)
  if (data.tasks.overdue > 0) {
    score -= Math.min(10, data.tasks.overdue * 2)
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

// Generate fallback ADHD insights
function generateFallbackADHDInsights(data: ProductivityData): ADHDInsights {
  const hyperfocusDetected = data.focus.mostFocusedTasks.some((t) => t.minutes > 120)

  return {
    hyperfocusDetected,
    energyPatterns:
      data.journal.energyTrend === 'improving'
        ? 'Energy levels are improving'
        : data.journal.energyTrend === 'declining'
        ? 'Energy levels are declining - consider rest'
        : 'Energy levels are stable',
    consistencyScore: Math.round(
      (data.habits.completionRate + data.tasks.completionRate) / 2
    ),
    dopamineManagement:
      data.habits.streaks.length > 0
        ? 'Good dopamine regulation with active streaks'
        : 'Consider building small wins for dopamine boosts',
  }
}

// Generate fallback report
function generateFallbackReport(
  data: ProductivityData
): Omit<ProductivityReport, 'id' | 'generatedAt' | 'rawData'> {
  const strengths: ReportStrength[] = []
  const weaknesses: ReportWeakness[] = []
  const achievements: ReportAchievement[] = []
  const missed: ReportMissed[] = []
  const advice: ReportAdvice[] = []

  // Analyze tasks
  if (data.tasks.completionRate >= 70) {
    strengths.push({
      title: 'Strong Task Completion',
      description: `You completed ${data.tasks.completionRate}% of your tasks`,
      evidence: `${data.tasks.completed}/${data.tasks.total} tasks done`,
    })
  } else if (data.tasks.completionRate < 50) {
    weaknesses.push({
      title: 'Task Completion',
      description: 'Task completion rate is below 50%',
      suggestion: 'Try breaking tasks into smaller, actionable steps',
    })
  }

  // Analyze habits
  if (data.habits.streaks.length > 0) {
    const topStreak = data.habits.streaks[0]
    achievements.push({
      title: `${topStreak.current} Day Streak`,
      description: `Maintaining "${topStreak.name}" streak`,
      impact: 'Building consistency and momentum',
    })
  }

  // Analyze focus
  if (data.focus.totalMinutes > 60) {
    strengths.push({
      title: 'Focus Time',
      description: `${Math.round(data.focus.totalMinutes / 60)} hours of focused work`,
      evidence: `${data.focus.sessions} focus sessions completed`,
    })
  }

  // Add advice
  advice.push({
    category: 'general',
    title: 'Keep Building Momentum',
    description: 'Small consistent actions lead to big results',
    actionItems: ['Start with your most important task', 'Take regular breaks', 'Celebrate small wins'],
  })

  return {
    period: data.period,
    dateRange: data.dateRange,
    summary: `Productivity analysis for ${data.dateRange.start} to ${data.dateRange.end}.`,
    productivityScore: calculateFallbackScore(data),
    comparisonToPrevious: null,
    strengths,
    weaknesses,
    achievements,
    missed,
    advice,
    adhdInsights: generateFallbackADHDInsights(data),
  }
}

// Main function to generate productivity report
export async function generateProductivityReport(
  period: 'daily' | 'weekly'
): Promise<ProductivityReport> {
  const reportStore = useReportStore.getState()
  const settings = useSettingsStore.getState()

  reportStore.setIsGenerating(true)
  reportStore.setLastError(null)

  try {
    // Step 1: Collect data
    reportStore.setGenerationProgress('Collecting productivity data...')
    const data = collectProductivityData(period)

    // Check if we have enough data
    if (data.tasks.total === 0 && data.habits.total === 0 && data.focus.sessions === 0) {
      throw new Error('Not enough data to generate report. Start tracking your activities!')
    }

    // Step 2: Check if AI is available
    const hasApiKey =
      !PROVIDER_INFO[settings.llmProvider].requiresKey ||
      settings.apiKeys[settings.llmProvider]

    let reportContent: Omit<ProductivityReport, 'id' | 'generatedAt' | 'rawData'>

    if (hasApiKey) {
      // Step 3: Generate AI report
      reportStore.setGenerationProgress('Generating AI analysis...')
      const prompt = buildReportPrompt(data)

      try {
        const aiResponse = await callLLMForReport(prompt)
        reportStore.setGenerationProgress('Processing AI response...')
        reportContent = parseAIResponse(aiResponse, data)
      } catch (aiError) {
        console.warn('AI report failed, using fallback:', aiError)
        reportContent = generateFallbackReport(data)
      }
    } else {
      // Use fallback report without AI
      reportStore.setGenerationProgress('Generating report...')
      reportContent = generateFallbackReport(data)
    }

    // Step 4: Create final report
    const report: ProductivityReport = {
      id: generateId(),
      generatedAt: new Date().toISOString(),
      rawData: data,
      ...reportContent,
    }

    // Step 5: Save report
    reportStore.addReport(report)
    reportStore.setIsGenerating(false)
    reportStore.setGenerationProgress('')

    return report
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate report'
    reportStore.setLastError(errorMessage)
    reportStore.setIsGenerating(false)
    reportStore.setGenerationProgress('')
    throw error
  }
}
