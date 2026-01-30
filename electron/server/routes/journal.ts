import { Router, Request, Response } from 'express';
import { storeBridge } from '../bridges/storeBridge';
import { logger } from '../utils/logger';

const router = Router();

// Types
interface JournalEntry {
  id: string;
  date: string;
  mood: number;
  energy: number;
  content: string;
  tags: string[];
}

interface CreateJournalRequest {
  date?: string;
  content?: string;
  mood?: number;
  energy?: number;
  tags?: string[];
}

interface UpdateJournalRequest {
  content?: string;
  mood?: number;
  energy?: number;
  tags?: string[];
}

// Helper to get today's date
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// GET /api/journal - List all entries
router.get('/', async (req: Request, res: Response) => {
  try {
    let entries = await storeBridge.getAll<JournalEntry>('journal');

    // Filter by date range
    const { from, to } = req.query;

    if (from) {
      entries = entries.filter(e => e.date >= (from as string));
    }

    if (to) {
      entries = entries.filter(e => e.date <= (to as string));
    }

    // Sort by date descending
    entries.sort((a, b) => b.date.localeCompare(a.date));

    res.json({
      success: true,
      data: entries,
      count: entries.length,
    });
  } catch (error) {
    logger.error('Failed to get journal entries:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// GET /api/journal/moods - Get mood statistics
router.get('/moods', async (req: Request, res: Response) => {
  try {
    const entries = await storeBridge.getAll<JournalEntry>('journal');

    const { days = '30' } = req.query;
    const daysCount = parseInt(days as string, 10);

    // Get entries from last N days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysCount);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const recentEntries = entries.filter(e => e.date >= cutoffDateStr);

    const moodStats = {
      averageMood: 0,
      averageEnergy: 0,
      totalEntries: recentEntries.length,
      moodDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      energyDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      trend: [] as { date: string; mood: number; energy: number }[],
    };

    if (recentEntries.length > 0) {
      let totalMood = 0;
      let totalEnergy = 0;

      recentEntries.forEach(entry => {
        totalMood += entry.mood;
        totalEnergy += entry.energy;

        const moodKey = entry.mood as keyof typeof moodStats.moodDistribution;
        const energyKey = entry.energy as keyof typeof moodStats.energyDistribution;

        if (moodStats.moodDistribution[moodKey] !== undefined) {
          moodStats.moodDistribution[moodKey]++;
        }
        if (moodStats.energyDistribution[energyKey] !== undefined) {
          moodStats.energyDistribution[energyKey]++;
        }

        moodStats.trend.push({
          date: entry.date,
          mood: entry.mood,
          energy: entry.energy,
        });
      });

      moodStats.averageMood = Math.round((totalMood / recentEntries.length) * 100) / 100;
      moodStats.averageEnergy = Math.round((totalEnergy / recentEntries.length) * 100) / 100;
      moodStats.trend.sort((a, b) => a.date.localeCompare(b.date));
    }

    res.json({
      success: true,
      data: moodStats,
      period: `${daysCount} days`,
    });
  } catch (error) {
    logger.error('Failed to get mood stats:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// GET /api/journal/:date - Get entry for specific date
router.get('/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    const entry = await storeBridge.getById<JournalEntry>('journal', date);

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Journal entry not found for this date',
      });
    }

    res.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    logger.error('Failed to get journal entry:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// POST /api/journal - Create or update entry
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as CreateJournalRequest;
    const date = body.date || getToday();

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    // Validate mood and energy (1-5)
    if (body.mood !== undefined && (body.mood < 1 || body.mood > 5)) {
      return res.status(400).json({
        success: false,
        error: 'Mood must be between 1 and 5',
      });
    }

    if (body.energy !== undefined && (body.energy < 1 || body.energy > 5)) {
      return res.status(400).json({
        success: false,
        error: 'Energy must be between 1 and 5',
      });
    }

    const entry = await storeBridge.create<JournalEntry>('journal', {
      date,
      content: body.content || '',
      mood: body.mood || 3,
      energy: body.energy || 3,
      tags: body.tags || [],
    });

    logger.info(`Created/updated journal entry: ${date}`);

    res.status(201).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    logger.error('Failed to create journal entry:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// PUT /api/journal/:date - Update entry
router.put('/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const body = req.body as UpdateJournalRequest;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    // Validate mood and energy (1-5)
    if (body.mood !== undefined && (body.mood < 1 || body.mood > 5)) {
      return res.status(400).json({
        success: false,
        error: 'Mood must be between 1 and 5',
      });
    }

    if (body.energy !== undefined && (body.energy < 1 || body.energy > 5)) {
      return res.status(400).json({
        success: false,
        error: 'Energy must be between 1 and 5',
      });
    }

    const entry = await storeBridge.update<JournalEntry>('journal', date, body);

    logger.info(`Updated journal entry: ${date}`);

    res.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    logger.error('Failed to update journal entry:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// DELETE /api/journal/:date - Delete entry
router.delete('/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    await storeBridge.delete('journal', date);

    logger.info(`Deleted journal entry: ${date}`);

    res.json({
      success: true,
      message: 'Journal entry deleted',
    });
  } catch (error) {
    logger.error('Failed to delete journal entry:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
