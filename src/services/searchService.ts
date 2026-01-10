// Global Search Service - Cross-module search

import { useNoteStore } from '../stores/noteStore'
import { useTaskStore } from '../stores/taskStore'
import { useHabitStore } from '../stores/habitStore'
import { useJournalStore } from '../stores/journalStore'
import { useBookmarkStore } from '../stores/bookmarkStore'
import { useDailyNotesStore } from '../stores/dailyNotesStore'

export type SearchResultType = 'note' | 'task' | 'habit' | 'journal' | 'bookmark' | 'dailynote'

export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  subtitle?: string
  content?: string
  score: number
  module: string
  date?: string
}

interface SearchOptions {
  limit?: number
  types?: SearchResultType[]
}

function normalizeText(text: string): string {
  return text.toLowerCase().trim()
}

function calculateScore(query: string, text: string): number {
  const normalizedQuery = normalizeText(query)
  const normalizedText = normalizeText(text)
  
  // Exact match
  if (normalizedText === normalizedQuery) return 100
  
  // Starts with query
  if (normalizedText.startsWith(normalizedQuery)) return 90
  
  // Contains query as word
  if (normalizedText.includes(` ${normalizedQuery} `) || 
      normalizedText.startsWith(`${normalizedQuery} `) ||
      normalizedText.endsWith(` ${normalizedQuery}`)) return 80
  
  // Contains query
  if (normalizedText.includes(normalizedQuery)) return 70
  
  // Fuzzy match - check if all query chars exist in order
  let queryIdx = 0
  for (const char of normalizedText) {
    if (char === normalizedQuery[queryIdx]) {
      queryIdx++
      if (queryIdx === normalizedQuery.length) return 50
    }
  }
  
  return 0
}

function searchNotes(query: string): SearchResult[] {
  const notes = useNoteStore.getState().notes
  const results: SearchResult[] = []
  
  for (const note of notes) {
    const titleScore = calculateScore(query, note.title)
    const contentScore = calculateScore(query, note.content) * 0.8
    const tagScore = note.tags.some(t => normalizeText(t).includes(normalizeText(query))) ? 60 : 0
    const score = Math.max(titleScore, contentScore, tagScore)
    
    if (score > 0) {
      results.push({
        id: note.id,
        type: 'note',
        title: note.title,
        subtitle: note.tags.length > 0 ? note.tags.join(', ') : undefined,
        content: note.content.slice(0, 100),
        score,
        module: 'notes',
      })
    }
  }
  
  return results
}

function searchTasks(query: string): SearchResult[] {
  const tasks = useTaskStore.getState().tasks
  const results: SearchResult[] = []
  
  for (const task of tasks) {
    const titleScore = calculateScore(query, task.title)
    const descScore = task.description ? calculateScore(query, task.description) * 0.7 : 0
    const score = Math.max(titleScore, descScore)
    
    if (score > 0) {
      results.push({
        id: task.id,
        type: 'task',
        title: task.title,
        subtitle: `[${task.priority}] ${task.completed ? '✓' : '○'}`,
        content: task.description,
        score,
        module: 'tasks',
        date: task.deadline ? new Date(task.deadline).toLocaleDateString() : undefined,
      })
    }
  }
  
  return results
}

function searchHabits(query: string): SearchResult[] {
  const habits = useHabitStore.getState().habits
  const results: SearchResult[] = []
  
  for (const habit of habits) {
    const score = calculateScore(query, habit.name)
    
    if (score > 0) {
      results.push({
        id: habit.id,
        type: 'habit',
        title: habit.name,
        subtitle: `🔥 ${habit.streak} streak`,
        score,
        module: 'habits',
      })
    }
  }
  
  return results
}

function searchJournal(query: string): SearchResult[] {
  const entries = useJournalStore.getState().entries
  const results: SearchResult[] = []
  
  for (const entry of entries) {
    const contentScore = calculateScore(query, entry.content)
    const score = contentScore
    
    if (score > 0) {
      results.push({
        id: entry.id,
        type: 'journal',
        title: new Date(entry.date).toLocaleDateString('tr-TR', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long' 
        }),
        subtitle: entry.mood ? `Mood: ${['😫', '😔', '😐', '🙂', '😊'][entry.mood - 1]}` : undefined,
        content: entry.content.slice(0, 100),
        score,
        module: 'journal',
        date: entry.date,
      })
    }
  }
  
  return results
}

function searchBookmarks(query: string): SearchResult[] {
  const bookmarks = useBookmarkStore.getState().bookmarks
  const results: SearchResult[] = []
  
  for (const bookmark of bookmarks) {
    const titleScore = calculateScore(query, bookmark.title)
    const urlScore = calculateScore(query, bookmark.url) * 0.6
    const descScore = bookmark.description ? calculateScore(query, bookmark.description) * 0.7 : 0
    const tagScore = bookmark.tags.some(t => normalizeText(t).includes(normalizeText(query))) ? 60 : 0
    const score = Math.max(titleScore, urlScore, descScore, tagScore)
    
    if (score > 0) {
      results.push({
        id: bookmark.id,
        type: 'bookmark',
        title: bookmark.title,
        subtitle: bookmark.url,
        content: bookmark.description,
        score,
        module: 'bookmarks',
      })
    }
  }
  
  return results
}

function searchDailyNotes(query: string): SearchResult[] {
  const dailyNotes = useDailyNotesStore.getState().dailyNotes
  const results: SearchResult[] = []
  
  for (const day of dailyNotes) {
    for (const card of day.cards) {
      const titleScore = calculateScore(query, card.title)
      const contentScore = calculateScore(query, card.content) * 0.8
      const tagScore = card.tags.some(t => normalizeText(t).includes(normalizeText(query))) ? 60 : 0
      const score = Math.max(titleScore, contentScore, tagScore)
      
      if (score > 0) {
        results.push({
          id: card.id,
          type: 'dailynote',
          title: card.title || 'Untitled Card',
          subtitle: day.date,
          content: card.content.slice(0, 100),
          score,
          module: 'dailynotes',
          date: day.date,
        })
      }
    }
  }
  
  return results
}

export function globalSearch(query: string, options: SearchOptions = {}): SearchResult[] {
  if (!query.trim()) return []
  
  const { limit = 20, types } = options
  let results: SearchResult[] = []
  
  // Search all modules or specific types
  const searchTypes = types || ['note', 'task', 'habit', 'journal', 'bookmark', 'dailynote']
  
  if (searchTypes.includes('note')) results.push(...searchNotes(query))
  if (searchTypes.includes('task')) results.push(...searchTasks(query))
  if (searchTypes.includes('habit')) results.push(...searchHabits(query))
  if (searchTypes.includes('journal')) results.push(...searchJournal(query))
  if (searchTypes.includes('bookmark')) results.push(...searchBookmarks(query))
  if (searchTypes.includes('dailynote')) results.push(...searchDailyNotes(query))
  
  // Sort by score (descending)
  results.sort((a, b) => b.score - a.score)
  
  // Limit results
  return results.slice(0, limit)
}

export function getModuleIcon(type: SearchResultType): string {
  switch (type) {
    case 'note': return '📝'
    case 'task': return '✓'
    case 'habit': return '🎯'
    case 'journal': return '📖'
    case 'bookmark': return '🔖'
    case 'dailynote': return '📅'
    default: return '📄'
  }
}

export function getModuleName(type: SearchResultType): string {
  switch (type) {
    case 'note': return 'Notes'
    case 'task': return 'Tasks'
    case 'habit': return 'Habits'
    case 'journal': return 'Journal'
    case 'bookmark': return 'Bookmarks'
    case 'dailynote': return 'Daily Notes'
    default: return 'Unknown'
  }
}
