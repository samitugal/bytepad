// FlowBot Tool Registry - Defines all available tools for the AI agent

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  enum?: string[]
  items?: { type: string; properties?: Record<string, ToolParameter> }
  properties?: Record<string, ToolParameter>
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
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for organization and filtering' },
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
  {
    name: 'smart_schedule',
    description: 'Generate AI-powered smart schedule based on current energy level and task priorities. Shows optimal task order and streak risk alerts.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_next_task',
    description: 'Get the best task recommendation based on current energy level and priorities.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'check_streak_risk',
    description: 'Check which habits are at risk of breaking their streak today.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  // ============ AUTO-TAGGING TOOLS ============
  {
    name: 'suggest_tags_for_note',
    description: 'Get AI-powered tag suggestions for an existing note.',
    parameters: {
      type: 'object',
      properties: {
        noteId: { type: 'string', description: 'ID of the note to analyze' },
      },
      required: ['noteId'],
    },
  },
  {
    name: 'suggest_tags_for_bookmark',
    description: 'Get AI-powered tag suggestions for an existing bookmark.',
    parameters: {
      type: 'object',
      properties: {
        bookmarkId: { type: 'string', description: 'ID of the bookmark to analyze' },
      },
      required: ['bookmarkId'],
    },
  },
  {
    name: 'suggest_tags',
    description: 'Get AI-powered tag suggestions for any content.',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Content to analyze for tags' },
        title: { type: 'string', description: 'Title of the content' },
      },
      required: [],
    },
  },

  // ============ BOOKMARK TOOLS ============
  {
    name: 'create_bookmark',
    description: 'Create a new bookmark. Use when user wants to save a URL or web resource. Can link to a task for cross-referencing.',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL of the bookmark' },
        title: { type: 'string', description: 'Title of the bookmark' },
        description: { type: 'string', description: 'Optional description' },
        collection: { type: 'string', description: 'Collection name (Gold, Silver, Bronze, or custom)', enum: ['Gold', 'Silver', 'Bronze', 'Unsorted'] },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for organization' },
        linkedTaskId: { type: 'string', description: 'ID of related task to link this bookmark to' },
        sourceQuery: { type: 'string', description: 'Original search query that found this resource' },
      },
      required: ['url', 'title'],
    },
  },
  {
    name: 'search_bookmarks',
    description: 'Search existing bookmarks by title, URL, or tags.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_bookmarks',
    description: 'List all bookmarks, optionally filtered by collection.',
    parameters: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Filter by collection (optional)' },
        limit: { type: 'number', description: 'Max number of bookmarks to return (default 10)' },
      },
      required: [],
    },
  },

  // ============ RESEARCH & PLANNING TOOLS ============
  {
    name: 'research_and_plan',
    description: 'Create a study/research plan with linked resources. Creates a task and saves related bookmarks linked to that task. Use when user asks for a learning plan, study resources, or research on a topic.',
    parameters: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'The topic to research (e.g., "prompt engineering", "React hooks")' },
        taskTitle: { type: 'string', description: 'Title for the main task (e.g., "Prompt Engineering Öğren")' },
        subtasks: { type: 'array', items: { type: 'string' }, description: 'Subtasks/steps for the learning plan' },
        resources: { 
          type: 'array', 
          items: { 
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL of the resource' },
              title: { type: 'string', description: 'Title of the resource' },
              description: { type: 'string', description: 'Description of the resource' }
            }
          }, 
          description: 'Resources to save as bookmarks (from web search results)' 
        },
        tags: { type: 'array', items: { type: 'string' }, description: 'Common tags for both task and bookmarks' },
        priority: { type: 'string', description: 'Task priority', enum: ['P1', 'P2', 'P3', 'P4'] },
      },
      required: ['topic', 'taskTitle', 'resources'],
    },
  },

  // ============ WEB SEARCH TOOLS ============
  {
    name: 'web_search',
    description: 'Search the web for information. Use this to find resources, articles, or answers. Returns search results that can be saved as bookmarks.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        numResults: { type: 'number', description: 'Number of results to return (default 5, max 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'save_search_results_as_bookmarks',
    description: 'Save web search results as bookmarks. Use after web_search to save useful results.',
    parameters: {
      type: 'object',
      properties: {
        results: { type: 'array', items: { type: 'object' }, description: 'Array of search results with url, title, description' },
        collection: { type: 'string', description: 'Collection to save to', enum: ['Gold', 'Silver', 'Bronze', 'Unsorted'] },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags to apply to all bookmarks' },
      },
      required: ['results'],
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
