import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storeBridge } from '../bridges/storeBridge';
import { logger } from '../utils/logger';

const router = Router();

// Params
interface IdParams {
  id: string;
}

// Types
interface Bookmark {
  id: string;
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  image?: string;
  tags: string[];
  collection?: string;
  isRead: boolean;
  createdAt: string;
  domain: string;
  linkedTaskId?: string;
  linkedNoteId?: string;
}

const createBookmarkSchema = z.object({
  url: z.string().min(1, 'URL is required').url('Invalid URL format'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  collection: z.string().optional(),
});

const updateBookmarkSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  collection: z.string().optional(),
  isRead: z.boolean().optional(),
});

// Helper to extract domain from URL
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

// GET /api/bookmarks - List all bookmarks
router.get('/', async (req: Request, res: Response) => {
  try {
    let bookmarks = await storeBridge.getAll<Bookmark>('bookmarks');

    // Filter by query params
    const { collection, tag, isRead } = req.query;

    if (collection) {
      bookmarks = bookmarks.filter(b => b.collection === collection);
    }

    if (tag) {
      bookmarks = bookmarks.filter(b => b.tags.includes(tag as string));
    }

    if (isRead !== undefined) {
      const read = isRead === 'true';
      bookmarks = bookmarks.filter(b => b.isRead === read);
    }

    res.json({
      success: true,
      data: bookmarks,
      count: bookmarks.length,
    });
  } catch (error) {
    logger.error('Failed to get bookmarks:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// GET /api/bookmarks/search - Search bookmarks
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
    }

    const bookmarks = await storeBridge.search<Bookmark>('bookmarks', query);
    res.json({
      success: true,
      data: bookmarks,
      count: bookmarks.length,
      query,
    });
  } catch (error) {
    logger.error('Failed to search bookmarks:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// GET /api/bookmarks/collections - List unique collections
router.get('/collections', async (_req: Request, res: Response) => {
  try {
    const bookmarks = await storeBridge.getAll<Bookmark>('bookmarks');
    const collections = [...new Set(bookmarks.map(b => b.collection).filter(Boolean))];

    res.json({
      success: true,
      data: collections,
      count: collections.length,
    });
  } catch (error) {
    logger.error('Failed to get collections:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// GET /api/bookmarks/:id - Get single bookmark
router.get('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const { id } = req.params;
    const bookmark = await storeBridge.getById<Bookmark>('bookmarks', id);

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        error: 'Bookmark not found',
      });
    }

    res.json({
      success: true,
      data: bookmark,
    });
  } catch (error) {
    logger.error('Failed to get bookmark:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// POST /api/bookmarks - Create bookmark
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = createBookmarkSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues.map(i => i.message).join('; '),
      });
    }
    const body = parsed.data;

    const bookmark = await storeBridge.create<Bookmark>('bookmarks', {
      url: body.url,
      title: body.title,
      description: body.description,
      tags: body.tags || [],
      collection: body.collection,
      domain: extractDomain(body.url),
    });

    logger.info(`Created bookmark: ${bookmark.id}`);

    res.status(201).json({
      success: true,
      data: bookmark,
    });
  } catch (error) {
    logger.error('Failed to create bookmark:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// PUT /api/bookmarks/:id - Update bookmark
router.put('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await storeBridge.getById<Bookmark>('bookmarks', id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Bookmark not found',
      });
    }

    const parsed = updateBookmarkSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues.map(i => i.message).join('; '),
      });
    }
    const body = parsed.data;

    const bookmark = await storeBridge.update<Bookmark>('bookmarks', id, body);

    logger.info(`Updated bookmark: ${id}`);

    res.json({
      success: true,
      data: bookmark,
    });
  } catch (error) {
    logger.error('Failed to update bookmark:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// POST /api/bookmarks/:id/read - Mark as read/unread
router.post('/:id/read', async (req: Request<IdParams>, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await storeBridge.getById<Bookmark>('bookmarks', id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Bookmark not found',
      });
    }

    const bookmark = await storeBridge.update<Bookmark>('bookmarks', id, {
      isRead: !existing.isRead,
    });

    logger.info(`Toggled bookmark read status: ${id} -> ${bookmark.isRead}`);

    res.json({
      success: true,
      data: bookmark,
    });
  } catch (error) {
    logger.error('Failed to toggle bookmark read status:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// DELETE /api/bookmarks/:id - Delete bookmark
router.delete('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await storeBridge.getById<Bookmark>('bookmarks', id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Bookmark not found',
      });
    }

    await storeBridge.delete('bookmarks', id);

    logger.info(`Deleted bookmark: ${id}`);

    res.json({
      success: true,
      message: 'Bookmark deleted',
    });
  } catch (error) {
    logger.error('Failed to delete bookmark:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
