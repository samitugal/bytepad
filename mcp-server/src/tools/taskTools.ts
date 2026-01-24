// Task Tools for MCP Server
// Local-first approach: tries Electron app first, falls back to file store

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { getStore, saveStore, generateId, type Task, type ToolResult } from '../store/index.js'
import {
  isValidPriority,
  isNonEmptyString,
  parseTags,
  sanitize,
  localCreateTask,
  localUpdateTask,
  localToggleTask,
  localDeleteTask,
  localGetTasks,
  logger,
} from '../utils/index.js'

// Tool definitions
export const taskToolDefinitions: Tool[] = [
  {
    name: 'create_task',
    description:
      'Create a new task with optional priority, deadline, and tags. If Electron app is running, task is created there and syncs to Gist automatically.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title (required)' },
        description: { type: 'string', description: 'Task description' },
        priority: {
          type: 'string',
          enum: ['P1', 'P2', 'P3', 'P4'],
          description: 'Priority level (P1=Critical, P2=High, P3=Medium, P4=Low). Default: P3',
        },
        deadline: { type: 'string', description: 'Due date in ISO format (YYYY-MM-DD or full ISO)' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID (required)' },
        title: { type: 'string', description: 'New title' },
        description: { type: 'string', description: 'New description' },
        priority: {
          type: 'string',
          enum: ['P1', 'P2', 'P3', 'P4'],
          description: 'New priority',
        },
        deadline: { type: 'string', description: 'New deadline' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'New tags',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'toggle_task',
    description: 'Mark a task as complete or incomplete',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID (required)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_task',
    description: 'Delete a task permanently',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID (required)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_tasks',
    description: 'Get all tasks with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          enum: ['all', 'active', 'completed'],
          description: 'Filter tasks by status (default: all)',
        },
        limit: { type: 'number', description: 'Maximum number of tasks to return' },
      },
    },
  },
  {
    name: 'get_tasks_by_priority',
    description: 'Get tasks filtered by priority level',
    inputSchema: {
      type: 'object',
      properties: {
        priority: {
          type: 'string',
          enum: ['P1', 'P2', 'P3', 'P4'],
          description: 'Priority level to filter by (required)',
        },
        includeCompleted: {
          type: 'boolean',
          description: 'Include completed tasks (default: false)',
        },
      },
      required: ['priority'],
    },
  },
]

// Tool executors with local-first approach
export const taskToolExecutors: Record<string, (args: Record<string, unknown>) => Promise<ToolResult>> = {
  create_task: async (args) => {
    const title = sanitize(args.title)
    if (!isNonEmptyString(title)) {
      return { success: false, message: 'Task title is required' }
    }

    const priority = isValidPriority(args.priority) ? (args.priority as string) : 'P3'
    const tags = parseTags(args.tags)

    // Try local API first
    const localResult = await localCreateTask({
      title,
      description: sanitize(args.description) || undefined,
      priority,
      deadline: args.deadline as string | undefined,
      tags: tags.length > 0 ? tags : undefined,
    })

    if (localResult.success && localResult.source === 'local') {
      logger.info(`Task created via local API: "${title}" (syncs to Gist)`)
      return {
        success: true,
        message: `Task created: "${title}" (${priority}) - synced to app & Gist`,
        data: localResult.data,
      }
    }

    // Fallback to file store
    logger.debug('Using file store fallback for create_task')
    const store = getStore()
    const task: Task = {
      id: generateId(),
      title,
      description: sanitize(args.description) || undefined,
      priority: priority as 'P1' | 'P2' | 'P3' | 'P4',
      deadline: args.deadline ? new Date(args.deadline as string) : undefined,
      completed: false,
      subtasks: [],
      createdAt: new Date(),
      tags: tags.length > 0 ? tags : undefined,
    }

    store.data.tasks.unshift(task)
    await saveStore()

    return {
      success: true,
      message: `Task created: "${title}" (${priority}) - stored locally`,
      data: { id: task.id, title, priority },
    }
  },

  update_task: async (args) => {
    const id = sanitize(args.id)
    if (!isNonEmptyString(id)) {
      return { success: false, message: 'Task ID is required' }
    }

    const updates: Record<string, unknown> = {}
    if (args.title !== undefined) updates.title = sanitize(args.title)
    if (args.description !== undefined) updates.description = sanitize(args.description)
    if (args.priority !== undefined && isValidPriority(args.priority)) {
      updates.priority = args.priority
    }
    if (args.deadline !== undefined) {
      updates.deadline = args.deadline
    }
    if (args.tags !== undefined) {
      updates.tags = parseTags(args.tags)
    }

    // Try local API first
    const localResult = await localUpdateTask(id, updates)

    if (localResult.success && localResult.source === 'local') {
      logger.info(`Task updated via local API: ${id}`)
      return {
        success: true,
        message: 'Task updated - synced to app & Gist',
        data: { id, updates },
      }
    }

    // Fallback to file store
    const store = getStore()
    const taskIndex = store.data.tasks.findIndex((t) => t.id === id)

    if (taskIndex === -1) {
      return { success: false, message: `Task not found: ${id}` }
    }

    const task = store.data.tasks[taskIndex]
    const taskUpdates: Partial<Task> = {}

    if (updates.title !== undefined) taskUpdates.title = updates.title as string
    if (updates.description !== undefined) taskUpdates.description = updates.description as string
    if (updates.priority !== undefined) taskUpdates.priority = updates.priority as 'P1' | 'P2' | 'P3' | 'P4'
    if (updates.deadline !== undefined) {
      taskUpdates.deadline = updates.deadline ? new Date(updates.deadline as string) : undefined
    }
    if (updates.tags !== undefined) taskUpdates.tags = updates.tags as string[]

    store.data.tasks[taskIndex] = { ...task, ...taskUpdates }
    await saveStore()

    return {
      success: true,
      message: `Task updated: "${store.data.tasks[taskIndex].title}" - stored locally`,
      data: { id, updates },
    }
  },

  toggle_task: async (args) => {
    const id = sanitize(args.id)
    if (!isNonEmptyString(id)) {
      return { success: false, message: 'Task ID is required' }
    }

    // Try local API first
    const localResult = await localToggleTask(id)

    if (localResult.success && localResult.source === 'local') {
      const data = localResult.data as { completed?: boolean; message?: string } | undefined
      logger.info(`Task toggled via local API: ${id}`)
      return {
        success: true,
        message: data?.message || 'Task toggled - synced to app & Gist',
        data: { id, completed: data?.completed },
      }
    }

    // Fallback to file store
    const store = getStore()
    const task = store.data.tasks.find((t) => t.id === id)

    if (!task) {
      return { success: false, message: `Task not found: ${id}` }
    }

    const wasCompleted = task.completed
    task.completed = !wasCompleted
    task.completedAt = task.completed ? new Date() : undefined

    if (task.completed && task.subtasks) {
      task.subtasks.forEach((st) => (st.completed = true))
    }

    if (task.completed && !wasCompleted) {
      store.data.gamification.tasksCompleted++
      store.data.gamification.tasksCompletedToday++
    }

    await saveStore()

    return {
      success: true,
      message: task.completed
        ? `Task completed: "${task.title}" - stored locally`
        : `Task uncompleted: "${task.title}" - stored locally`,
      data: { id, completed: task.completed },
    }
  },

  delete_task: async (args) => {
    const id = sanitize(args.id)
    if (!isNonEmptyString(id)) {
      return { success: false, message: 'Task ID is required' }
    }

    // Try local API first
    const localResult = await localDeleteTask(id)

    if (localResult.success && localResult.source === 'local') {
      logger.info(`Task deleted via local API: ${id}`)
      return {
        success: true,
        message: 'Task deleted - synced to app & Gist',
        data: { id },
      }
    }

    // Fallback to file store
    const store = getStore()
    const taskIndex = store.data.tasks.findIndex((t) => t.id === id)

    if (taskIndex === -1) {
      return { success: false, message: `Task not found: ${id}` }
    }

    const task = store.data.tasks[taskIndex]
    store.data.tasks.splice(taskIndex, 1)
    await saveStore()

    return {
      success: true,
      message: `Task deleted: "${task.title}" - stored locally`,
      data: { id, title: task.title },
    }
  },

  get_tasks: async (args) => {
    const filter = (args.filter as string) || 'all'
    const limit = typeof args.limit === 'number' ? args.limit : undefined

    // Try local API first
    const localResult = await localGetTasks()

    if (localResult.success && localResult.source === 'local') {
      let tasks = localResult.data as Array<Record<string, unknown>>

      if (filter === 'active') {
        tasks = tasks.filter((t) => !t.completed)
      } else if (filter === 'completed') {
        tasks = tasks.filter((t) => t.completed)
      }

      if (limit) {
        tasks = tasks.slice(0, limit)
      }

      return {
        success: true,
        message: `Found ${tasks.length} tasks (from app)`,
        data: tasks,
      }
    }

    // Fallback to file store
    const store = getStore()
    let tasks = store.data.tasks.filter((t) => !t.archivedAt)

    if (filter === 'active') {
      tasks = tasks.filter((t) => !t.completed)
    } else if (filter === 'completed') {
      tasks = tasks.filter((t) => t.completed)
    }

    // Sort by priority
    const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4 }
    tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    if (limit) {
      tasks = tasks.slice(0, limit)
    }

    return {
      success: true,
      message: `Found ${tasks.length} tasks (from file store)`,
      data: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        completed: t.completed,
        deadline: t.deadline,
        tags: t.tags,
        subtasks: t.subtasks?.length || 0,
      })),
    }
  },

  get_tasks_by_priority: async (args) => {
    const priority = args.priority
    if (!isValidPriority(priority)) {
      return { success: false, message: 'Valid priority (P1-P4) is required' }
    }

    const includeCompleted = args.includeCompleted === true

    // Try local API first
    const localResult = await localGetTasks()

    if (localResult.success && localResult.source === 'local') {
      let tasks = (localResult.data as Array<Record<string, unknown>>).filter(
        (t) => t.priority === priority
      )

      if (!includeCompleted) {
        tasks = tasks.filter((t) => !t.completed)
      }

      return {
        success: true,
        message: `Found ${tasks.length} ${priority} tasks (from app)`,
        data: tasks,
      }
    }

    // Fallback to file store
    const store = getStore()
    let tasks = store.data.tasks.filter((t) => t.priority === priority && !t.archivedAt)

    if (!includeCompleted) {
      tasks = tasks.filter((t) => !t.completed)
    }

    return {
      success: true,
      message: `Found ${tasks.length} ${priority} tasks (from file store)`,
      data: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        completed: t.completed,
        deadline: t.deadline,
        tags: t.tags,
      })),
    }
  },
}
