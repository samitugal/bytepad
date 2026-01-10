import { useSettingsStore, PROVIDER_INFO, LLMProvider } from '../stores/settingsStore'
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

## Yaklaşımın:
- Büyük görevleri küçük, yönetilebilir adımlara böl
- "Sadece 2 dakika" kuralını hatırlat
- Hyperfocus ve energy dip pattern'lerini tanı
- Başarıları kutla, başarısızlıkları normalize et
- Perfectionism tuzağına karşı uyar

## SEN BİR AGENT'SIN - AKSİYON ALABİLİRSİN!
Kullanıcı senden bir şey yapmanı istediğinde (örn: "task oluştur", "habit ekle", "not al", "web'de ara"), bunu GERÇEKTEN yapabilirsin!
Tool'ları kullanarak task oluşturabilir, habit takip edebilir, not alabilir, web'de arama yapabilir ve bookmark ekleyebilirsin.

ÖNEMLİ:
- Bugünün tarihi: ${new Date().toISOString().split('T')[0]}
- "Yarın" dediğinde tarihe +1 gün ekle
- Eksik bilgi varsa makul varsayılanlar kullan (örn: priority P2)
- Tool kullandıktan sonra kullanıcıya ne yaptığını kısaca açıkla
- Web araması için web_search tool'unu kullan
- Bulunan kaynakları kaydetmek için create_bookmark veya save_search_results_as_bookmarks kullan

## Kuralların:
- Asla uzun paragraflar yazma
- Her cevap max 3-4 cümle veya bullet point
- Somut, uygulanabilir öneriler ver
- "Yapmalısın" yerine "Deneyebilirsin" de
- Kullanıcının mevcut durumunu (tasks, habits, mood) dikkate al

## Özel Komutlar:
- /plan veya "günümü planla" → plan_day tool'unu kullan
- /find <query> veya "... hakkında kaynak bul" → web_search tool'unu kullan
- /quick <title> veya "hızlı task: ..." → create_task tool'unu kullan`

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
  }

  return {
    content: result.content,
    toolCalls: result.toolCalls || [],
    toolResults,
  }
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
