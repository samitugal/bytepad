// FlowBot Agent Service - Executes tools based on LLM responses

import { useTaskStore } from '../stores/taskStore'
import { useHabitStore } from '../stores/habitStore'
import { useNoteStore } from '../stores/noteStore'
import { useJournalStore } from '../stores/journalStore'
import { useBookmarkStore } from '../stores/bookmarkStore'
import { useSettingsStore } from '../stores/settingsStore'

export interface ToolCall {
  name: string
  arguments: Record<string, unknown>
}

export interface ToolResult {
  success: boolean
  message: string
  data?: unknown
}

// Parse tool calls from LLM response (for providers without native tool support)
export function parseToolCallsFromText(text: string): ToolCall[] {
  const toolCalls: ToolCall[] = []

  // Pattern: [TOOL: tool_name | param1=value1 | param2=value2]
  const toolPattern = /\[TOOL:\s*(\w+)\s*(?:\|([^\]]+))?\]/g
  let match

  while ((match = toolPattern.exec(text)) !== null) {
    const toolName = match[1]
    const paramsStr = match[2] || ''

    const args: Record<string, unknown> = {}
    if (paramsStr) {
      const params = paramsStr.split('|').map(p => p.trim())
      for (const param of params) {
        const [key, ...valueParts] = param.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim()
          // Try to parse as JSON for arrays/objects, otherwise use as string
          try {
            args[key.trim()] = JSON.parse(value)
          } catch {
            args[key.trim()] = value
          }
        }
      }
    }

    toolCalls.push({ name: toolName, arguments: args })
  }

  return toolCalls
}

// Execute a single tool call
export async function executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
  const { name, arguments: args } = toolCall

  try {
    switch (name) {
      // ============ TASK OPERATIONS ============
      case 'create_task': {
        const taskStore = useTaskStore.getState()
        const deadline = args.deadline ? new Date(args.deadline as string) : undefined
        const id = taskStore.addTask({
          title: args.title as string,
          priority: (args.priority as 'P1' | 'P2' | 'P3' | 'P4') || 'P2',
          description: args.description as string | undefined,
          deadline,
          deadlineTime: args.deadlineTime as string | undefined,
        })
        return {
          success: true,
          message: `Task "${args.title}" created with priority ${args.priority || 'P2'}${deadline ? ` (deadline: ${args.deadline})` : ''}`,
          data: { id, title: args.title },
        }
      }

      case 'update_task': {
        const taskStore = useTaskStore.getState()
        const task = taskStore.tasks.find(t => t.id === args.taskId)
        if (!task) {
          return { success: false, message: `Task not found with ID: ${args.taskId}` }
        }

        const updates: Partial<typeof task> = {}
        if (args.title) updates.title = args.title as string
        if (args.priority) updates.priority = args.priority as 'P1' | 'P2' | 'P3' | 'P4'
        if (args.description) updates.description = args.description as string
        if (args.deadline) updates.deadline = new Date(args.deadline as string)

        taskStore.updateTask(args.taskId as string, updates)
        return {
          success: true,
          message: `Task "${task.title}" updated`,
          data: { id: task.id, updates },
        }
      }

      case 'toggle_task': {
        const taskStore = useTaskStore.getState()
        const task = taskStore.tasks.find(t => t.id === args.taskId)
        if (!task) {
          return { success: false, message: `Task not found with ID: ${args.taskId}` }
        }
        taskStore.toggleTask(args.taskId as string)
        const newStatus = !task.completed ? 'completed' : 'reopened'
        return {
          success: true,
          message: `Task "${task.title}" ${newStatus}!`,
          data: { id: task.id, completed: !task.completed },
        }
      }

      case 'delete_task': {
        const taskStore = useTaskStore.getState()
        const task = taskStore.tasks.find(t => t.id === args.taskId)
        if (!task) {
          return { success: false, message: `Task not found with ID: ${args.taskId}` }
        }
        taskStore.deleteTask(args.taskId as string)
        return {
          success: true,
          message: `Task "${task.title}" deleted`,
          data: { id: task.id },
        }
      }

      case 'get_pending_tasks': {
        const tasks = useTaskStore.getState().tasks.filter(t => !t.completed)
        const formatted = tasks.map(t => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          deadline: t.deadline ? new Date(t.deadline).toISOString().split('T')[0] : null,
        }))
        return {
          success: true,
          message: `${tasks.length} pending task${tasks.length !== 1 ? 's' : ''}`,
          data: formatted,
        }
      }

      case 'get_tasks_by_priority': {
        const tasks = useTaskStore.getState().tasks.filter(
          t => !t.completed && t.priority === args.priority
        )
        return {
          success: true,
          message: `${tasks.length} ${args.priority} task${tasks.length !== 1 ? 's' : ''}`,
          data: tasks.map(t => ({ id: t.id, title: t.title, deadline: t.deadline })),
        }
      }

      // ============ HABIT OPERATIONS ============
      case 'create_habit': {
        const habitStore = useHabitStore.getState()
        const id = habitStore.addHabit({
          name: args.name as string,
          frequency: (args.frequency as 'daily' | 'weekly') || 'daily',
          category: (args.category as string) || 'personal',
        })
        return {
          success: true,
          message: `Habit "${args.name}" created (${args.frequency || 'daily'})`,
          data: { id, name: args.name },
        }
      }

      case 'toggle_habit_today': {
        const habitStore = useHabitStore.getState()
        const habit = habitStore.habits.find(h => h.id === args.habitId)
        if (!habit) {
          return { success: false, message: `Habit not found with ID: ${args.habitId}` }
        }
        const today = new Date().toISOString().split('T')[0]
        const wasCompleted = habit.completions[today]
        habitStore.toggleCompletion(args.habitId as string, today)
        return {
          success: true,
          message: `Habit "${habit.name}" ${wasCompleted ? 'unchecked' : 'checked'} for today!`,
          data: { id: habit.id, completed: !wasCompleted },
        }
      }

      case 'get_today_habits': {
        const habits = useHabitStore.getState().habits
        const today = new Date().toISOString().split('T')[0]
        const formatted = habits.map(h => ({
          id: h.id,
          name: h.name,
          completedToday: !!h.completions[today],
          streak: h.streak,
          category: h.category,
        }))
        const completed = formatted.filter(h => h.completedToday).length
        return {
          success: true,
          message: `${completed}/${habits.length} habits completed today`,
          data: formatted,
        }
      }

      case 'get_habit_streaks': {
        const habits = useHabitStore.getState().habits
          .map(h => ({ id: h.id, name: h.name, streak: h.streak }))
          .sort((a, b) => b.streak - a.streak)
        return {
          success: true,
          message: `Top streaks: ${habits.slice(0, 3).map(h => `${h.name}(${h.streak})`).join(', ')}`,
          data: habits,
        }
      }

      // ============ NOTE OPERATIONS ============
      case 'create_note': {
        const noteStore = useNoteStore.getState()
        const id = noteStore.addNote({
          title: args.title as string,
          content: args.content as string,
          tags: (args.tags as string[]) || [],
        })
        return {
          success: true,
          message: `Note "${args.title}" created`,
          data: { id, title: args.title },
        }
      }

      case 'search_notes': {
        const notes = useNoteStore.getState().notes
        const query = (args.query as string).toLowerCase()
        const matches = notes.filter(n =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query)
        )
        return {
          success: true,
          message: `Found ${matches.length} note${matches.length !== 1 ? 's' : ''} matching "${args.query}"`,
          data: matches.map(n => ({ id: n.id, title: n.title, preview: n.content.slice(0, 100) })),
        }
      }

      // ============ JOURNAL OPERATIONS ============
      case 'create_journal_entry': {
        const journalStore = useJournalStore.getState()
        const today = new Date().toISOString().split('T')[0]
        const existing = journalStore.entries.find(e => e.date === today)

        if (existing) {
          journalStore.updateEntry(existing.id, {
            content: args.content as string,
            mood: args.mood as 1 | 2 | 3 | 4 | 5 | undefined,
            energy: args.energy as 1 | 2 | 3 | 4 | 5 | undefined,
            tags: args.tags as string[] | undefined,
          })
          return {
            success: true,
            message: `Today's journal entry updated`,
            data: { id: existing.id, date: today },
          }
        } else {
          const id = journalStore.addEntry({
            date: today,
            content: args.content as string,
            mood: (args.mood as number) || 3,
            energy: (args.energy as number) || 3,
            tags: (args.tags as string[]) || [],
          })
          return {
            success: true,
            message: `Journal entry created for today`,
            data: { id, date: today },
          }
        }
      }

      case 'get_recent_journal': {
        const journalStore = useJournalStore.getState()
        const days = (args.days as number) || 7
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - days)

        const recent = journalStore.entries
          .filter(e => new Date(e.date) >= cutoff)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        return {
          success: true,
          message: `${recent.length} journal entries from last ${days} days`,
          data: recent.map(e => ({
            date: e.date,
            mood: e.mood,
            energy: e.energy,
            preview: e.content.slice(0, 100),
          })),
        }
      }

      // ============ SUMMARY OPERATIONS ============
      case 'get_daily_summary': {
        const tasks = useTaskStore.getState().tasks
        const habits = useHabitStore.getState().habits
        const today = new Date().toISOString().split('T')[0]

        const pendingTasks = tasks.filter(t => !t.completed)
        const completedToday = tasks.filter(t =>
          t.completed && t.completedAt &&
          new Date(t.completedAt).toISOString().split('T')[0] === today
        )
        const habitsCompletedToday = habits.filter(h => h.completions[today])

        const summary = {
          pendingTasks: pendingTasks.length,
          completedToday: completedToday.length,
          habitsTotal: habits.length,
          habitsCompleted: habitsCompletedToday.length,
          topPriorityTasks: pendingTasks
            .filter(t => t.priority === 'P1' || t.priority === 'P2')
            .map(t => t.title)
            .slice(0, 3),
        }

        return {
          success: true,
          message: `Today: ${completedToday.length} tasks done, ${habitsCompletedToday.length}/${habits.length} habits`,
          data: summary,
        }
      }

      case 'get_weekly_summary': {
        const tasks = useTaskStore.getState().tasks
        const habits = useHabitStore.getState().habits

        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)

        const completedThisWeek = tasks.filter(t =>
          t.completed && t.completedAt && new Date(t.completedAt) >= weekAgo
        )

        const summary = {
          tasksCompletedThisWeek: completedThisWeek.length,
          pendingTasks: tasks.filter(t => !t.completed).length,
          totalHabits: habits.length,
          topStreaks: habits
            .map(h => ({ name: h.name, streak: h.streak }))
            .sort((a, b) => b.streak - a.streak)
            .slice(0, 3),
        }

        return {
          success: true,
          message: `This week: ${completedThisWeek.length} tasks completed`,
          data: summary,
        }
      }

      // ============ PLANNING OPERATIONS ============
      case 'plan_day': {
        const taskStore = useTaskStore.getState()
        const habitStore = useHabitStore.getState()
        const journalStore = useJournalStore.getState()
        const pendingTasks = taskStore.tasks.filter(t => !t.completed)
        const today = new Date().toISOString().split('T')[0]

        // Get P1 and P2 tasks first
        const priorityTasks = pendingTasks
          .filter(t => t.priority === 'P1' || t.priority === 'P2')
          .slice(0, 5)

        // Get today's habits
        const todayHabits = habitStore.habits.filter(h => h.frequency === 'daily')
        const completedHabits = todayHabits.filter(h => h.completions[today])

        // Get today's mood/energy from journal
        const todayEntry = journalStore.entries.find(e => e.date === today)

        // Suggest a day plan based on available time and energy
        const availableHours = (args.availableHours as number) || 8
        const focusArea = args.focus as string | undefined
        const energyLevel = todayEntry?.energy || 3

        // Adjust recommendations based on energy
        let taskRecommendation = ''
        if (energyLevel <= 2) {
          taskRecommendation = 'Düşük enerji - hafif işlerle başla, P1 taskları öğleden sonraya bırak'
        } else if (energyLevel >= 4) {
          taskRecommendation = 'Yüksek enerji - P1 taskları şimdi halletmek için ideal zaman!'
        } else {
          taskRecommendation = 'Normal enerji - önce en önemli 2 task, sonra molalar'
        }

        const plan = {
          focusArea: focusArea || 'General productivity',
          energyLevel,
          taskRecommendation,
          suggestedTasks: priorityTasks.map(t => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            deadline: t.deadline ? new Date(t.deadline).toISOString().split('T')[0] : null,
          })),
          habits: {
            total: todayHabits.length,
            completed: completedHabits.length,
            pending: todayHabits.filter(h => !h.completions[today]).map(h => h.name),
          },
          totalPending: pendingTasks.length,
          message: `Focus on ${priorityTasks.length} high-priority tasks today. You have ${availableHours} hours available.`,
        }

        return {
          success: true,
          message: `Day plan created: ${priorityTasks.length} priority tasks, ${todayHabits.length - completedHabits.length} habits remaining`,
          data: plan,
        }
      }

      // ============ BOOKMARK OPERATIONS ============
      case 'create_bookmark': {
        const bookmarkStore = useBookmarkStore.getState()
        const id = bookmarkStore.addBookmark({
          url: args.url as string,
          title: args.title as string,
          description: args.description as string | undefined,
          collection: (args.collection as string) || 'Unsorted',
          tags: (args.tags as string[]) || [],
        })
        return {
          success: true,
          message: `Bookmark "${args.title}" saved to ${args.collection || 'Unsorted'}`,
          data: { id, url: args.url, title: args.title },
        }
      }

      case 'search_bookmarks': {
        const bookmarks = useBookmarkStore.getState().bookmarks
        const query = (args.query as string).toLowerCase()
        const matches = bookmarks.filter(b =>
          b.title.toLowerCase().includes(query) ||
          b.url.toLowerCase().includes(query) ||
          b.description?.toLowerCase().includes(query) ||
          b.tags.some(t => t.toLowerCase().includes(query))
        )
        return {
          success: true,
          message: `Found ${matches.length} bookmark${matches.length !== 1 ? 's' : ''} matching "${args.query}"`,
          data: matches.slice(0, 10).map(b => ({
            id: b.id,
            title: b.title,
            url: b.url,
            collection: b.collection,
          })),
        }
      }

      case 'list_bookmarks': {
        const bookmarkStore = useBookmarkStore.getState()
        let bookmarks = bookmarkStore.bookmarks

        if (args.collection) {
          bookmarks = bookmarks.filter(b => b.collection === args.collection)
        }

        const limit = (args.limit as number) || 10
        return {
          success: true,
          message: `${bookmarks.length} bookmark${bookmarks.length !== 1 ? 's' : ''}${args.collection ? ` in ${args.collection}` : ''}`,
          data: bookmarks.slice(0, limit).map(b => ({
            id: b.id,
            title: b.title,
            url: b.url,
            collection: b.collection,
          })),
        }
      }

      // ============ WEB SEARCH OPERATIONS ============
      case 'web_search': {
        const settings = useSettingsStore.getState()
        const tavilyKey = settings.apiKeys.tavily

        if (!tavilyKey) {
          return {
            success: false,
            message: 'Web search requires Tavily API key. Please add it in Settings → AI Coach → Tavily API Key',
          }
        }

        try {
          const numResults = Math.min((args.numResults as number) || 5, 10)
          const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: tavilyKey,
              query: args.query as string,
              search_depth: 'basic',
              max_results: numResults,
              include_answer: true,
            }),
          })

          if (!response.ok) {
            throw new Error('Tavily API error')
          }

          const data = await response.json()
          const results = data.results?.map((r: { url: string; title: string; content: string }) => ({
            url: r.url,
            title: r.title,
            description: r.content?.slice(0, 200),
          })) || []

          return {
            success: true,
            message: `Found ${results.length} results for "${args.query}"`,
            data: {
              answer: data.answer,
              results,
            },
          }
        } catch (error) {
          return {
            success: false,
            message: `Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          }
        }
      }

      case 'save_search_results_as_bookmarks': {
        const bookmarkStore = useBookmarkStore.getState()
        const results = args.results as Array<{ url: string; title: string; description?: string }>
        const collection = (args.collection as string) || 'Unsorted'
        const tags = (args.tags as string[]) || []

        const savedIds: string[] = []
        for (const result of results) {
          const id = bookmarkStore.addBookmark({
            url: result.url,
            title: result.title,
            description: result.description,
            collection,
            tags,
          })
          savedIds.push(id)
        }

        return {
          success: true,
          message: `Saved ${savedIds.length} bookmarks to ${collection}`,
          data: { savedCount: savedIds.length, collection },
        }
      }

      default:
        return {
          success: false,
          message: `Unknown tool: ${name}`,
        }
    }
  } catch (error) {
    return {
      success: false,
      message: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

// Execute multiple tool calls and return results
export async function executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
  const results: ToolResult[] = []

  for (const toolCall of toolCalls) {
    const result = await executeToolCall(toolCall)
    results.push(result)
  }

  return results
}

// Format tool results for display in chat
export function formatToolResultsForDisplay(results: ToolResult[]): string {
  return results
    .map(r => `${r.success ? '[OK]' : '[ERR]'} ${r.message}`)
    .join('\n')
}

// Format tool results for feeding back to LLM
export function formatToolResultsForLLM(results: ToolResult[]): string {
  return results
    .map(r => {
      let text = `Tool Result: ${r.message}`
      if (r.data) {
        text += `\nData: ${JSON.stringify(r.data, null, 2)}`
      }
      return text
    })
    .join('\n\n')
}
