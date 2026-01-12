# Focus Mode

Focus Mode combines the Pomodoro Technique with task integration for distraction-free productivity sessions.

## Features

- Customizable timer (default 25 minutes)
- Task selection for sessions
- Break reminders
- Session statistics
- Mini timer widget
- XP rewards

## Opening Focus Mode

- Press `Ctrl+5` to open Focus module
- Press `Ctrl+Shift+F` for Focus overlay (Electron global)
- Use Command Palette → "Focus Mode"

## The Pomodoro Technique

BytePad implements the Pomodoro Technique:

1. **Work session**: 25 minutes of focused work
2. **Short break**: 5 minutes
3. **Long break**: 15-30 minutes after 4 sessions

## Starting a Session

### Basic Session

1. Open Focus Mode (`Ctrl+5`)
2. Click "Start"
3. Work until timer ends
4. Take a break

### Task-Linked Session

1. Click "Select Task" dropdown
2. Choose a task to work on
3. Click "Start"
4. Task progress is tracked

## Timer Controls

| Control | Action |
|---------|--------|
| Start | Begin countdown |
| Pause | Temporarily stop |
| Resume | Continue paused timer |
| Reset | Start over |
| Skip | End current session |

## Timer Settings

Customize your focus sessions in Settings:

| Setting | Default | Description |
|---------|---------|-------------|
| Work duration | 25 min | Focus session length |
| Short break | 5 min | Quick rest period |
| Long break | 15 min | Extended break |
| Sessions before long break | 4 | Pomodoro count |

## Mini Timer Widget

The mini timer appears during active sessions:
- Shows remaining time
- Appears in corner of screen
- Can be minimized
- Shows task name if selected

## Session Types

### Focus Session
Full work session with timer and tracking.

### Quick Session
Shorter session for small tasks:
1. Click time options (15, 25, 45 min)
2. Start immediately

## Statistics

Track your focus sessions:

- **Today's sessions**: Completed pomodoros
- **This week**: Weekly session count
- **Total time**: Cumulative focus hours
- **Streak**: Consecutive days with sessions

## Gamification

Focus sessions earn XP:

| Achievement | XP |
|------------|-----|
| Complete session | +25 XP |
| Complete 4 sessions | +50 XP bonus |
| Daily focus goal | +25 XP |

## Best Practices

### During Sessions

1. **Close distractions** - Minimize other apps
2. **Set expectations** - Tell others you're focusing
3. **One task only** - Focus on selected task
4. **Trust the timer** - Don't check constantly

### Break Time

1. **Actually rest** - Step away from screen
2. **Move** - Stretch, walk, hydrate
3. **Don't work** - Breaks are essential
4. **Return refreshed** - Ready for next session

### Session Planning

1. **Review tasks** - Know what to work on
2. **Estimate sessions** - How many pomodoros needed?
3. **Prioritize** - Start with important tasks
4. **Be realistic** - 8-10 sessions per day max

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+5` | Open Focus Mode |
| `Ctrl+Shift+F` | Quick Focus overlay |
| `Space` | Start/Pause timer |
| `Escape` | Close Focus overlay |

## Global Shortcuts (Electron)

When using desktop app:

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+P` | Start Pomodoro (global) |

Works even when BytePad is minimized.

## Integration

Focus Mode connects with:

- **Tasks** - Select task for session
- **Analysis** - View focus statistics
- **Gamification** - Earn XP for sessions
- **Notifications** - Break reminders

## Troubleshooting

### Timer Not Starting
- Check if another session is active
- Try refreshing the page
- Verify task selection is valid

### Missing Notifications
- Check browser notification permissions
- Verify system notification settings
- Ensure app has focus permission

### Stats Not Updating
- Complete sessions fully (don't skip)
- Check date/time settings
- Refresh the app
