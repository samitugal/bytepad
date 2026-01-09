import { useSettingsStore, PROVIDER_INFO, LLMProvider } from '../stores/settingsStore'
import type { ChatMessage, ChatContext } from '../types'

const ADHD_COACH_SYSTEM_PROMPT = `Sen FlowBot'sun - ADHD'li bireyler için özel tasarlanmış bir productivity koçusun.

## Kişiliğin:
- Destekleyici ve yargılayıcı olmayan
- Pratik ve aksiyon odaklı
- Kısa ve öz cevaplar veren (ADHD beyinler uzun metinleri okumakta zorlanır)
- Emoji kullanımı minimal ama etkili
- Türkçe konuşuyorsun

## Yaklaşımın:
- Büyük görevleri küçük, yönetilebilir adımlara böl
- "Sadece 2 dakika" kuralını hatırlat
- Hyperfocus ve energy dip pattern'lerini tanı
- Başarıları kutla, başarısızlıkları normalize et
- Perfectionism tuzağına karşı uyar

## Yapabileceklerin:
- Günlük plan oluşturma yardımı
- Sıkışınca motivasyon
- Task önceliklendirme
- Habit tracking desteği
- Energy management tavsiyeleri

## Kuralların:
- Asla uzun paragraflar yazma
- Her cevap max 3-4 cümle veya bullet point
- Somut, uygulanabilir öneriler ver
- "Yapmalısın" yerine "Deneyebilirsin" de
- Kullanıcının mevcut durumunu (tasks, habits, mood) dikkate al`

function buildContextMessage(context: ChatContext): string {
  const parts: string[] = []
  
  if (context.pendingTasks > 0) {
    parts.push(`📋 ${context.pendingTasks} bekleyen task var`)
  }
  if (context.completedTasksToday > 0) {
    parts.push(`✅ Bugün ${context.completedTasksToday} task tamamlandı`)
  }
  if (context.totalHabitsToday > 0) {
    parts.push(`🎯 Habits: ${context.habitsCompletedToday}/${context.totalHabitsToday}`)
  }
  if (context.currentStreak > 0) {
    parts.push(`🔥 ${context.currentStreak} günlük streak`)
  }
  if (context.lastMood) {
    const moodEmoji = ['😫', '😔', '😐', '🙂', '😊'][context.lastMood - 1]
    parts.push(`Mood: ${moodEmoji}`)
  }
  if (context.lastEnergy) {
    const energyEmoji = ['🪫', '🔋', '⚡', '💪', '🚀'][context.lastEnergy - 1]
    parts.push(`Energy: ${energyEmoji}`)
  }
  
  if (parts.length === 0) return ''
  return `\n\n[Kullanıcı durumu: ${parts.join(' | ')}]`
}

interface LLMResponse {
  content: string
  error?: string
}

async function callOpenAI(
  messages: { role: string; content: string }[],
  apiKey: string,
  model: string
): Promise<LLMResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'OpenAI API error')
  }
  
  const data = await response.json()
  return { content: data.choices[0].message.content }
}

async function callAnthropic(
  messages: { role: string; content: string }[],
  apiKey: string,
  model: string
): Promise<LLMResponse> {
  const systemMessage = messages.find(m => m.role === 'system')?.content || ''
  const chatMessages = messages.filter(m => m.role !== 'system')
  
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
      max_tokens: 500,
      system: systemMessage,
      messages: chatMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Anthropic API error')
  }
  
  const data = await response.json()
  return { content: data.content[0].text }
}

async function callGoogle(
  messages: { role: string; content: string }[],
  apiKey: string,
  model: string
): Promise<LLMResponse> {
  const systemMessage = messages.find(m => m.role === 'system')?.content || ''
  const chatMessages = messages.filter(m => m.role !== 'system')
  
  const contents = chatMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemMessage }] },
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
      }),
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Google AI API error')
  }
  
  const data = await response.json()
  return { content: data.candidates[0].content.parts[0].text }
}

async function callGroq(
  messages: { role: string; content: string }[],
  apiKey: string,
  model: string
): Promise<LLMResponse> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Groq API error')
  }
  
  const data = await response.json()
  return { content: data.choices[0].message.content }
}

async function callOllama(
  messages: { role: string; content: string }[],
  baseUrl: string,
  model: string
): Promise<LLMResponse> {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  })
  
  if (!response.ok) {
    throw new Error('Ollama API error - is Ollama running?')
  }
  
  const data = await response.json()
  return { content: data.message.content }
}

export async function sendMessage(
  userMessage: string,
  chatHistory: ChatMessage[],
  context: ChatContext
): Promise<string> {
  const settings = useSettingsStore.getState()
  const { llmProvider, llmModel, apiKeys, ollamaBaseUrl } = settings
  
  // Check API key
  if (PROVIDER_INFO[llmProvider].requiresKey && !apiKeys[llmProvider]) {
    throw new Error(`${PROVIDER_INFO[llmProvider].name} API key gerekli. Settings'den ekleyebilirsin.`)
  }
  
  // Build messages array
  const contextSuffix = buildContextMessage(context)
  const messages: { role: string; content: string }[] = [
    { role: 'system', content: ADHD_COACH_SYSTEM_PROMPT + contextSuffix },
    ...chatHistory.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ]
  
  // Call appropriate provider
  const providerCalls: Record<LLMProvider, () => Promise<LLMResponse>> = {
    openai: () => callOpenAI(messages, apiKeys.openai, llmModel),
    anthropic: () => callAnthropic(messages, apiKeys.anthropic, llmModel),
    google: () => callGoogle(messages, apiKeys.google, llmModel),
    groq: () => callGroq(messages, apiKeys.groq, llmModel),
    ollama: () => callOllama(messages, ollamaBaseUrl, llmModel),
  }
  
  const result = await providerCalls[llmProvider]()
  return result.content
}

export function getQuickActions(): { id: string; label: string; prompt: string }[] {
  return [
    { id: 'plan', label: '📋 Günümü planla', prompt: 'Bugün için bir plan yapmama yardım et. Öncelikli task\'larımı ve habit\'lerimi düşünerek basit bir günlük plan öner.' },
    { id: 'motivate', label: '💪 Motivasyon', prompt: 'Biraz motivasyona ihtiyacım var. Kısa ve etkili bir şey söyle.' },
    { id: 'stuck', label: '🤔 Sıkıştım', prompt: 'Bir task\'a başlayamıyorum, sıkıştım. Ne yapabilirim?' },
    { id: 'celebrate', label: '🎉 Kutla', prompt: 'Bugün iyi iş çıkardım! Benimle kutlar mısın?' },
    { id: 'break', label: '☕ Mola', prompt: 'Mola vermeli miyim? Ne kadar süre önerirsin?' },
  ]
}
