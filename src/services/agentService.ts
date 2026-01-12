// FlowBot Agent Service - Executes tools based on LLM responses

import { useTaskStore } from '../stores/taskStore'
import { useHabitStore } from '../stores/habitStore'
import { useNoteStore } from '../stores/noteStore'
import { useJournalStore } from '../stores/journalStore'
import { useBookmarkStore } from '../stores/bookmarkStore'
import { useSettingsStore } from '../stores/settingsStore'
import { formatScheduleForChat, getTaskRecommendations, predictStreakRisk } from './smartSchedulingService'
import { suggestTagsForNote, suggestTagsForBookmark, suggestTagsForContent, formatTagSuggestions } from './autoTaggingService'

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
        const tags = (args.tags as string[]) || []
        const id = taskStore.addTask({
          title: args.title as string,
          priority: (args.priority as 'P1' | 'P2' | 'P3' | 'P4') || 'P2',
          description: args.description as string | undefined,
          deadline,
          deadlineTime: args.deadlineTime as string | undefined,
          tags,
        })
        let message = `Task "${args.title}" created with priority ${args.priority || 'P2'}`
        if (deadline) message += ` (deadline: ${args.deadline})`
        if (tags.length > 0) message += ` [tags: ${tags.map(t => `#${t}`).join(' ')}]`
        return {
          success: true,
          message,
          data: { id, title: args.title, tags },
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
        // Sort by priority
        const sortedTasks = [...tasks].sort((a, b) => {
          const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        })

        const formatted = sortedTasks.map(t => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          deadline: t.deadline ? new Date(t.deadline).toISOString().split('T')[0] : null,
        }))

        // Build rich message
        let message = ''
        if (tasks.length === 0) {
          message = '✅ Bekleyen task yok - tüm işler tamamlandı!'
        } else {
          message = `📋 **${tasks.length} Bekleyen Task:**\n`
          sortedTasks.slice(0, 10).forEach((t, i) => {
            const deadline = t.deadline ? new Date(t.deadline).toLocaleDateString('tr-TR') : null
            message += `${i + 1}. [${t.priority}] ${t.title}${deadline ? ` (${deadline})` : ''}\n`
          })
          if (tasks.length > 10) {
            message += `\n_+${tasks.length - 10} task daha..._`
          }
        }

        return {
          success: true,
          message,
          data: formatted,
        }
      }

      case 'get_tasks_by_priority': {
        const tasks = useTaskStore.getState().tasks.filter(
          t => !t.completed && t.priority === args.priority
        )
        // Build detailed message with task names
        let message = `${tasks.length} ${args.priority} task${tasks.length !== 1 ? 's' : ''}`
        if (tasks.length > 0) {
          const taskList = tasks.slice(0, 5).map(t => {
            const deadline = t.deadline ? ` (${new Date(t.deadline).toLocaleDateString()})` : ''
            return `${t.title}${deadline}`
          }).join('\n• ')
          message += `:\n• ${taskList}`
          if (tasks.length > 5) {
            message += `\n... and ${tasks.length - 5} more`
          }
        }
        return {
          success: true,
          message,
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
        const completed = formatted.filter(h => h.completedToday)
        const pending = formatted.filter(h => !h.completedToday)

        // Build detailed message
        let message = `**Bugünkü Habit'ler:** ${completed.length}/${habits.length} tamamlandı\n`
        if (pending.length > 0) {
          message += `\n**Bekleyen:**\n`
          pending.forEach(h => {
            const streakInfo = h.streak > 0 ? ` (🔥 ${h.streak} gün)` : ''
            message += `• [ ] ${h.name}${streakInfo}\n`
          })
        }
        if (completed.length > 0) {
          message += `\n**Tamamlanan:**\n`
          completed.forEach(h => {
            message += `• [✓] ${h.name} (🔥 ${h.streak} gün)\n`
          })
        }

        return {
          success: true,
          message,
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
          const moodVal = Math.min(5, Math.max(1, (args.mood as number) || 3)) as 1 | 2 | 3 | 4 | 5
          const energyVal = Math.min(5, Math.max(1, (args.energy as number) || 3)) as 1 | 2 | 3 | 4 | 5
          const id = journalStore.addEntry({
            date: today,
            content: args.content as string,
            mood: moodVal,
            energy: energyVal,
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
        const pendingHabits = habits.filter(h => !h.completions[today])

        const priorityTasks = pendingTasks.filter(t => t.priority === 'P1' || t.priority === 'P2')

        // Build rich message
        let message = '📊 **Günlük Özet**\n\n'

        // Task summary
        message += `**Task'lar:**\n`
        message += `• Bugün tamamlanan: ${completedToday.length}\n`
        message += `• Bekleyen: ${pendingTasks.length}\n`

        if (priorityTasks.length > 0) {
          message += `\n**Öncelikli Task'lar (${priorityTasks.length}):**\n`
          priorityTasks.slice(0, 5).forEach((t, i) => {
            message += `${i + 1}. [${t.priority}] ${t.title}\n`
          })
        }

        // Habit summary
        message += `\n**Habit'ler:** ${habitsCompletedToday.length}/${habits.length} tamamlandı\n`
        if (pendingHabits.length > 0 && pendingHabits.length <= 5) {
          message += `Bekleyenler: ${pendingHabits.map(h => h.name).join(', ')}\n`
        }

        const summary = {
          pendingTasks: pendingTasks.length,
          completedToday: completedToday.length,
          habitsTotal: habits.length,
          habitsCompleted: habitsCompletedToday.length,
          topPriorityTasks: priorityTasks.map(t => ({ title: t.title, priority: t.priority })).slice(0, 5),
          pendingHabits: pendingHabits.map(h => h.name),
        }

        return {
          success: true,
          message,
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
        const pendingTasks = tasks.filter(t => !t.completed)
        const topStreaks = habits
          .map(h => ({ name: h.name, streak: h.streak }))
          .sort((a, b) => b.streak - a.streak)
          .slice(0, 5)

        // Build detailed message
        let message = `**Haftalık Özet**\n\n`
        message += `📋 **Task'lar:** ${completedThisWeek.length} bu hafta tamamlandı, ${pendingTasks.length} bekliyor\n`
        message += `✅ **Habit'ler:** ${habits.length} toplam\n`

        if (topStreaks.length > 0 && topStreaks[0].streak > 0) {
          message += `\n**En İyi Streak'ler:**\n`
          topStreaks.filter(h => h.streak > 0).forEach(h => {
            message += `• 🔥 ${h.name}: ${h.streak} gün\n`
          })
        }

        if (completedThisWeek.length > 0) {
          message += `\n**Bu Hafta Tamamlanan:**\n`
          completedThisWeek.slice(0, 5).forEach(t => {
            message += `• ✓ ${t.title}\n`
          })
          if (completedThisWeek.length > 5) {
            message += `• ... ve ${completedThisWeek.length - 5} tane daha\n`
          }
        }

        const summary = {
          tasksCompletedThisWeek: completedThisWeek.length,
          pendingTasks: pendingTasks.length,
          totalHabits: habits.length,
          topStreaks,
          completedTasks: completedThisWeek.slice(0, 10).map(t => t.title),
        }

        return {
          success: true,
          message,
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

        // Get P1 and P2 tasks first (sorted by priority and deadline)
        const priorityTasks = pendingTasks
          .filter(t => t.priority === 'P1' || t.priority === 'P2')
          .sort((a, b) => {
            // P1 before P2
            if (a.priority !== b.priority) return a.priority < b.priority ? -1 : 1
            // Earlier deadline first
            if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
            if (a.deadline) return -1
            return 1
          })
          .slice(0, 5)

        // Get today's habits
        const todayHabits = habitStore.habits.filter(h => h.frequency === 'daily')
        const completedHabits = todayHabits.filter(h => h.completions[today])
        const pendingHabits = todayHabits.filter(h => !h.completions[today])

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

        // Build rich message for LLM
        let message = `📋 **Günlük Plan Özeti** (${availableHours} saat)\n\n`

        if (priorityTasks.length > 0) {
          message += '**Öncelikli Task\'lar:**\n'
          priorityTasks.forEach((t, i) => {
            const deadline = t.deadline ? new Date(t.deadline).toLocaleDateString('tr-TR') : null
            message += `${i + 1}. [${t.priority}] ${t.title}${deadline ? ` (deadline: ${deadline})` : ''}\n`
          })
        } else {
          message += '✅ Öncelikli task yok - harika!\n'
        }

        if (pendingTasks.length > priorityTasks.length) {
          const otherTasks = pendingTasks.length - priorityTasks.length
          message += `\n_+${otherTasks} düşük öncelikli task daha var_\n`
        }

        if (pendingHabits.length > 0) {
          message += `\n**Bugünkü Habit'ler (${completedHabits.length}/${todayHabits.length}):**\n`
          message += `Bekleyenler: ${pendingHabits.map(h => h.name).join(', ')}\n`
        } else if (todayHabits.length > 0) {
          message += `\n✅ Tüm habit'ler tamamlandı! (${todayHabits.length}/${todayHabits.length})\n`
        }

        message += `\n💡 **Öneri:** ${taskRecommendation}`

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
            pending: pendingHabits.map(h => h.name),
          },
          totalPending: pendingTasks.length,
        }

        return {
          success: true,
          message,
          data: plan,
        }
      }

      case 'smart_schedule': {
        const scheduleText = formatScheduleForChat()
        return {
          success: true,
          message: scheduleText,
          data: { type: 'smart_schedule' },
        }
      }

      case 'get_next_task': {
        const recommendation = getTaskRecommendations()
        if (!recommendation.nextTask) {
          return {
            success: true,
            message: 'No pending tasks! You\'re all caught up. 🎉',
            data: null,
          }
        }
        return {
          success: true,
          message: `**Recommended Task:** ${recommendation.nextTask.title}\n_${recommendation.reason}_`,
          data: recommendation,
        }
      }

      case 'check_streak_risk': {
        const risk = predictStreakRisk()
        if (risk.atRiskHabits.length === 0) {
          return {
            success: true,
            message: 'All habits are on track! No streak risks detected. ✅',
            data: risk,
          }
        }
        let message = '**⚠️ Streak Risk Alert:**\n'
        risk.atRiskHabits.forEach(h => {
          const icon = h.risk === 'high' ? '🔴' : '🟡'
          message += `${icon} ${h.reason}\n`
        })
        return {
          success: true,
          message,
          data: risk,
        }
      }

      // ============ AUTO-TAGGING OPERATIONS ============
      case 'suggest_tags_for_note': {
        const noteId = args.noteId as string
        if (!noteId) {
          return { success: false, message: 'Note ID required' }
        }
        const suggestions = suggestTagsForNote(noteId)
        return {
          success: true,
          message: formatTagSuggestions(suggestions),
          data: suggestions,
        }
      }

      case 'suggest_tags_for_bookmark': {
        const bookmarkId = args.bookmarkId as string
        if (!bookmarkId) {
          return { success: false, message: 'Bookmark ID required' }
        }
        const suggestions = suggestTagsForBookmark(bookmarkId)
        return {
          success: true,
          message: formatTagSuggestions(suggestions),
          data: suggestions,
        }
      }

      case 'suggest_tags': {
        const content = args.content as string || ''
        const title = args.title as string || ''
        if (!content && !title) {
          return { success: false, message: 'Content or title required' }
        }
        const suggestions = suggestTagsForContent(content, title)
        return {
          success: true,
          message: formatTagSuggestions(suggestions),
          data: suggestions,
        }
      }

      // ============ BOOKMARK OPERATIONS ============
      case 'create_bookmark': {
        const bookmarkStore = useBookmarkStore.getState()
        const linkedTaskId = args.linkedTaskId as string | undefined
        const sourceQuery = args.sourceQuery as string | undefined
        
        const id = bookmarkStore.addBookmark({
          url: args.url as string,
          title: args.title as string,
          description: args.description as string | undefined,
          collection: (args.collection as string) || 'Unsorted',
          tags: (args.tags as string[]) || [],
          linkedTaskId,
          sourceQuery,
        })
        
        // Build response message with link info
        let message = `Bookmark "${args.title}" saved to ${args.collection || 'Unsorted'}`
        if (linkedTaskId) {
          const taskStore = useTaskStore.getState()
          const linkedTask = taskStore.tasks.find(t => t.id === linkedTaskId)
          if (linkedTask) {
            message += ` (linked to task: "${linkedTask.title}")`
          }
        }
        
        return {
          success: true,
          message,
          data: { id, url: args.url, title: args.title, linkedTaskId, sourceQuery },
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

      // ============ RESEARCH & PLANNING ============
      case 'research_and_plan': {
        const taskStore = useTaskStore.getState()
        const bookmarkStore = useBookmarkStore.getState()
        
        const topic = args.topic as string
        const taskTitle = args.taskTitle as string
        const subtasks = (args.subtasks as string[]) || []
        const resources = args.resources as Array<{ url: string; title: string; description?: string }> || []
        const tags = (args.tags as string[]) || [topic.toLowerCase().replace(/\s+/g, '-')]
        const priority = (args.priority as 'P1' | 'P2' | 'P3' | 'P4') || 'P2'
        const finalTags = [...tags, 'research']
        
        // 1. Create main task with tags
        const taskId = taskStore.addTask({
          title: taskTitle,
          priority,
          description: `Research plan for: ${topic}\n\nResources: ${resources.length} bookmarks linked`,
          tags: finalTags,
        })
        
        // Add subtasks
        for (const subtask of subtasks) {
          taskStore.addSubtask(taskId, subtask)
        }
        
        // 2. Create bookmarks linked to the task
        const bookmarkIds: string[] = []
        for (const resource of resources) {
          const bookmarkId = bookmarkStore.addBookmark({
            url: resource.url,
            title: resource.title,
            description: resource.description,
            collection: 'Gold', // Research resources go to Gold
            tags: finalTags,
            linkedTaskId: taskId,
            sourceQuery: topic,
          })
          bookmarkIds.push(bookmarkId)
        }
        
        // 3. Link bookmarks to task (bidirectional linking)
        if (bookmarkIds.length > 0) {
          taskStore.updateTask(taskId, { linkedBookmarkIds: bookmarkIds })
        }
        
        // Build response
        let message = `📚 **Research Plan Created: "${taskTitle}"**\n\n`
        message += `**Task ID:** ${taskId}\n`
        message += `**Priority:** ${priority}\n`
        message += `**Tags:** ${finalTags.map(t => `#${t}`).join(' ')}\n`
        
        if (subtasks.length > 0) {
          message += `\n**Subtasks (${subtasks.length}):**\n`
          subtasks.forEach((st, i) => {
            message += `${i + 1}. ${st}\n`
          })
        }
        
        if (resources.length > 0) {
          message += `\n**Linked Resources (${resources.length}):**\n`
          resources.slice(0, 5).forEach((r, i) => {
            message += `${i + 1}. [${r.title}](${r.url})\n`
          })
          if (resources.length > 5) {
            message += `... and ${resources.length - 5} more\n`
          }
        }
        
        message += `\n✅ Task and bookmarks are bidirectionally linked with tags: ${finalTags.map(t => `#${t}`).join(' ')}`
        
        return {
          success: true,
          message,
          data: {
            taskId,
            taskTitle,
            subtaskCount: subtasks.length,
            bookmarkIds,
            bookmarkCount: bookmarkIds.length,
            tags: finalTags,
            topic,
          },
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
