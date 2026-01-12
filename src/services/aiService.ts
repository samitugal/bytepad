// AI Service using LangChain.js
import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { HumanMessage, SystemMessage, AIMessage, ToolMessage, BaseMessage } from '@langchain/core/messages'
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { useSettingsStore } from '../stores/settingsStore'
import { useTaskStore } from '../stores/taskStore'
import { useHabitStore } from '../stores/habitStore'
import { useNoteStore } from '../stores/noteStore'
import { useJournalStore } from '../stores/journalStore'
import { useBookmarkStore } from '../stores/bookmarkStore'
import type { ChatMessage, ChatContext } from '../types'

// Build dynamic system prompt with current datetime
function buildSystemPrompt(): string {
  const now = new Date()
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
  const currentTime = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  const currentDate = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  const dayOfWeek = days[now.getDay()]
  const remainingHours = 24 - now.getHours()

  return `You are FlowBot, a productivity assistant. ALWAYS respond in Turkish.

CURRENT TIME: ${currentDate} (${dayOfWeek}), Saat: ${currentTime}, Kalan saat: ${remainingHours}

## CRITICAL RESPONSE RULES - YOU MUST FOLLOW THESE:

1. **STOP CALLING TOOLS AND RESPOND**: After you have gathered enough information (1-3 tool calls MAX), you MUST stop and write a natural Turkish response to the user. Do NOT keep calling tools indefinitely.

2. **NEVER SHOW JSON**: The user should NEVER see raw JSON, tool names, or technical output. Transform all tool results into friendly Turkish sentences.

3. **PLANNING REQUESTS**: When user asks for planning:
   - Use create_plan tool to create ONE main task with subtasks
   - Do NOT create multiple separate tasks or notes
   - Structure: Main task → subtasks for each step
   - Example: "Blog yazısı yaz" → 1 main task with subtasks like "Araştırma yap", "Taslak oluştur", "Düzenle"

4. **RESPONSE FORMAT**:
   - Start with what you did: "Planını oluşturdum! 📋"
   - List key items briefly (2-4 bullet points max)
   - End with encouragement or next step suggestion
   - Keep total response under 200 words

5. **TOOL CALL LIMIT**: Maximum 3 tool calls per user message. After 3 calls, you MUST respond with text.

## EXAMPLE GOOD RESPONSE:
User: "Yarın için blog yazısı planla"
You call: create_plan (with main task and subtasks)
Your response: "Blog yazısı planını oluşturdum! 📝

Ana görev: Blog yazısı - LLM Metamodel
Alt görevler:
• Araştırma ve kaynak toplama
• Taslak yazımı
• Son düzenleme ve yayın

Yarın 13:00'te başlamak için takvime ekledim. Başarılar! 💪"

## EXAMPLE BAD RESPONSE (NEVER DO THIS):
{"success":true,"taskId":"abc123"...} ← NEVER show this!

Context: Bekleyen: {pending}, Tamamlanan: {completed}, Habit: {habits}`
}

function buildContext(context: ChatContext): string {
  return buildSystemPrompt()
    .replace('{pending}', String(context.pendingTasks))
    .replace('{completed}', String(context.completedTasksToday))
    .replace('{habits}', String(context.habitsCompletedToday))
}

// Tavily web search helper
async function searchWithTavily(query: string, maxResults: number = 5): Promise<string> {
  const { apiKeys } = useSettingsStore.getState()
  const tavilyKey = apiKeys.tavily

  if (!tavilyKey) {
    return 'Web search is not available. Please configure Tavily API key in Settings → AI.'
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: tavilyKey,
        query,
        search_depth: 'basic',
        max_results: maxResults,
        include_answer: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Tavily] Error:', response.status, errorText)
      return `Search failed: ${response.status}`
    }

    const data = await response.json()

    // Format results
    let result = ''
    if (data.answer) {
      result += `Summary: ${data.answer}\n\n`
    }

    if (data.results?.length > 0) {
      result += 'Sources:\n'
      for (const r of data.results.slice(0, maxResults)) {
        result += `• ${r.title}: ${r.content?.substring(0, 200)}...\n  URL: ${r.url}\n`
      }
    }

    return result || 'No results found.'
  } catch (error) {
    console.error('[Tavily] Error:', error)
    return `Search error: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

const toolExecutors: Record<string, (args: Record<string, unknown>) => Promise<string>> = {
  // Task Management
  create_task: async (args) => {
    const { addTask } = useTaskStore.getState()
    const taskId = addTask({
      title: args.title as string,
      priority: args.priority as 'P1'|'P2'|'P3'|'P4',
      description: args.description as string | undefined,
      deadline: args.deadline ? new Date(args.deadline as string) : undefined,
      startTime: args.startTime as string | undefined,
      deadlineTime: args.endTime as string | undefined,
    })
    return JSON.stringify({
      success: true,
      taskId,
      title: args.title,
      priority: args.priority,
      message: `Task "${args.title}" created with priority ${args.priority}`,
    })
  },

  get_pending_tasks: async () => {
    const tasks = useTaskStore.getState().tasks.filter(t => !t.completed)
    if (tasks.length === 0) {
      return JSON.stringify({ count: 0, tasks: [], message: 'No pending tasks!' })
    }
    return JSON.stringify({
      count: tasks.length,
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        deadline: t.deadline ? new Date(t.deadline).toISOString().split('T')[0] : null,
        startTime: t.startTime || null,
      })),
      message: `${tasks.length} pending tasks`,
    })
  },

  complete_task: async (args) => {
    const { toggleTask, tasks } = useTaskStore.getState()
    const taskId = args.taskId as string
    const task = tasks.find(t => t.id === taskId)

    if (!task) {
      // Try to find by title
      const byTitle = tasks.find(t => t.title.toLowerCase().includes((args.taskId as string).toLowerCase()))
      if (byTitle) {
        toggleTask(byTitle.id)
        return JSON.stringify({
          success: true,
          taskId: byTitle.id,
          title: byTitle.title,
          message: `Task "${byTitle.title}" completed!`,
        })
      }
      return JSON.stringify({ success: false, message: 'Task not found' })
    }

    toggleTask(taskId)
    return JSON.stringify({
      success: true,
      taskId,
      title: task.title,
      message: `Task "${task.title}" completed!`,
    })
  },

  // Time-blocking
  create_time_block: async (args) => {
    const { addTask } = useTaskStore.getState()
    const taskId = addTask({
      title: args.title as string,
      priority: (args.priority as 'P1'|'P2'|'P3'|'P4') || 'P2',
      description: args.description as string | undefined,
      startTime: args.startTime as string,
      deadlineTime: args.endTime as string,
      startDate: new Date(),
      deadline: new Date(),
    })
    return JSON.stringify({
      success: true,
      taskId,
      title: args.title,
      timeBlock: `${args.startTime} - ${args.endTime}`,
      message: `Time block created: "${args.title}" from ${args.startTime} to ${args.endTime}`,
    })
  },

  get_free_time_slots: async () => {
    const tasks = useTaskStore.getState().tasks.filter(t => !t.completed && t.startTime)
    const now = new Date()
    const currentHour = now.getHours()

    // Define work hours (9:00 - 22:00)
    const workStart = 9
    const workEnd = 22

    // Get booked slots
    const bookedSlots = tasks
      .filter(t => t.startTime)
      .map(t => ({
        start: parseInt(t.startTime!.split(':')[0]),
        end: t.deadlineTime ? parseInt(t.deadlineTime.split(':')[0]) : parseInt(t.startTime!.split(':')[0]) + 1,
        title: t.title,
      }))

    // Find free slots
    const freeSlots: Array<{ start: string; end: string }> = []
    let lastEnd = Math.max(currentHour, workStart)

    const sortedBooked = bookedSlots.sort((a, b) => a.start - b.start)

    for (const slot of sortedBooked) {
      if (slot.start > lastEnd) {
        freeSlots.push({
          start: `${lastEnd.toString().padStart(2, '0')}:00`,
          end: `${slot.start.toString().padStart(2, '0')}:00`,
        })
      }
      lastEnd = Math.max(lastEnd, slot.end)
    }

    // Add remaining time until end of day
    if (lastEnd < workEnd) {
      freeSlots.push({
        start: `${lastEnd.toString().padStart(2, '0')}:00`,
        end: `${workEnd}:00`,
      })
    }

    return JSON.stringify({
      currentTime: now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      freeSlots,
      bookedSlots: sortedBooked.map(s => ({
        time: `${s.start.toString().padStart(2, '0')}:00 - ${s.end.toString().padStart(2, '0')}:00`,
        title: s.title,
      })),
      message: freeSlots.length > 0
        ? `${freeSlots.length} free time slots available`
        : 'No free time slots - schedule is packed!',
    })
  },

  // Context & Analytics
  get_productivity_stats: async () => {
    const tasks = useTaskStore.getState().tasks
    const habits = useHabitStore.getState().habits
    const today = new Date().toISOString().split('T')[0]

    const completedToday = tasks.filter(t =>
      t.completed &&
      t.completedAt &&
      new Date(t.completedAt).toISOString().split('T')[0] === today
    ).length

    const pending = tasks.filter(t => !t.completed).length
    const overdue = tasks.filter(t =>
      !t.completed &&
      t.deadline &&
      new Date(t.deadline) < new Date()
    ).length

    const habitsCompletedToday = habits.filter(h => h.completions[today]).length
    const longestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0)

    return JSON.stringify({
      tasks: {
        completedToday,
        pending,
        overdue,
        byPriority: {
          P1: tasks.filter(t => !t.completed && t.priority === 'P1').length,
          P2: tasks.filter(t => !t.completed && t.priority === 'P2').length,
          P3: tasks.filter(t => !t.completed && t.priority === 'P3').length,
          P4: tasks.filter(t => !t.completed && t.priority === 'P4').length,
        },
      },
      habits: {
        total: habits.length,
        completedToday: habitsCompletedToday,
        longestStreak,
      },
      message: `Today: ${completedToday} tasks done, ${pending} pending. ${habitsCompletedToday}/${habits.length} habits completed.`,
    })
  },

  get_upcoming_deadlines: async (args) => {
    const days = (args.days as number) || 7
    const tasks = useTaskStore.getState().tasks
    const now = new Date()
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    const upcoming = tasks.filter(t =>
      !t.completed &&
      t.deadline &&
      new Date(t.deadline) >= now &&
      new Date(t.deadline) <= futureDate
    ).sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())

    return JSON.stringify({
      count: upcoming.length,
      days,
      tasks: upcoming.map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        deadline: new Date(t.deadline!).toLocaleDateString('tr-TR'),
        daysRemaining: Math.ceil((new Date(t.deadline!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
      })),
      message: upcoming.length > 0
        ? `${upcoming.length} tasks due in the next ${days} days`
        : `No deadlines in the next ${days} days`,
    })
  },

  get_overdue_tasks: async () => {
    const tasks = useTaskStore.getState().tasks
    const now = new Date()

    const overdue = tasks.filter(t =>
      !t.completed &&
      t.deadline &&
      new Date(t.deadline) < now
    ).sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())

    return JSON.stringify({
      count: overdue.length,
      tasks: overdue.map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        deadline: new Date(t.deadline!).toLocaleDateString('tr-TR'),
        daysOverdue: Math.ceil((now.getTime() - new Date(t.deadline!).getTime()) / (24 * 60 * 60 * 1000)),
      })),
      message: overdue.length > 0
        ? `${overdue.length} overdue tasks need attention!`
        : 'No overdue tasks - great job staying on track!',
    })
  },

  // Habit Management
  create_habit: async (args) => {
    const { addHabit } = useHabitStore.getState()
    addHabit({
      name: args.name as string,
      frequency: args.frequency as 'daily' | 'weekly',
      category: args.category as string
    })
    return JSON.stringify({
      success: true,
      name: args.name,
      frequency: args.frequency,
      message: `Habit "${args.name}" created (${args.frequency})`,
    })
  },

  get_today_habits: async () => {
    const habits = useHabitStore.getState().habits
    const today = new Date().toISOString().split('T')[0]

    if (habits.length === 0) {
      return JSON.stringify({ count: 0, habits: [], message: 'No habits created yet!' })
    }

    return JSON.stringify({
      count: habits.length,
      habits: habits.map(h => ({
        id: h.id,
        name: h.name,
        completed: !!h.completions[today],
        streak: h.streak,
        category: h.category,
      })),
      completedCount: habits.filter(h => h.completions[today]).length,
      message: `${habits.filter(h => h.completions[today]).length}/${habits.length} habits completed today`,
    })
  },

  // Note Management
  create_note: async (args) => {
    const { addNote } = useNoteStore.getState()
    addNote({
      title: args.title as string,
      content: args.content as string,
      tags: (args.tags as string[]) || []
    })
    return JSON.stringify({
      success: true,
      title: args.title,
      message: `Note "${args.title}" created`,
    })
  },

  // Journal
  create_journal_entry: async (args) => {
    const { addEntry } = useJournalStore.getState()
    addEntry({
      date: new Date().toISOString().split('T')[0],
      content: args.content as string,
      mood: ((args.mood as number) || 3) as 1|2|3|4|5,
      energy: ((args.energy as number) || 3) as 1|2|3|4|5,
      tags: []
    })
    return JSON.stringify({
      success: true,
      mood: args.mood || 3,
      energy: args.energy || 3,
      message: 'Journal entry saved!',
    })
  },

  // Bookmarks
  create_bookmark: async (args) => {
    const { addBookmark } = useBookmarkStore.getState()
    addBookmark({
      url: args.url as string,
      title: args.title as string,
      description: (args.description as string) || '',
      collection: (args.collection as string) || 'Unsorted',
      tags: []
    })
    return JSON.stringify({
      success: true,
      title: args.title,
      url: args.url,
      message: `Bookmark "${args.title}" saved`,
    })
  },

  // Summary & Time
  get_daily_summary: async () => {
    const tasks = useTaskStore.getState().tasks
    const habits = useHabitStore.getState().habits
    const today = new Date().toISOString().split('T')[0]

    const pending = tasks.filter(t => !t.completed).length
    const completedToday = tasks.filter(t =>
      t.completed &&
      t.completedAt &&
      new Date(t.completedAt).toISOString().split('T')[0] === today
    ).length
    const habitsCompleted = habits.filter(h => h.completions[today]).length

    return JSON.stringify({
      pendingTasks: pending,
      completedToday,
      habitsCompleted,
      totalHabits: habits.length,
      message: `Summary: ${completedToday} tasks completed, ${pending} pending. ${habitsCompleted}/${habits.length} habits done.`,
    })
  },

  get_current_datetime: async () => {
    const now = new Date()
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
    return JSON.stringify({
      date: now.toISOString().split('T')[0],
      dateFormatted: now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      dayOfWeek: days[now.getDay()],
      hour: now.getHours(),
      minute: now.getMinutes(),
      remainingHours: 24 - now.getHours(),
      timezone: 'Europe/Istanbul',
    })
  },

  // Web Search
  search_web: async (args) => {
    const query = args.query as string
    const maxResults = (args.maxResults as number) || 5
    return await searchWithTavily(query, maxResults)
  },

  // Planning - Create task with subtasks
  create_plan: async (args) => {
    const { addTask, addSubtask } = useTaskStore.getState()
    const title = args.title as string
    const subtasks = args.subtasks as string[]
    const priority = (args.priority as 'P1'|'P2'|'P3'|'P4') || 'P1'
    const startTime = args.startTime as string | undefined
    const endTime = args.endTime as string | undefined
    const deadline = args.deadline as string | undefined

    // Create main task
    const taskId = addTask({
      title,
      priority,
      description: args.description as string | undefined,
      startTime,
      deadlineTime: endTime,
      startDate: deadline ? new Date(deadline) : new Date(),
      deadline: deadline ? new Date(deadline) : undefined,
    })

    // Add subtasks
    for (const subtaskTitle of subtasks) {
      addSubtask(taskId, subtaskTitle)
    }

    return JSON.stringify({
      success: true,
      taskId,
      title,
      subtaskCount: subtasks.length,
      subtasks,
      timeBlock: startTime && endTime ? `${startTime} - ${endTime}` : null,
      message: `Plan created: "${title}" with ${subtasks.length} subtasks`,
    })
  },

  // Add subtask to existing task
  add_subtask: async (args) => {
    const { addSubtask, tasks } = useTaskStore.getState()
    const taskId = args.taskId as string
    const subtaskTitle = args.title as string

    // Find task by ID or title
    let task = tasks.find(t => t.id === taskId)
    if (!task) {
      task = tasks.find(t => t.title.toLowerCase().includes(taskId.toLowerCase()))
    }

    if (!task) {
      return JSON.stringify({ success: false, message: 'Task not found' })
    }

    addSubtask(task.id, subtaskTitle)

    return JSON.stringify({
      success: true,
      taskId: task.id,
      taskTitle: task.title,
      subtaskTitle,
      message: `Subtask "${subtaskTitle}" added to "${task.title}"`,
    })
  },

  // Edit existing note
  edit_note: async (args) => {
    const { notes, updateNote } = useNoteStore.getState()
    const noteId = args.noteId as string
    const updates: { title?: string; content?: string; tags?: string[] } = {}

    // Find note by ID or title
    let note = notes.find(n => n.id === noteId)
    if (!note) {
      note = notes.find(n => n.title.toLowerCase().includes(noteId.toLowerCase()))
    }

    if (!note) {
      return JSON.stringify({ success: false, message: 'Note not found' })
    }

    if (args.title) updates.title = args.title as string
    if (args.content) updates.content = args.content as string
    if (args.tags) updates.tags = args.tags as string[]
    if (args.appendContent) {
      updates.content = note.content + '\n\n' + (args.appendContent as string)
    }

    updateNote(note.id, updates)

    return JSON.stringify({
      success: true,
      noteId: note.id,
      title: updates.title || note.title,
      message: `Note "${note.title}" updated`,
    })
  },

  // Get notes (for finding notes to edit)
  get_notes: async (args) => {
    const notes = useNoteStore.getState().notes
    const searchTerm = (args.search as string)?.toLowerCase()

    let filtered = notes
    if (searchTerm) {
      filtered = notes.filter(n =>
        n.title.toLowerCase().includes(searchTerm) ||
        n.content.toLowerCase().includes(searchTerm)
      )
    }

    return JSON.stringify({
      count: filtered.length,
      notes: filtered.slice(0, 10).map(n => ({
        id: n.id,
        title: n.title,
        preview: n.content.substring(0, 100),
        tags: n.tags,
      })),
      message: `Found ${filtered.length} notes`,
    })
  },

  // Get all notes with previews (for FlowBot to browse notes)
  get_all_notes: async (args) => {
    const notes = useNoteStore.getState().notes
    const sortBy = (args.sortBy as string) || 'updated'
    const limit = (args.limit as number) || 20
    const tag = args.tag as string | undefined
    const search = args.search as string | undefined

    let filtered = [...notes]

    // Filter by tag
    if (tag) {
      filtered = filtered.filter(n =>
        n.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
      )
    }

    // Search in title and content
    if (search) {
      const query = search.toLowerCase()
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    // Limit
    filtered = filtered.slice(0, limit)

    // Format response with previews
    const previews = filtered.map(n => ({
      id: n.id,
      title: n.title || 'Untitled',
      tags: n.tags,
      createdAt: new Date(n.createdAt).toISOString().split('T')[0],
      updatedAt: new Date(n.updatedAt).toISOString().split('T')[0],
      contentPreview: n.content.slice(0, 200) + (n.content.length > 200 ? '...' : ''),
      wordCount: n.content.split(/\s+/).filter(Boolean).length,
    }))

    return JSON.stringify({
      count: previews.length,
      totalNotes: notes.length,
      notes: previews,
      message: `Found ${previews.length} notes (total: ${notes.length})`,
    })
  },

  // Get full note detail by ID
  get_note_detail: async (args) => {
    const notes = useNoteStore.getState().notes
    const noteId = args.noteId as string

    // Find by ID first, then by title
    let note = notes.find(n => n.id === noteId)
    if (!note) {
      note = notes.find(n => n.title.toLowerCase().includes(noteId.toLowerCase()))
    }

    if (!note) {
      return JSON.stringify({ success: false, message: 'Note not found' })
    }

    // Find backlinks (notes that link to this one)
    const backlinks = notes
      .filter(n => n.id !== note!.id && n.content.includes(`[[${note!.title}]]`))
      .map(n => ({ id: n.id, title: n.title }))

    // Find outgoing links (notes this one links to)
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g
    const outgoingLinks: Array<{ id: string; title: string }> = []
    let match
    while ((match = wikiLinkRegex.exec(note.content)) !== null) {
      const linkedTitle = match[1]
      const linkedNote = notes.find(n => n.title.toLowerCase() === linkedTitle.toLowerCase())
      if (linkedNote) {
        outgoingLinks.push({ id: linkedNote.id, title: linkedNote.title })
      }
    }

    return JSON.stringify({
      success: true,
      id: note.id,
      title: note.title || 'Untitled',
      content: note.content,
      tags: note.tags,
      createdAt: new Date(note.createdAt).toISOString(),
      updatedAt: new Date(note.updatedAt).toISOString(),
      wordCount: note.content.split(/\s+/).filter(Boolean).length,
      characterCount: note.content.length,
      backlinks,
      outgoingLinks,
      message: `Note "${note.title}" retrieved`,
    })
  },
}

function getToolDefinitions() {
  return [
    // Task Management Tools
    tool(async (input) => toolExecutors.create_task(input), {
      name: 'create_task',
      description: 'Create a new task in the task list. Use this when the user wants to add a todo item, reminder, or action item. Always set an appropriate priority based on urgency.',
      schema: z.object({
        title: z.string().describe('Task title - be specific and actionable (e.g., "Review project proposal" not just "Work")'),
        priority: z.enum(['P1','P2','P3','P4']).describe('Priority level: P1=urgent+important (do today), P2=important (this week), P3=normal, P4=someday/low'),
        description: z.string().optional().describe('Additional context, notes, or details about the task'),
        deadline: z.string().optional().describe('Due date in YYYY-MM-DD format (e.g., "2026-01-15")'),
        startTime: z.string().optional().describe('Start time in HH:mm format for time-blocking (e.g., "14:00")'),
        endTime: z.string().optional().describe('End time in HH:mm format (e.g., "15:30")'),
      }),
    }),

    tool(async () => toolExecutors.get_pending_tasks({}), {
      name: 'get_pending_tasks',
      description: 'Get all incomplete/pending tasks from the task list. Returns tasks with their priorities and deadlines. Use this to understand what the user needs to do.',
      schema: z.object({}),
    }),

    tool(async (input) => toolExecutors.complete_task(input), {
      name: 'complete_task',
      description: 'Mark a task as completed. Use when user says they finished something. Can search by task ID or partial title match.',
      schema: z.object({
        taskId: z.string().describe('Task ID or partial title to search for (e.g., "abc123" or "review")'),
      }),
    }),

    // Time-Blocking Tools
    tool(async (input) => toolExecutors.create_time_block(input), {
      name: 'create_time_block',
      description: 'Create a time-blocked task with specific start and end times. Use this for scheduling focused work sessions, meetings, or dedicated task time.',
      schema: z.object({
        title: z.string().describe('What will be done during this time block'),
        startTime: z.string().describe('Start time in HH:mm format (e.g., "14:00")'),
        endTime: z.string().describe('End time in HH:mm format (e.g., "15:30")'),
        priority: z.enum(['P1','P2','P3','P4']).optional().describe('Priority level (defaults to P2 if not specified)'),
        description: z.string().optional().describe('Additional details about what to accomplish'),
      }),
    }),

    tool(async () => toolExecutors.get_free_time_slots({}), {
      name: 'get_free_time_slots',
      description: 'Find available time slots today based on already scheduled time blocks. Returns free periods between 9:00-22:00. Useful for planning and scheduling.',
      schema: z.object({}),
    }),

    // Context & Analytics Tools
    tool(async () => toolExecutors.get_productivity_stats({}), {
      name: 'get_productivity_stats',
      description: 'Get comprehensive productivity statistics including tasks completed today, pending tasks by priority, overdue count, and habit completion. Use for daily reviews or motivation.',
      schema: z.object({}),
    }),

    tool(async (input) => toolExecutors.get_upcoming_deadlines(input), {
      name: 'get_upcoming_deadlines',
      description: 'Get tasks with deadlines in the next N days. Use to help user plan ahead and avoid last-minute rushes.',
      schema: z.object({
        days: z.number().optional().describe('Number of days to look ahead (default: 7)'),
      }),
    }),

    tool(async () => toolExecutors.get_overdue_tasks({}), {
      name: 'get_overdue_tasks',
      description: 'Get all tasks that are past their deadline but not completed. Important for addressing backlog and reprioritizing.',
      schema: z.object({}),
    }),

    tool(async () => toolExecutors.get_daily_summary({}), {
      name: 'get_daily_summary',
      description: 'Get a quick overview of today: tasks completed, pending count, and habits done. Good for daily check-ins.',
      schema: z.object({}),
    }),

    // Time Awareness
    tool(async () => toolExecutors.get_current_datetime({}), {
      name: 'get_current_datetime',
      description: 'Get current date, time, day of week, and remaining hours today. ALWAYS use this first when user asks about time-based planning, scheduling, or "what time is it".',
      schema: z.object({}),
    }),

    // Habit Tools
    tool(async (input) => toolExecutors.create_habit(input), {
      name: 'create_habit',
      description: 'Create a new habit to track. Use when user wants to build a new routine or track recurring behaviors.',
      schema: z.object({
        name: z.string().describe('Habit name - clear and specific (e.g., "30 min exercise" not "exercise")'),
        frequency: z.enum(['daily','weekly']).describe('How often: daily or weekly'),
        category: z.string().describe('Category for grouping (e.g., "Health", "Learning", "Productivity")'),
      }),
    }),

    tool(async () => toolExecutors.get_today_habits({}), {
      name: 'get_today_habits',
      description: 'Get all habits with their completion status for today and current streaks. Shows which habits are done and which still need attention.',
      schema: z.object({}),
    }),

    // Note Tools
    tool(async (input) => toolExecutors.create_note(input), {
      name: 'create_note',
      description: 'Create a new note to save information, ideas, or references. Use when user wants to remember something that is not a task.',
      schema: z.object({
        title: z.string().describe('Note title'),
        content: z.string().describe('Note content - can be markdown formatted'),
        tags: z.array(z.string()).optional().describe('Tags for organization (e.g., ["project-x", "ideas"])'),
      }),
    }),

    // Journal Tools
    tool(async (input) => toolExecutors.create_journal_entry(input), {
      name: 'create_journal_entry',
      description: 'Create a daily journal entry with mood and energy tracking. Use for reflections, gratitude, or daily logging.',
      schema: z.object({
        content: z.string().describe('Journal entry content - what happened, thoughts, reflections'),
        mood: z.number().min(1).max(5).optional().describe('Mood rating 1-5 (1=very low, 5=great)'),
        energy: z.number().min(1).max(5).optional().describe('Energy level 1-5 (1=exhausted, 5=energized)'),
      }),
    }),

    // Bookmark Tools
    tool(async (input) => toolExecutors.create_bookmark(input), {
      name: 'create_bookmark',
      description: 'Save a URL as a bookmark for later reference. Use when user shares a link they want to save.',
      schema: z.object({
        url: z.string().describe('The URL to bookmark'),
        title: z.string().describe('Title/name for the bookmark'),
        description: z.string().optional().describe('What this link is about'),
        collection: z.string().optional().describe('Collection name (e.g., "Gold", "Silver", "Bronze", "Unsorted")'),
      }),
    }),

    // Web Search Tool
    tool(async (input) => toolExecutors.search_web(input), {
      name: 'search_web',
      description: 'Search the internet for current information. Use when user asks about news, facts, how-to guides, or anything requiring up-to-date information. Requires Tavily API key configured in settings.',
      schema: z.object({
        query: z.string().describe('Search query - be specific for better results'),
        maxResults: z.number().min(1).max(10).optional().describe('Maximum results to return (default: 5)'),
      }),
    }),

    // Planning Tool - PREFERRED for planning requests
    tool(async (input) => toolExecutors.create_plan(input), {
      name: 'create_plan',
      description: 'Create a main task with subtasks in one call. USE THIS for any planning request. Creates hierarchical task structure that appears in calendar. This is the PREFERRED tool for planning.',
      schema: z.object({
        title: z.string().describe('Main task title (e.g., "Blog yazısı: LLM Metamodel")'),
        subtasks: z.array(z.string()).describe('List of subtask titles (e.g., ["Araştırma yap", "Taslak oluştur", "Düzenle ve yayınla"])'),
        priority: z.enum(['P1','P2','P3','P4']).optional().describe('Priority (default: P1)'),
        startTime: z.string().optional().describe('Start time in HH:mm format (e.g., "13:00")'),
        endTime: z.string().optional().describe('End time in HH:mm format (e.g., "16:00")'),
        deadline: z.string().optional().describe('Date in YYYY-MM-DD format'),
        description: z.string().optional().describe('Additional notes about the plan'),
      }),
    }),

    // Add subtask to existing task
    tool(async (input) => toolExecutors.add_subtask(input), {
      name: 'add_subtask',
      description: 'Add a subtask to an existing task. Use when user wants to break down an existing task into smaller steps.',
      schema: z.object({
        taskId: z.string().describe('Task ID or partial title to find the task'),
        title: z.string().describe('Subtask title'),
      }),
    }),

    // Edit note
    tool(async (input) => toolExecutors.edit_note(input), {
      name: 'edit_note',
      description: 'Update an existing note. Can change title, content, or tags. Use appendContent to add to existing content without replacing.',
      schema: z.object({
        noteId: z.string().describe('Note ID or partial title to find the note'),
        title: z.string().optional().describe('New title (optional)'),
        content: z.string().optional().describe('New content - replaces existing (optional)'),
        appendContent: z.string().optional().describe('Content to append to existing note (optional)'),
        tags: z.array(z.string()).optional().describe('New tags (optional)'),
      }),
    }),

    // Get notes for searching
    tool(async (input) => toolExecutors.get_notes(input), {
      name: 'get_notes',
      description: 'Search and list notes. Use to find notes before editing them.',
      schema: z.object({
        search: z.string().optional().describe('Search term to filter notes by title or content'),
      }),
    }),

    // Get all notes with previews - for browsing and analyzing user's notes
    tool(async (input) => toolExecutors.get_all_notes(input), {
      name: 'get_all_notes',
      description: 'Get a list of all notes with titles, tags, dates, and content preview. Use this to browse user\'s notes, find relevant ones, or analyze their knowledge base. Returns notes sorted by last updated by default.',
      schema: z.object({
        sortBy: z.enum(['date', 'title', 'updated']).optional().describe('Sort order: "updated" (default), "date" (created), or "title"'),
        limit: z.number().optional().describe('Maximum number of notes to return (default: 20)'),
        tag: z.string().optional().describe('Filter by tag (partial match)'),
        search: z.string().optional().describe('Search in title and content'),
      }),
    }),

    // Get full note detail - for reading complete note content
    tool(async (input) => toolExecutors.get_note_detail(input), {
      name: 'get_note_detail',
      description: 'Get the full content of a specific note by ID or title. Use after get_all_notes to read a note in detail. Returns complete content, word count, backlinks, and outgoing links.',
      schema: z.object({
        noteId: z.string().describe('The note ID or partial title to search for'),
      }),
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

// Generate a friendly summary from tool results
function generateFriendlySummary(toolResults: string[]): string {
  const summaryParts: string[] = []

  for (const result of toolResults) {
    try {
      const parsed = JSON.parse(result)
      if (parsed.message) {
        // Convert English messages to Turkish-friendly format
        let msg = parsed.message
        msg = msg.replace(/Task "(.+)" created/, 'Görev "$1" oluşturuldu')
        msg = msg.replace(/Plan created: "(.+)" with (\d+) subtasks/, 'Plan oluşturuldu: "$1" - $2 alt görev')
        msg = msg.replace(/completed/, 'tamamlandı')
        msg = msg.replace(/Subtask "(.+)" added/, 'Alt görev "$1" eklendi')
        summaryParts.push(`✓ ${msg}`)
      }
    } catch {
      // Not JSON, use as-is but truncate
      if (result.length < 200 && !result.startsWith('{')) {
        summaryParts.push(result)
      }
    }
  }

  if (summaryParts.length === 0) {
    return 'İşlemler tamamlandı!'
  }

  return `İşte yaptıklarım:\n${summaryParts.join('\n')}\n\nBaşka bir şeye yardımcı olabilir miyim?`
}

export async function sendMessage(
  userMessage: string,
  chatHistory: ChatMessage[],
  context: ChatContext
): Promise<{ content: string; toolResults: string[] }> {
  const llm = getLLM()
  const tools = getToolDefinitions()
  const llmWithTools = llm.bindTools(tools)
  const messages: BaseMessage[] = convertMessages(chatHistory, buildContext(context))
  messages.push(new HumanMessage(userMessage))
  const toolResults: string[] = []

  // Reduced max iterations - force summary after 4 tool calls
  const MAX_ITERATIONS = 4
  let iterations = 0

  try {
    // Agent loop - continues until agent decides to respond (no more tool calls)
    while (iterations < MAX_ITERATIONS) {
      iterations++
      console.log(`[Agent] Iteration ${iterations}/${MAX_ITERATIONS}, sending to LLM...`)

      const response = await llmWithTools.invoke(messages)

      // Debug: log full response
      console.log('[Agent] Response:', {
        hasContent: !!response.content,
        contentLength: typeof response.content === 'string' ? response.content.length : 0,
        contentPreview: typeof response.content === 'string' ? response.content.substring(0, 200) : response.content,
        toolCallsCount: response.tool_calls?.length || 0,
      })

      // If no tool calls, agent is done - return final response
      if (!response.tool_calls?.length) {
        const content = typeof response.content === 'string' ? response.content : ''
        console.log('[Agent] No tool calls, returning final response:', content.substring(0, 100))

        // If content is empty but we have tool results, generate friendly summary
        if (!content && toolResults.length > 0) {
          console.warn('[Agent] Empty response after tool execution - generating summary')
          return {
            content: generateFriendlySummary(toolResults),
            toolResults
          }
        }

        return {
          content: content || 'Nasıl yardımcı olabilirim?',
          toolResults
        }
      }

      console.log(`[Agent] Tool calls: ${response.tool_calls.map(tc => tc.name).join(', ')}`)

      // Add assistant message with tool calls to history
      messages.push(response)

      // Execute each tool and add results to message history
      for (const toolCall of response.tool_calls) {
        const executor = toolExecutors[toolCall.name]
        let result: string

        if (executor) {
          try {
            result = await executor(toolCall.args as Record<string, unknown>)
            toolResults.push(result)
            console.log(`[Agent] Tool ${toolCall.name} executed:`, result.substring(0, 100))
          } catch (toolError) {
            result = `Error executing ${toolCall.name}: ${toolError}`
            console.error(`[Agent] Tool error:`, toolError)
          }
        } else {
          result = `Unknown tool: ${toolCall.name}`
        }

        // Add tool result as ToolMessage back to agent (required format for LangChain)
        messages.push(new ToolMessage({
          content: result,
          tool_call_id: toolCall.id || `call_${toolCall.name}_${Date.now()}`,
        }))
      }

      // If we're at iteration 3, add a prompt to encourage final response
      if (iterations === 3) {
        messages.push(new HumanMessage(
          'Sen yeterli bilgiyi topladın. Şimdi araç çağırmayı DURDUR ve kullanıcıya Türkçe doğal bir yanıt yaz. JSON gösterme.'
        ))
      }
    }

    // Max iterations reached - generate friendly summary instead of error
    console.warn('[Agent] Max iterations reached, generating summary')
    return {
      content: generateFriendlySummary(toolResults),
      toolResults
    }
  } catch (error) {
    console.error('[Agent Error]', error)
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
