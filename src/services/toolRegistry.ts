// FlowBot Tool Registry - Defines all available tools for the AI agent

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array'
  description: string
  enum?: string[]
  items?: { type: string }
  required?: boolean
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, ToolParameter>
    required: string[]
  }
}

// All tools available to FlowBot
export const FLOWBOT_TOOLS: ToolDefinition[] = [
  // ============ TASK TOOLS ============
  {
    name: 'create_task',
    description: 'Create a new task for the user. Use this when user wants to add a task, todo, or reminder.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title - what needs to be done' },
        priority: { type: 'string', description: 'Priority level', enum: ['P1', 'P2', 'P3', 'P4'] },
        description: { type: 'string', description: 'Optional detailed description' },
        deadline: { type: 'string', description: 'Deadline date in YYYY-MM-DD format (optional)' },
        deadlineTime: { type: 'string', description: 'Deadline time in HH:mm format (optional)' },
      },
      required: ['title', 'priority'],
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task. Use task title or ID to identify which task to update.',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'ID of the task to update' },
        title: { type: 'string', description: 'New title (optional)' },
        priority: { type: 'string', description: 'New priority (optional)', enum: ['P1', 'P2', 'P3', 'P4'] },
        description: { type: 'string', description: 'New description (optional)' },
        deadline: { type: 'string', description: 'New deadline date (optional)' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'toggle_task',
    description: 'Mark a task as complete or incomplete. Toggle its completion status.',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'ID of the task to toggle' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'delete_task',
    description: 'Delete a task permanently. Use with caution.',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'ID of the task to delete' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'get_pending_tasks',
    description: 'Get list of all pending (incomplete) tasks. Use to see what needs to be done.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_tasks_by_priority',
    description: 'Get tasks filtered by priority level.',
    parameters: {
      type: 'object',
      properties: {
        priority: { type: 'string', description: 'Priority to filter by', enum: ['P1', 'P2', 'P3', 'P4'] },
      },
      required: ['priority'],
    },
  },

  // ============ HABIT TOOLS ============
  {
    name: 'create_habit',
    description: 'Create a new habit to track. Use when user wants to build a new routine or habit.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Habit name' },
        frequency: { type: 'string', description: 'How often', enum: ['daily', 'weekly'] },
        category: { type: 'string', description: 'Category like health, work, personal, learning' },
      },
      required: ['name', 'frequency', 'category'],
    },
  },
  {
    name: 'toggle_habit_today',
    description: 'Mark a habit as complete or incomplete for today.',
    parameters: {
      type: 'object',
      properties: {
        habitId: { type: 'string', description: 'ID of the habit to toggle' },
      },
      required: ['habitId'],
    },
  },
  {
    name: 'get_today_habits',
    description: 'Get all habits and their completion status for today.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_habit_streaks',
    description: 'Get habits sorted by their current streak.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  // ============ NOTE TOOLS ============
  {
    name: 'create_note',
    description: 'Create a new note. Use when user wants to save information, ideas, or reminders.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Note title' },
        content: { type: 'string', description: 'Note content (markdown supported)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for organization (optional)' },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'search_notes',
    description: 'Search notes by title or content.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },

  // ============ JOURNAL TOOLS ============
  {
    name: 'create_journal_entry',
    description: 'Create or update today\'s journal entry with mood, energy, and content.',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Journal entry content' },
        mood: { type: 'number', description: 'Mood level 1-5 (1=bad, 5=great)' },
        energy: { type: 'number', description: 'Energy level 1-5 (1=low, 5=high)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for the entry (optional)' },
      },
      required: ['content'],
    },
  },
  {
    name: 'get_recent_journal',
    description: 'Get recent journal entries to understand user\'s recent mood and energy patterns.',
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Number of days to look back (default 7)' },
      },
      required: [],
    },
  },

  // ============ SUMMARY TOOLS ============
  {
    name: 'get_daily_summary',
    description: 'Get a summary of today including tasks, habits, and productivity stats.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_weekly_summary',
    description: 'Get a comprehensive weekly summary with trends and insights.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  // ============ PLANNING TOOLS ============
  {
    name: 'plan_day',
    description: 'Create a structured plan for the day based on pending tasks and habits. Creates multiple tasks if needed.',
    parameters: {
      type: 'object',
      properties: {
        focus: { type: 'string', description: 'Main focus area for the day (optional)' },
        availableHours: { type: 'number', description: 'How many hours available for work (optional)' },
      },
      required: [],
    },
  },
]

// Helper to format tools for different LLM providers
export function formatToolsForOpenAI() {
  return FLOWBOT_TOOLS.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }))
}

export function formatToolsForAnthropic() {
  return FLOWBOT_TOOLS.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  }))
}

export function formatToolsForGoogle() {
  return [{
    functionDeclarations: FLOWBOT_TOOLS.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    })),
  }]
}

// Get tool by name
export function getToolByName(name: string): ToolDefinition | undefined {
  return FLOWBOT_TOOLS.find(t => t.name === name)
}

// Get tool names for quick reference
export function getToolNames(): string[] {
  return FLOWBOT_TOOLS.map(t => t.name)
}
