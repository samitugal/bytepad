import { Router, Request, Response } from 'express';
import { storeBridge } from '../bridges/storeBridge';
import { logger } from '../utils/logger';

const router = Router();

// Types
interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  category?: string;
  tags?: string[];
  completions: Record<string, boolean>;
  streak: number;
  createdAt: string;
  reminderEnabled?: boolean;
  reminderTime?: string;
}

interface CreateHabitRequest {
  name: string;
  frequency?: 'daily' | 'weekly';
  category?: string;
  tags?: string[];
  reminderEnabled?: boolean;
  reminderTime?: string;
}

interface UpdateHabitRequest {
  name?: string;
  frequency?: 'daily' | 'weekly';
  category?: string;
  tags?: string[];
  reminderEnabled?: boolean;
  reminderTime?: string;
}

// Helper to get today's date
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// GET /api/habits - List all habits
router.get('/', async (req: Request, res: Response) => {
  try {
    const habits = await storeBridge.getAll<Habit>('habits');
    const today = getToday();

    // Add today's status to each habit
    const habitsWithStatus = habits.map(habit => ({
      ...habit,
      completedToday: !!habit.completions[today],
    }));

    res.json({
      success: true,
      data: habitsWithStatus,
      count: habits.length,
      date: today,
    });
  } catch (error) {
    logger.error('Failed to get habits:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// GET /api/habits/:id - Get single habit with completion history
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const habit = await storeBridge.getById<Habit>('habits', id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found',
      });
    }

    const today = getToday();

    res.json({
      success: true,
      data: {
        ...habit,
        completedToday: !!habit.completions[today],
      },
    });
  } catch (error) {
    logger.error('Failed to get habit:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// GET /api/habits/:id/stats - Get habit statistics
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const habit = await storeBridge.getById<Habit>('habits', id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found',
      });
    }

    const completions = Object.entries(habit.completions);
    const totalDays = completions.length;
    const completedDays = completions.filter(([_, completed]) => completed).length;
    const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

    // Calculate longest streak
    const sortedDates = completions
      .filter(([_, completed]) => completed)
      .map(([date]) => date)
      .sort();

    let longestStreak = 0;
    let currentStreak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    res.json({
      success: true,
      data: {
        habitId: id,
        name: habit.name,
        currentStreak: habit.streak,
        longestStreak,
        totalDays,
        completedDays,
        completionRate: Math.round(completionRate * 100) / 100,
      },
    });
  } catch (error) {
    logger.error('Failed to get habit stats:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// POST /api/habits - Create habit
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as CreateHabitRequest;

    if (!body.name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required',
      });
    }

    const habit = await storeBridge.create<Habit>('habits', {
      name: body.name,
      frequency: body.frequency || 'daily',
      category: body.category,
      tags: body.tags,
      reminderEnabled: body.reminderEnabled,
      reminderTime: body.reminderTime,
    });

    logger.info(`Created habit: ${habit.id}`);

    res.status(201).json({
      success: true,
      data: habit,
    });
  } catch (error) {
    logger.error('Failed to create habit:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// PUT /api/habits/:id - Update habit
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body as UpdateHabitRequest;

    const existing = await storeBridge.getById<Habit>('habits', id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found',
      });
    }

    const habit = await storeBridge.update<Habit>('habits', id, body);

    logger.info(`Updated habit: ${id}`);

    res.json({
      success: true,
      data: habit,
    });
  } catch (error) {
    logger.error('Failed to update habit:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// POST /api/habits/:id/complete - Toggle completion for today
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await storeBridge.getById<Habit>('habits', id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found',
      });
    }

    await storeBridge.action('habits', 'toggleCompletion', id);
    const habit = await storeBridge.getById<Habit>('habits', id);
    const today = getToday();

    logger.info(`Toggled habit completion: ${id} for ${today}`);

    res.json({
      success: true,
      data: {
        ...habit,
        completedToday: !!habit?.completions[today],
      },
    });
  } catch (error) {
    logger.error('Failed to toggle habit completion:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// POST /api/habits/:id/complete/:date - Toggle completion for specific date
router.post('/:id/complete/:date', async (req: Request, res: Response) => {
  try {
    const { id, date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    const existing = await storeBridge.getById<Habit>('habits', id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found',
      });
    }

    await storeBridge.action('habits', 'toggleCompletion', id, date);
    const habit = await storeBridge.getById<Habit>('habits', id);

    logger.info(`Toggled habit completion: ${id} for ${date}`);

    res.json({
      success: true,
      data: {
        ...habit,
        completedOnDate: !!habit?.completions[date],
        date,
      },
    });
  } catch (error) {
    logger.error('Failed to toggle habit completion:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// DELETE /api/habits/:id - Delete habit
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await storeBridge.getById<Habit>('habits', id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found',
      });
    }

    await storeBridge.delete('habits', id);

    logger.info(`Deleted habit: ${id}`);

    res.json({
      success: true,
      message: 'Habit deleted',
    });
  } catch (error) {
    logger.error('Failed to delete habit:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
