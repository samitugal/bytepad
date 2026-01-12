# Sprint 19: Enhanced Focus Mode
**Goal:** Improve Focus Mode with time logging, animated timer, and productivity features
**Duration:** 3-4 days
**Priority:** HIGH
**Status:** COMPLETED

---

## Background
- Basic Focus Mode exists in `src/components/common/FocusMode.tsx`
- Current features: task selection, simple timer, pause/resume, notifications
- Missing: time logging, animated timer, statistics, break reminders

---

## 19.1: Focus Session Store

### Create `focusStore.ts`

```typescript
interface FocusSession {
  id: string
  taskId: string
  taskTitle: string
  startedAt: Date
  endedAt?: Date
  duration: number // seconds
  completed: boolean // did user complete the task?
  interrupted: boolean // was session stopped early?
}

interface FocusStats {
  totalSessions: number
  totalFocusTime: number // seconds
  todayFocusTime: number
  weekFocusTime: number
  averageSessionLength: number
  longestSession: number
  sessionsPerTask: Record<string, number>
}

interface FocusStore {
  sessions: FocusSession[]
  currentSession: FocusSession | null
  
  // Actions
  startSession(taskId: string, taskTitle: string): void
  endSession(completed: boolean): void
  cancelSession(): void
  
  // Stats
  getStats(): FocusStats
  getTaskFocusTime(taskId: string): number
  getTodaySessions(): FocusSession[]
  getWeekSessions(): FocusSession[]
}
```

### Tasks:
- [x] Create Zustand store with persist middleware
- [x] Implement session tracking
- [x] Calculate focus statistics
- [x] Track time per task

---

## 19.2: Animated Circular Timer

### Design (ASCII Preview)
```
        ╭──────────────╮
       ╱                ╲
      │    ┌────────┐    │
      │    │ 24:35  │    │
      │    └────────┘    │
       ╲                ╱
        ╰──────────────╯
         ████████░░░░░░
```

### Features:
- **Circular progress ring** - SVG-based, smooth animation
- **Pulsing effect** when running
- **Color changes** based on time remaining:
  - Green: > 50% time left
  - Yellow: 25-50% time left
  - Red: < 25% time left (urgency)
- **Completion animation** - celebratory pulse when done

### Tasks:
- [x] Create `CircularTimer.tsx` component
- [x] SVG circle with stroke-dasharray animation
- [x] Smooth countdown with requestAnimationFrame
- [x] Color transition based on progress
- [x] Pulsing animation when active
- [x] Completion celebration effect

---

## 19.3: Task Time Logging

### Display in Task List
```
┌─────────────────────────────────────┐
│ [P1] Complete project proposal      │
│ ⏱️ 2h 15m focused                   │
│ 📅 Due: Tomorrow                    │
└─────────────────────────────────────┘
```

### Tasks:
- [x] Add `totalFocusTime` field to Task type (via focusStore tracking)
- [x] Update task display to show focus time
- [x] Show focus time in task detail view
- [ ] Calculate estimated vs actual time (future enhancement)

---

## 19.4: Break Reminders (Pomodoro Style)

### Break System
```
Session complete! 🎉

You've been focusing for 25 minutes.
Time for a 5-minute break.

[Start Break Timer] [Skip Break]
```

### Break Durations:
- After 25 min session: 5 min break
- After 45 min session: 10 min break
- After 60 min session: 15 min break
- Every 4 sessions: 20 min long break

### Tasks:
- [x] Implement break timer
- [x] Track session count for long breaks
- [x] Break reminder notification
- [ ] Optional: ambient sounds during break (future enhancement)

---

## 19.5: Focus Statistics Panel

### Stats Display
```
╭─────────────────────────────────────╮
│  FOCUS STATS                        │
├─────────────────────────────────────┤
│  Today:        2h 45m               │
│  This Week:    12h 30m              │
│  Total:        47h 15m              │
│                                     │
│  Sessions Today:    5               │
│  Avg Session:       33 min          │
│  Longest Session:   60 min          │
│                                     │
│  Most Focused Task:                 │
│  "Project Proposal" - 4h 20m        │
╰─────────────────────────────────────╯
```

### Tasks:
- [x] Create `FocusStats.tsx` component
- [x] Daily/weekly/total time display
- [x] Session count and averages
- [x] Most focused tasks list
- [x] Add to Settings or dedicated panel

---

## 19.6: Enhanced UI/UX

### Ambient Mode
- [x] Dim everything except timer and task (via full-screen focus mode)
- [x] Optional: dark overlay on rest of screen (bg-np-bg-primary z-50)
- [x] Minimal distractions

### Sound Effects (Optional)
- [ ] Tick sound (can disable) (future enhancement)
- [ ] Session start chime (future enhancement)
- [x] Session complete sound (notification)
- [x] Break reminder sound (notification)

### Keyboard Shortcuts
- [x] `Space` - Start/Pause timer
- [x] `R` - Reset timer
- [x] `C` - Complete task
- [x] `Esc` - Exit focus mode

### Progress Indicators
- [x] Session progress bar (circular timer)
- [x] Daily goal progress (e.g., "3/5 sessions today")
- [x] Streak indicator (consecutive days with focus)

---

## 19.7: Focus Mode Settings

### New Settings
```typescript
interface FocusSettings {
  defaultDuration: number // 25
  shortBreakDuration: number // 5
  longBreakDuration: number // 20
  sessionsUntilLongBreak: number // 4
  autoStartBreak: boolean
  playTickSound: boolean
  playCompletionSound: boolean
  showTimeInTitle: boolean // browser tab title
  dailyGoalSessions: number // 5
}
```

### Tasks:
- [x] Add focus settings to settingsStore
- [ ] Create Focus Settings section in SettingsPanel (UI not yet added)
- [x] Persist user preferences

---

## 19.8: Browser Integration

### Tab Title Update
```
🍅 24:35 - Focus Mode | MyFlowSpace
```

### Tasks:
- [x] Update document.title during focus
- [x] Show remaining time in tab
- [x] Reset title when focus ends

### Prevent Accidental Close
- [x] `beforeunload` warning during active session
- [x] "Are you sure?" if timer is running

---

## 19.9: i18n Support

### New Translation Keys
```json
{
  "focus": {
    "title": "Focus Mode",
    "selectTask": "What do you want to focus on?",
    "noTasks": "No active tasks",
    "sessionDuration": "Session duration",
    "startFocus": "Start Focus",
    "pause": "Pause",
    "resume": "Resume",
    "stop": "Stop",
    "complete": "Mark Complete",
    "changeTask": "Change Task",
    "focusingOn": "Currently focusing on",
    "sessionComplete": "Session complete!",
    "takeBreak": "Time for a break",
    "startBreak": "Start Break",
    "skipBreak": "Skip Break",
    "todayTime": "Today",
    "weekTime": "This Week",
    "totalTime": "Total",
    "sessions": "Sessions",
    "avgSession": "Avg Session",
    "tip": "Break tasks into smaller chunks for better focus"
  }
}
```

### Tasks:
- [x] Add focus keys to en.json
- [x] Add focus keys to tr.json
- [x] Update FocusMode.tsx with translations

---

## File Structure

```
src/
├── stores/
│   └── focusStore.ts           # NEW
├── components/
│   ├── common/
│   │   └── FocusMode.tsx       # ENHANCED
│   └── focus/                  # NEW folder
│       ├── index.ts
│       ├── CircularTimer.tsx
│       ├── FocusStats.tsx
│       ├── BreakTimer.tsx
│       └── FocusSettings.tsx
```

---

## Acceptance Criteria

1. ✅ Focus sessions are logged with start/end time
2. ✅ Task shows total focus time spent
3. ✅ Animated circular timer with progress ring
4. ✅ Timer color changes based on remaining time
5. ✅ Break reminders after sessions
6. ✅ Focus statistics panel shows daily/weekly/total
7. ✅ Browser tab shows remaining time
8. ✅ Keyboard shortcuts work (Space, Esc, etc.)
9. ✅ Settings for durations and sounds
10. ✅ All strings are translated (en/tr)

---

## Design Principles

### ADHD-Friendly
- **Single task focus** - no task switching during session
- **Visual progress** - always know how much time left
- **Gentle reminders** - not aggressive notifications
- **Break enforcement** - prevent burnout

### Minimal Distractions
- **Full-screen mode** - hide other UI elements
- **No notifications** during focus (except completion)
- **Clean, calm interface**

### Motivation
- **Progress tracking** - see accumulated focus time
- **Streaks** - consecutive days with focus sessions
- **Integration with gamification** - XP for completed sessions

---

## Integration with Sprint 18 (Gamification)

- Focus session complete: +15 XP
- 4 sessions in one day: "Deep Work" achievement
- 100 total hours: "Focus Master" achievement
- Track `pomodorosCompleted` in gamification store

---

*Sprint 19 - Enhanced Focus Mode*
*Estimated: 3-4 days*
*Depends on: Sprint 18 (Gamification) for XP integration*
