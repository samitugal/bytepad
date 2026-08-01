import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storeBridge } from '../bridges/storeBridge';
import { logger } from '../utils/logger';

const router = Router();

// Types
type IdeaColor = 'yellow' | 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'cyan';
type IdeaStatus = 'active' | 'archived' | 'converted';

interface Idea {
  id: string;
  title: string;
  content: string;
  color: IdeaColor;
  tags: string[];
  linkedNoteIds: string[];
  linkedTaskIds: string[];
  status: IdeaStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const validColors: IdeaColor[] = ['yellow', 'green', 'blue', 'purple', 'orange', 'red', 'cyan'];
const colorEnum = z.enum(validColors as [IdeaColor, ...IdeaColor[]]);

const createIdeaSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().max(280, 'Content must be 280 characters or less').optional(),
  color: colorEnum.optional(),
  tags: z.array(z.string()).optional(),
});

const updateIdeaSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().max(280, 'Content must be 280 characters or less').optional(),
  color: colorEnum.optional(),
  tags: z.array(z.string()).optional(),
});

const convertIdeaSchema = z.object({
  to: z.enum(['note', 'task'], { message: 'Must specify "to" as "note" or "task"' }),
});

// GET /api/ideas - List all ideas
router.get('/', async (req: Request, res: Response) => {
  try {
    let ideas = await storeBridge.getAll<Idea>('ideas');

    // Filter by status
    const { status, color } = req.query;

    if (status) {
      ideas = ideas.filter(i => i.status === status);
    } else {
      // By default, only show active ideas
      ideas = ideas.filter(i => i.status === 'active');
    }

    if (color) {
      ideas = ideas.filter(i => i.color === color);
    }

    // Sort by order
    ideas.sort((a, b) => a.order - b.order);

    res.json({
      success: true,
      data: ideas,
      count: ideas.length,
    });
  } catch (error) {
    logger.error('Failed to get ideas:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// GET /api/ideas/:id - Get single idea
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idea = await storeBridge.getById<Idea>('ideas', id);

    if (!idea) {
      return res.status(404).json({
        success: false,
        error: 'Idea not found',
      });
    }

    res.json({
      success: true,
      data: idea,
    });
  } catch (error) {
    logger.error('Failed to get idea:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// POST /api/ideas - Create idea
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = createIdeaSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues.map(i => i.message).join('; '),
      });
    }
    const body = parsed.data;

    const idea = await storeBridge.create<Idea>('ideas', {
      title: body.title,
      content: body.content || '',
      color: body.color || 'yellow',
      tags: body.tags || [],
    });

    logger.info(`Created idea: ${idea.id}`);

    res.status(201).json({
      success: true,
      data: idea,
    });
  } catch (error) {
    logger.error('Failed to create idea:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// PUT /api/ideas/:id - Update idea
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await storeBridge.getById<Idea>('ideas', id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Idea not found',
      });
    }

    const parsed = updateIdeaSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues.map(i => i.message).join('; '),
      });
    }
    const body = parsed.data;

    const idea = await storeBridge.update<Idea>('ideas', id, body);

    logger.info(`Updated idea: ${id}`);

    res.json({
      success: true,
      data: idea,
    });
  } catch (error) {
    logger.error('Failed to update idea:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// POST /api/ideas/:id/convert - Convert idea to note or task
router.post('/:id/convert', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = convertIdeaSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues.map(i => i.message).join('; '),
      });
    }
    const { to } = parsed.data;

    const existing = await storeBridge.getById<Idea>('ideas', id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Idea not found',
      });
    }

    if (to === 'note') {
      await storeBridge.action('ideas', 'convertToNote', id);
    } else {
      await storeBridge.action('ideas', 'convertToTask', id);
    }

    const idea = await storeBridge.getById<Idea>('ideas', id);

    logger.info(`Converted idea ${id} to ${to}`);

    res.json({
      success: true,
      data: idea,
      message: `Idea converted to ${to}`,
    });
  } catch (error) {
    logger.error('Failed to convert idea:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// POST /api/ideas/:id/archive - Archive idea
router.post('/:id/archive', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await storeBridge.getById<Idea>('ideas', id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Idea not found',
      });
    }

    await storeBridge.action('ideas', 'archiveIdea', id);
    const idea = await storeBridge.getById<Idea>('ideas', id);

    logger.info(`Archived idea: ${id}`);

    res.json({
      success: true,
      data: idea,
    });
  } catch (error) {
    logger.error('Failed to archive idea:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// DELETE /api/ideas/:id - Delete idea
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await storeBridge.getById<Idea>('ideas', id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Idea not found',
      });
    }

    await storeBridge.delete('ideas', id);

    logger.info(`Deleted idea: ${id}`);

    res.json({
      success: true,
      message: 'Idea deleted',
    });
  } catch (error) {
    logger.error('Failed to delete idea:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
