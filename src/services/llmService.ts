import { useSettingsStore, PROVIDER_INFO } from '../stores/settingsStore'
import { formatToolsForOpenAI, formatToolsForAnthropic } from './toolRegistry'
import { executeToolCall, type ToolCall, type ToolResult } from './agentService'
import type { ChatMessage, ChatContext } from '../types'

// Debug mode - set to true for development
const DEBUG_MODE = true

function debugLog(label: string, data: unknown) {
  if (DEBUG_MODE) {
    console.log(`[FlowBot Debug] ${label}:`, data)
  }
}

// Agent response with potential tool calls
export interface AgentResponse {
  content: string
  toolCalls: ToolCall[]
  toolResults: ToolResult[]
}

const ADHD_COACH_SYSTEM_PROMPT = `You are FlowBot - an ADHD-friendly productivity coach. Respond in Turkish, keep it short.

## YOUR IDENTITY
- Supportive, non-judgmental
- Action-oriented - you CAN actually create tasks/habits/notes
- Max 3-4 sentences or bullet points

## CRITICAL RULES

1. **PLANNING WITH TOPIC → CREATE NEW TASKS**
   When user says "X konusunda çalışmak istiyorum" or "X öğrenmek istiyorum, günümü planla":
   - DO NOT just list existing tasks
   - CREATE 3-5 new tasks using create_task tool for the topic they mentioned
   - Break down the topic into small, actionable steps (ADHD-friendly: 25-45 min each)
   - Example: "Prompt engineering öğrenmek istiyorum" →
     * create_task: "Prompt engineering nedir? - Temel kavramları araştır" (P2, 30 dk)
     * create_task: "OpenAI prompt best practices dökümanını oku" (P2, 45 dk)
     * create_task: "3 farklı prompt tekniği dene (zero-shot, few-shot, chain-of-thought)" (P2, 45 dk)
     * create_task: "Öğrendiklerini not al ve özet çıkar" (P3, 30 dk)

2. **SIMPLE PLANNING → SHOW EXISTING**
   - "Günümü planla" (without topic) → plan_day tool to show existing tasks
   - "Ne yapmalıyım?" → get_pending_tasks

3. **TASK REQUEST**
   - Clear request: Call create_task immediately (default P2)
   - Unclear: Ask "Task adı ne?" (What's the task name?)

4. **INFO REQUEST**
   - "Tasks", "ne var" → get_pending_tasks
   - "Habits" → get_today_habits
   - "Summary" → get_daily_summary

## DATES
- Today: ${new Date().toISOString().split('T')[0]}
- Tomorrow: ${new Date(Date.now() + 86400000).toISOString().split('T')[0]}
- Default priority: P2

## DON'T
- Write long paragraphs
- Start with "Of course!", "Sure!"
- Just list existing tasks when user wants to learn something new`

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
  const isGPT5 = model.startsWith('gpt-5')

  // GPT-5 uses Responses API, others use Chat Completions API
  if (isGPT5) {
    return callOpenAIResponsesAPI(messages, apiKey, model, tools)
  }

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
      parallel_tool_calls: true,
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

// GPT-5 uses the new Responses API
async function callOpenAIResponsesAPI(
  messages: { role: string; content: string }[],
  apiKey: string,
  model: string,
  tools: ReturnType<typeof formatToolsForOpenAI>
): Promise<LLMResponse> {
  // Convert messages to Responses API format
  const systemMessage = messages.find(m => m.role === 'system')?.content || ''
  const chatMessages = messages.filter(m => m.role !== 'system')
  
  // Build input array for Responses API
  const input = chatMessages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      instructions: systemMessage,
      input,
      tools: tools.map(t => ({
        type: 'function',
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters,
      })),
      tool_choice: 'auto',
      max_output_tokens: 1000,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    debugLog('GPT-5 API Error', error)
    throw new Error(error.error?.message || 'OpenAI Responses API error')
  }

  let data = await response.json()
  debugLog('GPT-5 Initial Response', { id: data.id, status: data.status })

  // Poll for completion if status is incomplete (GPT-5 reasoning takes time)
  const maxPolls = 30 // Max 30 seconds
  let pollCount = 0
  while (data.status === 'incomplete' && pollCount < maxPolls) {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    pollCount++
    
    const pollResponse = await fetch(`https://api.openai.com/v1/responses/${data.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })
    
    if (pollResponse.ok) {
      data = await pollResponse.json()
      debugLog('GPT-5 Poll', { poll: pollCount, status: data.status })
    } else {
      break
    }
  }

  debugLog('GPT-5 Final Response', { status: data.status, outputLength: data.output?.length })

  // Parse Responses API output - handle various response structures
  let textContent = ''
  const toolCalls: ToolCall[] = []

  // Check for output array (standard response)
  if (data.output && Array.isArray(data.output)) {
    for (const item of data.output) {
      // Text message
      if (item.type === 'message' && item.content) {
        for (const block of item.content) {
          if (block.type === 'output_text' || block.type === 'text') {
            textContent += block.text
          }
        }
      }
      // Function/tool call
      if (item.type === 'function_call') {
        toolCalls.push({
          name: item.name,
          arguments: typeof item.arguments === 'string' ? JSON.parse(item.arguments) : item.arguments,
        })
      }
    }
  }

  // Check for output_text directly in response (alternative format)
  if (data.output_text) {
    textContent = data.output_text
  }

  // Check for tool_calls array (alternative format)
  if (data.tool_calls && Array.isArray(data.tool_calls)) {
    for (const tc of data.tool_calls) {
      toolCalls.push({
        name: tc.function?.name || tc.name,
        arguments: typeof tc.function?.arguments === 'string' 
          ? JSON.parse(tc.function.arguments) 
          : (tc.arguments || tc.function?.arguments || {}),
      })
    }
  }

  // If status is incomplete or no content, check for partial results
  if (data.status === 'incomplete' && !textContent && toolCalls.length === 0) {
    debugLog('GPT-5 Incomplete Response', { status: data.status, output: data.output })
    // Try to extract any available content
    if (data.output?.[0]?.content?.[0]?.text) {
      textContent = data.output[0].content[0].text
    }
  }

  return {
    content: textContent,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
  }
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
  // GPT-5 uses max_completion_tokens and doesn't support custom temperature
  const isGPT5 = model.startsWith('gpt-5')
  const tokenParam = isGPT5 ? { max_completion_tokens: 500 } : { max_tokens: 500 }
  const tempParam = isGPT5 ? {} : { temperature: 0.7 }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      ...tokenParam,
      ...tempParam,
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

  debugLog('User Message', userMessage)
  debugLog('Context', context)
  debugLog('Provider', { llmProvider, llmModel })

  // Check API key
  if (PROVIDER_INFO[llmProvider].requiresKey && !apiKeys[llmProvider]) {
    throw new Error(`${PROVIDER_INFO[llmProvider].name} API key gerekli. Settings → AI bölümünden ekleyebilirsin.`)
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

  debugLog('System Prompt Length', ADHD_COACH_SYSTEM_PROMPT.length + contextSuffix.length)

  // Use native tool calling for OpenAI and Anthropic
  let result: LLMResponse

  try {
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
  } catch (error) {
    debugLog('LLM API Error', error)
    throw error
  }

  debugLog('LLM Response', { content: result.content?.slice(0, 100), toolCalls: result.toolCalls })

  // Execute tool calls if present
  const toolResults: ToolResult[] = []
  if (result.toolCalls && result.toolCalls.length > 0) {
    for (const toolCall of result.toolCalls) {
      debugLog('Executing Tool', toolCall.name)
      const toolResult = await executeToolCall(toolCall)
      toolResults.push(toolResult)
      debugLog('Tool Result', { name: toolCall.name, success: toolResult.success, message: toolResult.message.slice(0, 100) })
    }

    // If we executed tools but have no content OR content is too short, get a follow-up response
    const needsFollowUp = !result.content || result.content.trim().length < 20

    if (needsFollowUp && toolResults.length > 0) {
      debugLog('Needs Follow-up', true)

      // Build rich tool results summary - use the message directly since we enriched it
      const toolResultsSummary = toolResults
        .map(r => r.message)
        .join('\n\n---\n\n')

      // More directive follow-up prompt
      const followUpMessages = [
        ...messages,
        { role: 'assistant', content: `[Tool sonuçları]\n\n${toolResultsSummary}` },
        { role: 'user', content: `Respond briefly in Turkish using the tool results.

RULES:
1. Use tool message details (task names, priorities, deadlines) AS-IS
2. Don't rewrite the formatted list - just add important notes
3. Max 2-3 sentences of commentary
4. If "plan" was requested: Ask "Bugün kaç saatin var?" (How many hours do you have today?)
5. Use emojis sparingly

DON'T:
- Write long paragraphs
- Modify tool data
- Start with "Tabii ki!" or "Elbette!"` },
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
        debugLog('Follow-up Response', followUpResult.content?.slice(0, 100))
        result.content = followUpResult.content
      } catch (followUpError) {
        debugLog('Follow-up Error', followUpError)
        // If follow-up fails, use the tool result messages directly
        result.content = toolResults.map(r => r.message).join('\n\n')
      }
    }
  }

  // If still no content, generate from tool results
  if (!result.content && toolResults.length > 0) {
    result.content = generateSimpleResponse(toolResults)
  }

  debugLog('Final Response', result.content?.slice(0, 100))

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

// Streaming version of sendMessageWithTools
export async function sendMessageStreaming(
  userMessage: string,
  chatHistory: ChatMessage[],
  context: ChatContext,
  onChunk: (chunk: string) => void,
  onToolCall?: (toolName: string, result: string) => void
): Promise<AgentResponse> {
  const settings = useSettingsStore.getState()
  const { llmProvider, llmModel, apiKeys } = settings

  // Only OpenAI supports streaming with tools currently
  if (llmProvider !== 'openai') {
    // Fallback to non-streaming
    const result = await sendMessageWithTools(userMessage, chatHistory, context)
    onChunk(result.content)
    return result
  }

  const contextSuffix = buildContextMessage(context)
  const messages: { role: string; content: string }[] = [
    { role: 'system', content: ADHD_COACH_SYSTEM_PROMPT + contextSuffix },
    ...chatHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const tools = formatToolsForOpenAI()

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKeys.openai}`,
    },
    body: JSON.stringify({
      model: llmModel,
      messages,
      tools,
      tool_choice: 'auto',
      stream: true,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'OpenAI API error')
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let fullContent = ''
  const toolCalls: ToolCall[] = []
  const toolCallsInProgress: Map<number, { name: string; arguments: string }> = new Map()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

    for (const line of lines) {
      const data = line.slice(6)
      if (data === '[DONE]') continue

      try {
        const parsed = JSON.parse(data)
        const delta = parsed.choices?.[0]?.delta

        // Handle text content
        if (delta?.content) {
          fullContent += delta.content
          onChunk(delta.content)
        }

        // Handle tool calls
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index
            if (!toolCallsInProgress.has(idx)) {
              toolCallsInProgress.set(idx, { name: '', arguments: '' })
            }
            const current = toolCallsInProgress.get(idx)!
            if (tc.function?.name) current.name = tc.function.name
            if (tc.function?.arguments) current.arguments += tc.function.arguments
          }
        }
      } catch {
        // Skip invalid JSON
      }
    }
  }

  // Process completed tool calls
  const toolResults: ToolResult[] = []
  for (const [, tc] of toolCallsInProgress) {
    if (tc.name) {
      try {
        const args = tc.arguments ? JSON.parse(tc.arguments) : {}
        toolCalls.push({ name: tc.name, arguments: args })
        const result = await executeToolCall({ name: tc.name, arguments: args })
        toolResults.push(result)
        if (onToolCall) onToolCall(tc.name, result.message)
      } catch (e) {
        debugLog('Tool call error', e)
      }
    }
  }

  // If we have tool results but no content, generate follow-up
  if (toolResults.length > 0 && !fullContent.trim()) {
    const toolSummary = toolResults.map(r => r.message).join('\n')
    onChunk(toolSummary)
    fullContent = toolSummary
  }

  return { content: fullContent, toolCalls, toolResults }
}
