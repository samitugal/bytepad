import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useSettingsStore } from '../stores/settingsStore'
import { useNoteStore } from '../stores/noteStore'
import { useTaskStore } from '../stores/taskStore'
import { useHabitStore } from '../stores/habitStore'
import { useJournalStore } from '../stores/journalStore'
import type { Note, Task, Habit, JournalEntry } from '../types'

// Check if File System Access API is supported
export const isFileSystemAccessSupported = (): boolean => {
  return 'showDirectoryPicker' in window
}

// Sanitize filename - remove invalid characters
const sanitizeFilename = (name: string): string => {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 100) // Limit filename length
    .trim() || 'untitled'
}

// Request directory access from user
export const selectNotesDirectory = async (): Promise<{ handle: FileSystemDirectoryHandle; path: string } | null> => {
  if (!isFileSystemAccessSupported()) {
    console.warn('File System Access API is not supported in this browser')
    return null
  }

  try {
    // @ts-expect-error - showDirectoryPicker is not in TypeScript's lib yet
    const dirHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents',
    })
    
    return {
      handle: dirHandle,
      path: dirHandle.name
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      // User cancelled the picker
      return null
    }
    console.error('Error selecting directory:', error)
    throw error
  }
}

// Save a single note as txt file
export const saveNoteToFile = async (note: Note, dirHandle: FileSystemDirectoryHandle): Promise<boolean> => {
  try {
    const filename = `${sanitizeFilename(note.title || 'untitled')}.txt`
    
    // Create or get the file
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true })
    
    // Create writable stream
    const writable = await fileHandle.createWritable()
    
    // Format content with metadata
    const content = formatNoteContent(note)
    
    // Write content
    await writable.write(content)
    await writable.close()
    
    return true
  } catch (error) {
    console.error('Error saving note to file:', error)
    return false
  }
}

// Format note content for txt file
const formatNoteContent = (note: Note): string => {
  const lines: string[] = []
  
  // Title
  lines.push(`# ${note.title || 'Untitled'}`)
  lines.push('')
  
  // Metadata
  lines.push(`Created: ${new Date(note.createdAt).toLocaleString()}`)
  lines.push(`Updated: ${new Date(note.updatedAt).toLocaleString()}`)
  
  if (note.tags && note.tags.length > 0) {
    lines.push(`Tags: ${note.tags.join(', ')}`)
  }
  
  lines.push('')
  lines.push('---')
  lines.push('')
  
  // Content
  lines.push(note.content)
  
  return lines.join('\n')
}

// Save all notes to files
export const saveAllNotesToFiles = async (): Promise<{ success: number; failed: number }> => {
  const { localNotesDirHandle } = useSettingsStore.getState()
  const { notes } = useNoteStore.getState()
  
  if (!localNotesDirHandle) {
    throw new Error('No directory selected for local notes')
  }
  
  let success = 0
  let failed = 0
  
  for (const note of notes) {
    const saved = await saveNoteToFile(note, localNotesDirHandle)
    if (saved) {
      success++
    } else {
      failed++
    }
  }
  
  return { success, failed }
}

// Auto-save a note when it's updated (if local notes is enabled)
export const autoSaveNoteLocally = async (note: Note): Promise<void> => {
  const { localNotesEnabled, localNotesDirHandle } = useSettingsStore.getState()
  
  if (!localNotesEnabled || !localNotesDirHandle) {
    return
  }
  
  try {
    await saveNoteToFile(note, localNotesDirHandle)
  } catch (error) {
    console.error('Auto-save to local file failed:', error)
  }
}

// Delete a note file
export const deleteNoteFile = async (noteTitle: string): Promise<boolean> => {
  const { localNotesEnabled, localNotesDirHandle } = useSettingsStore.getState()
  
  if (!localNotesEnabled || !localNotesDirHandle) {
    return false
  }
  
  try {
    const filename = `${sanitizeFilename(noteTitle || 'untitled')}.txt`
    await localNotesDirHandle.removeEntry(filename)
    return true
  } catch (error) {
    // File might not exist, which is fine
    console.warn('Could not delete note file:', error)
    return false
  }
}

// Export single note as download (fallback for browsers without File System Access API)
export const downloadNoteAsTxt = (note: Note): void => {
  const content = formatNoteContent(note)
  // Ensure we have a valid filename with .txt extension
  const baseFilename = note.title && note.title.trim() ? note.title.trim() : 'untitled'
  const safeFilename = sanitizeFilename(baseFilename)
  const filename = `${safeFilename}.txt`
  
  console.log('Downloading note:', { title: note.title, filename })
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  saveAs(blob, filename)
}

// Format task content for txt file
const formatTaskContent = (task: Task): string => {
  const lines: string[] = []
  lines.push(`# ${task.title}`)
  lines.push('')
  lines.push(`Status: ${task.completed ? 'Completed' : 'Pending'}`)
  lines.push(`Priority: ${task.priority}`)
  if (task.deadline) {
    lines.push(`Deadline: ${new Date(task.deadline).toLocaleString()}`)
  }
  lines.push(`Created: ${new Date(task.createdAt).toLocaleString()}`)
  if (task.description) {
    lines.push('')
    lines.push('---')
    lines.push('')
    lines.push(task.description)
  }
  if (task.subtasks && task.subtasks.length > 0) {
    lines.push('')
    lines.push('## Subtasks')
    task.subtasks.forEach(st => {
      lines.push(`- [${st.completed ? 'x' : ' '}] ${st.title}`)
    })
  }
  return lines.join('\n')
}

// Format habit content for txt file
const formatHabitContent = (habit: Habit): string => {
  const lines: string[] = []
  lines.push(`# ${habit.name}`)
  lines.push('')
  lines.push(`Frequency: ${habit.frequency}`)
  lines.push(`Category: ${habit.category}`)
  lines.push(`Current Streak: ${habit.streak} days`)
  lines.push(`Created: ${new Date(habit.createdAt).toLocaleString()}`)
  if (habit.tags && habit.tags.length > 0) {
    lines.push(`Tags: ${habit.tags.join(', ')}`)
  }
  // Show completions
  const completionDates = Object.keys(habit.completions).filter(date => habit.completions[date])
  if (completionDates.length > 0) {
    lines.push('')
    lines.push('## Completed Dates')
    completionDates.slice(-30).forEach(date => {
      lines.push(`- ${date}`)
    })
    if (completionDates.length > 30) {
      lines.push(`... and ${completionDates.length - 30} more`)
    }
  }
  return lines.join('\n')
}

// Format journal entry content for txt file
const formatJournalContent = (entry: JournalEntry): string => {
  const lines: string[] = []
  lines.push(`# Journal - ${entry.date}`)
  lines.push('')
  lines.push(`Mood: ${entry.mood}/5`)
  lines.push(`Energy: ${entry.energy}/5`)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push(entry.content)
  if (entry.tags && entry.tags.length > 0) {
    lines.push('')
    lines.push(`Tags: ${entry.tags.join(', ')}`)
  }
  return lines.join('\n')
}

// Export all data as a zip file
export const downloadAllDataAsZip = async (): Promise<{ notes: number; tasks: number; habits: number; journal: number }> => {
  const zip = new JSZip()
  
  const { notes } = useNoteStore.getState()
  const { tasks } = useTaskStore.getState()
  const { habits } = useHabitStore.getState()
  const { entries: journalEntries } = useJournalStore.getState()
  
  // Add notes folder
  const notesFolder = zip.folder('notes')
  notes.forEach((note, index) => {
    const filename = `${sanitizeFilename(note.title || `note_${index + 1}`)}.txt`
    notesFolder?.file(filename, formatNoteContent(note))
  })
  
  // Add tasks folder
  const tasksFolder = zip.folder('tasks')
  tasks.forEach((task, index) => {
    const filename = `${sanitizeFilename(task.title || `task_${index + 1}`)}.txt`
    tasksFolder?.file(filename, formatTaskContent(task))
  })
  
  // Add habits folder
  const habitsFolder = zip.folder('habits')
  habits.forEach((habit, index) => {
    const filename = `${sanitizeFilename(habit.name || `habit_${index + 1}`)}.txt`
    habitsFolder?.file(filename, formatHabitContent(habit))
  })
  
  // Add journal folder
  const journalFolder = zip.folder('journal')
  journalEntries.forEach((entry, index) => {
    const date = new Date(entry.date)
    const filename = `${date.toISOString().split('T')[0]}_journal_${index + 1}.txt`
    journalFolder?.file(filename, formatJournalContent(entry))
  })
  
  // Generate zip and download
  const blob = await zip.generateAsync({ type: 'blob' })
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `bytepad_backup_${timestamp}.zip`
  
  saveAs(blob, filename)
  
  return {
    notes: notes.length,
    tasks: tasks.length,
    habits: habits.length,
    journal: journalEntries.length
  }
}

// Legacy function - kept for backwards compatibility
export const downloadAllNotesAsZip = async (): Promise<void> => {
  await downloadAllDataAsZip()
}
