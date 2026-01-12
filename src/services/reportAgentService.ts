// Report Agent Service - Specialized agent for generating weekly productivity reports

import { useTaskStore } from '../stores/taskStore'
import { useHabitStore } from '../stores/habitStore'
import { useNoteStore } from '../stores/noteStore'
import { useJournalStore } from '../stores/journalStore'
import { useFocusStore } from '../stores/focusStore'
import { useGamificationStore } from '../stores/gamificationStore'
import { useSettingsStore, PROVIDER_INFO } from '../stores/settingsStore'
import { getWeekRange, getWeekDates } from './analysisService'

// Tool definitions for Report Agent
export const REPORT_AGENT_TOOLS = [
  {
    name: 'get_tasks_data',
    description: 'Get all tasks data including completed, pending, overdue tasks with priorities',
    parameters: { weekOffset: { type: 'number', description: 'Number of weeks back (0 = current week)' } }
  },
  {
    name: 'get_habits_data',
    description: 'Get habits data including completion rates, streaks, and daily tracking',
    parameters: { weekOffset: { type: 'number', description: 'Number of weeks back (0 = current week)' } }
  },
  {
    name: 'get_journal_data',
    description: 'Get journal entries with mood and energy levels',
    parameters: { weekOffset: { type: 'number', description: 'Number of weeks back (0 = current week)' } }
  },
  {
    name: 'get_notes_data',
    description: 'Get notes summary including count, tags, and recent activity',
    parameters: { weekOffset: { type: 'number', description: 'Number of weeks back (0 = current week)' } }
  },
  {
    name: 'get_focus_data',
    description: 'Get focus session data including total minutes and sessions',
    parameters: {}
  },
  {
    name: 'get_gamification_data',
    description: 'Get XP, level, achievements, and streak data',
    parameters: {}
  }
]

// Tool execution for Report Agent
export interface ReportToolResult {
  success: boolean
  data: Record<string, unknown>
}

export function executeReportTool(name: string, args: Record<string, unknown>): ReportToolResult {
  const weekOffset = (args.weekOffset as number) || 0
  const now = new Date()
  now.setDate(now.getDate() - weekOffset * 7)
  const weekRange = getWeekRange(now)
  const weekDates = getWeekDates(weekRange.start)

  switch (name) {
    case 'get_tasks_data': {
      const tasks = useTaskStore.getState().tasks
      const weekTasks = tasks.filter(t => {
        const created = new Date(t.createdAt)
        return created >= weekRange.start && created <= weekRange.end
      })

      const completed = weekTasks.filter(t => t.completed)
      const pending = weekTasks.filter(t => !t.completed)
      const overdue = pending.filter(t => t.deadline && new Date(t.deadline) < new Date())

      const byPriority = {
        P1: weekTasks.filter(t => t.priority === 'P1'),
        P2: weekTasks.filter(t => t.priority === 'P2'),
        P3: weekTasks.filter(t => t.priority === 'P3'),
        P4: weekTasks.filter(t => t.priority === 'P4'),
      }

      return {
        success: true,
        data: {
          total: weekTasks.length,
          completed: completed.length,
          pending: pending.length,
          overdue: overdue.length,
          completionRate: weekTasks.length > 0 ? Math.round((completed.length / weekTasks.length) * 100) : 0,
          byPriority: {
            P1: { total: byPriority.P1.length, completed: byPriority.P1.filter(t => t.completed).length },
            P2: { total: byPriority.P2.length, completed: byPriority.P2.filter(t => t.completed).length },
            P3: { total: byPriority.P3.length, completed: byPriority.P3.filter(t => t.completed).length },
            P4: { total: byPriority.P4.length, completed: byPriority.P4.filter(t => t.completed).length },
          },
          recentCompleted: completed.slice(-5).map(t => ({ title: t.title, priority: t.priority })),
          pendingTasks: pending.slice(0, 5).map(t => ({ title: t.title, priority: t.priority, deadline: t.deadline })),
        }
      }
    }

    case 'get_habits_data': {
      const habits = useHabitStore.getState().habits

      const dailyCompletions: Record<string, { completed: number; total: number }> = {}
      weekDates.forEach(date => {
        const completed = habits.filter(h => h.completions[date]).length
        dailyCompletions[date] = { completed, total: habits.length }
      })

      const totalPossible = habits.length * 7
      const totalCompleted = Object.values(dailyCompletions).reduce((sum, d) => sum + d.completed, 0)

      const streaks = habits
        .filter(h => h.streak > 0)
        .sort((a, b) => b.streak - a.streak)
        .slice(0, 5)
        .map(h => ({ name: h.name, streak: h.streak, category: h.category }))

      const bestDay = Object.entries(dailyCompletions)
        .sort((a, b) => b[1].completed - a[1].completed)[0]
      const worstDay = Object.entries(dailyCompletions)
        .sort((a, b) => a[1].completed - b[1].completed)[0]

      return {
        success: true,
        data: {
          totalHabits: habits.length,
          avgCompletion: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
          dailyCompletions,
          streaks,
          bestDay: bestDay ? { date: bestDay[0], completed: bestDay[1].completed } : null,
          worstDay: worstDay ? { date: worstDay[0], completed: worstDay[1].completed } : null,
          habitList: habits.map(h => ({ name: h.name, category: h.category, streak: h.streak })),
        }
      }
    }

    case 'get_journal_data': {
      const entries = useJournalStore.getState().entries
      const weekEntries = entries.filter(e => {
        const date = new Date(e.date)
        return date >= weekRange.start && date <= weekRange.end
      })

      const moods = weekEntries.map(e => e.mood).filter(m => m > 0)
      const energies = weekEntries.map(e => e.energy).filter(e => e > 0)

      return {
        success: true,
        data: {
          entriesCount: weekEntries.length,
          avgMood: moods.length > 0 ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : 0,
          avgEnergy: energies.length > 0 ? (energies.reduce((a, b) => a + b, 0) / energies.length).toFixed(1) : 0,
          moodTrend: moods,
          energyTrend: energies,
          entries: weekEntries.map(e => ({
            date: e.date,
            mood: e.mood,
            energy: e.energy,
            contentPreview: e.content?.slice(0, 100),
          })),
        }
      }
    }

    case 'get_notes_data': {
      const notes = useNoteStore.getState().notes
      const weekNotes = notes.filter(n => {
        const created = new Date(n.createdAt)
        return created >= weekRange.start && created <= weekRange.end
      })

      const allTags: Record<string, number> = {}
      notes.forEach(n => {
        n.tags.forEach(tag => {
          allTags[tag] = (allTags[tag] || 0) + 1
        })
      })

      const topTags = Object.entries(allTags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }))

      return {
        success: true,
        data: {
          totalNotes: notes.length,
          createdThisWeek: weekNotes.length,
          topTags,
          recentNotes: weekNotes.slice(-5).map(n => ({
            title: n.title,
            tags: n.tags,
            wordCount: n.content.split(/\s+/).length,
          })),
        }
      }
    }

    case 'get_focus_data': {
      const focusState = useFocusStore.getState()
      const sessions = focusState.completedSessions || []

      return {
        success: true,
        data: {
          totalMinutes: focusState.totalFocusMinutes || 0,
          totalSessions: sessions.length,
          focusStreak: focusState.focusStreak || 0,
          avgSessionMinutes: sessions.length > 0
            ? Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length)
            : 0,
        }
      }
    }

    case 'get_gamification_data': {
      const gamification = useGamificationStore.getState()

      return {
        success: true,
        data: {
          xp: gamification.xp,
          level: gamification.level,
          currentStreak: gamification.currentStreak,
          bestStreak: gamification.bestStreak,
          achievements: gamification.achievements
            .filter(a => a.unlockedAt)
            .map(a => ({ id: a.id, name: a.name })),
          totalAchievements: gamification.achievements.length,
          unlockedAchievements: gamification.achievements.filter(a => a.unlockedAt).length,
        }
      }
    }

    default:
      return { success: false, data: { error: `Unknown tool: ${name}` } }
  }
}

// Build the report prompt with all collected data
function buildReportAgentPrompt(weekOffset: number = 0): { systemMessage: string; userPrompt: string; data: string } {
  // Collect all data using tools
  const tasksData = executeReportTool('get_tasks_data', { weekOffset })
  const habitsData = executeReportTool('get_habits_data', { weekOffset })
  const journalData = executeReportTool('get_journal_data', { weekOffset })
  const notesData = executeReportTool('get_notes_data', { weekOffset })
  const focusData = executeReportTool('get_focus_data', {})
  const gamificationData = executeReportTool('get_gamification_data', {})

  const now = new Date()
  now.setDate(now.getDate() - weekOffset * 7)
  const weekRange = getWeekRange(now)
  const weekStart = weekRange.start.toISOString().split('T')[0]
  const weekEnd = weekRange.end.toISOString().split('T')[0]

  const dataContext = `
## Collected Data for Week: ${weekStart} to ${weekEnd}

### Tasks
${JSON.stringify(tasksData.data, null, 2)}

### Habits
${JSON.stringify(habitsData.data, null, 2)}

### Journal
${JSON.stringify(journalData.data, null, 2)}

### Notes
${JSON.stringify(notesData.data, null, 2)}

### Focus Sessions
${JSON.stringify(focusData.data, null, 2)}

### Gamification
${JSON.stringify(gamificationData.data, null, 2)}
`

  const systemMessage = `Sen bir verimlilik koçu, hayat mentörü ve kişisel gelişim uzmanısın.
Kullanıcının haftalık verilerini analiz edip, detaylı, motive edici ve kişiselleştirilmiş bir Markdown rapor oluşturuyorsun.

Önemli Kurallar:
1. Rapor Türkçe olmalı
2. Motive edici ve pozitif bir ton kullan, ama gerçekçi ol
3. Kullanıcının başarılarını kutla
4. Gelişim alanlarını yapıcı bir şekilde belirt
5. Somut, uygulanabilir öneriler ver
6. Kitap önerileri yazar adı ve kısa açıklama ile olsun
7. Hayat tavsiyeleri pratik ve günlük hayata uygulanabilir olsun

Rapor Formatı (Bu başlıkları kullan):
# bytepad Haftalık Rapor
## Haftalık Özet
## Güçlü Yönlerin
## Gelişim Alanların
## Motivasyon Mesajı
## Pratik Öneriler
## Kitap Önerileri
## Hayat Tavsiyeleri
## Sonraki Hafta Hedefleri`

  const userPrompt = `Aşağıdaki haftalık verileri analiz et ve kapsamlı bir Markdown rapor oluştur.

${dataContext}

Lütfen verileri detaylı analiz et ve yukarıdaki format başlıklarını kullanarak kapsamlı bir rapor yaz.
Raporun başına tarih bilgisi ekle. Her bölümde verilere dayalı spesifik öneriler ver.`

  return { systemMessage, userPrompt, data: dataContext }
}

// Main function to generate report using AI
export async function generateReportWithAgent(weekOffset: number = 0): Promise<{
  success: boolean
  markdown: string
  generatedAt: string
}> {
  const settings = useSettingsStore.getState()
  const { llmProvider, llmModel, apiKeys, ollamaBaseUrl } = settings

  // Check if API key is available
  if (PROVIDER_INFO[llmProvider].requiresKey && !apiKeys[llmProvider]) {
    return {
      success: false,
      markdown: '# Error\n\nAPI key is required. Please configure in Settings → AI Coach.',
      generatedAt: new Date().toISOString(),
    }
  }

  const { systemMessage, userPrompt } = buildReportAgentPrompt(weekOffset)

  try {
    const markdown = await callLLMForReport(
      systemMessage,
      userPrompt,
      llmProvider,
      llmModel,
      apiKeys[llmProvider],
      ollamaBaseUrl
    )

    return {
      success: true,
      markdown,
      generatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Report Agent error:', error)
    return {
      success: false,
      markdown: `# Error\n\nFailed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      generatedAt: new Date().toISOString(),
    }
  }
}

async function callLLMForReport(
  systemMessage: string,
  userPrompt: string,
  provider: string,
  model: string,
  apiKey: string,
  ollamaBaseUrl: string
): Promise<string> {
  const messages = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: userPrompt },
  ]

  if (provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 3000,
        temperature: 0.8,
      }),
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error.message)
    return data.choices[0].message.content
  }

  if (provider === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 3000,
        system: systemMessage,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error.message)
    return data.content[0].text
  }

  if (provider === 'google') {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${systemMessage}\n\n${userPrompt}` }] }],
          generationConfig: { maxOutputTokens: 3000, temperature: 0.8 },
        }),
      }
    )
    const data = await response.json()
    if (data.error) throw new Error(data.error.message)
    return data.candidates[0].content.parts[0].text
  }

  if (provider === 'groq') {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 3000,
        temperature: 0.8,
      }),
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error.message)
    return data.choices[0].message.content
  }

  if (provider === 'ollama') {
    const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
      }),
    })
    const data = await response.json()
    return data.message.content
  }

  throw new Error('Unsupported provider')
}
