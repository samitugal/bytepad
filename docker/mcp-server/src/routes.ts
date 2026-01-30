/**
 * API Routes for Docker MCP Server
 */

import { Router, Request, Response } from 'express';

interface StoreBridge {
  getAll(storeName: string): Promise<unknown[]>;
  getById(storeName: string, id: string): Promise<unknown | null>;
  getState(storeName: string): Promise<unknown>;
  create(storeName: string, item: unknown): Promise<unknown>;
  update(storeName: string, id: string, updates: unknown): Promise<unknown | null>;
  delete(storeName: string, id: string): Promise<boolean>;
  search(storeName: string, query: string): Promise<unknown[]>;
}

export function createRoutes(storeBridge: StoreBridge): Router {
  const router = Router();

  // Health check
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      success: true,
      status: 'healthy',
      service: 'bytepad-mcp-docker',
      version: '0.24.3',
      timestamp: new Date().toISOString(),
    });
  });

  // Generic CRUD for all stores
  const stores = ['notes', 'tasks', 'habits', 'journal', 'bookmarks', 'ideas', 'dailyNotes'];

  stores.forEach((storeName) => {
    // GET all
    router.get(`/${storeName}`, async (req: Request, res: Response) => {
      try {
        const items = await storeBridge.getAll(storeName);
        res.json({ success: true, data: items });
      } catch (err) {
        res.status(500).json({ success: false, error: (err as Error).message });
      }
    });

    // GET by ID
    router.get(`/${storeName}/:id`, async (req: Request, res: Response) => {
      try {
        const item = await storeBridge.getById(storeName, req.params.id);
        if (!item) {
          return res.status(404).json({ success: false, error: 'Not found' });
        }
        res.json({ success: true, data: item });
      } catch (err) {
        res.status(500).json({ success: false, error: (err as Error).message });
      }
    });

    // POST create
    router.post(`/${storeName}`, async (req: Request, res: Response) => {
      try {
        const item = await storeBridge.create(storeName, req.body);
        res.status(201).json({ success: true, data: item });
      } catch (err) {
        res.status(500).json({ success: false, error: (err as Error).message });
      }
    });

    // PUT update
    router.put(`/${storeName}/:id`, async (req: Request, res: Response) => {
      try {
        const item = await storeBridge.update(storeName, req.params.id, req.body);
        if (!item) {
          return res.status(404).json({ success: false, error: 'Not found' });
        }
        res.json({ success: true, data: item });
      } catch (err) {
        res.status(500).json({ success: false, error: (err as Error).message });
      }
    });

    // DELETE
    router.delete(`/${storeName}/:id`, async (req: Request, res: Response) => {
      try {
        const success = await storeBridge.delete(storeName, req.params.id);
        if (!success) {
          return res.status(404).json({ success: false, error: 'Not found' });
        }
        res.json({ success: true, message: 'Deleted' });
      } catch (err) {
        res.status(500).json({ success: false, error: (err as Error).message });
      }
    });

    // GET search
    router.get(`/${storeName}/search`, async (req: Request, res: Response) => {
      try {
        const query = req.query.q as string || '';
        const items = await storeBridge.search(storeName, query);
        res.json({ success: true, data: items });
      } catch (err) {
        res.status(500).json({ success: false, error: (err as Error).message });
      }
    });
  });

  // Bulk operations
  router.get('/bulk/stats', async (req: Request, res: Response) => {
    try {
      const stats: Record<string, number> = {};
      for (const storeName of stores) {
        const items = await storeBridge.getAll(storeName);
        stats[storeName] = items.length;
      }
      res.json({ success: true, data: stats });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  router.post('/bulk/export', async (req: Request, res: Response) => {
    try {
      const data: Record<string, unknown[]> = {};
      for (const storeName of stores) {
        data[storeName] = await storeBridge.getAll(storeName);
      }
      res.json({
        success: true,
        data: {
          version: 1,
          exportedAt: new Date().toISOString(),
          data,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // Today summary
  router.get('/bulk/today', async (req: Request, res: Response) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tasks = await storeBridge.getAll('tasks') as { completed: boolean; deadline?: string }[];
      const habits = await storeBridge.getAll('habits') as { completions: Record<string, boolean> }[];

      res.json({
        success: true,
        data: {
          date: today,
          tasks: {
            total: tasks.length,
            completed: tasks.filter(t => t.completed).length,
            pending: tasks.filter(t => !t.completed).length,
          },
          habits: {
            total: habits.length,
            completedToday: habits.filter(h => h.completions?.[today]).length,
          },
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  return router;
}
