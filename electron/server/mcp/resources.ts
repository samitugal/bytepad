import { storeBridge } from '../bridges/storeBridge';
import { logger } from '../utils/logger';

// Resource definitions
export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const resourceList: MCPResource[] = [
  {
    uri: 'bytepad://notes',
    name: 'All Notes',
    description: 'List of all notes in bytepad',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://notes/{id}',
    name: 'Single Note',
    description: 'Get a specific note by ID',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://tasks',
    name: 'All Tasks',
    description: 'List of all tasks in bytepad',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://tasks/{id}',
    name: 'Single Task',
    description: 'Get a specific task by ID',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://tasks/pending',
    name: 'Pending Tasks',
    description: 'List of pending (incomplete) tasks',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://habits',
    name: 'All Habits',
    description: 'List of all habits with today\'s status',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://journal',
    name: 'Journal Entries',
    description: 'List of all journal entries',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://journal/{date}',
    name: 'Journal Entry',
    description: 'Get journal entry for a specific date (YYYY-MM-DD)',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://bookmarks',
    name: 'All Bookmarks',
    description: 'List of all bookmarks',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://ideas',
    name: 'All Ideas',
    description: 'List of all active ideas',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://today',
    name: 'Today Summary',
    description: 'Aggregated view of today\'s tasks, habits, and stats',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://stats',
    name: 'Productivity Stats',
    description: 'Overall productivity statistics',
    mimeType: 'application/json',
  },
];

// Parse URI and extract resource type and ID
function parseResourceUri(uri: string): { type: string; id?: string } | null {
  const match = uri.match(/^bytepad:\/\/(\w+)(?:\/(.+))?$/);
  if (!match) return null;
  return { type: match[1], id: match[2] };
}

// Read resource content
export async function readResource(uri: string): Promise<{ contents: { uri: string; mimeType: string; text: string }[] }> {
  const parsed = parseResourceUri(uri);
  if (!parsed) {
    throw new Error(`Invalid resource URI: ${uri}`);
  }

  const { type, id } = parsed;
  let data: unknown;

  try {
    switch (type) {
      case 'notes':
        if (id) {
          data = await storeBridge.getById('notes', id);
          if (!data) throw new Error('Note not found');
        } else {
          data = await storeBridge.getAll('notes');
        }
        break;

      case 'tasks':
        if (id === 'pending') {
          const allTasks = await storeBridge.getAll('tasks') as { completed: boolean; archivedAt?: string }[];
          data = allTasks.filter(t => !t.completed && !t.archivedAt);
        } else if (id) {
          data = await storeBridge.getById('tasks', id);
          if (!data) throw new Error('Task not found');
        } else {
          data = await storeBridge.getAll('tasks');
        }
        break;

      case 'habits':
        if (id) {
          data = await storeBridge.getById('habits', id);
          if (!data) throw new Error('Habit not found');
        } else {
          const habits = await storeBridge.getAll('habits') as { completions: Record<string, boolean> }[];
          const today = new Date().toISOString().split('T')[0];
          data = habits.map(h => ({
            ...h,
            completedToday: !!h.completions[today],
          }));
        }
        break;

      case 'journal':
        if (id) {
          data = await storeBridge.getById('journal', id);
          if (!data) throw new Error('Journal entry not found');
        } else {
          data = await storeBridge.getAll('journal');
        }
        break;

      case 'bookmarks':
        if (id) {
          data = await storeBridge.getById('bookmarks', id);
          if (!data) throw new Error('Bookmark not found');
        } else {
          data = await storeBridge.getAll('bookmarks');
        }
        break;

      case 'ideas':
        if (id) {
          data = await storeBridge.getById('ideas', id);
          if (!data) throw new Error('Idea not found');
        } else {
          const ideas = await storeBridge.getAll('ideas') as { status: string }[];
          data = ideas.filter(i => i.status === 'active');
        }
        break;

      case 'today':
        data = await getTodaySummary();
        break;

      case 'stats':
        data = await getProductivityStats();
        break;

      default:
        throw new Error(`Unknown resource type: ${type}`);
    }

    logger.debug(`Read resource: ${uri}`);

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2),
      }],
    };
  } catch (error) {
    logger.error(`Failed to read resource ${uri}:`, error);
    throw error;
  }
}

// Get today's summary
async function getTodaySummary() {
  const today = new Date().toISOString().split('T')[0];

  const [tasks, habits, journal, gamification] = await Promise.all([
    storeBridge.getAll('tasks'),
    storeBridge.getAll('habits'),
    storeBridge.getById('journal', today),
    storeBridge.getState('gamification'),
  ]);

  const tasksArray = tasks as { completed: boolean; archivedAt?: string; deadline?: string; completedAt?: string }[];
  const habitsArray = habits as { completions: Record<string, boolean> }[];
  const gamificationState = gamification as { dailyXP?: number };

  const activeTasks = tasksArray.filter(t => !t.archivedAt);
  const completedToday = activeTasks.filter(t =>
    t.completedAt && t.completedAt.startsWith(today)
  ).length;
  const overdue = activeTasks.filter(t =>
    !t.completed && t.deadline && t.deadline < today
  ).length;

  const completedHabits = habitsArray.filter(h => h.completions[today]).length;

  return {
    date: today,
    tasks: {
      total: activeTasks.length,
      completed: completedToday,
      pending: activeTasks.filter(t => !t.completed).length,
      overdue,
    },
    habits: {
      total: habitsArray.length,
      completed: completedHabits,
      remaining: habitsArray.length - completedHabits,
    },
    journal: journal ? {
      mood: (journal as { mood?: number }).mood,
      energy: (journal as { energy?: number }).energy,
      hasEntry: true,
    } : {
      hasEntry: false,
    },
    xpEarned: gamificationState?.dailyXP || 0,
  };
}

// Get productivity stats
async function getProductivityStats() {
  const [notes, tasks, habits, journal, bookmarks, ideas, gamification] = await Promise.all([
    storeBridge.getAll('notes'),
    storeBridge.getAll('tasks'),
    storeBridge.getAll('habits'),
    storeBridge.getAll('journal'),
    storeBridge.getAll('bookmarks'),
    storeBridge.getAll('ideas'),
    storeBridge.getState('gamification'),
  ]);

  const tasksArray = tasks as { completed: boolean; archivedAt?: string }[];
  const gamificationState = gamification as { level?: number; totalXP?: number; currentStreak?: number };

  return {
    counts: {
      notes: notes.length,
      tasks: {
        total: tasks.length,
        completed: tasksArray.filter(t => t.completed).length,
        pending: tasksArray.filter(t => !t.completed && !t.archivedAt).length,
      },
      habits: habits.length,
      journalEntries: journal.length,
      bookmarks: bookmarks.length,
      ideas: ideas.length,
    },
    gamification: {
      level: gamificationState?.level || 1,
      totalXP: gamificationState?.totalXP || 0,
      currentStreak: gamificationState?.currentStreak || 0,
    },
  };
}
