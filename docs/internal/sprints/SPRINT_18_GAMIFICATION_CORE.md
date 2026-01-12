# Sprint 18: Gamification Core System
**Goal:** Implement XP system, levels, basic achievements, and stats panel
**Duration:** 3-4 days
**Priority:** HIGH
**Status:** COMPLETED

---

## Background
- Gamification spec exists in `docs/GAMIFICATION.md`
- Oldschool, terminal-aesthetic approach (ASCII art, minimal animations)
- ADHD-friendly: sustainable motivation over dopamine spikes
- Phase 1 (MVP) focus: XP, Levels, Basic Achievements, Stats Panel

---

## 18.1: Gamification Store

### Create `gamificationStore.ts`

```typescript
interface UserStats {
  level: number
  currentXP: number
  totalXP: number
  
  tasksCompleted: number
  habitsCompleted: number
  pomodorosCompleted: number
  notesCreated: number
  journalEntries: number
  
  currentStreak: number
  bestStreak: number
  lastActiveDate: string
  
  achievements: string[]
}
```

### Tasks:
- [x] Create Zustand store with persist middleware
- [x] Implement XP calculation functions
- [x] Implement level progression logic
- [x] Add streak tracking (daily activity check)

---

## 18.2: XP System

### XP Values:
| Action | XP |
|--------|-----|
| Task complete | +10 |
| P1 Task complete | +25 |
| Habit complete | +5 |
| Journal entry | +10 |
| Pomodoro complete | +15 |
| Note create | +3 |

### Streak Multipliers:
- 1-6 days: 1.0x
- 7-13 days: 1.2x
- 14-29 days: 1.5x
- 30+ days: 2.0x

### Tasks:
- [x] `addXP(amount, action)` function
- [x] `getStreakMultiplier()` function
- [x] Integrate with taskStore (on task complete)
- [x] Integrate with habitStore (on habit complete)
- [x] Integrate with noteStore (on note create)

---

## 18.3: Level System

### Level Progression:
```
Level 1:    0 XP      [Novice]
Level 2:    100 XP    [Apprentice]
Level 3:    250 XP    [Journeyman]
Level 4:    500 XP    [Adept]
Level 5:    1000 XP   [Expert]
Level 6:    2000 XP   [Master]
Level 7:    4000 XP   [Grandmaster]
Level 8:    8000 XP   [Legend]
Level 9:    16000 XP  [Mythic]
Level 10:   32000 XP  [Transcendent]
```

### Tasks:
- [x] `calculateLevel(totalXP)` function
- [x] `getLevelTitle(level)` function
- [x] `getXPForNextLevel(level)` function
- [x] Level-up detection and notification

---

## 18.4: Basic Achievements (10 MVP)

### MVP Achievements:
| ID | Name | Condition | Badge |
|----|------|-----------|-------|
| T01 | First Blood | Complete first task | `[✓]` |
| T02 | Productive Day | 5 tasks in one day | `[✓✓✓]` |
| T03 | Task Slayer | 100 total tasks | `[SLAYER]` |
| S01 | Week Warrior | 7 day streak | `[7d]` |
| S02 | Monthly Master | 30 day streak | `[30d]` |
| N01 | First Note | Create first note | `[n]` |
| N02 | Notebook | 10 notes | `[nb]` |
| H01 | Habit Starter | Complete first habit | `[h]` |
| H02 | Perfect Day | All habits in one day | `[★]` |
| X01 | Early Bird | Task before 6 AM | `[🌅]` |

### Tasks:
- [x] Define achievement interfaces
- [x] Create achievement definitions array
- [x] `checkAchievements()` function
- [x] `unlockAchievement(id)` function

---

## 18.5: UI Components

### StatusBar XP Display
```
[Lv.5 Expert] ████████░░ 1247/2000 XP | 🔥14
```

### Tasks:
- [x] Update `StatusBar.tsx` with XP/Level display
- [x] Create `XPProgressBar` component
- [x] Add streak indicator

### Stats Panel (Settings or dedicated module)
- [x] Create `StatsPanel.tsx` component
- [x] Show level, XP, progress bar
- [x] Show total counts (tasks, habits, notes)
- [x] Show streak info (current, best)
- [x] Show unlocked achievements

### Level-Up Modal
- [x] Create `LevelUpModal.tsx` component
- [x] ASCII-style box design
- [x] Show new level and title
- [x] Auto-dismiss after 3 seconds

### Achievement Notification
- [x] Create `AchievementToast.tsx` component
- [x] Bottom-right corner notification
- [x] Show badge and name
- [x] Auto-dismiss after 3 seconds

---

## 18.6: Integration Points

### taskStore.ts
- [x] Call `addXP()` on task completion
- [x] Call `checkAchievements()` after XP add
- [x] Update `tasksCompleted` counter

### habitStore.ts
- [x] Call `addXP()` on habit completion
- [x] Update `habitsCompleted` counter
- [x] Check for "Perfect Day" achievement

### noteStore.ts
- [x] Call `addXP()` on note creation
- [x] Update `notesCreated` counter

### App startup
- [x] Check streak on app load
- [x] Reset streak if missed a day
- [x] Update `lastActiveDate`

---

## 18.7: Settings Integration

### Gamification Toggle
- [x] Add `gamificationEnabled` to settingsStore
- [x] Add toggle in Settings → General
- [x] Hide all gamification UI when disabled

---

## File Structure

```
src/
├── stores/
│   └── gamificationStore.ts    # NEW
├── components/
│   └── gamification/           # NEW folder
│       ├── index.ts
│       ├── XPProgressBar.tsx
│       ├── StatsPanel.tsx
│       ├── LevelUpModal.tsx
│       ├── AchievementToast.tsx
│       └── AchievementList.tsx
```

---

## Acceptance Criteria

1. ✅ XP is awarded for completing tasks, habits, notes
2. ✅ Level increases based on total XP
3. ✅ StatusBar shows current level and XP progress
4. ✅ Streak is tracked and displayed
5. ✅ 10 basic achievements can be unlocked
6. ✅ Level-up shows minimal ASCII-style modal
7. ✅ Achievement unlock shows toast notification
8. ✅ Stats panel shows all progress data
9. ✅ Gamification can be disabled in settings
10. ✅ All data persists in localStorage

---

## Notes

- Keep animations minimal (300-500ms max)
- Use existing color palette (np-green, np-blue, np-orange)
- ASCII art style for badges and modals
- No sound effects in Phase 1
- i18n support for all new strings

---

*Sprint 18 - Gamification Core*
*Estimated: 3-4 days*
