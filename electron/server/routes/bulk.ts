import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storeBridge } from '../bridges/storeBridge';
import { logger } from '../utils/logger';

const router = Router();

// Types for export data
interface ExportData {
  version: number;
  exportedAt: string;
  data: {
    notes: unknown[];
    tasks: unknown[];
    habits: unknown[];
    journal: unknown[];
    bookmarks: unknown[];
    ideas: unknown[];
    dailyNotes: unknown[];
    focusSessions: unknown[];
    gamification: unknown;
    focusStats: unknown;
  };
}

// Import schemas - each mirrors the fields the entity stores accept.
// Unknown/unexpected keys on each item are stripped by default zod object
// behavior, so imported payloads can only write whitelisted fields into
// the stores instead of arbitrary attacker-controlled objects.

const noteImportSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().optional(),
  pinned: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const taskImportSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).optional(),
  deadline: z.string().optional(),
  deadlineTime: z.string().optional(),
  completed: z.boolean().optional(),
  completedAt: z.string().optional(),
  archivedAt: z.string().optional(),
  subtasks: z.array(z.object({
    id: z.string().optional(),
    title: z.string(),
    completed: z.boolean().optional(),
  })).optional(),
  tags: z.array(z.string()).optional(),
  linkedBookmarkIds: z.array(z.string()).optional(),
  linkedNoteIds: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const habitImportSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  frequency: z.enum(['daily', 'weekly']).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  completions: z.record(z.string(), z.boolean()).optional(),
  streak: z.number().optional(),
  createdAt: z.string().optional(),
  reminderEnabled: z.boolean().optional(),
  reminderTime: z.string().optional(),
});

const journalImportSchema = z.object({
  id: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  mood: z.number().min(1).max(5).optional(),
  energy: z.number().min(1).max(5).optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const bookmarkImportSchema = z.object({
  id: z.string().optional(),
  url: z.string().url(),
  title: z.string().min(1),
  description: z.string().optional(),
  favicon: z.string().optional(),
  image: z.string().optional(),
  tags: z.array(z.string()).optional(),
  collection: z.string().optional(),
  isRead: z.boolean().optional(),
  createdAt: z.string().optional(),
  domain: z.string().optional(),
  linkedTaskId: z.string().optional(),
  linkedNoteId: z.string().optional(),
});

const ideaImportSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  content: z.string().max(280).optional(),
  color: z.enum(['yellow', 'green', 'blue', 'purple', 'orange', 'red', 'cyan']).optional(),
  tags: z.array(z.string()).optional(),
  linkedNoteIds: z.array(z.string()).optional(),
  linkedTaskIds: z.array(z.string()).optional(),
  status: z.enum(['active', 'archived', 'converted']).optional(),
  order: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Top-level import body: only checks the envelope shape. Each entity array,
// if present, must be an array - individual items are validated (and
// unknown fields stripped) per-item below so a single bad record doesn't
// reject the whole import, matching prior permissive behavior.
const importBodySchema = z.object({
  version: z.number().optional(),
  exportedAt: z.string().optional(),
  data: z.object({
    notes: z.array(z.unknown()).optional(),
    tasks: z.array(z.unknown()).optional(),
    habits: z.array(z.unknown()).optional(),
    journal: z.array(z.unknown()).optional(),
    bookmarks: z.array(z.unknown()).optional(),
    ideas: z.array(z.unknown()).optional(),
    dailyNotes: z.array(z.unknown()).optional(),
    focusSessions: z.array(z.unknown()).optional(),
    gamification: z.unknown().optional(),
    focusStats: z.unknown().optional(),
  }, { message: 'Invalid import data: missing "data" field' }),
});

// GET /api/bulk/stats - Get aggregate statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [notes, tasks, habits, journal, bookmarks, ideas, focus, gamification] = await Promise.all([
      storeBridge.getAll('notes'),
      storeBridge.getAll('tasks'),
      storeBridge.getAll('habits'),
      storeBridge.getAll('journal'),
      storeBridge.getAll('bookmarks'),
      storeBridge.getAll('ideas'),
      storeBridge.getState('focus'),
      storeBridge.getState('gamification'),
    ]);

    const tasksArray = tasks as { completed: boolean; archivedAt?: string }[];
    const habitsArray = habits as { completions: Record<string, boolean> }[];
    const ideasArray = ideas as { status: string }[];
    const focusState = focus as { sessions?: unknown[] };
    const gamificationState = gamification as { level?: number; totalXP?: number };

    const today = new Date().toISOString().split('T')[0];

    res.json({
      success: true,
      data: {
        counts: {
          notes: notes.length,
          tasks: {
            total: tasks.length,
            completed: tasksArray.filter(t => t.completed).length,
            pending: tasksArray.filter(t => !t.completed && !t.archivedAt).length,
            archived: tasksArray.filter(t => t.archivedAt).length,
          },
          habits: {
            total: habits.length,
            completedToday: habitsArray.filter(h => h.completions[today]).length,
          },
          journal: journal.length,
          bookmarks: bookmarks.length,
          ideas: {
            total: ideas.length,
            active: ideasArray.filter(i => i.status === 'active').length,
            archived: ideasArray.filter(i => i.status === 'archived').length,
            converted: ideasArray.filter(i => i.status === 'converted').length,
          },
          focusSessions: focusState?.sessions?.length || 0,
        },
        gamification: {
          level: gamificationState?.level || 1,
          totalXP: gamificationState?.totalXP || 0,
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to get stats:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// POST /api/bulk/export - Export all data as JSON
router.post('/export', async (_req: Request, res: Response) => {
  try {
    logger.info('Starting data export...');

    const [notes, tasks, habits, journal, bookmarks, ideas, dailyNotes, focus, gamification] = await Promise.all([
      storeBridge.getAll('notes'),
      storeBridge.getAll('tasks'),
      storeBridge.getAll('habits'),
      storeBridge.getAll('journal'),
      storeBridge.getAll('bookmarks'),
      storeBridge.getAll('ideas'),
      storeBridge.getAll('dailyNotes'),
      storeBridge.getState('focus'),
      storeBridge.getState('gamification'),
    ]);

    const focusState = focus as { sessions?: unknown[]; focusStreak?: unknown };

    const exportData: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        notes,
        tasks,
        habits,
        journal,
        bookmarks,
        ideas,
        dailyNotes,
        focusSessions: focusState?.sessions || [],
        gamification,
        focusStats: {
          focusStreak: focusState?.focusStreak,
        },
      },
    };

    logger.info('Data export completed');

    res.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    logger.error('Failed to export data:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// POST /api/bulk/import - Import data from JSON
router.post('/import', async (req: Request, res: Response) => {
  try {
    const parsedBody = importBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        success: false,
        error: parsedBody.error.issues.map(i => i.message).join('; '),
      });
    }
    const importData = parsedBody.data;

    logger.info('Starting data import...');

    const results = {
      notes: 0,
      tasks: 0,
      habits: 0,
      journal: 0,
      bookmarks: 0,
      ideas: 0,
      errors: [] as string[],
    };

    // Import notes
    if (importData.data.notes && Array.isArray(importData.data.notes)) {
      for (const note of importData.data.notes) {
        const parsed = noteImportSchema.safeParse(note);
        if (!parsed.success) {
          results.errors.push(`Note import error: ${parsed.error.issues.map(i => i.message).join('; ')}`);
          continue;
        }
        try {
          await storeBridge.create('notes', parsed.data);
          results.notes++;
        } catch (error) {
          results.errors.push(`Note import error: ${(error as Error).message}`);
        }
      }
    }

    // Import tasks
    if (importData.data.tasks && Array.isArray(importData.data.tasks)) {
      for (const task of importData.data.tasks) {
        const parsed = taskImportSchema.safeParse(task);
        if (!parsed.success) {
          results.errors.push(`Task import error: ${parsed.error.issues.map(i => i.message).join('; ')}`);
          continue;
        }
        try {
          await storeBridge.create('tasks', parsed.data);
          results.tasks++;
        } catch (error) {
          results.errors.push(`Task import error: ${(error as Error).message}`);
        }
      }
    }

    // Import habits
    if (importData.data.habits && Array.isArray(importData.data.habits)) {
      for (const habit of importData.data.habits) {
        const parsed = habitImportSchema.safeParse(habit);
        if (!parsed.success) {
          results.errors.push(`Habit import error: ${parsed.error.issues.map(i => i.message).join('; ')}`);
          continue;
        }
        try {
          await storeBridge.create('habits', parsed.data);
          results.habits++;
        } catch (error) {
          results.errors.push(`Habit import error: ${(error as Error).message}`);
        }
      }
    }

    // Import journal entries
    if (importData.data.journal && Array.isArray(importData.data.journal)) {
      for (const entry of importData.data.journal) {
        const parsed = journalImportSchema.safeParse(entry);
        if (!parsed.success) {
          results.errors.push(`Journal import error: ${parsed.error.issues.map(i => i.message).join('; ')}`);
          continue;
        }
        try {
          await storeBridge.create('journal', parsed.data);
          results.journal++;
        } catch (error) {
          results.errors.push(`Journal import error: ${(error as Error).message}`);
        }
      }
    }

    // Import bookmarks
    if (importData.data.bookmarks && Array.isArray(importData.data.bookmarks)) {
      for (const bookmark of importData.data.bookmarks) {
        const parsed = bookmarkImportSchema.safeParse(bookmark);
        if (!parsed.success) {
          results.errors.push(`Bookmark import error: ${parsed.error.issues.map(i => i.message).join('; ')}`);
          continue;
        }
        try {
          await storeBridge.create('bookmarks', parsed.data);
          results.bookmarks++;
        } catch (error) {
          results.errors.push(`Bookmark import error: ${(error as Error).message}`);
        }
      }
    }

    // Import ideas
    if (importData.data.ideas && Array.isArray(importData.data.ideas)) {
      for (const idea of importData.data.ideas) {
        const parsed = ideaImportSchema.safeParse(idea);
        if (!parsed.success) {
          results.errors.push(`Idea import error: ${parsed.error.issues.map(i => i.message).join('; ')}`);
          continue;
        }
        try {
          await storeBridge.create('ideas', parsed.data);
          results.ideas++;
        } catch (error) {
          results.errors.push(`Idea import error: ${(error as Error).message}`);
        }
      }
    }

    logger.info(`Data import completed: ${JSON.stringify(results)}`);

    res.json({
      success: true,
      data: {
        imported: results,
        hasErrors: results.errors.length > 0,
      },
    });
  } catch (error) {
    logger.error('Failed to import data:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// GET /api/bulk/today - Get today's summary
router.get('/today', async (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [tasks, habits, journal, focus, gamification] = await Promise.all([
      storeBridge.getAll('tasks'),
      storeBridge.getAll('habits'),
      storeBridge.getById('journal', today),
      storeBridge.getState('focus'),
      storeBridge.getState('gamification'),
    ]);

    const tasksArray = tasks as { completed: boolean; archivedAt?: string; deadline?: string; completedAt?: string }[];
    const habitsArray = habits as { completions: Record<string, boolean> }[];
    const focusState = focus as { sessions?: { date?: string }[] };
    const gamificationState = gamification as { dailyXP?: number };

    // Calculate today's tasks
    const todayTasks = tasksArray.filter(t => !t.archivedAt);
    const completedToday = todayTasks.filter(t =>
      t.completedAt && t.completedAt.startsWith(today)
    ).length;
    const overdue = todayTasks.filter(t =>
      !t.completed && t.deadline && t.deadline < today
    ).length;

    // Calculate today's habits
    const completedHabits = habitsArray.filter(h => h.completions[today]).length;
    const remainingHabits = habitsArray.length - completedHabits;

    // Calculate today's focus sessions
    const todaySessions = focusState?.sessions?.filter(s =>
      s.date && s.date.startsWith(today)
    ).length || 0;

    res.json({
      success: true,
      data: {
        date: today,
        tasks: {
          total: todayTasks.length,
          completed: completedToday,
          pending: todayTasks.filter(t => !t.completed).length,
          overdue,
        },
        habits: {
          total: habitsArray.length,
          completed: completedHabits,
          remaining: remainingHabits,
        },
        journal: journal ? {
          mood: (journal as { mood?: number }).mood,
          energy: (journal as { energy?: number }).energy,
          hasEntry: true,
        } : {
          hasEntry: false,
        },
        focus: {
          sessions: todaySessions,
        },
        xpEarned: gamificationState?.dailyXP || 0,
      },
    });
  } catch (error) {
    logger.error('Failed to get today summary:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
