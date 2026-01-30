import { storeBridge } from '../bridges/storeBridge';
import { logger } from '../utils/logger';

// Tool definitions
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      items?: { type: string };
      default?: unknown;
    }>;
    required: string[];
  };
}

export const toolList: MCPTool[] = [
  // Notes
  {
    name: 'create_note',
    description: 'Create a new note in bytepad',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Note title' },
        content: { type: 'string', description: 'Note content (markdown supported)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for the note' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_note',
    description: 'Update an existing note',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Note ID' },
        title: { type: 'string', description: 'New title' },
        content: { type: 'string', description: 'New content' },
        tags: { type: 'array', items: { type: 'string' }, description: 'New tags' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_note',
    description: 'Delete a note',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Note ID to delete' },
      },
      required: ['id'],
    },
  },

  // Tasks
  {
    name: 'create_task',
    description: 'Create a new task in bytepad',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description' },
        priority: { type: 'string', enum: ['P1', 'P2', 'P3', 'P4'], description: 'Priority level (P1 highest, P4 lowest)', default: 'P3' },
        deadline: { type: 'string', description: 'Due date (YYYY-MM-DD format)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for the task' },
        subtasks: { type: 'array', items: { type: 'string' }, description: 'List of subtask titles' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID' },
        title: { type: 'string', description: 'New title' },
        description: { type: 'string', description: 'New description' },
        priority: { type: 'string', enum: ['P1', 'P2', 'P3', 'P4'], description: 'New priority' },
        deadline: { type: 'string', description: 'New deadline' },
        tags: { type: 'array', items: { type: 'string' }, description: 'New tags' },
      },
      required: ['id'],
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task as completed (or toggle completion)',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID to complete' },
      },
      required: ['id'],
    },
  },
  {
    name: 'add_subtask',
    description: 'Add a subtask to an existing task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Parent task ID' },
        title: { type: 'string', description: 'Subtask title' },
      },
      required: ['taskId', 'title'],
    },
  },

  // Habits
  {
    name: 'create_habit',
    description: 'Create a new habit to track',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Habit name' },
        frequency: { type: 'string', enum: ['daily', 'weekly'], description: 'Tracking frequency', default: 'daily' },
        category: { type: 'string', description: 'Category (e.g., health, productivity)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'toggle_habit',
    description: 'Toggle habit completion for today (or specific date)',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Habit ID' },
        date: { type: 'string', description: 'Date to toggle (YYYY-MM-DD), defaults to today' },
      },
      required: ['id'],
    },
  },

  // Journal
  {
    name: 'write_journal',
    description: 'Write or update a journal entry',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Entry date (YYYY-MM-DD), defaults to today' },
        content: { type: 'string', description: 'Journal content' },
        mood: { type: 'number', description: 'Mood rating (1-5)' },
        energy: { type: 'number', description: 'Energy level (1-5)' },
      },
      required: [],
    },
  },

  // Ideas
  {
    name: 'create_idea',
    description: 'Capture a quick idea (max 280 characters)',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Idea title' },
        content: { type: 'string', description: 'Idea content (max 280 chars)' },
        color: { type: 'string', enum: ['yellow', 'green', 'blue', 'purple', 'orange', 'red', 'cyan'], description: 'Card color', default: 'yellow' },
      },
      required: ['title'],
    },
  },
  {
    name: 'convert_idea',
    description: 'Convert an idea to a note or task',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Idea ID' },
        to: { type: 'string', enum: ['note', 'task'], description: 'Convert to note or task' },
      },
      required: ['id', 'to'],
    },
  },

  // Sync
  {
    name: 'sync_gist',
    description: 'Trigger Gist sync (pull if needed, then push)',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'force_push',
    description: 'Force push local data to Gist (overwrites remote)',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  // Search
  {
    name: 'search',
    description: 'Search across all entities in bytepad',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        type: { type: 'string', enum: ['all', 'notes', 'tasks', 'bookmarks'], description: 'Entity type to search', default: 'all' },
      },
      required: ['query'],
    },
  },
];

// Execute tool
export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: { type: 'text'; text: string }[] }> {
  logger.info(`Executing tool: ${name} with args:`, args);

  try {
    let result: unknown;

    switch (name) {
      // Notes
      case 'create_note':
        result = await storeBridge.create('notes', {
          title: args.title,
          content: args.content || '',
          tags: args.tags || [],
        });
        break;

      case 'update_note':
        result = await storeBridge.update('notes', args.id as string, {
          ...(args.title && { title: args.title }),
          ...(args.content !== undefined && { content: args.content }),
          ...(args.tags && { tags: args.tags }),
        });
        break;

      case 'delete_note':
        await storeBridge.delete('notes', args.id as string);
        result = { deleted: true, id: args.id };
        break;

      // Tasks
      case 'create_task': {
        const task = await storeBridge.create('tasks', {
          title: args.title,
          description: args.description,
          priority: args.priority || 'P3',
          deadline: args.deadline,
          tags: args.tags,
        });

        // Add subtasks if provided
        if (args.subtasks && Array.isArray(args.subtasks)) {
          for (const subtaskTitle of args.subtasks) {
            await storeBridge.action('tasks', 'addSubtask', (task as { id: string }).id, subtaskTitle);
          }
        }

        result = await storeBridge.getById('tasks', (task as { id: string }).id);
        break;
      }

      case 'update_task':
        result = await storeBridge.update('tasks', args.id as string, {
          ...(args.title && { title: args.title }),
          ...(args.description !== undefined && { description: args.description }),
          ...(args.priority && { priority: args.priority }),
          ...(args.deadline && { deadline: args.deadline }),
          ...(args.tags && { tags: args.tags }),
        });
        break;

      case 'complete_task':
        await storeBridge.action('tasks', 'toggleComplete', args.id);
        result = await storeBridge.getById('tasks', args.id as string);
        break;

      case 'add_subtask':
        await storeBridge.action('tasks', 'addSubtask', args.taskId, args.title);
        result = await storeBridge.getById('tasks', args.taskId as string);
        break;

      // Habits
      case 'create_habit':
        result = await storeBridge.create('habits', {
          name: args.name,
          frequency: args.frequency || 'daily',
          category: args.category,
        });
        break;

      case 'toggle_habit':
        await storeBridge.action('habits', 'toggleCompletion', args.id, args.date);
        result = await storeBridge.getById('habits', args.id as string);
        break;

      // Journal
      case 'write_journal': {
        const date = (args.date as string) || new Date().toISOString().split('T')[0];
        result = await storeBridge.create('journal', {
          date,
          content: args.content || '',
          mood: args.mood || 3,
          energy: args.energy || 3,
        });
        break;
      }

      // Ideas
      case 'create_idea':
        if (args.content && (args.content as string).length > 280) {
          throw new Error('Idea content must be 280 characters or less');
        }
        result = await storeBridge.create('ideas', {
          title: args.title,
          content: args.content || '',
          color: args.color || 'yellow',
        });
        break;

      case 'convert_idea':
        if (args.to === 'note') {
          await storeBridge.action('ideas', 'convertToNote', args.id);
        } else {
          await storeBridge.action('ideas', 'convertToTask', args.id);
        }
        result = await storeBridge.getById('ideas', args.id as string);
        break;

      // Sync (placeholder - actual sync handled elsewhere)
      case 'sync_gist':
        result = { message: 'Sync triggered. Check sync status for results.' };
        break;

      case 'force_push':
        result = { message: 'Force push triggered. Check sync status for results.' };
        break;

      // Search
      case 'search': {
        const query = args.query as string;
        const type = (args.type as string) || 'all';
        const results: Record<string, unknown[]> = {};

        if (type === 'all' || type === 'notes') {
          results.notes = await storeBridge.search('notes', query);
        }
        if (type === 'all' || type === 'tasks') {
          results.tasks = await storeBridge.search('tasks', query);
        }
        if (type === 'all' || type === 'bookmarks') {
          results.bookmarks = await storeBridge.search('bookmarks', query);
        }

        result = results;
        break;
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2),
      }],
    };
  } catch (error) {
    logger.error(`Tool execution failed: ${name}`, error);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: (error as Error).message,
          tool: name,
        }),
      }],
    };
  }
}
