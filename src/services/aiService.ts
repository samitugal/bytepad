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

const SYSTEM_PROMPT = `Sen FlowBot, ADHD-friendly productivity kocusun. Turkce konus.
Kurallar: Kisa cevaplar ver, emoji kullan, task/habit icin tool kullan.`

function buildContext(context: ChatContext): string {
  return SYSTEM_PROMPT + ` Bekleyen: ${context.pendingTasks}, Tamamlanan: ${context.completedTasksToday}`
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
    return `Task olusturuldu: "${args.title}" [${args.priority}]`
  },
  get_pending_tasks: async () => {
    const tasks = useTaskStore.getState().tasks.filter(t => !t.completed)
    if (tasks.length === 0) return 'Bekleyen task yok!'
    return `Bekleyen tasklar:\n${tasks.map(t => `[${t.priority}] ${t.title}`).join('\n')}`
  },
  create_habit: async (args) => {
    const { addHabit } = useHabitStore.getState()
    addHabit({ name: args.name as string, frequency: args.frequency as 'daily'|'weekly', category: args.category as string })
    return `Habit olusturuldu: "${args.name}"`
  },
  get_today_habits: async () => {
    const habits = useHabitStore.getState().habits
    if (habits.length === 0) return 'Henuz habit yok!'
    return `Habitler:\n${habits.map(h => `${h.name} (streak: ${h.streak})`).join('\n')}`
  },
  create_note: async (args) => {
    const { addNote } = useNoteStore.getState()
    addNote({ title: args.title as string, content: args.content as string, tags: (args.tags as string[]) || [] })
    return `Not olusturuldu: "${args.title}"`
  },
  create_journal_entry: async (args) => {
    const { addEntry } = useJournalStore.getState()
    addEntry({ date: new Date().toISOString().split('T')[0], content: args.content as string, mood: ((args.mood as number) || 3) as 1|2|3|4|5, energy: ((args.energy as number) || 3) as 1|2|3|4|5, tags: [] })
    return `Gunluk girisi kaydedildi!`
  },
  create_bookmark: async (args) => {
    const { addBookmark } = useBookmarkStore.getState()
    addBookmark({ url: args.url as string, title: args.title as string, description: (args.description as string) || '', collection: (args.collection as string) || 'Unsorted', tags: [] })
    return `Bookmark kaydedildi: "${args.title}"`
  },
  get_daily_summary: async () => {
    const tasks = useTaskStore.getState().tasks
    const habits = useHabitStore.getState().habits
    const pending = tasks.filter(t => !t.completed).length
    return `Ozet: ${pending} bekleyen task, ${habits.length} habit`
  },
}

function getToolDefinitions() {
  return [
    tool(async (input) => toolExecutors.create_task(input), { name: 'create_task', description: 'Yeni task olustur', schema: z.object({ title: z.string(), priority: z.enum(['P1','P2','P3','P4']), description: z.string().optional(), deadline: z.string().optional() }) }),
    tool(async () => toolExecutors.get_pending_tasks({}), { name: 'get_pending_tasks', description: 'Bekleyen tasklari listele', schema: z.object({}) }),
    tool(async (input) => toolExecutors.create_habit(input), { name: 'create_habit', description: 'Yeni habit olustur', schema: z.object({ name: z.string(), frequency: z.enum(['daily','weekly']), category: z.string() }) }),
    tool(async () => toolExecutors.get_today_habits({}), { name: 'get_today_habits', description: 'Bugunku habitleri listele', schema: z.object({}) }),
    tool(async (input) => toolExecutors.create_note(input), { name: 'create_note', description: 'Yeni not olustur', schema: z.object({ title: z.string(), content: z.string(), tags: z.array(z.string()).optional() }) }),
    tool(async (input) => toolExecutors.create_journal_entry(input), { name: 'create_journal_entry', description: 'Gunluk girisi olustur', schema: z.object({ content: z.string(), mood: z.number().optional(), energy: z.number().optional() }) }),
    tool(async (input) => toolExecutors.create_bookmark(input), { name: 'create_bookmark', description: 'Yeni bookmark olustur', schema: z.object({ url: z.string(), title: z.string(), description: z.string().optional(), collection: z.string().optional() }) }),
    tool(async () => toolExecutors.get_daily_summary({}), { name: 'get_daily_summary', description: 'Gunluk ozet al', schema: z.object({}) }),
  ]
}

function getLLM() {
  const { llmProvider, llmModel, apiKeys } = useSettingsStore.getState()
  if (llmProvider === 'anthropic') {
    return new ChatAnthropic({ anthropicApiKey: apiKeys.anthropic, modelName: llmModel, maxTokens: 1000 })
  }
  return new ChatOpenAI({ openAIApiKey: apiKeys.openai, modelName: llmModel || 'gpt-4o-mini', temperature: 0.7, maxTokens: 1000 })
}

function convertMessages(history: ChatMessage[], system: string): BaseMessage[] {
  const msgs: BaseMessage[] = [new SystemMessage(system)]
  for (const m of history.slice(-10)) {
    msgs.push(m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content))
  }
  return msgs
}

export async function sendMessage(userMessage: string, chatHistory: ChatMessage[], context: ChatContext): Promise<{ content: string; toolResults: string[] }> {
  const llm = getLLM()
  const tools = getToolDefinitions()
  const llmWithTools = llm.bindTools(tools)
  const messages = convertMessages(chatHistory, buildContext(context))
  messages.push(new HumanMessage(userMessage))
  const toolResults: string[] = []
  
  try {
    const response = await llmWithTools.invoke(messages)
    if (response.tool_calls?.length) {
      for (const tc of response.tool_calls) {
        const executor = toolExecutors[tc.name]
        if (executor) {
          const result = await executor(tc.args as Record<string, unknown>)
          toolResults.push(result)
        }
      }
      if (toolResults.length) {
        return { content: toolResults.join('\n'), toolResults }
      }
    }
    return { content: typeof response.content === 'string' ? response.content : 'Islem tamamlandi!', toolResults }
  } catch (error) {
    console.error('[AI Service Error]', error)
    throw error
  }
}

export interface QuickAction { id: string; label: string; prompt: string }
export function getQuickActions(): QuickAction[] {
  return [
    { id: 'plan', label: 'Gunumu planla', prompt: 'Bugun icin plan yap' },
    { id: 'motivate', label: 'Motivasyon', prompt: 'Motivasyon ver' },
    { id: 'stuck', label: 'Sikistim', prompt: 'Sikistim, yardim et' },
  ]
}
