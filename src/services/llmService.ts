import { useSettingsStore, PROVIDER_INFO } from '../stores/settingsStore'
import { formatToolsForOpenAI, formatToolsForAnthropic } from './toolRegistry'
import { executeToolCall, type ToolCall, type ToolResult } from './agentService'
import type { ChatMessage, ChatContext } from '../types'

// Agent response with potential tool calls
export interface AgentResponse {
  content: string
  toolCalls: ToolCall[]
  toolResults: ToolResult[]
}

const ADHD_COACH_SYSTEM_PROMPT = `Sen FlowBot'sun - ADHD'li bireyler için özel tasarlanmış bir productivity koçusun.

## Kişiliğin:
- Destekleyici ve yargılayıcı olmayan
- Pratik ve aksiyon odaklı
- Kısa ve öz cevaplar veren (ADHD beyinler uzun metinleri okumakta zorlanır)
- Emoji kullanımı minimal ama etkili
- Türkçe konuşuyorsun

## SEN BİR AGENT'SIN - AKSİYON ALABİLİRSİN!
Kullanıcı senden bir şey yapmanı istediğinde (örn: "task oluştur", "habit ekle", "not al", "web'de ara"), bunu GERÇEKTEN yapabilirsin!

## ÖNEMLİ KURALLAR:

### 1. ÖNCE BİLGİ TOPLA
- Planlama yapmadan ÖNCE mutlaka get_pending_tasks veya get_daily_summary tool'unu çağır
- Kullanıcının mevcut task'larını, habit'lerini ve durumunu öğren
- Tool sonuçlarındaki DATA kısmını DİKKATLİCE oku ve kullanıcıya DETAYLARI göster

### 2. FOLLOW-UP SORU SOR
Eksik bilgi varsa MUTLAKA sor:
- "Günümü planla" → "Bugün kaç saatin var? Hangi alana odaklanmak istiyorsun?"
- "Task ekle" (belirsiz) → "Bu task için bir deadline var mı? Öncelik seviyesi ne olsun?"
- "Ne yapmalıyım?" → Önce task'ları çek, sonra öner

### 3. DETAYLI CEVAP VER
Tool çağırdıktan sonra:
- Task isimlerini, priority'lerini ve deadline'larını AÇIKÇA yaz
- Sadece "1 task var" deme, task'ın ADI ne?
- Plan yaparken somut adımlar ve tahmini süreler ver

### 4. AKSİYON ODAKLI OL
- Büyük görevleri küçük adımlara böl
- "Sadece 2 dakika" kuralını hatırlat
- Başarıları kutla, başarısızlıkları normalize et

## BUGÜNÜN TARİHİ: ${new Date().toISOString().split('T')[0]}
- "Yarın" = ${new Date(Date.now() + 86400000).toISOString().split('T')[0]}
- Eksik bilgi varsa makul varsayılanlar kullan (priority: P2)

## ÖRNEK DAVRANIŞLAR:

### "Günümü planla" dendiğinde:
1. ÖNCE get_pending_tasks veya plan_day tool'unu çağır
2. Sonuçlardaki task isimlerini ve detaylarını oku
3. Kullanıcıya şöyle cevap ver:
   "Şu an 3 bekleyen task'ın var:
   - [P1] Proje sunumu hazırla (yarın deadline)
   - [P2] Email'leri yanıtla
   - [P3] Araştırma yap
   
   Bugün kaç saatin var? En önemli task'la başlayalım mı?"

### "Task ekle" dendiğinde (belirsiz):
"Tamam, task ekleyeceğim. Birkaç soru:
- Task'ın adı ne?
- Deadline var mı?
- Öncelik: P1 (acil), P2 (önemli), P3 (normal), P4 (düşük)?"

### Task oluşturduktan sonra:
"✅ Task eklendi: '[Task adı]' - Priority: P2, Deadline: yarın
Başka eklemek istediğin var mı?"

## Kuralların:
- Max 3-4 cümle veya bullet point
- Somut, uygulanabilir öneriler ver
- "Yapmalısın" yerine "Deneyebilirsin" de`

function buildContextMessage(context: ChatContext): string {
  const parts: string[] = []

  // Summary stats
  if (context.pendingTasks > 0) {
    parts.push(`📋 ${context.pendingTasks} bekleyen task`)
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

  let result = ''
  if (parts.length > 0) {
    result += `\n\n[Kullanıcı durumu: ${parts.join(' | ')}]`
  }

  // Add task list details
  if (context.taskList && context.taskList.length > 0) {
    result += '\n\n[MEVCUT TASK LİSTESİ - Bu bilgiyi kullanıcıya göster!]'
    context.taskList.forEach((t, i) => {
      result += `\n${i + 1}. [${t.priority}] ${t.title}${t.deadline ? ` (deadline: ${t.deadline})` : ''}`
    })
  }

  // Add habit list details
  if (context.habitList && context.habitList.length > 0) {
    const pendingHabits = context.habitList.filter(h => !h.completed)
    if (pendingHabits.length > 0) {
      result += `\n\n[BUGÜN YAPILMASI GEREKEN HABİT'LER: ${pendingHabits.map(h => h.name).join(', ')}]`
    }
  }

  return result
}

interface LLMResponse {
  content: string
  toolCalls?: ToolCall[]
  error?: string
}

// OpenAI with native function calling
async function callOpenAIWithTools(
  messages: { role: string; content: string }[],
  apiKey: string,
  model: string
): Promise<LLMResponse> {
  const tools = formatToolsForOpenAI()

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      tools,
      tool_choice: 'auto',
      max_tokens: 1000,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'OpenAI API error')
  }

  const data = await response.json()
  const message = data.choices[0].message

  // Check for tool calls
  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolCalls: ToolCall[] = message.tool_calls.map((tc: { function: { name: string; arguments: string } }) => ({
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments),
    }))
    return {
      content: message.content || '',
      toolCalls
    }
  }

  return { content: message.content || '' }
}

// Anthropic with native tool use
async function callAnthropicWithTools(
  messages: { role: string; content: string }[],
  apiKey: string,
  model: string
): Promise<LLMResponse> {
  const systemMessage = messages.find(m => m.role === 'system')?.content || ''
  const chatMessages = messages.filter(m => m.role !== 'system')
  const tools = formatToolsForAnthropic()

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
      max_tokens: 1000,
      system: systemMessage,
      tools,
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

  // Parse response - Anthropic returns content blocks
  let textContent = ''
  const toolCalls: ToolCall[] = []

  for (const block of data.content) {
    if (block.type === 'text') {
      textContent += block.text
    } else if (block.type === 'tool_use') {
      toolCalls.push({
        name: block.name,
        arguments: block.input,
      })
    }
  }

  return {
    content: textContent,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined
  }
}

// Fallback for providers without native tool support
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

// Main send message function with native tool calling support
export async function sendMessageWithTools(
  userMessage: string,
  chatHistory: ChatMessage[],
  context: ChatContext
): Promise<AgentResponse> {
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

  // Use native tool calling for OpenAI and Anthropic
  let result: LLMResponse

  if (llmProvider === 'openai') {
    result = await callOpenAIWithTools(messages, apiKeys.openai, llmModel)
  } else if (llmProvider === 'anthropic') {
    result = await callAnthropicWithTools(messages, apiKeys.anthropic, llmModel)
  } else {
    // Fallback for other providers (no native tool support)
    const providerCalls: Record<string, () => Promise<LLMResponse>> = {
      google: () => callGoogle(messages, apiKeys.google, llmModel),
      groq: () => callGroq(messages, apiKeys.groq, llmModel),
      ollama: () => callOllama(messages, ollamaBaseUrl, llmModel),
    }
    result = await providerCalls[llmProvider]()
  }

  // Execute tool calls if present
  const toolResults: ToolResult[] = []
  if (result.toolCalls && result.toolCalls.length > 0) {
    for (const toolCall of result.toolCalls) {
      const toolResult = await executeToolCall(toolCall)
      toolResults.push(toolResult)
    }

    // If we executed tools but have no content, get a follow-up response
    if (!result.content && toolResults.length > 0) {
      // Build rich tool results summary including DATA
      const toolResultsSummary = toolResults
        .map(r => {
          let summary = `${r.success ? 'Başarılı' : 'Hata'}: ${r.message}`
          // Include data details for LLM to use
          if (r.data && typeof r.data === 'object') {
            const data = r.data as Record<string, unknown>
            // For plan_day, include task details
            if (data.suggestedTasks && Array.isArray(data.suggestedTasks)) {
              const tasks = data.suggestedTasks as Array<{title: string; priority: string; deadline?: string}>
              if (tasks.length > 0) {
                summary += '\n\nÖncelikli Task\'lar:'
                tasks.forEach((t, i) => {
                  summary += `\n${i + 1}. [${t.priority}] ${t.title}${t.deadline ? ` (deadline: ${t.deadline})` : ''}`
                })
              }
            }
            // For get_pending_tasks, include task list
            if (Array.isArray(r.data)) {
              const tasks = r.data as Array<{title: string; priority: string; deadline?: string | null}>
              if (tasks.length > 0) {
                summary += '\n\nBekleyen Task\'lar:'
                tasks.forEach((t, i) => {
                  summary += `\n${i + 1}. [${t.priority}] ${t.title}${t.deadline ? ` (deadline: ${t.deadline})` : ''}`
                })
              }
            }
            // For habits
            if (data.habits && typeof data.habits === 'object') {
              const habits = data.habits as {total: number; completed: number; pending: string[]}
              if (habits.pending && habits.pending.length > 0) {
                summary += `\n\nBekleyen Habit'ler: ${habits.pending.join(', ')}`
              }
            }
          }
          return summary
        })
        .join('\n\n')

      // Add tool results to messages and get a natural response
      const followUpMessages = [
        ...messages,
        { role: 'assistant', content: `[Tool çağrıları yapıldı]\n\n${toolResultsSummary}` },
        { role: 'user', content: 'Yukarıdaki tool sonuçlarını kullanarak bana DETAYLI bir cevap ver. Task isimlerini, priority\'lerini göster. Eğer planlama yapıyorsan, follow-up soru sor (kaç saatin var? hangi alana odaklanmak istiyorsun?).' },
      ]

      try {
        let followUpResult: LLMResponse
        if (llmProvider === 'openai') {
          followUpResult = await callOpenAI(followUpMessages, apiKeys.openai, llmModel)
        } else if (llmProvider === 'anthropic') {
          followUpResult = await callAnthropic(followUpMessages, apiKeys.anthropic, llmModel)
        } else {
          const providerCalls: Record<string, () => Promise<LLMResponse>> = {
            google: () => callGoogle(followUpMessages, apiKeys.google, llmModel),
            groq: () => callGroq(followUpMessages, apiKeys.groq, llmModel),
            ollama: () => callOllama(followUpMessages, ollamaBaseUrl, llmModel),
          }
          followUpResult = await providerCalls[llmProvider]()
        }
        result.content = followUpResult.content
      } catch {
        // If follow-up fails, generate a simple response based on tool results
        result.content = generateSimpleResponse(toolResults)
      }
    }
  }

  return {
    content: result.content,
    toolCalls: result.toolCalls || [],
    toolResults,
  }
}

// Generate a simple response when LLM follow-up fails
function generateSimpleResponse(toolResults: ToolResult[]): string {
  const successCount = toolResults.filter(r => r.success).length
  const totalCount = toolResults.length

  if (totalCount === 0) return ''

  if (successCount === totalCount) {
    if (totalCount === 1) {
      const result = toolResults[0]
      // Generate contextual responses based on tool type
      if (result.message.includes('plan created') || result.message.includes('Day plan')) {
        return `Günün için bir plan hazırladım! 📋 ${result.message.split(':').slice(1).join(':').trim() || ''}`
      }
      if (result.message.includes('Task') && result.message.includes('created')) {
        return `Tamam, task'ı ekledim! ✅ Başka bir şey var mı?`
      }
      if (result.message.includes('Found') && result.message.includes('results')) {
        return `Arama sonuçlarını buldum! 🔍 İstersen bunları bookmark'lara kaydedebilirim.`
      }
      if (result.message.includes('bookmark') || result.message.includes('Bookmark')) {
        return `Bookmark'ları kaydettim! 📚 Bookmarks modülünden görebilirsin.`
      }
      return `Tamam, hallettim! ✅`
    }
    return `${totalCount} işlem başarıyla tamamlandı! ✅`
  }

  return `${successCount}/${totalCount} işlem tamamlandı.`
}

// Legacy function for backward compatibility
export async function sendMessage(
  userMessage: string,
  chatHistory: ChatMessage[],
  context: ChatContext
): Promise<string> {
  const response = await sendMessageWithTools(userMessage, chatHistory, context)

  // If there were tool calls, append results to content
  if (response.toolResults.length > 0) {
    const resultSummary = response.toolResults
      .map(r => `${r.success ? '✓' : '✗'} ${r.message}`)
      .join('\n')

    return response.content
      ? `${response.content}\n\n---\n${resultSummary}`
      : resultSummary
  }

  return response.content
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
