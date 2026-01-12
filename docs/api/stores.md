# Zustand Stores API

## noteStore

```typescript
interface NoteStore {
  notes: Note[]
  activeNoteId: string | null
  addNote: (note: Partial<Note>) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  setActiveNote: (id: string | null) => void
}
```

## taskStore

```typescript
interface TaskStore {
  tasks: Task[]
  filter: 'all' | 'active' | 'completed'
  sortBy: 'priority' | 'deadline' | 'created' | 'manual'
  addTask: (task: Partial<Task>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTask: (id: string) => void
  addSubtask: (taskId: string, title: string) => void
}
```

## habitStore

```typescript
interface HabitStore {
  habits: Habit[]
  addHabit: (habit: Partial<Habit>) => void
  toggleHabitDay: (id: string, date: string) => void
  deleteHabit: (id: string) => void
}
```

## uiStore

```typescript
interface UIStore {
  activeModule: ModuleType
  theme: 'dark' | 'light'
  language: 'en' | 'tr'
  setActiveModule: (module: ModuleType) => void
  setTheme: (theme: 'dark' | 'light') => void
}
```
