# First Steps

Welcome to BytePad! This guide will help you get started with the basics.

## Interface Overview

BytePad has a keyboard-first interface inspired by code editors. The main areas are:

```
┌─────────────────────────────────────────────────────┐
│  Status Bar                                         │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│  Sidebar │           Main Content                   │
│          │                                          │
│          │                                          │
├──────────┴──────────────────────────────────────────┤
│  Keyboard Hints                                     │
└─────────────────────────────────────────────────────┘
```

## Navigation

### Using Keyboard (Recommended)

| Keys | Action |
|------|--------|
| `Ctrl+1` | Notes |
| `Ctrl+2` | Tasks |
| `Ctrl+3` | Habits |
| `Ctrl+4` | Journal |
| `Ctrl+5` | Focus |
| `Ctrl+6` | Bookmarks |
| `Ctrl+7` | FlowBot |
| `Ctrl+8` | Knowledge Graph |
| `Ctrl+9` | Analysis |
| `Ctrl+K` | Command Palette |

### Using Sidebar

Click on any module icon in the left sidebar to switch between modules.

## Your First Note

1. Press `Ctrl+1` to go to Notes
2. Click "+ New Note" or use Command Palette
3. Give your note a title
4. Start writing in Markdown

### Markdown Support

BytePad supports full Markdown syntax:

```markdown
# Heading 1
## Heading 2

**Bold** and *italic* text

- Bullet list
- Another item

1. Numbered list
2. Second item

`inline code`

```code block```

[Link](https://example.com)
```

### Wikilinks

Link between notes using `[[Note Title]]` syntax:

```markdown
This relates to [[Another Note]].
```

## Your First Task

1. Press `Ctrl+2` to go to Tasks
2. Click "+ New Task"
3. Fill in the task details:
   - Title
   - Priority (P1-P4)
   - Due date (optional)
   - Description (optional)

### Subtasks

Click on a task to expand it, then add subtasks:

1. Click a task to expand
2. Type in "Add subtask" input
3. Press Enter

When all subtasks are done, the parent task is automatically marked complete.

## Starting a Focus Session

1. Press `Ctrl+5` or `Ctrl+Shift+F` for Focus Mode
2. Select a task to work on (optional)
3. Click "Start" to begin a 25-minute Pomodoro
4. Work until the timer ends
5. Take a break, then repeat

## Using FlowBot

FlowBot is your AI productivity coach:

1. Press `Ctrl+/` to open FlowBot
2. Ask questions like:
   - "What should I focus on today?"
   - "Summarize my completed tasks this week"
   - "Help me break down this project"

FlowBot can also:
- Create notes and tasks for you
- Search your content
- Provide insights about your productivity

## Tracking Habits

1. Press `Ctrl+3` for Habits
2. Click "+ New Habit"
3. Define your habit (e.g., "Exercise", "Read")
4. Check off habits daily to build streaks

## Daily Journal

1. Press `Ctrl+4` for Journal
2. Today's entry is automatically created
3. Write your thoughts
4. Track mood and energy levels

## Gamification

BytePad rewards your productivity:

- **XP**: Earn experience points by completing tasks and habits
- **Levels**: Level up as you accumulate XP
- **Streaks**: Maintain daily habits for bonus multipliers
- **Achievements**: Unlock achievements for milestones

## Tips for Power Users

1. **Use Command Palette** (`Ctrl+K`) - Access everything quickly
2. **Keyboard Navigation** - Learn the shortcuts for speed
3. **Wikilinks** - Connect your notes for a personal knowledge base
4. **Knowledge Graph** (`Ctrl+8`) - Visualize connections
5. **Weekly Analysis** (`Ctrl+9`) - Review your productivity

## Next Steps

- Explore [Notes](../features/notes.md) in depth
- Set up [Gist Sync](../features/sync.md) for backup
- Configure [FlowBot](../features/flowbot.md) with your AI provider
