/**
 * Local API Handler Hook
 * Handles API requests from the Electron main process for MCP integration
 */

import { useEffect } from 'react'
import { useTaskStore } from '../stores/taskStore'
import { useNoteStore } from '../stores/noteStore'
import { useHabitStore } from '../stores/habitStore'
import { useBookmarkStore } from '../stores/bookmarkStore'
import { useJournalStore } from '../stores/journalStore'
import type { Task, Note, Habit, Bookmark, JournalEntry } from '../types'

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron

export function useLocalApi() {
  const taskStore = useTaskStore()
  const noteStore = useNoteStore()
  const habitStore = useHabitStore()
  const bookmarkStore = useBookmarkStore()
  const journalStore = useJournalStore()

  useEffect(() => {
    if (!isElectron || !window.electronAPI?.api) return

    const api = window.electronAPI.api

    // Helper to handle requests
    const handleRequest = (
      channel: string,
      handler: (data: unknown) => unknown
    ) => {
      api.onApiRequest(channel, async (requestId: string, data: unknown) => {
        try {
          const result = await handler(data)
          api.sendResponse(requestId, result)
        } catch (error) {
          api.sendResponse(requestId, null, error instanceof Error ? error.message : 'Unknown error')
        }
      })
    }

    // ============================================
    // TASK HANDLERS
    // ============================================

    handleRequest('api:getTasks', () => {
      return taskStore.tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        completed: t.completed,
        deadline: t.deadline,
        tags: t.tags,
        subtasks: t.subtasks,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
      }))
    })

    handleRequest('api:createTask', (data) => {
      const taskData = data as Partial<Task>
      const id = taskStore.addTask({
        title: taskData.title || 'Untitled Task',
        description: taskData.description,
        priority: taskData.priority || 'P3',
        deadline: taskData.deadline,
        tags: taskData.tags,
      })
      return { id, message: `Task created: ${taskData.title}` }
    })

    handleRequest('api:updateTask', (data) => {
      const { id, updates } = data as { id: string; updates: Partial<Task> }
      taskStore.updateTask(id, updates)
      return { id, message: 'Task updated' }
    })

    handleRequest('api:deleteTask', (data) => {
      const { id } = data as { id: string }
      taskStore.deleteTask(id)
      return { id, message: 'Task deleted' }
    })

    handleRequest('api:toggleTask', (data) => {
      const { id } = data as { id: string }
      taskStore.toggleTask(id)
      const task = taskStore.tasks.find(t => t.id === id)
      return { id, completed: task?.completed, message: `Task ${task?.completed ? 'completed' : 'uncompleted'}` }
    })

    // ============================================
    // NOTE HANDLERS
    // ============================================

    handleRequest('api:getNotes', () => {
      return noteStore.notes.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        tags: n.tags,
        pinned: n.pinned,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      }))
    })

    handleRequest('api:getNote', (data) => {
      const { id } = data as { id: string }
      const note = noteStore.notes.find(n => n.id === id)
      if (!note) {
        throw new Error(`Note not found: ${id}`)
      }
      return {
        id: note.id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        pinned: note.pinned,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      }
    })

    handleRequest('api:createNote', (data) => {
      const noteData = data as Partial<Note>
      const id = noteStore.addNote({
        title: noteData.title || 'Untitled Note',
        content: noteData.content || '',
        tags: noteData.tags || [],
      })
      return { id, message: `Note created: ${noteData.title}` }
    })

    handleRequest('api:updateNote', (data) => {
      const { id, updates } = data as { id: string; updates: Partial<Note> }
      noteStore.updateNote(id, updates)
      return { id, message: 'Note updated' }
    })

    handleRequest('api:deleteNote', (data) => {
      const { id } = data as { id: string }
      noteStore.deleteNote(id)
      return { id, message: 'Note deleted' }
    })

    // ============================================
    // HABIT HANDLERS
    // ============================================

    handleRequest('api:getHabits', () => {
      const today = new Date().toISOString().split('T')[0]
      return habitStore.habits.map(h => ({
        id: h.id,
        name: h.name,
        frequency: h.frequency,
        category: h.category,
        streak: h.streak,
        completedToday: h.completions[today] || false,
        createdAt: h.createdAt,
      }))
    })

    handleRequest('api:createHabit', (data) => {
      const habitData = data as Partial<Habit>
      const id = habitStore.addHabit({
        name: habitData.name || 'Untitled Habit',
        frequency: habitData.frequency || 'daily',
        category: habitData.category || '',
      })
      return { id, message: `Habit created: ${habitData.name}` }
    })

    handleRequest('api:toggleHabit', (data) => {
      const { id } = data as { id: string }
      const today = new Date().toISOString().split('T')[0]
      habitStore.toggleCompletion(id, today)
      const habit = habitStore.habits.find(h => h.id === id)
      const completed = habit?.completions[today] || false
      return { id, completed, message: `Habit ${completed ? 'completed' : 'uncompleted'}` }
    })

    handleRequest('api:updateHabit', (data) => {
      const { id, updates } = data as { id: string; updates: Partial<Habit> }
      habitStore.updateHabit(id, updates)
      return { id, message: 'Habit updated' }
    })

    handleRequest('api:deleteHabit', (data) => {
      const { id } = data as { id: string }
      habitStore.deleteHabit(id)
      return { id, message: 'Habit deleted' }
    })

    // ============================================
    // BOOKMARK HANDLERS
    // ============================================

    handleRequest('api:getBookmarks', () => {
      return bookmarkStore.bookmarks.map(b => ({
        id: b.id,
        url: b.url,
        title: b.title,
        description: b.description,
        collection: b.collection,
        tags: b.tags,
        isRead: b.isRead,
        createdAt: b.createdAt,
      }))
    })

    handleRequest('api:createBookmark', (data) => {
      const bookmarkData = data as Partial<Bookmark>
      const id = bookmarkStore.addBookmark({
        url: bookmarkData.url || '',
        title: bookmarkData.title || bookmarkData.url || 'Untitled',
        description: bookmarkData.description,
        collection: bookmarkData.collection,
        tags: bookmarkData.tags || [],
      })
      return { id, message: `Bookmark created: ${bookmarkData.title || bookmarkData.url}` }
    })

    handleRequest('api:updateBookmark', (data) => {
      const { id, updates } = data as { id: string; updates: Partial<Bookmark> }
      bookmarkStore.updateBookmark(id, updates)
      return { id, message: 'Bookmark updated' }
    })

    handleRequest('api:deleteBookmark', (data) => {
      const { id } = data as { id: string }
      bookmarkStore.deleteBookmark(id)
      return { id, message: 'Bookmark deleted' }
    })

    // ============================================
    // JOURNAL HANDLERS
    // ============================================

    handleRequest('api:getJournal', () => {
      return journalStore.entries.map(e => ({
        id: e.id,
        date: e.date,
        content: e.content,
        mood: e.mood,
        energy: e.energy,
        tags: e.tags,
      }))
    })

    handleRequest('api:createJournalEntry', (data) => {
      const entryData = data as Partial<JournalEntry>
      const today = new Date().toISOString().split('T')[0]
      journalStore.addEntry({
        date: entryData.date || today,
        content: entryData.content || '',
        mood: entryData.mood || 3,
        energy: entryData.energy || 3,
        tags: entryData.tags || [],
      })
      return { message: 'Journal entry created' }
    })

    handleRequest('api:updateJournalEntry', (data) => {
      const { date, updates } = data as { date: string; updates: Partial<JournalEntry> }
      const entry = journalStore.entries.find(e => e.date === date)
      if (!entry) {
        throw new Error(`Journal entry not found for date: ${date}`)
      }
      journalStore.updateEntry(entry.id, updates)
      return { date, message: 'Journal entry updated' }
    })

    handleRequest('api:deleteJournalEntry', (data) => {
      const { date } = data as { date: string }
      const entry = journalStore.entries.find(e => e.date === date)
      if (!entry) {
        throw new Error(`Journal entry not found for date: ${date}`)
      }
      journalStore.deleteEntry(entry.id)
      return { date, message: 'Journal entry deleted' }
    })

    // ============================================
    // SUMMARY HANDLERS
    // ============================================

    handleRequest('api:getDailySummary', () => {
      const today = new Date().toISOString().split('T')[0]
      const tasks = taskStore.tasks
      const habits = habitStore.habits

      const completedTasks = tasks.filter(t =>
        t.completed && t.completedAt &&
        new Date(t.completedAt).toISOString().split('T')[0] === today
      )
      const pendingTasks = tasks.filter(t => !t.completed && !t.archivedAt)
      const completedHabits = habits.filter(h => h.completions[today])

      return {
        date: today,
        tasks: {
          completed: completedTasks.length,
          pending: pendingTasks.length,
          total: tasks.length,
        },
        habits: {
          completed: completedHabits.length,
          total: habits.length,
        },
        pendingTasksList: pendingTasks.slice(0, 5).map(t => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
        })),
      }
    })

    handleRequest('api:getWeeklySummary', () => {
      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      weekStart.setHours(0, 0, 0, 0)

      const tasks = taskStore.tasks
      const weeklyCompleted = tasks.filter(t =>
        t.completed && t.completedAt && new Date(t.completedAt) >= weekStart
      )

      return {
        weekStart: weekStart.toISOString().split('T')[0],
        tasksCompleted: weeklyCompleted.length,
        tasksByPriority: {
          P1: weeklyCompleted.filter(t => t.priority === 'P1').length,
          P2: weeklyCompleted.filter(t => t.priority === 'P2').length,
          P3: weeklyCompleted.filter(t => t.priority === 'P3').length,
          P4: weeklyCompleted.filter(t => t.priority === 'P4').length,
        },
      }
    })

    // Cleanup on unmount
    return () => {
      if (window.electronAPI?.api?.removeApiListeners) {
        window.electronAPI.api.removeApiListeners()
      }
    }
  }, [taskStore, noteStore, habitStore, bookmarkStore, journalStore])
}
