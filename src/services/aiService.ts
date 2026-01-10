// AI Service using LangChain.js
import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from '@langchain/core/messages'
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { useSettingsStore } from '../stores/settingsStore'
import { useTaskStore } from '../stores/taskStore'
import { useHabitStore } from '../stores/habitStore'
import { useNoteStore } from '../stores/noteStore'
import { useJournalStore } from '../stores/journalStore'
import { useBookmarkStore } from '../stores/bookmarkStore'
import type { ChatMessage, ChatContext } from '../types'

const SYSTEM_PROMPT = `Sen FlowBot, ADHD-friendly productivity koçusun. Türkçe konuş.
Kurallar: Kısa cevaplar ver, emoji kullan, task/habit için tool kullan.
Context: Bekleyen: {pending}, Tamamlanan: {completed}, Habitler: {habits}`

function buildContext(context: ChatContext): string {
  return SYSTEM_PROMPT
    .replace('{pending}', String(context.pendingTasks))
    .replace('{completed}', String(context.completedTasksToday))
    .replace('{habits}', String(context.habitsCompletedToday))
}

const toolExecutors: Record<string, (args: Record<string, unknown>) => Promise<string>> = {
  create_task: async (args) => {
    const { addTask } = useTaskStore.getState()
    addTask({ 
      title: args.title as string, 
      priority: args.priority as 'P1'|'P2'|'P3'|'P4',
      description: args.description as string | undefined,
      deadline: args.deadline ? new Date(args.deadline as string) : undefined,
    })
    return `✅ Task oluşturuldu: "${args.title}" [${args.priority}]`
  },
  get_pending_tasks: async () => {
    const tasks = useTaskStore.getState().tasks.filter(t => !t.completed)
    if (tasks.length === 0) return '📋 Bekleyen task yok!'
    return `📋 Bekleyen tasklar:\n${tasks.map(t => `• [${t.priority}] ${t.title}`).join('\n')}`
  },
  create_habit: async (args) => {
    const { addHabit } = useHabitStore.getState()
    addHabit({ 
      name: args.name as string, 
      frequency: args.frequency as 'daily' | 'weekly', 
      category: args.category as string 
    })
    return `🎯 Habit oluşturuldu: "${args.name}"`
  },
  get_today_habits: async () => {
    const habits = useHabitStore.getState().habits
    if (habits.length === 0) return '🎯 Henüz habit yok!'
    return `🎯 Habitler:\n${habits.map(h => `⬜ ${h.name} (🔥${h.streak})`).join('\n')}`
  },
  create_note: async (args) => {
    const { addNote } = useNoteStore.getState()
    addNote({ 
      title: args.title as string, 
      content: args.content as string, 
      tags: (args.tags as string[]) || [] 
    })
    return `📝 Not oluşturuldu: "${args.title}"`
  },
  create_journal_entry: async (args) => {
    const { addEntry } = useJournalStore.getState()
    addEntry({ 
      date: new Date().toISOString().split('T')[0], 
      content: args.content as string, 
      mood: ((args.mood as number) || 3) as 1|2|3|4|5, 
      energy: ((args.energy as number) || 3) as 1|2|3|4|5, 
      tags: [] 
    })
    return `📖 Günlük girişi kaydedildi!`
  },
  create_bookmark: async (args) => {
    const { addBookmark } = useBookmarkStore.getState()
    addBookmark({ 
      url: args.url as string, 
      title: args.title as string, 
      description: (args.description as string) || '', 
      collection: (args.collection as string) || 'Unsorted', 
      tags: [] 
    })
    return `🔖 Bookmark kaydedildi: "${args.title}"`
  },
  get_daily_summary: async () => {
    const tasks = useTaskStore.getState().tasks
    const habits = useHabitStore.getState().habits
    const pending = tasks.filter(t => !t.completed).length
    return `📊 Özet: ${pending} bekleyen task, ${habits.length} habit`
  },
  get_current_datetime: async () => {
    const now = new Date()
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
    return JSON.stringify({
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      dayOfWeek: days[now.getDay()],
      hour: now.getHours(),
      remainingHours: 24 - now.getHours(),
    })
  },
}

function getToolDefinitions() {
  return [
    tool(async (input) => toolExecutors.create_task(input), {
      name: 'create_task',
      description: 'Yeni task oluştur',
      schema: z.object({ 
        title: z.string(), 
        priority: z.enum(['P1','P2','P3','P4']),
        description: z.string().optional(),
        deadline: z.string().optional(),
      }),
    }),
    tool(async () => toolExecutors.get_pending_tasks({}), {
      name: 'get_pending_tasks',
      description: 'Bekleyen taskları listele',
      schema: z.object({}),
    }),
    tool(async (input) => toolExecutors.create_habit(input), {
      name: 'create_habit',
      description: 'Yeni habit oluştur',
      schema: z.object({ 
        name: z.string(), 
        frequency: z.enum(['daily','weekly']),
        category: z.string(),
      }),
    }),
    tool(async () => toolExecutors.get_today_habits({}), {
      name: 'get_today_habits',
      description: 'Bugünkü habitleri listele',
      schema: z.object({}),
    }),
    tool(async (input) => toolExecutors.create_note(input), {
      name: 'create_note',
      description: 'Yeni not oluştur',
      schema: z.object({ 
        title: z.string(), 
        content: z.string(),
        tags: z.array(z.string()).optional(),
      }),
    }),
    tool(async (input) => toolExecutors.create_journal_entry(input), {
      name: 'create_journal_entry',
      description: 'Günlük girişi oluştur',
      schema: z.object({ 
        content: z.string(),
        mood: z.number().optional(),
        energy: z.number().optional(),
      }),
    }),
    tool(async (input) => toolExecutors.create_bookmark(input), {
      name: 'create_bookmark',
      description: 'Yeni bookmark oluştur',
      schema: z.object({ 
        url: z.string(), 
        title: z.string(),
        description: z.string().optional(),
        collection: z.string().optional(),
      }),
    }),
    tool(async () => toolExecutors.get_daily_summary({}), {
      name: 'get_daily_summary',
      description: 'Get daily productivity summary with pending tasks and habits count',
      schema: z.object({}),
    }),
    tool(async () => toolExecutors.get_current_datetime({}), {
      name: 'get_current_datetime',
      description: 'Get current date, time, day of week, and remaining hours in the day. Use this when user asks about time-based planning or scheduling.',
      schema: z.object({}),
    }),
  ]
}

function getLLM() {
  const { llmProvider, llmModel, apiKeys } = useSettingsStore.getState()
  const apiKey = apiKeys[llmProvider]
  
  console.log('[AI Service] Provider:', llmProvider, 'Model:', llmModel, 'API Key exists:', !!apiKey, 'Key length:', apiKey?.length)
  
  if (!apiKey) {
    throw new Error(`API key for ${llmProvider} is not configured. Please set it in Settings → AI.`)
  }
  
  if (llmProvider === 'anthropic') {
    return new ChatAnthropic({ 
      anthropicApiKey: apiKey, 
      model: llmModel,
      maxTokens: 1000 
    })
  }
  
  // OpenAI - GPT-5 doesn't support temperature parameter
  const isGPT5 = llmModel?.startsWith('gpt-5')
  
  return new ChatOpenAI({ 
    apiKey: apiKey,
    model: llmModel || 'gpt-4o-mini', 
    ...(isGPT5 ? {} : { temperature: 0.7 }),
    maxTokens: 1000 
  })
}

function convertMessages(history: ChatMessage[], system: string): BaseMessage[] {
  const msgs: BaseMessage[] = [new SystemMessage(system)]
  for (const m of history.slice(-10)) {
    msgs.push(m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content))
  }
  return msgs
}

export async function sendMessage(
  userMessage: string,
  chatHistory: ChatMessage[],
  context: ChatContext
): Promise<{ content: string; toolResults: string[] }> {
  const llm = getLLM()
  const tools = getToolDefinitions()
  const llmWithTools = llm.bindTools(tools)
  const messages = convertMessages(chatHistory, buildContext(context))
  messages.push(new HumanMessage(userMessage))
  const toolResults: string[] = []
  
  try {
    console.log('[AI Service] Sending message to LLM...')
    const response = await llmWithTools.invoke(messages)
    console.log('[AI Service] Response received, tool_calls:', response.tool_calls?.length || 0)
    
    // Handle tool calls
    if (response.tool_calls?.length) {
      for (const tc of response.tool_calls) {
        console.log('[AI Service] Executing tool:', tc.name)
        const executor = toolExecutors[tc.name]
        if (executor) {
          try {
            const result = await executor(tc.args as Record<string, unknown>)
            toolResults.push(result)
          } catch (toolError) {
            console.error('[AI Service] Tool error:', tc.name, toolError)
            toolResults.push(`❌ Error in ${tc.name}`)
          }
        }
      }
      
      // After tool execution, get a natural language response
      if (toolResults.length) {
        console.log('[AI Service] Getting follow-up response after tools...')
        try {
          const followUpMessages = [
            ...messages,
            new AIMessage({ content: '', tool_calls: response.tool_calls }),
            new HumanMessage(`Tool results:\n${toolResults.join('\n')}\n\nPlease summarize what was done in a friendly, brief way in Turkish.`)
          ]
          const followUp = await llm.invoke(followUpMessages)
          const followUpContent = typeof followUp.content === 'string' ? followUp.content : ''
          console.log('[AI Service] Follow-up response received')
          return { 
            content: followUpContent || toolResults.join('\n'), 
            toolResults 
          }
        } catch (followUpError) {
          console.error('[AI Service] Follow-up error:', followUpError)
          return { content: toolResults.join('\n'), toolResults }
        }
      }
    }
    
    // No tool calls - return direct response
    const content = typeof response.content === 'string' ? response.content : ''
    if (!content) {
      console.warn('[AI Service] Empty response from LLM')
      return { content: 'Bir sorun oluştu, tekrar dener misin?', toolResults }
    }
    
    return { content, toolResults }
  } catch (error) {
    console.error('[AI Service Error]', error)
    throw error
  }
}

export interface QuickAction { id: string; label: string; prompt: string }
export function getQuickActions(): QuickAction[] {
  return [
    { id: 'plan', label: '📋 Günümü planla', prompt: 'Bugün için plan yap' },
    { id: 'motivate', label: '💪 Motivasyon', prompt: 'Motivasyon ver' },
    { id: 'stuck', label: '🤔 Sıkıştım', prompt: 'Sıkıştım, yardım et' },
  ]
}
