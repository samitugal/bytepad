# Tasks Module

The Tasks module provides priority-based task management with subtasks, deadlines, reminders, and drag-and-drop organization.

## Features

- Priority levels (P1-P4)
- Subtasks with auto-completion
- Due dates and time blocks
- Reminders
- Tags and linked resources
- Calendar view
- Manual reordering (drag & drop)

## Creating Tasks

### New Task

1. Press `Ctrl+2` to open Tasks
2. Click "+ New Task"
3. Fill in task details
4. Click "Add" or press Enter

### Task Properties

| Property | Description |
|----------|-------------|
| Title | Task name |
| Priority | P1 (Critical) to P4 (Low) |
| Description | Optional details, supports `[[links]]` |
| Start Date | When to begin |
| Deadline | Due date |
| Time Block | Start and end times |
| Reminder | Notification before deadline |
| Tags | Categorization tags |
| Linked Resources | Attached bookmarks |

## Priority System

| Priority | Color | Use For |
|----------|-------|---------|
| P1 | Red | Critical, must do today |
| P2 | Orange | Important, should do soon |
| P3 | Blue | Normal priority |
| P4 | Gray | Low priority, someday |

## Subtasks

Break down complex tasks into subtasks:

1. Click task to expand
2. Type subtask in "Add subtask" input
3. Press Enter

### Auto-completion

When all subtasks are completed, the parent task is automatically marked as complete.

## Sorting and Filtering

### Sort Options

| Option | Description |
|--------|-------------|
| Priority | P1 first, then P2, P3, P4 |
| Deadline | Earliest deadline first |
| Created | Most recent first |
| Manual | Drag and drop order |

### Filter Options

| Filter | Shows |
|--------|-------|
| All | All tasks |
| Active | Incomplete tasks only |
| Completed | Done tasks only |

## Drag and Drop

When sorted by "Manual":

1. Grab the `⋮⋮` handle on the left
2. Drag task to new position
3. Release to reorder

## Entity Links

Link to notes, bookmarks, or other tasks in descriptions:

```
See [[Project Notes]] for details.
Related to [[Meeting Bookmarks]].
```

Type `[[` to trigger autocomplete.

## Linked Resources

Attach bookmarks to tasks:

1. Open task form
2. Scroll to "Linked Resources"
3. Search for bookmarks
4. Click to add

Linked bookmarks appear as clickable links in the task.

## Reminders

Set reminders for tasks with deadlines:

1. Enable reminder checkbox
2. Choose time before deadline:
   - 15 minutes
   - 30 minutes
   - 1 hour
   - 2 hours
   - 1 day

Reminders appear in the Notification Center.

## Calendar View

View tasks on a calendar:

1. Click "Calendar" tab in Tasks
2. Tasks with dates appear on their due dates
3. Click a date to see tasks
4. Drag tasks between dates

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+2` | Open Tasks module |
| `Ctrl+Shift+T` | Quick add task (Electron) |
| `Enter` | Add task/subtask |
| `Click` | Expand task details |

## Completed Tasks

Completed tasks move to the "Done" section:

- Collapsed by default
- Shows last 10 completed
- Displays completion date
- Can be restored by unchecking

## Best Practices

1. **Use priorities consistently** - P1 is truly critical
2. **Break down large tasks** - Use subtasks
3. **Set realistic deadlines** - Avoid overcommitting
4. **Review daily** - Update task status
5. **Use time blocks** - Schedule focused work

## Integration

Tasks integrate with:

- **Focus Mode** - Select task for Pomodoro session
- **Knowledge Graph** - See task connections
- **FlowBot** - AI can create and manage tasks
- **Analysis** - View task completion stats
