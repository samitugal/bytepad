import type { Note, Habit, Task, JournalEntry } from '../types'

export interface ExportData {
  version: string
  exportedAt: string
  data: {
    notes: Note[]
    habits: Habit[]
    tasks: Task[]
    journalEntries: JournalEntry[]
  }
}

export function exportAllData(): ExportData {
  const notes = JSON.parse(localStorage.getItem('myflowspace-notes') || '{"state":{"notes":[]}}')
  const habits = JSON.parse(localStorage.getItem('myflowspace-habits') || '{"state":{"habits":[]}}')
  const tasks = JSON.parse(localStorage.getItem('myflowspace-tasks') || '{"state":{"tasks":[]}}')
  const journal = JSON.parse(localStorage.getItem('myflowspace-journal') || '{"state":{"entries":[]}}')

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      notes: notes.state?.notes || [],
      habits: habits.state?.habits || [],
      tasks: tasks.state?.tasks || [],
      journalEntries: journal.state?.entries || [],
    },
  }
}

export function downloadAsJson(data: ExportData, filename: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function importData(data: ExportData): { success: boolean; error?: string } {
  try {
    if (!data.version || !data.data) {
      return { success: false, error: 'Invalid data format' }
    }

    // Validate and import notes
    if (Array.isArray(data.data.notes)) {
      const notesState = { state: { notes: data.data.notes }, version: 0 }
      localStorage.setItem('myflowspace-notes', JSON.stringify(notesState))
    }

    // Validate and import habits
    if (Array.isArray(data.data.habits)) {
      const habitsState = { state: { habits: data.data.habits }, version: 0 }
      localStorage.setItem('myflowspace-habits', JSON.stringify(habitsState))
    }

    // Validate and import tasks
    if (Array.isArray(data.data.tasks)) {
      const tasksState = { state: { tasks: data.data.tasks }, version: 0 }
      localStorage.setItem('myflowspace-tasks', JSON.stringify(tasksState))
    }

    // Validate and import journal entries
    if (Array.isArray(data.data.journalEntries)) {
      const journalState = { state: { entries: data.data.journalEntries }, version: 0 }
      localStorage.setItem('myflowspace-journal', JSON.stringify(journalState))
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export function readFileAsJson(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        resolve(data)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

export function clearAllData() {
  localStorage.removeItem('myflowspace-notes')
  localStorage.removeItem('myflowspace-habits')
  localStorage.removeItem('myflowspace-tasks')
  localStorage.removeItem('myflowspace-journal')
}

export function getDataStats() {
  const notes = JSON.parse(localStorage.getItem('myflowspace-notes') || '{"state":{"notes":[]}}')
  const habits = JSON.parse(localStorage.getItem('myflowspace-habits') || '{"state":{"habits":[]}}')
  const tasks = JSON.parse(localStorage.getItem('myflowspace-tasks') || '{"state":{"tasks":[]}}')
  const journal = JSON.parse(localStorage.getItem('myflowspace-journal') || '{"state":{"entries":[]}}')

  return {
    notes: notes.state?.notes?.length || 0,
    habits: habits.state?.habits?.length || 0,
    tasks: tasks.state?.tasks?.length || 0,
    journalEntries: journal.state?.entries?.length || 0,
  }
}
