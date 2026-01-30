import { Router, Request, Response } from 'express';
import { storeBridge } from '../bridges/storeBridge';
import { logger } from '../utils/logger';

const router = Router();

// Types
interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folderId?: string;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateNoteRequest {
  title: string;
  content?: string;
  tags?: string[];
  folderId?: string;
}

interface UpdateNoteRequest {
  title?: string;
  content?: string;
  tags?: string[];
  folderId?: string;
  pinned?: boolean;
}

// GET /api/notes - List all notes
router.get('/', async (req: Request, res: Response) => {
  try {
    const notes = await storeBridge.getAll<Note>('notes');
    res.json({
      success: true,
      data: notes,
      count: notes.length,
    });
  } catch (error) {
    logger.error('Failed to get notes:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// GET /api/notes/search - Search notes
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
    }

    const notes = await storeBridge.search<Note>('notes', query);
    res.json({
      success: true,
      data: notes,
      count: notes.length,
      query,
    });
  } catch (error) {
    logger.error('Failed to search notes:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// GET /api/notes/:id - Get single note
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const note = await storeBridge.getById<Note>('notes', id);

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found',
      });
    }

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    logger.error('Failed to get note:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// GET /api/notes/:id/backlinks - Get notes that link to this note
router.get('/:id/backlinks', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const targetNote = await storeBridge.getById<Note>('notes', id);

    if (!targetNote) {
      return res.status(404).json({
        success: false,
        error: 'Note not found',
      });
    }

    const allNotes = await storeBridge.getAll<Note>('notes');

    // Find notes that contain [[targetNote.title]] or [[id]]
    const backlinks = allNotes.filter(note => {
      if (note.id === id) return false;
      const content = note.content.toLowerCase();
      const titlePattern = `[[${targetNote.title.toLowerCase()}]]`;
      const idPattern = `[[${id}]]`;
      return content.includes(titlePattern) || content.includes(idPattern);
    });

    res.json({
      success: true,
      data: backlinks,
      count: backlinks.length,
    });
  } catch (error) {
    logger.error('Failed to get backlinks:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// POST /api/notes - Create note
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as CreateNoteRequest;

    if (!body.title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required',
      });
    }

    const note = await storeBridge.create<Note>('notes', {
      title: body.title,
      content: body.content || '',
      tags: body.tags || [],
      folderId: body.folderId,
    });

    logger.info(`Created note: ${note.id}`);

    res.status(201).json({
      success: true,
      data: note,
    });
  } catch (error) {
    logger.error('Failed to create note:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// PUT /api/notes/:id - Update note
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body as UpdateNoteRequest;

    const existing = await storeBridge.getById<Note>('notes', id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Note not found',
      });
    }

    const note = await storeBridge.update<Note>('notes', id, body);

    logger.info(`Updated note: ${id}`);

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    logger.error('Failed to update note:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// DELETE /api/notes/:id - Delete note
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await storeBridge.getById<Note>('notes', id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Note not found',
      });
    }

    await storeBridge.delete('notes', id);

    logger.info(`Deleted note: ${id}`);

    res.json({
      success: true,
      message: 'Note deleted',
    });
  } catch (error) {
    logger.error('Failed to delete note:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
