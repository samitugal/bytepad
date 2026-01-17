# Sprint 36: Notes, Shortcuts, and Task UX

**Goal:** Capture support notes and UX improvements around shortcuts, search, autocomplete, and subtasks.
**Duration:** 1 week
**Priority:** MEDIUM
**Status:** COMPLETED

## Completed Tasks

### 1. Document Recovery Steps for Accidental Pull/Push Operations
**File:** `docs/features/sync.md`
- Added comprehensive "Data Recovery" section
- Documented recovery steps for accidental pull (overwrote local data)
- Documented recovery steps for accidental push (overwrote remote data)
- Added step-by-step Gist revision recovery guide
- Added recovery best practices

### 2. Add Support Notes for Keeping Files Locally (TXT Format)
**File:** `docs/features/sync.md`
- Added "Local File Storage (TXT Format)" section
- Documented why keeping local files is beneficial
- Added export to TXT/Markdown instructions
- Added recommended file naming conventions
- Added backup folder structure recommendations

### 3. Add Page Search with Ctrl+F
**Files:**
- `src/stores/uiStore.ts` - Added pageSearchOpen and pageSearchQuery state
- `src/stores/keybindingsStore.ts` - Added Ctrl+F keybinding
- `src/hooks/useKeyboardShortcuts.ts` - Added pageSearch handler
- `src/components/common/PageSearch.tsx` - New component
- `src/App.tsx` - Integrated PageSearch component

**Features:**
- Ctrl+F opens floating search bar (top-right corner)
- Real-time highlighting of matches on the current page
- Navigation between matches (Enter/Shift+Enter or arrows)
- Match counter (current/total)
- Keyboard hints (Enter, Shift+Enter, Esc)

### 4. Investigate and Fix Autocomplete Placement Bug
**File:** `src/components/notes/WikilinkAutocomplete.tsx`
- Fixed viewport boundary detection
- Added bottom overflow check (dropdown shows above cursor if needed)
- Added right overflow check (aligns to right of textarea)
- Improved position calculation for viewport-relative coordinates

### 5. Add Ctrl+Enter Shortcut for Automatic Save
**Files:**
- `src/stores/keybindingsStore.ts` - Added Ctrl+Enter keybinding
- `src/hooks/useKeyboardShortcuts.ts` - Added save handler

**Features:**
- Ctrl+Enter triggers blur on active input (triggering auto-save)
- Re-focuses the input after saving
- Dispatches custom `bytepad:save` event for components

### 6. Manual Subtask Creation Under a Task
**Status:** Already implemented

**Existing Implementation:**
- `src/components/tasks/TaskItem.tsx` - Has subtask input in expanded view
- `src/components/tasks/TasksModule.tsx` - Has handleAddSubtask function
- `src/stores/taskStore.ts` - Has addSubtask method

**How to use:**
1. Click on a task to expand it
2. Type in the "Add subtask" input field
3. Press Enter or click "+ Add" button

## New Keyboard Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+F` | Page Search | Search within current page content |
| `Ctrl+Enter` | Save | Save current item in any module |

## Technical Notes

### PageSearch Component
- Uses DOM TreeWalker to find text nodes
- Creates `<mark>` elements for highlighting
- Supports regex-escaped queries
- Auto-cleans highlights when closed
- Debounced search (200ms)

### Autocomplete Fix
- Now calculates viewport coordinates before positioning
- Checks if dropdown would overflow bottom or right edge
- Adjusts position to stay within visible area

## Files Modified

```
docs/features/sync.md (updated)
docs/sprints/SPRINT_36_NOTES_SHORTCUTS_TASK_UX.md (new)
src/stores/uiStore.ts (updated)
src/stores/keybindingsStore.ts (updated)
src/hooks/useKeyboardShortcuts.ts (updated)
src/components/common/PageSearch.tsx (new)
src/components/notes/WikilinkAutocomplete.tsx (updated)
src/App.tsx (updated)
```
