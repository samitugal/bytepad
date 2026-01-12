# Sprint 32: UX Enhancements & Sync Improvements

## Overview
Enhance user experience with drag & drop interactions, desktop notifications, improved sync automation, and fix critical input blocking bug. Also lay foundation for plugin system.

## Status: PLANNED
- Planned: 2026-01-XX
- Duration: 7-10 days
- Priority: HIGH

---

## Tasks

### 1. Drag & Drop Task Reordering [HIGH] [FEATURE]
**Goal:** Allow users to manually reorder tasks via drag & drop in TasksModule.

**Current Behavior:**
- Tasks are sorted by priority/deadline/created date
- No manual reordering capability
- Order is determined by sort criteria only

**Expected Behavior:**
- Users can drag tasks to reorder them within the active/completed sections
- Custom order is persisted (add `order` field to Task type)
- Sort by dropdown still works but respects manual order when set
- Visual feedback during drag (ghost element, drop indicators)

**Implementation Plan:**
- [ ] Add `order: number` field to Task type (optional, defaults to creation timestamp)
- [ ] Add `reorderTasks: (taskIds: string[]) => void` action to taskStore
- [ ] Integrate `@dnd-kit/core` or `react-beautiful-dnd` library
- [ ] Implement drag handlers in TasksModule
- [ ] Persist order in localStorage via zustand persist
- [ ] Update sort logic to respect manual order when available
- [ ] Add visual drag indicators (drop zones, ghost preview)
- [ ] Ensure keyboard accessibility (alternative: up/down arrow keys)

**Files to Modify:**
- `src/types/index.ts` - Add `order` field to Task interface
- `src/stores/taskStore.ts` - Add reorderTasks action
- `src/components/tasks/TasksModule.tsx` - Add drag & drop UI
- `package.json` - Add drag & drop library dependency

**Acceptance Criteria:**
- [ ] Tasks can be reordered by dragging
- [ ] Order persists across app restarts
- [ ] Sort dropdown still works (resets manual order or merges intelligently)
- [ ] Drag & drop works smoothly without lag
- [ ] Keyboard alternative available (arrow keys or similar)

---

### 2. Calendar Drag & Drop Task Time Editing [HIGH] [FEATURE]
**Goal:** Allow users to drag tasks in calendar view to change their time (Notion-style).

**Current Behavior:**
- Tasks display in calendar at their startTime/deadlineTime
- Time can only be changed via task edit modal
- No visual time manipulation in calendar

**Expected Behavior:**
- In Week/Day view, users can drag tasks vertically to change startTime
- Dragging task end adjusts deadlineTime
- Visual feedback shows new time while dragging
- Changes are saved immediately on drop
- All-day tasks can be dragged to convert to timed tasks

**Implementation Plan:**
- [ ] Add drag handlers to task elements in WeekView and DayView
- [ ] Calculate target hour/minute from mouse Y position
- [ ] Update task.startTime/deadlineTime on drop
- [ ] Show time preview tooltip while dragging
- [ ] Handle edge cases (drag to different day, convert all-day to timed)
- [ ] Add visual feedback (ghost element, drop zone highlighting)
- [ ] Ensure smooth interaction (no lag, proper event handling)

**Files to Modify:**
- `src/components/calendar/CalendarModule.tsx` - Add drag handlers to WeekView/DayView
- `src/stores/taskStore.ts` - Ensure updateTask handles time changes
- `src/types/index.ts` - Verify Task type supports time fields

**Acceptance Criteria:**
- [ ] Tasks can be dragged vertically in Week/Day view to change time
- [ ] Time updates immediately on drop
- [ ] Visual feedback shows target time while dragging
- [ ] All-day tasks can be converted to timed tasks via drag
- [ ] Drag works smoothly without performance issues

---

### 3. Habit Reminder Desktop Notifications [MEDIUM] [FEATURE]
**Goal:** Send native desktop notifications for habit reminders (Electron only, with permission request).

**Current Behavior:**
- Habit reminders use browser Notification API
- Works in PWA but limited in Electron
- No native desktop notification integration

**Expected Behavior:**
- Electron app requests notification permission on first habit reminder setup
- Native desktop notifications appear (like Cursor/VS Code)
- Permission can be granted/revoked in Settings
- Notifications work even when app is minimized/backgrounded
- Respect quiet hours and notification preferences

**Implementation Plan:**
- [ ] Check if running in Electron (`window.electronAPI` or similar)
- [ ] Use Electron's `Notification` API for desktop notifications
- [ ] Add permission request flow in Settings → Notifications
- [ ] Update `notificationService.ts` to use Electron notifications when available
- [ ] Fallback to browser Notification API for PWA
- [ ] Add permission status indicator in Settings
- [ ] Handle permission denied/revoked gracefully
- [ ] Test on Windows/macOS/Linux

**Files to Modify:**
- `src/services/notificationService.ts` - Add Electron notification support
- `src/components/common/SettingsPanel.tsx` - Add permission request UI
- `src/stores/notificationStore.ts` - Add desktopPermissionGranted field
- `electron/main.ts` (if exists) - Ensure notification API is available

**Acceptance Criteria:**
- [ ] Desktop notifications work in Electron app
- [ ] Permission is requested before first notification
- [ ] Permission can be managed in Settings
- [ ] Notifications appear even when app is minimized
- [ ] Falls back gracefully to browser notifications in PWA
- [ ] Respects quiet hours and notification preferences

---

### 4. Sync Automation Improvements [HIGH] [FEATURE]
**Goal:** Remove "Sync Now" button, make sync fully automatic with manual override options.

**Current Behavior:**
- "Sync Now" button requires manual click
- Auto-sync interval exists but may not be obvious
- Users must remember to sync manually

**Expected Behavior:**
- Remove "Sync Now" button from UI
- Sync happens automatically:
  - On app startup (pull if remote newer)
  - On app close/visibility change (push)
  - At configured interval (auto-sync)
  - After data changes (debounced, e.g., 30 seconds)
- Manual override: Keep "Push" and "Pull" buttons for force operations
- Show sync status indicator (icon in status bar or settings)
- Display last sync time in Settings

**Implementation Plan:**
- [ ] Remove "Sync Now" button from SyncTab
- [ ] Add debounced auto-sync on data changes (watch store updates)
- [ ] Improve auto-sync interval reliability
- [ ] Add sync status indicator (StatusBar or Settings icon)
- [ ] Show last sync time prominently
- [ ] Keep "Push" and "Pull" buttons for manual override
- [ ] Add visual feedback when sync is in progress
- [ ] Handle sync conflicts gracefully (show notification if needed)

**Files to Modify:**
- `src/components/common/SettingsPanel.tsx` - Remove Sync Now button, add status indicator
- `src/services/gistSyncService.ts` - Add debounced sync on data changes
- `src/App.tsx` - Ensure auto-sync triggers properly
- `src/components/common/StatusBar.tsx` - Add sync status icon (if exists)

**Acceptance Criteria:**
- [ ] "Sync Now" button removed
- [ ] Sync happens automatically on startup, close, and interval
- [ ] Sync triggers after data changes (debounced)
- [ ] Manual "Push" and "Pull" buttons still available
- [ ] Sync status is visible to user
- [ ] Last sync time displayed in Settings

---

### 5. Fix Input Blocking After Gist Push [CRITICAL] [BUG]
**Goal:** Fix bug where app becomes unresponsive to input after Gist push/sync.

**Current Behavior:**
- After pushing to Gist, input fields become unresponsive
- User must close and reopen app to continue typing
- Likely caused by `applyData()` triggering full store updates

**Expected Behavior:**
- App remains responsive after sync operations
- Input fields maintain focus and accept input
- No UI freezing or blocking

**Root Cause Analysis:**
- `applyData()` in `gistSyncService.ts` calls `setState()` on all stores simultaneously
- This triggers React re-renders across entire app
- May cause focus loss or input blocking
- Need to batch updates or use more efficient update strategy

**Implementation Plan:**
- [ ] Investigate exact cause (add logging, check React DevTools)
- [ ] Batch store updates using React.startTransition or similar
- [ ] Avoid unnecessary re-renders (only update changed stores)
- [ ] Ensure sync operations don't block main thread
- [ ] Test with large datasets to verify fix
- [ ] Add error boundaries to prevent full app freeze

**Files to Modify:**
- `src/services/gistSyncService.ts` - Fix applyData() to batch updates
- `src/App.tsx` - Ensure sync doesn't block UI
- Add React.startTransition or similar batching mechanism

**Acceptance Criteria:**
- [ ] Input remains responsive after sync operations
- [ ] No UI freezing or blocking
- [ ] Focus is maintained on active input fields
- [ ] Works with large datasets (100+ notes/tasks)

---

### 6. Plugin System Foundation [LOW] [FEATURE]
**Goal:** Lay foundation for plugin system allowing users to extend app functionality.

**Note:** This is a large feature. This sprint focuses on foundation/architecture only.

**Current Behavior:**
- App functionality is hardcoded
- No extension mechanism
- Users cannot customize beyond settings

**Expected Behavior (Foundation):**
- Plugin architecture defined (API, lifecycle, hooks)
- Plugin loader/discovery mechanism
- Basic plugin example (e.g., custom command palette action)
- Plugin settings UI skeleton
- Security model (sandboxed execution, permissions)

**Implementation Plan:**
- [ ] Design plugin API (interfaces, types, hooks)
- [ ] Create plugin loader/discovery system
- [ ] Define plugin manifest format (plugin.json)
- [ ] Implement plugin lifecycle (load, enable, disable, unload)
- [ ] Add plugin storage (localStorage or separate store)
- [ ] Create plugin settings UI skeleton (Settings → Plugins tab)
- [ ] Build example plugin (simple command palette extension)
- [ ] Document plugin API for future development

**Files to Create:**
- `src/plugins/pluginApi.ts` - Plugin API definitions
- `src/plugins/pluginLoader.ts` - Plugin loading/discovery
- `src/plugins/pluginStore.ts` - Plugin state management
- `src/plugins/examples/examplePlugin.ts` - Example plugin
- `docs/PLUGIN_API.md` - Plugin development guide

**Files to Modify:**
- `src/components/common/SettingsPanel.tsx` - Add Plugins tab
- `src/stores/settingsStore.ts` - Add plugin preferences
- `src/App.tsx` - Initialize plugin system on mount

**Acceptance Criteria:**
- [ ] Plugin API defined and documented
- [ ] Plugin loader can discover and load plugins
- [ ] Example plugin works (e.g., adds command to palette)
- [ ] Plugin settings UI exists (even if minimal)
- [ ] Plugins can be enabled/disabled
- [ ] Foundation ready for future plugin development

**Future Work (Not in this sprint):**
- Plugin marketplace/discovery
- More plugin hooks (beforeSave, afterTaskComplete, etc.)
- Plugin UI components
- Plugin permissions system
- Plugin updates/versioning

---

## Implementation Order

### Phase 1: Critical Bug Fix (Day 1)
1. **Task 5:** Fix Input Blocking After Gist Push [CRITICAL]
   - Highest priority, blocks user workflow
   - Should be fixed before other sync improvements

### Phase 2: Sync Improvements (Day 2)
2. **Task 4:** Sync Automation Improvements
   - Builds on bug fix
   - Improves user experience significantly

### Phase 3: Drag & Drop Features (Day 3-5)
3. **Task 1:** Drag & Drop Task Reordering
4. **Task 2:** Calendar Drag & Drop Task Time Editing
   - Can be worked on in parallel
   - Similar implementation patterns

### Phase 4: Desktop Notifications (Day 6)
5. **Task 3:** Habit Reminder Desktop Notifications
   - Electron-specific, isolated feature

### Phase 5: Plugin Foundation (Day 7-10)
6. **Task 6:** Plugin System Foundation
   - Large architectural work
   - Can be started in parallel with other tasks
   - May extend beyond sprint if needed

---

## Dependencies

- **Task 5 → Task 4:** Sync bug fix needed before automation improvements
- **Task 1 & Task 2:** Can be done in parallel (different modules)
- **Task 6:** Independent, can be done anytime

---

## Risk Register

### R1: Drag & Drop Performance
**Risk:** Drag & drop may cause performance issues with many tasks
**Mitigation:** 
- Use virtualization if needed (react-window)
- Debounce updates during drag
- Test with 100+ tasks

### R2: Calendar Drag Complexity
**Risk:** Time calculation from mouse position may be inaccurate
**Mitigation:**
- Use snap-to-hour or snap-to-15min intervals
- Show preview tooltip with exact time
- Allow fine-tuning via edit modal after drag

### R3: Electron Notification Permissions
**Risk:** Permission flow may be confusing or OS-specific
**Mitigation:**
- Clear UI explaining why permission is needed
- Handle permission denied gracefully
- Test on all target platforms

### R4: Sync Debouncing
**Risk:** Too frequent syncs may hit rate limits or cause performance issues
**Mitigation:**
- Use appropriate debounce delay (30-60 seconds)
- Batch multiple changes
- Respect GitHub API rate limits

### R5: Plugin System Scope Creep
**Risk:** Plugin system may become too complex for foundation sprint
**Mitigation:**
- Focus on architecture only
- Defer advanced features to future sprints
- Keep example plugin minimal

---

## Acceptance Criteria (Overall)

- [ ] All critical bugs fixed (input blocking)
- [ ] Sync is fully automatic with manual override
- [ ] Tasks can be reordered via drag & drop
- [ ] Calendar tasks can be rescheduled via drag & drop
- [ ] Desktop notifications work in Electron
- [ ] Plugin system foundation is in place
- [ ] No performance regressions
- [ ] All features work offline (except sync)
- [ ] Keyboard shortcuts still work correctly
- [ ] i18n strings added for all new UI elements

---

## Testing Checklist

### Manual Testing
- [ ] Test drag & drop with 10, 50, 100+ tasks
- [ ] Test calendar drag with various time scenarios
- [ ] Test sync automation (startup, close, interval, data changes)
- [ ] Test desktop notifications on Windows/macOS
- [ ] Test input responsiveness after sync operations
- [ ] Test plugin loading/enabling/disabling

### Edge Cases
- [ ] Drag task to invalid time (e.g., past deadline)
- [ ] Sync while offline (should queue or skip)
- [ ] Notification permission denied flow
- [ ] Plugin with invalid manifest
- [ ] Large dataset sync performance

---

## Documentation Updates

- [ ] Update `CHANGELOG.md` with all new features
- [ ] Update `CLAUDE.md` with Sprint 32 completion status
- [ ] Create `docs/PLUGIN_API.md` for plugin development
- [ ] Update user-facing docs if needed

---

## Notes

- **Drag & Drop Library:** Consider `@dnd-kit/core` (modern, accessible) or `react-beautiful-dnd` (mature, but may have React 18 issues)
- **Sync Debouncing:** Use lodash debounce or custom implementation (30-60 second delay)
- **Plugin System:** This is a foundation sprint. Full plugin marketplace/UI will come later
- **Desktop Notifications:** Electron's Notification API is cross-platform, but permission handling may differ

---

## Future Considerations

- **Task 1:** Consider adding "Pin to top" feature alongside drag & drop
- **Task 2:** Consider adding "Duplicate task" on drag with modifier key
- **Task 3:** Consider notification actions (e.g., "Mark habit complete" from notification)
- **Task 4:** Consider sync conflict resolution UI (if remote and local both changed)
- **Task 6:** Future sprints can add more plugin hooks, UI components, marketplace

