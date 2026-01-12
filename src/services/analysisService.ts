import type { Habit, Task, JournalEntry } from '../types'
import { useSettingsStore, PROVIDER_INFO } from '../stores/settingsStore'

export interface WeeklyStats {
  weekStart: string
  weekEnd: string
  habits: {
    total: number
    avgCompletion: number
    bestDay: string | null
    worstDay: string | null
    streaks: { name: string; streak: number }[]
  }
  tasks: {
    total: number
    completed: number
    completionRate: number
    byPriority: Record<string, { total: number; completed: number }>
  }
  journal: {
    entries: number
    avgMood: number
    avgEnergy: number
    moodTrend: number[]
    energyTrend: number[]
  }
  insights: string[]
  recommendations: string[]
}

export function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

export function getWeekDates(start: Date): string[] {
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

export function calculateWeeklyStats(
  habits: Habit[],
  tasks: Task[],
  journalEntries: JournalEntry[],
  weekRange: { start: Date; end: Date }
): WeeklyStats {
  const weekDates = getWeekDates(weekRange.start)
  const weekStart = weekRange.start.toISOString().split('T')[0]
  const weekEnd = weekRange.end.toISOString().split('T')[0]

  // Habit stats
  const habitCompletions: Record<string, number> = {}
  weekDates.forEach(date => {
    habitCompletions[date] = habits.filter(h => h.completions[date]).length
  })

  const totalPossible = habits.length * 7
  const totalCompleted = Object.values(habitCompletions).reduce((a, b) => a + b, 0)
  const avgCompletion = totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0

  let bestDay: string | null = null
  let worstDay: string | null = null
  if (habits.length > 0) {
    const maxCompletion = Math.max(...Object.values(habitCompletions))
    const minCompletion = Math.min(...Object.values(habitCompletions))
    bestDay = Object.entries(habitCompletions).find(([, v]) => v === maxCompletion)?.[0] || null
    worstDay = Object.entries(habitCompletions).find(([, v]) => v === minCompletion)?.[0] || null
  }

  const streaks = habits
    .map(h => ({ name: h.name, streak: h.streak }))
    .filter(s => s.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 5)

  // Task stats
  const weekTasks = tasks.filter(t => {
    const created = new Date(t.createdAt)
    return created >= weekRange.start && created <= weekRange.end
  })

  const completedTasks = weekTasks.filter(t => t.completed)

  const byPriority: Record<string, { total: number; completed: number }> = {
    P1: { total: 0, completed: 0 },
    P2: { total: 0, completed: 0 },
    P3: { total: 0, completed: 0 },
    P4: { total: 0, completed: 0 },
  }

  weekTasks.forEach(t => {
    byPriority[t.priority].total++
    if (t.completed) byPriority[t.priority].completed++
  })

  // Journal stats
  const weekEntries = journalEntries.filter(e => weekDates.includes(e.date))
  const moodTrend = weekDates.map(date => {
    const entry = weekEntries.find(e => e.date === date)
    return entry?.mood || 0
  })
  const energyTrend = weekDates.map(date => {
    const entry = weekEntries.find(e => e.date === date)
    return entry?.energy || 0
  })

  const validMoods = moodTrend.filter(m => m > 0) as number[]
  const validEnergies = energyTrend.filter(e => e > 0) as number[]
  const avgMood = validMoods.length > 0 ? validMoods.reduce((a, b) => a + b, 0) / validMoods.length : 0
  const avgEnergy = validEnergies.length > 0 ? validEnergies.reduce((a, b) => a + b, 0) / validEnergies.length : 0

  // Generate insights
  const insights = generateInsights({
    avgCompletion,
    completionRate: weekTasks.length > 0 ? (completedTasks.length / weekTasks.length) * 100 : 0,
    avgMood,
    avgEnergy,
    byPriority,
    streaks,
    moodTrend,
    energyTrend,
  })

  // Generate recommendations
  const recommendations = generateRecommendations({
    avgCompletion,
    completionRate: weekTasks.length > 0 ? (completedTasks.length / weekTasks.length) * 100 : 0,
    avgMood,
    avgEnergy,
    byPriority,
    habits,
  })

  return {
    weekStart,
    weekEnd,
    habits: {
      total: habits.length,
      avgCompletion,
      bestDay,
      worstDay,
      streaks,
    },
    tasks: {
      total: weekTasks.length,
      completed: completedTasks.length,
      completionRate: weekTasks.length > 0 ? (completedTasks.length / weekTasks.length) * 100 : 0,
      byPriority,
    },
    journal: {
      entries: weekEntries.length,
      avgMood,
      avgEnergy,
      moodTrend,
      energyTrend,
    },
    insights,
    recommendations,
  }
}

interface InsightData {
  avgCompletion: number
  completionRate: number
  avgMood: number
  avgEnergy: number
  byPriority: Record<string, { total: number; completed: number }>
  streaks: { name: string; streak: number }[]
  moodTrend: number[]
  energyTrend: number[]
}

function generateInsights(data: InsightData): string[] {
  const insights: string[] = []

  // Habit insights
  if (data.avgCompletion >= 80) {
    insights.push('Excellent habit consistency this week! You completed ' + Math.round(data.avgCompletion) + '% of your habits.')
  } else if (data.avgCompletion >= 50) {
    insights.push('Good progress on habits at ' + Math.round(data.avgCompletion) + '%. Room for improvement!')
  } else if (data.avgCompletion > 0) {
    insights.push('Habit completion at ' + Math.round(data.avgCompletion) + '%. Consider starting with just 1-2 key habits.')
  }

  // Streak insights
  if (data.streaks.length > 0) {
    const topStreak = data.streaks[0]
    if (topStreak.streak >= 7) {
      insights.push(`Amazing! "${topStreak.name}" streak at ${topStreak.streak} days!`)
    }
  }

  // Task insights
  if (data.completionRate >= 70) {
    insights.push('Strong task completion rate at ' + Math.round(data.completionRate) + '%!')
  }

  // P1 task focus
  const p1Stats = data.byPriority['P1']
  if (p1Stats && p1Stats.total > 0) {
    const p1Rate = (p1Stats.completed / p1Stats.total) * 100
    if (p1Rate === 100) {
      insights.push('All critical (P1) tasks completed! Great prioritization.')
    } else if (p1Rate < 50) {
      insights.push('Some P1 tasks incomplete. These need your immediate attention.')
    }
  }

  // Mood/Energy patterns
  if (data.avgMood >= 4) {
    insights.push('Great mood this week! Average: ' + data.avgMood.toFixed(1) + '/5')
  } else if (data.avgMood > 0 && data.avgMood < 3) {
    insights.push('Mood has been lower this week. Be gentle with yourself.')
  }

  // Energy dip pattern
  const midWeekEnergy = data.energyTrend.slice(2, 5).filter(e => e > 0)
  if (midWeekEnergy.length > 0) {
    const avgMidWeek = midWeekEnergy.reduce((a, b) => a + b, 0) / midWeekEnergy.length
    if (avgMidWeek < 3) {
      insights.push('Mid-week energy dip detected. Consider lighter tasks on Wed-Fri.')
    }
  }

  return insights.length > 0 ? insights : ['Start tracking to see insights!']
}

interface RecommendationData {
  avgCompletion: number
  completionRate: number
  avgMood: number
  avgEnergy: number
  byPriority: Record<string, { total: number; completed: number }>
  habits: Habit[]
}

function generateRecommendations(data: RecommendationData): string[] {
  const recommendations: string[] = []

  // Habit recommendations
  if (data.avgCompletion < 50 && data.habits.length > 3) {
    recommendations.push('Try reducing to 3 core habits. Quality over quantity!')
  }

  if (data.avgCompletion < 30) {
    recommendations.push('Start with just ONE habit and build from there.')
  }

  // Task recommendations
  const p1Stats = data.byPriority['P1']
  if (p1Stats && p1Stats.total > 3) {
    recommendations.push('Too many P1 tasks. Re-evaluate what\'s truly critical.')
  }

  if (data.completionRate < 50) {
    recommendations.push('Break tasks into smaller, actionable steps.')
  }

  // Energy-based recommendations
  if (data.avgEnergy > 0 && data.avgEnergy < 3) {
    recommendations.push('Low energy detected. Prioritize sleep and movement.')
    recommendations.push('Schedule important tasks during your peak energy hours.')
  }

  // Mood-based recommendations
  if (data.avgMood > 0 && data.avgMood < 3) {
    recommendations.push('Consider adding one small joy to each day.')
    recommendations.push('Journaling can help process difficult emotions.')
  }

  // General ADHD-friendly tips
  if (recommendations.length < 2) {
    recommendations.push('Use timers for focused work sessions (25-50 min).')
    recommendations.push('Celebrate small wins to maintain motivation.')
  }

  return recommendations.slice(0, 4)
}

// AI-powered insights generation
export async function generateAIInsights(stats: WeeklyStats): Promise<{
  insights: string[]
  recommendations: string[]
  summary: string
}> {
  const settings = useSettingsStore.getState()
  const { llmProvider, llmModel, apiKeys, ollamaBaseUrl } = settings

  // Check if API key is available
  if (PROVIDER_INFO[llmProvider].requiresKey && !apiKeys[llmProvider]) {
    return {
      insights: stats.insights,
      recommendations: stats.recommendations,
      summary: 'AI insights require an API key. Configure in Settings.',
    }
  }

  const prompt = buildAIInsightsPrompt(stats)

  try {
    const response = await callLLMForInsights(
      prompt,
      llmProvider,
      llmModel,
      apiKeys[llmProvider],
      ollamaBaseUrl
    )

    return parseAIInsightsResponse(response, stats)
  } catch (error) {
    console.error('AI Insights error:', error)
    return {
      insights: stats.insights,
      recommendations: stats.recommendations,
      summary: 'Could not generate AI insights. Using default analysis.',
    }
  }
}

function buildAIInsightsPrompt(stats: WeeklyStats): string {
  return `Sen bir verimlilik koçusun. Aşağıdaki haftalık verileri analiz et ve kişiselleştirilmiş öneriler sun.

## Haftalık Veriler (${stats.weekStart} - ${stats.weekEnd})

### Habits
- Toplam habit: ${stats.habits.total}
- Ortalama tamamlama: %${Math.round(stats.habits.avgCompletion)}
- En iyi gün: ${stats.habits.bestDay || 'N/A'}
- En kötü gün: ${stats.habits.worstDay || 'N/A'}
- Aktif streak'ler: ${stats.habits.streaks.map(s => `${s.name} (${s.streak} gün)`).join(', ') || 'Yok'}

### Tasks
- Toplam task: ${stats.tasks.total}
- Tamamlanan: ${stats.tasks.completed}
- Tamamlama oranı: %${Math.round(stats.tasks.completionRate)}
- P1 (Kritik): ${stats.tasks.byPriority.P1.completed}/${stats.tasks.byPriority.P1.total}
- P2 (Yüksek): ${stats.tasks.byPriority.P2.completed}/${stats.tasks.byPriority.P2.total}

### Journal
- Günlük sayısı: ${stats.journal.entries}/7
- Ortalama mood: ${stats.journal.avgMood.toFixed(1)}/5
- Ortalama enerji: ${stats.journal.avgEnergy.toFixed(1)}/5
- Mood trendi: ${stats.journal.moodTrend.join(', ')}
- Enerji trendi: ${stats.journal.energyTrend.join(', ')}

## Görevin
1. Bu verilerdeki verimlilik pattern'lerini tespit et (odaklanma, enerji dalgalanmaları, tutarlılık vb.)
2. 3-4 kısa insight yaz (her biri max 1 cümle)
3. 3-4 pratik öneri yaz (uygulanabilir, küçük adımlar)
4. 2-3 cümlelik genel bir özet yaz

## Format (JSON olarak yanıtla)
{
  "insights": ["insight1", "insight2", "insight3"],
  "recommendations": ["öneri1", "öneri2", "öneri3"],
  "summary": "Genel özet..."
}

Sadece JSON döndür, başka açıklama ekleme.`
}

async function callLLMForInsights(
  prompt: string,
  provider: string,
  model: string,
  apiKey: string,
  ollamaBaseUrl: string
): Promise<string> {
  const messages = [
    { role: 'system', content: 'Sen bir verimlilik koçusun. JSON formatında yanıt ver.' },
    { role: 'user', content: prompt },
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
        max_tokens: 800,
        temperature: 0.7,
      }),
    })
    const data = await response.json()
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
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await response.json()
    return data.content[0].text
  }

  if (provider === 'google') {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
        }),
      }
    )
    const data = await response.json()
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
        max_tokens: 800,
        temperature: 0.7,
      }),
    })
    const data = await response.json()
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

function parseAIInsightsResponse(
  response: string,
  fallbackStats: WeeklyStats
): { insights: string[]; recommendations: string[]; summary: string } {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        insights: parsed.insights || fallbackStats.insights,
        recommendations: parsed.recommendations || fallbackStats.recommendations,
        summary: parsed.summary || 'AI analysis complete.',
      }
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e)
  }

  return {
    insights: fallbackStats.insights,
    recommendations: fallbackStats.recommendations,
    summary: response.slice(0, 200),
  }
}

// Generate comprehensive MD report with AI insights
export interface AIMarkdownReport {
  markdown: string
  generatedAt: string
}

export async function generateAIMarkdownReport(stats: WeeklyStats): Promise<AIMarkdownReport> {
  const settings = useSettingsStore.getState()
  const { llmProvider, llmModel, apiKeys, ollamaBaseUrl } = settings

  // Check if API key is available
  if (PROVIDER_INFO[llmProvider].requiresKey && !apiKeys[llmProvider]) {
    return {
      markdown: generateFallbackMarkdownReport(stats),
      generatedAt: new Date().toISOString(),
    }
  }

  const prompt = buildMarkdownReportPrompt(stats)

  try {
    const response = await callLLMForMarkdownReport(
      prompt,
      llmProvider,
      llmModel,
      apiKeys[llmProvider],
      ollamaBaseUrl
    )

    return {
      markdown: response,
      generatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('AI Markdown Report error:', error)
    return {
      markdown: generateFallbackMarkdownReport(stats),
      generatedAt: new Date().toISOString(),
    }
  }
}

async function callLLMForMarkdownReport(
  prompt: string,
  provider: string,
  model: string,
  apiKey: string,
  ollamaBaseUrl: string
): Promise<string> {
  const systemMessage = `Sen bir verimlilik koçu ve hayat mentorüsün. Kullanıcının haftalık verilerini analiz edip, detaylı ve motive edici bir Markdown rapor oluşturuyorsun.

Raporun şunları içermeli:
- Motive edici ve kişiselleştirilmiş bir ton
- Kullanıcının güçlü yönlerini vurgula
- Gelişim alanlarını yapıcı bir şekilde belirt
- Kitap önerileri (yazar adı ve kısa açıklama ile)
- Hayat tavsiyeleri ve pratik öneriler
- Sonraki hafta için hedefler

Markdown formatında yaz. Her bölüm için ## başlık kullan. Türkçe yaz.`

  const messages = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: prompt },
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
        max_tokens: 2000,
        temperature: 0.8,
      }),
    })
    const data = await response.json()
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
        max_tokens: 2000,
        system: systemMessage,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await response.json()
    return data.content[0].text
  }

  if (provider === 'google') {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${systemMessage}\n\n${prompt}` }] }],
          generationConfig: { maxOutputTokens: 2000, temperature: 0.8 },
        }),
      }
    )
    const data = await response.json()
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
        max_tokens: 2000,
        temperature: 0.8,
      }),
    })
    const data = await response.json()
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

function buildMarkdownReportPrompt(stats: WeeklyStats): string {
  return `Sen bir verimlilik koçu ve hayat mentorüsün. Aşağıdaki haftalık verileri analiz et ve kapsamlı bir Markdown rapor oluştur.

## Haftalık Veriler (${stats.weekStart} - ${stats.weekEnd})

### Habits
- Toplam habit: ${stats.habits.total}
- Ortalama tamamlama: %${Math.round(stats.habits.avgCompletion)}
- En iyi gün: ${stats.habits.bestDay || 'N/A'}
- En kötü gün: ${stats.habits.worstDay || 'N/A'}
- Aktif streak'ler: ${stats.habits.streaks.map(s => `${s.name} (${s.streak} gün)`).join(', ') || 'Yok'}

### Tasks
- Toplam task: ${stats.tasks.total}
- Tamamlanan: ${stats.tasks.completed}
- Tamamlama oranı: %${Math.round(stats.tasks.completionRate)}
- P1 (Kritik): ${stats.tasks.byPriority.P1.completed}/${stats.tasks.byPriority.P1.total}
- P2 (Yüksek): ${stats.tasks.byPriority.P2.completed}/${stats.tasks.byPriority.P2.total}

### Journal
- Günlük sayısı: ${stats.journal.entries}/7
- Ortalama mood: ${stats.journal.avgMood.toFixed(1)}/5
- Ortalama enerji: ${stats.journal.avgEnergy.toFixed(1)}/5

## Görevin

Aşağıdaki başlıklarla detaylı bir Markdown rapor yaz:

1. **Haftalık Özet** - Bu haftanın genel değerlendirmesi (2-3 paragraf)

2. **Güçlü Yönlerin** - Bu hafta iyi gittiğin noktalar (bullet list)

3. **Gelişim Alanların** - Eksik kalan veya geliştirilmesi gereken noktalar (bullet list)

4. **Motivasyon Mesajı** - Kişiselleştirilmiş, motive edici bir paragraf

5. **Pratik Öneriler** - Bu hafta uygulayabileceğin somut adımlar (bullet list)

6. **Kitap Önerileri** - Durumuna uygun 2-3 kitap önerisi (yazar ve kısa açıklama ile)

7. **Hayat Tavsiyeleri** - Genel yaşam kalitesini artıracak tavsiyeler (bullet list)

8. **Sonraki Hafta Hedefleri** - Önerilen hedefler (bullet list)

Format: Düz Markdown olarak yaz, JSON değil. Her bölüm için ## başlık kullan. Türkçe yaz.`
}

function parseMarkdownReportResponse(response: string, stats: WeeklyStats): string {
  // Check if response is already markdown (not JSON)
  if (response.includes('##') || response.includes('**')) {
    return response
  }

  // Try to extract markdown from response
  // Sometimes AI might wrap it in code blocks
  const codeBlockMatch = response.match(/```markdown\n?([\s\S]*?)```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }

  const mdMatch = response.match(/```\n?([\s\S]*?)```/)
  if (mdMatch) {
    return mdMatch[1].trim()
  }

  // If response is plain text, return it as is
  if (response.length > 100) {
    return response
  }

  // Fallback
  return generateFallbackMarkdownReport(stats)
}

function generateFallbackMarkdownReport(stats: WeeklyStats): string {
  const completionEmoji = stats.habits.avgCompletion >= 70 ? '🎉' : stats.habits.avgCompletion >= 40 ? '💪' : '🌱'
  const taskEmoji = stats.tasks.completionRate >= 70 ? '✅' : stats.tasks.completionRate >= 40 ? '📝' : '🎯'

  const streaksList = stats.habits.streaks.length > 0
    ? stats.habits.streaks.map(s => `- **${s.name}** streak'ini ${s.streak} güne taşıdın!`).join('\n')
    : '- Düzenli alışkanlıklar oluşturmaya başlıyorsun'

  const journalNote = stats.journal.entries > 0
    ? `Günlüğüne ${stats.journal.entries} kez yazdın ve ortalama mood seviyeni ${stats.journal.avgMood.toFixed(1)}/5 olarak kaydettın.`
    : 'Bu hafta günlük tutmadın - düşüncelerini yazmayı deneyebilirsin.'

  return `# bytepad Haftalık Rapor ${completionEmoji}

**Tarih:** ${stats.weekStart} - ${stats.weekEnd}
**Oluşturulma:** ${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}

---

## Haftalık Özet

Bu hafta ${stats.habits.total} habit takip ettin ve ortalama %${Math.round(stats.habits.avgCompletion)} tamamlama oranına ulaştın. ${stats.tasks.total} görevden ${stats.tasks.completed} tanesini tamamladın (%${Math.round(stats.tasks.completionRate)}).

${journalNote}

---

## Güçlü Yönlerin ${taskEmoji}

${streaksList}
${stats.tasks.completionRate >= 50 ? '- Görevlerini tamamlama konusunda iyi ilerleme kaydediyorsun' : ''}
${stats.journal.entries >= 3 ? '- Düzenli günlük tutma alışkanlığı geliştiriyorsun' : ''}

---

## Gelişim Alanların

${stats.habits.avgCompletion < 70 ? '- Habit tamamlama oranını artırmak için daha küçük hedefler koyabilirsin' : ''}
${stats.tasks.byPriority.P1.completed < stats.tasks.byPriority.P1.total ? '- P1 (kritik) görevlere öncelik vermeyi dene' : ''}
${stats.journal.entries < 5 ? '- Günlük yazma alışkanlığını güçlendirebilirsin' : ''}
- Her gün en az bir küçük kazanım hedefle

---

## Motivasyon Mesajı

Unutma, büyük başarılar küçük adımların toplamıdır. Bu hafta attığın her adım, gelecekteki başarılarının temelidir. Kendine karşı sabırlı ol ve ilerlemeni kutla - ne kadar küçük olursa olsun.

**"Mükemmel anı bekleyenler asla başlayamaz. Başlayanlar ise mükemmelleşir."**

---

## Pratik Öneriler

- Sabah rutinine 5 dakikalık bir planlama ekle
- En zor görevi günün enerjinin yüksek olduğu saatte yap
- Her tamamlanan görevden sonra kendine küçük bir ödül ver
- Gece yatmadan önce yarınki 3 önceliğini belirle
- Haftada bir gün tam dinlenme günü ayır

---

## Kitap Önerileri

1. **"Atomic Habits"** - James Clear
   *Küçük alışkanlıkların nasıl büyük değişimlere yol açtığını anlatıyor.*

2. **"Deep Work"** - Cal Newport
   *Odaklanma ve derin çalışma becerisini geliştirmek için pratik stratejiler.*

3. **"The 5 AM Club"** - Robin Sharma
   *Sabah rutininin gücünü ve günü nasıl verimli başlatacağını öğretiyor.*

---

## Hayat Tavsiyeleri

- Her gün 10 dakika sessizlik veya meditasyon yap
- Telefonu yatmadan 1 saat önce bırak
- Günde en az 8 bardak su iç
- Haftada 3 gün fiziksel aktivite yap
- Minnettarlık listesi tut - her gün 3 şey yaz

---

## Sonraki Hafta Hedefleri

- [ ] Habit tamamlama oranını %${Math.min(Math.round(stats.habits.avgCompletion) + 10, 100)}'e çıkar
- [ ] En az ${Math.min(stats.tasks.completed + 2, stats.tasks.total + 5)} görevi tamamla
- [ ] Her gün günlük yaz
- [ ] Yeni bir alışkanlık ekle veya mevcut birini güçlendir
- [ ] Haftanın sonunda bu raporu tekrar gözden geçir

---

*Bu rapor bytepad tarafından otomatik oluşturulmuştur. AI destekli analiz için API key ekleyin.*
`
}
