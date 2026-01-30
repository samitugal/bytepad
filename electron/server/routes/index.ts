import { Router } from 'express';
import healthRouter from './health';
import notesRouter from './notes';
import tasksRouter from './tasks';
import habitsRouter from './habits';
import journalRouter from './journal';
import bookmarksRouter from './bookmarks';
import ideasRouter from './ideas';
import syncRouter from './sync';
import bulkRouter from './bulk';

const router = Router();

// Health check (no auth required)
router.use('/health', healthRouter);

// Entity routes
router.use('/notes', notesRouter);
router.use('/tasks', tasksRouter);
router.use('/habits', habitsRouter);
router.use('/journal', journalRouter);
router.use('/bookmarks', bookmarksRouter);
router.use('/ideas', ideasRouter);

// Sync and bulk operations
router.use('/sync', syncRouter);
router.use('/bulk', bulkRouter);

export default router;
