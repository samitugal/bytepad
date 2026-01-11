# Sprint 22: Bug Fixes & UX Improvements
**Goal:** Fix reported bugs and improve user experience
**Duration:** 2-3 days
**Priority:** HIGH
**Status:** PLANNED

---

## Reported Issues

### 22.1: Note Title Display Area Too Small
**Type:** UI Bug
**Severity:** Medium
**Description:** The title input field for notes is too narrow/restricted. Long titles get cut off.

**Current Behavior:**
- Title area is constrained
- Long titles not fully visible

**Expected Behavior:**
- Title area should expand or allow scrolling
- Full title should be visible or accessible

**Files to Check:**
- `src/components/notes/NoteEditor.tsx`

---

### 22.2: Line Numbers Not Updating After Line 34
**Type:** Bug
**Severity:** High
**Description:** In the note editor, line numbers stop at 34 and don't continue regardless of content length.

**Current Behavior:**
- Line numbers display 1-34
- After line 34, numbers don't increment
- Content continues but line tracking stops

**Expected Behavior:**
- Line numbers should match actual content lines
- Should dynamically update as content grows

**Files to Check:**
- `src/components/notes/NoteEditor.tsx`
- Line number generation logic

---

### 22.3: Multi-Tab Feature Not Working
**Type:** Feature Bug
**Severity:** High
**Description:** Tab UI exists (Notes tab with + button visible) but clicking doesn't do anything. Multi-tab functionality needs to be implemented.

**Current Behavior:**
- Tab bar shows "Notes ▼" with + button
- Clicking + does nothing
- No actual tab management

**Expected Behavior:**
- Click + to open new tab
- Each tab can have different note open
- Tab switching works
- Close tab functionality

**Files to Check:**
- `src/components/layout/TabBar.tsx`
- `src/stores/uiStore.ts`

---

### 22.4: Focus Mode Resets When Exiting
**Type:** Bug
**Severity:** High
**Description:** When exiting Focus Mode to do other work, the timer resets completely. User loses progress.

**Current Behavior:**
- Exit Focus Mode → Timer resets to 0
- No way to pause and continue
- Progress lost

**Expected Behavior:**
- Timer should persist when minimized/exited
- Option to pause vs stop
- Resume from where left off

**Proposed Solution:**
- Add minimize option (not just exit)
- Show mini timer widget in corner/status bar
- Persist timer state in store

**Files to Check:**
- `src/components/common/FocusMode.tsx`
- `src/stores/uiStore.ts`

---

### 22.5: Focus Mode Mini Timer Widget
**Type:** Feature Request
**Severity:** Medium
**Description:** When Focus Mode is minimized, show a small timer widget in the bottom-right corner of the app.

**Expected Behavior:**
- Small floating timer (e.g., "🍅 12:34")
- Click to expand back to full Focus Mode
- Shows current task name (truncated)
- Doesn't block other work

**UI Design:**
```
┌─────────────────────┐
│ 🍅 12:34 | Task... │
└─────────────────────┘
```

**Files to Check:**
- `src/components/common/FocusMode.tsx`
- `src/components/layout/StatusBar.tsx` (or new component)

---

### 22.6: Gist Sync Issues
**Type:** Bug
**Severity:** High
**Description:** Multiple Gist sync problems:

1. **Auto-pull on startup:** When Gist is enabled, app should pull data from Gist on launch
2. **Auto-push on close:** When closing app, should push to Gist
3. **Auto-sync interval not working:** "Sync every 5 minutes" setting doesn't work, manual sync required

**Current Behavior:**
- No auto-pull on startup
- No auto-push on close
- Interval sync not triggering
- Only manual sync works

**Expected Behavior:**
- App launch → Check Gist → Pull if newer
- App close → Push to Gist
- Background sync every X minutes (configurable)
- Visual indicator when syncing

**Files to Check:**
- `src/services/gistService.ts`
- `src/stores/settingsStore.ts`
- `src/App.tsx` (for lifecycle hooks)
- Electron `main.ts` (for close event)

---

## Implementation Plan

### Phase 1: Critical Bugs (Day 1)
- [ ] 22.2: Fix line numbers not updating
- [ ] 22.4: Fix Focus Mode reset issue
- [ ] 22.6: Fix Gist sync (startup/close/interval)

### Phase 2: UI Improvements (Day 2)
- [ ] 22.1: Expand note title area
- [ ] 22.5: Add mini timer widget for Focus Mode

### Phase 3: Multi-Tab (Day 2-3)
- [ ] 22.3: Implement multi-tab functionality

---

## Acceptance Criteria

- [ ] Line numbers update correctly for any content length
- [ ] Note title area accommodates longer titles
- [ ] Multi-tab works: create, switch, close tabs
- [ ] Focus Mode can be minimized without losing progress
- [ ] Mini timer shows when Focus Mode minimized
- [ ] Gist auto-pulls on app startup
- [ ] Gist auto-pushes on app close
- [ ] Gist interval sync works as configured

---

## Technical Notes

### Line Numbers Fix
Current implementation likely uses a fixed array or doesn't recalculate on content change. Need to:
1. Count actual lines in content
2. Generate line numbers dynamically
3. Update on every content change

### Focus Mode Persistence
Need to separate "exit" from "minimize":
- Exit = Stop timer, clear state
- Minimize = Hide UI, keep timer running in background
- Store timer state in Zustand with persistence

### Gist Sync
Need to add:
1. `useEffect` on app mount to pull
2. `beforeunload` event to push
3. `setInterval` for periodic sync
4. Electron `before-quit` event for desktop app

---

*Sprint 22 - Bug Fixes & UX Improvements*
*Estimated: 2-3 days*
*Priority: HIGH*
