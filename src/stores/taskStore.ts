import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task, SubTask } from '../types'

interface TaskState {
  tasks: Task[]
  filter: 'all' | 'active' | 'completed'
  sortBy: 'priority' | 'deadline' | 'created'
  addTask: (task: Omit<Task, 'id' | 'completed' | 'completedAt' | 'subtasks' | 'createdAt'>) => string
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTask: (id: string) => void
  addSubtask: (taskId: string, title: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  deleteSubtask: (taskId: string, subtaskId: string) => void
  setFilter: (filter: 'all' | 'active' | 'completed') => void
  setSortBy: (sortBy: 'priority' | 'deadline' | 'created') => void
  getPendingCount: () => number
}

const generateId = () => Math.random().toString(36).substring(2, 15)

const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4 }

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      filter: 'all',
      sortBy: 'priority',

      addTask: (taskData) => {
        const id = generateId()
        const task: Task = {
          ...taskData,
          id,
          completed: false,
          subtasks: [],
          createdAt: new Date(),
        }
        set((state) => ({
          tasks: [task, ...state.tasks],
        }))
        return id
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        }))
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }))
      },

      toggleTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  completed: !task.completed,
                  completedAt: !task.completed ? new Date() : undefined,
                }
              : task
          ),
        }))
      },

      addSubtask: (taskId, title) => {
        const subtask: SubTask = {
          id: generateId(),
          title,
          completed: false,
        }
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, subtasks: [...task.subtasks, subtask] }
              : task
          ),
        }))
      },

      toggleSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks.map((st) =>
                    st.id === subtaskId ? { ...st, completed: !st.completed } : st
                  ),
                }
              : task
          ),
        }))
      },

      deleteSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks.filter((st) => st.id !== subtaskId),
                }
              : task
          ),
        }))
      },

      setFilter: (filter) => set({ filter }),
      setSortBy: (sortBy) => set({ sortBy }),

      getPendingCount: () => get().tasks.filter(t => !t.completed).length,
    }),
    {
      name: 'myflowspace-tasks',
      partialize: (state) => ({ tasks: state.tasks }),
    }
  )
)

export const getFilteredTasks = (state: TaskState) => {
  let filtered = [...state.tasks]

  // Apply filter
  if (state.filter === 'active') {
    filtered = filtered.filter(t => !t.completed)
  } else if (state.filter === 'completed') {
    filtered = filtered.filter(t => t.completed)
  }

  // Apply sort
  filtered.sort((a, b) => {
    if (state.sortBy === 'priority') {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    if (state.sortBy === 'deadline') {
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return filtered
}
