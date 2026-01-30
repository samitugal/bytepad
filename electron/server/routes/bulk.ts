import { Router, Request, Response } from 'express';
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

// GET /api/bulk/stats - Get aggregate statistics
router.get('/stats', async (req: Request, res: Response) => {
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
router.post('/export', async (req: Request, res: Response) => {
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
    const importData = req.body as ExportData;

    // Validate structure
    if (!importData.data) {
      return res.status(400).json({
        success: false,
        error: 'Invalid import data: missing "data" field',
      });
    }

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
        try {
          await storeBridge.create('notes', note);
          results.notes++;
        } catch (error) {
          results.errors.push(`Note import error: ${(error as Error).message}`);
        }
      }
    }

    // Import tasks
    if (importData.data.tasks && Array.isArray(importData.data.tasks)) {
      for (const task of importData.data.tasks) {
        try {
          await storeBridge.create('tasks', task);
          results.tasks++;
        } catch (error) {
          results.errors.push(`Task import error: ${(error as Error).message}`);
        }
      }
    }

    // Import habits
    if (importData.data.habits && Array.isArray(importData.data.habits)) {
      for (const habit of importData.data.habits) {
        try {
          await storeBridge.create('habits', habit);
          results.habits++;
        } catch (error) {
          results.errors.push(`Habit import error: ${(error as Error).message}`);
        }
      }
    }

    // Import journal entries
    if (importData.data.journal && Array.isArray(importData.data.journal)) {
      for (const entry of importData.data.journal) {
        try {
          await storeBridge.create('journal', entry);
          results.journal++;
        } catch (error) {
          results.errors.push(`Journal import error: ${(error as Error).message}`);
        }
      }
    }

    // Import bookmarks
    if (importData.data.bookmarks && Array.isArray(importData.data.bookmarks)) {
      for (const bookmark of importData.data.bookmarks) {
        try {
          await storeBridge.create('bookmarks', bookmark);
          results.bookmarks++;
        } catch (error) {
          results.errors.push(`Bookmark import error: ${(error as Error).message}`);
        }
      }
    }

    // Import ideas
    if (importData.data.ideas && Array.isArray(importData.data.ideas)) {
      for (const idea of importData.data.ideas) {
        try {
          await storeBridge.create('ideas', idea);
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
router.get('/today', async (req: Request, res: Response) => {
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
