import { Router, Request, Response } from 'express';
import { storeBridge } from '../bridges/storeBridge';
import { logger } from '../utils/logger';

const router = Router();

// Types
interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  deadline?: string;
  deadlineTime?: string;
  completed: boolean;
  completedAt?: string;
  archivedAt?: string;
  subtasks: SubTask[];
  tags?: string[];
  linkedBookmarkIds?: string[];
  linkedNoteIds?: string[];
  createdAt: string;
  updatedAt?: string;
}

interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: 'P1' | 'P2' | 'P3' | 'P4';
  deadline?: string;
  deadlineTime?: string;
  tags?: string[];
  subtasks?: { title: string }[];
}

interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: 'P1' | 'P2' | 'P3' | 'P4';
  deadline?: string;
  deadlineTime?: string;
  completed?: boolean;
  tags?: string[];
  linkedBookmarkIds?: string[];
  linkedNoteIds?: string[];
}

// GET /api/tasks - List all tasks
router.get('/', async (req: Request, res: Response) => {
  try {
    let tasks = await storeBridge.getAll<Task>('tasks');

    // Filter by query params
    const { completed, priority, tag, archived } = req.query;

    if (completed !== undefined) {
      const isCompleted = completed === 'true';
      tasks = tasks.filter(t => t.completed === isCompleted);
    }

    if (priority) {
      tasks = tasks.filter(t => t.priority === priority);
    }

    if (tag) {
      tasks = tasks.filter(t => t.tags?.includes(tag as string));
    }

    if (archived !== undefined) {
      const isArchived = archived === 'true';
      tasks = tasks.filter(t => isArchived ? !!t.archivedAt : !t.archivedAt);
    }

    res.json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (error) {
    logger.error('Failed to get tasks:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// GET /api/tasks/search - Search tasks
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
    }

    const tasks = await storeBridge.search<Task>('tasks', query);
    res.json({
      success: true,
      data: tasks,
      count: tasks.length,
      query,
    });
  } catch (error) {
    logger.error('Failed to search tasks:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// GET /api/tasks/:id - Get single task
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await storeBridge.getById<Task>('tasks', id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    logger.error('Failed to get task:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// POST /api/tasks - Create task
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as CreateTaskRequest;

    if (!body.title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required',
      });
    }

    const task = await storeBridge.create<Task>('tasks', {
      title: body.title,
      description: body.description,
      priority: body.priority || 'P3',
      deadline: body.deadline,
      deadlineTime: body.deadlineTime,
      tags: body.tags,
    });

    // Add subtasks if provided
    if (body.subtasks && body.subtasks.length > 0) {
      for (const subtask of body.subtasks) {
        await storeBridge.action('tasks', 'addSubtask', task.id, subtask.title);
      }
    }

    // Get updated task with subtasks
    const updatedTask = await storeBridge.getById<Task>('tasks', task.id);

    logger.info(`Created task: ${task.id}`);

    res.status(201).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    logger.error('Failed to create task:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body as UpdateTaskRequest;

    const existing = await storeBridge.getById<Task>('tasks', id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    const task = await storeBridge.update<Task>('tasks', id, body);

    logger.info(`Updated task: ${id}`);

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    logger.error('Failed to update task:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// POST /api/tasks/:id/complete - Toggle task completion
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await storeBridge.getById<Task>('tasks', id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    await storeBridge.action('tasks', 'toggleComplete', id);
    const task = await storeBridge.getById<Task>('tasks', id);

    logger.info(`Toggled task completion: ${id} -> ${task?.completed}`);

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    logger.error('Failed to toggle task completion:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// POST /api/tasks/:id/archive - Archive task
router.post('/:id/archive', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await storeBridge.getById<Task>('tasks', id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    await storeBridge.action('tasks', 'archiveTask', id);
    const task = await storeBridge.getById<Task>('tasks', id);

    logger.info(`Archived task: ${id}`);

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    logger.error('Failed to archive task:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await storeBridge.getById<Task>('tasks', id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    await storeBridge.delete('tasks', id);

    logger.info(`Deleted task: ${id}`);

    res.json({
      success: true,
      message: 'Task deleted',
    });
  } catch (error) {
    logger.error('Failed to delete task:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// POST /api/tasks/:id/subtasks - Add subtask
router.post('/:id/subtasks', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Subtask title is required',
      });
    }

    const existing = await storeBridge.getById<Task>('tasks', id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    await storeBridge.action('tasks', 'addSubtask', id, title);
    const task = await storeBridge.getById<Task>('tasks', id);

    logger.info(`Added subtask to task: ${id}`);

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    logger.error('Failed to add subtask:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// PUT /api/tasks/:id/subtasks/:subId - Toggle subtask
router.put('/:id/subtasks/:subId', async (req: Request, res: Response) => {
  try {
    const { id, subId } = req.params;

    const existing = await storeBridge.getById<Task>('tasks', id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    await storeBridge.action('tasks', 'toggleSubtask', id, subId);
    const task = await storeBridge.getById<Task>('tasks', id);

    logger.info(`Toggled subtask: ${id}/${subId}`);

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    logger.error('Failed to toggle subtask:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
