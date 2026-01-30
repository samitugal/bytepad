import { storeBridge } from '../bridges/storeBridge';
import { logger } from '../utils/logger';

// Prompt definitions
export interface MCPPrompt {
  name: string;
  description: string;
  arguments: {
    name: string;
    description: string;
    required: boolean;
  }[];
}

export const promptList: MCPPrompt[] = [
  {
    name: 'daily_planning',
    description: 'Get context for daily planning - pending tasks, habits, and recent activity',
    arguments: [
      { name: 'date', description: 'Date to plan for (YYYY-MM-DD), defaults to today', required: false },
    ],
  },
  {
    name: 'task_context',
    description: 'Get full context for a specific task including related notes and history',
    arguments: [
      { name: 'task_id', description: 'Task ID to get context for', required: true },
    ],
  },
  {
    name: 'weekly_review',
    description: 'Get data for weekly review - completed tasks, habit streaks, and productivity stats',
    arguments: [],
  },
  {
    name: 'project_status',
    description: 'Get all tasks and notes tagged with a specific project/tag',
    arguments: [
      { name: 'tag', description: 'Project tag to filter by', required: true },
    ],
  },
  {
    name: 'focus_session',
    description: 'Get context for starting a focus session - suggested task and relevant notes',
    arguments: [],
  },
];

// Get prompt content
export async function getPrompt(
  name: string,
  args: Record<string, string>
): Promise<{ messages: { role: 'user'; content: { type: 'text'; text: string } }[] }> {
  logger.info(`Getting prompt: ${name} with args:`, args);

  try {
    let content: string;

    switch (name) {
      case 'daily_planning':
        content = await getDailyPlanningPrompt(args.date);
        break;

      case 'task_context':
        if (!args.task_id) {
          throw new Error('task_id is required');
        }
        content = await getTaskContextPrompt(args.task_id);
        break;

      case 'weekly_review':
        content = await getWeeklyReviewPrompt();
        break;

      case 'project_status':
        if (!args.tag) {
          throw new Error('tag is required');
        }
        content = await getProjectStatusPrompt(args.tag);
        break;

      case 'focus_session':
        content = await getFocusSessionPrompt();
        break;

      default:
        throw new Error(`Unknown prompt: ${name}`);
    }

    return {
      messages: [{
        role: 'user',
        content: { type: 'text', text: content },
      }],
    };
  } catch (error) {
    logger.error(`Prompt generation failed: ${name}`, error);
    throw error;
  }
}

// Daily planning prompt
async function getDailyPlanningPrompt(date?: string): Promise<string> {
  const targetDate = date || new Date().toISOString().split('T')[0];

  const [tasks, habits, journal] = await Promise.all([
    storeBridge.getAll('tasks'),
    storeBridge.getAll('habits'),
    storeBridge.getById('journal', targetDate),
  ]);

  const tasksArray = tasks as {
    id: string;
    title: string;
    priority: string;
    deadline?: string;
    completed: boolean;
    archivedAt?: string;
  }[];

  const habitsArray = habits as {
    id: string;
    name: string;
    completions: Record<string, boolean>;
    streak: number;
  }[];

  // Filter pending tasks
  const pendingTasks = tasksArray
    .filter(t => !t.completed && !t.archivedAt)
    .sort((a, b) => {
      const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4 };
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) -
             (priorityOrder[b.priority as keyof typeof priorityOrder] || 4);
    });

  // Overdue tasks
  const overdueTasks = pendingTasks.filter(t => t.deadline && t.deadline < targetDate);

  // Today's habits
  const habitStatus = habitsArray.map(h => ({
    name: h.name,
    completed: !!h.completions[targetDate],
    streak: h.streak,
  }));

  return `# Daily Planning for ${targetDate}

## Pending Tasks (${pendingTasks.length})

### High Priority (P1-P2)
${pendingTasks
  .filter(t => t.priority === 'P1' || t.priority === 'P2')
  .map(t => `- [${t.priority}] ${t.title}${t.deadline ? ` (due: ${t.deadline})` : ''}`)
  .join('\n') || 'No high priority tasks'}

### Normal Priority (P3-P4)
${pendingTasks
  .filter(t => t.priority === 'P3' || t.priority === 'P4')
  .slice(0, 10)
  .map(t => `- [${t.priority}] ${t.title}${t.deadline ? ` (due: ${t.deadline})` : ''}`)
  .join('\n') || 'No tasks'}

${overdueTasks.length > 0 ? `
### ⚠️ Overdue Tasks (${overdueTasks.length})
${overdueTasks.map(t => `- [${t.priority}] ${t.title} (was due: ${t.deadline})`).join('\n')}
` : ''}

## Habits for Today
${habitStatus.map(h => `- [${h.completed ? 'x' : ' '}] ${h.name} (${h.streak} day streak)`).join('\n')}

${journal ? `
## Today's Journal Entry
- Mood: ${(journal as { mood: number }).mood}/5
- Energy: ${(journal as { energy: number }).energy}/5
` : `
## Journal
No entry for today yet.
`}

---
Use this context to help plan the day effectively.`;
}

// Task context prompt
async function getTaskContextPrompt(taskId: string): Promise<string> {
  const task = await storeBridge.getById('tasks', taskId) as {
    id: string;
    title: string;
    description?: string;
    priority: string;
    deadline?: string;
    completed: boolean;
    subtasks: { id: string; title: string; completed: boolean }[];
    tags?: string[];
    linkedNoteIds?: string[];
    createdAt: string;
  } | null;

  if (!task) {
    throw new Error('Task not found');
  }

  // Get linked notes if any
  let linkedNotes: { title: string; content: string }[] = [];
  if (task.linkedNoteIds && task.linkedNoteIds.length > 0) {
    const notePromises = task.linkedNoteIds.map(id => storeBridge.getById('notes', id));
    const notes = await Promise.all(notePromises);
    linkedNotes = notes
      .filter(Boolean)
      .map(n => ({ title: (n as { title: string }).title, content: (n as { content: string }).content }));
  }

  return `# Task Context: ${task.title}

## Details
- **Priority:** ${task.priority}
- **Status:** ${task.completed ? 'Completed' : 'Pending'}
- **Created:** ${task.createdAt}
${task.deadline ? `- **Deadline:** ${task.deadline}` : ''}
${task.tags && task.tags.length > 0 ? `- **Tags:** ${task.tags.join(', ')}` : ''}

${task.description ? `
## Description
${task.description}
` : ''}

${task.subtasks.length > 0 ? `
## Subtasks
${task.subtasks.map(s => `- [${s.completed ? 'x' : ' '}] ${s.title}`).join('\n')}
` : ''}

${linkedNotes.length > 0 ? `
## Related Notes
${linkedNotes.map(n => `
### ${n.title}
${n.content.slice(0, 500)}${n.content.length > 500 ? '...' : ''}
`).join('\n')}
` : ''}

---
Use this context to help with the task.`;
}

// Weekly review prompt
async function getWeeklyReviewPrompt(): Promise<string> {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  const [tasks, habits, journal, gamification] = await Promise.all([
    storeBridge.getAll('tasks'),
    storeBridge.getAll('habits'),
    storeBridge.getAll('journal'),
    storeBridge.getState('gamification'),
  ]);

  const tasksArray = tasks as {
    title: string;
    completed: boolean;
    completedAt?: string;
    priority: string;
  }[];

  const habitsArray = habits as {
    name: string;
    completions: Record<string, boolean>;
    streak: number;
  }[];

  const journalArray = journal as {
    date: string;
    mood: number;
    energy: number;
  }[];

  const gamificationState = gamification as {
    level: number;
    totalXP: number;
    weeklyXP?: number;
  };

  // Tasks completed this week
  const completedThisWeek = tasksArray.filter(t =>
    t.completed && t.completedAt && t.completedAt >= weekAgoStr
  );

  // Weekly journal entries
  const weeklyJournal = journalArray.filter(e => e.date >= weekAgoStr);
  const avgMood = weeklyJournal.length > 0
    ? weeklyJournal.reduce((sum, e) => sum + e.mood, 0) / weeklyJournal.length
    : 0;
  const avgEnergy = weeklyJournal.length > 0
    ? weeklyJournal.reduce((sum, e) => sum + e.energy, 0) / weeklyJournal.length
    : 0;

  return `# Weekly Review (${weekAgoStr} to ${today.toISOString().split('T')[0]})

## Tasks Completed (${completedThisWeek.length})
${completedThisWeek.slice(0, 15).map(t => `- [${t.priority}] ${t.title}`).join('\n') || 'No tasks completed'}
${completedThisWeek.length > 15 ? `\n... and ${completedThisWeek.length - 15} more` : ''}

## Habit Streaks
${habitsArray.map(h => `- ${h.name}: ${h.streak} day streak`).join('\n')}

## Mood & Energy
- Average Mood: ${avgMood.toFixed(1)}/5
- Average Energy: ${avgEnergy.toFixed(1)}/5
- Journal Entries: ${weeklyJournal.length}/7 days

## Gamification
- Level: ${gamificationState?.level || 1}
- Total XP: ${gamificationState?.totalXP || 0}
${gamificationState?.weeklyXP ? `- Weekly XP: ${gamificationState.weeklyXP}` : ''}

---
Use this data for the weekly review.`;
}

// Project status prompt
async function getProjectStatusPrompt(tag: string): Promise<string> {
  const [tasks, notes] = await Promise.all([
    storeBridge.getAll('tasks'),
    storeBridge.getAll('notes'),
  ]);

  const tasksArray = tasks as {
    title: string;
    priority: string;
    completed: boolean;
    tags?: string[];
  }[];

  const notesArray = notes as {
    title: string;
    tags: string[];
    updatedAt: string;
  }[];

  const projectTasks = tasksArray.filter(t => t.tags?.includes(tag));
  const projectNotes = notesArray.filter(n => n.tags.includes(tag));

  const pendingTasks = projectTasks.filter(t => !t.completed);
  const completedTasks = projectTasks.filter(t => t.completed);

  return `# Project Status: ${tag}

## Tasks
### Pending (${pendingTasks.length})
${pendingTasks.map(t => `- [${t.priority}] ${t.title}`).join('\n') || 'No pending tasks'}

### Completed (${completedTasks.length})
${completedTasks.slice(0, 10).map(t => `- ✓ ${t.title}`).join('\n') || 'No completed tasks'}
${completedTasks.length > 10 ? `\n... and ${completedTasks.length - 10} more` : ''}

## Related Notes (${projectNotes.length})
${projectNotes.slice(0, 10).map(n => `- ${n.title} (updated: ${n.updatedAt})`).join('\n') || 'No notes'}
${projectNotes.length > 10 ? `\n... and ${projectNotes.length - 10} more` : ''}

---
Use this context for the project "${tag}".`;
}

// Focus session prompt
async function getFocusSessionPrompt(): Promise<string> {
  const tasks = await storeBridge.getAll('tasks') as {
    id: string;
    title: string;
    priority: string;
    completed: boolean;
    archivedAt?: string;
    deadline?: string;
  }[];

  const pendingTasks = tasks
    .filter(t => !t.completed && !t.archivedAt)
    .sort((a, b) => {
      const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4 };
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) -
             (priorityOrder[b.priority as keyof typeof priorityOrder] || 4);
    });

  const today = new Date().toISOString().split('T')[0];
  const urgentTasks = pendingTasks.filter(t => t.deadline && t.deadline <= today);

  const suggestedTask = urgentTasks[0] || pendingTasks[0];

  return `# Focus Session Preparation

## Suggested Task
${suggestedTask ? `
**${suggestedTask.title}**
- Priority: ${suggestedTask.priority}
${suggestedTask.deadline ? `- Deadline: ${suggestedTask.deadline}` : ''}
` : 'No pending tasks to focus on.'}

## Other High Priority Tasks
${pendingTasks
  .filter(t => t.id !== suggestedTask?.id)
  .slice(0, 5)
  .map(t => `- [${t.priority}] ${t.title}`)
  .join('\n') || 'No other tasks'}

${urgentTasks.length > 1 ? `
## ⚠️ Urgent/Overdue Tasks
${urgentTasks.map(t => `- ${t.title} (due: ${t.deadline})`).join('\n')}
` : ''}

---
Ready for a focus session. Recommended Pomodoro: 25 minutes work, 5 minutes break.`;
}
