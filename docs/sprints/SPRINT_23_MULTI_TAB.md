# Sprint 23: Multi-Tab Support
**Goal:** Implement multi-tab functionality for notes and other modules
**Duration:** 3-4 days
**Priority:** MEDIUM
**Status:** PLANNED

---

## Background

### Current State
- Tab bar shows module name with dropdown
- "+" button exists but does nothing
- Only one view per module at a time
- No way to have multiple notes open simultaneously

### Why Multi-Tab?
1. **Productivity**: Work on multiple notes without losing context
2. **Reference**: Keep reference material open while writing
3. **Comparison**: Compare different notes side by side
4. **Workflow**: Better matches how users work in IDEs

---

## 23.1: Tab State Management

### New Store: `tabStore.ts`
```typescript
interface Tab {
  id: string
  type: 'note' | 'task' | 'habit' | 'journal' | 'bookmark'
  entityId: string | null  // ID of the opened item
  title: string
  isActive: boolean
  isPinned: boolean
}

interface TabState {
  tabs: Tab[]
  activeTabId: string | null
  
  // Actions
  addTab: (type: Tab['type'], entityId?: string) => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTabTitle: (tabId: string, title: string) => void
  pinTab: (tabId: string) => void
  unpinTab: (tabId: string) => void
  reorderTabs: (fromIndex: number, toIndex: number) => void
}
```

### Tasks:
- [ ] Create `src/stores/tabStore.ts`
- [ ] Persist tabs in localStorage
- [ ] Handle tab limit (max 10 tabs)
- [ ] Auto-close oldest unpinned tab when limit reached

---

## 23.2: TabBar Component Enhancement

### Current TabBar
```tsx
// Shows: "Notes ▼" with + button
```

### New TabBar
```tsx
// Shows: [📝 Note 1] [📝 Note 2] [+]
// Each tab has: icon, title (truncated), close button
// Active tab highlighted
// Drag to reorder
// Right-click context menu
```

### Features:
- [ ] Render multiple tabs
- [ ] Tab close button (×)
- [ ] Tab overflow handling (scroll or dropdown)
- [ ] Active tab indicator
- [ ] Double-click to rename
- [ ] Middle-click to close
- [ ] Drag and drop reorder

### Tasks:
- [ ] Update `src/components/layout/TabBar.tsx`
- [ ] Add tab icons per type
- [ ] Implement close functionality
- [ ] Add overflow menu for many tabs

---

## 23.3: Module Integration

### Notes Module
- Opening a note creates/activates its tab
- Creating new note creates new tab
- Tab title = note title (or "Untitled")

### Tasks Module
- Opening task detail creates tab
- Tab shows task title

### Other Modules
- Each module can have one "home" tab
- Specific items open in new tabs

### Tasks:
- [ ] Update NoteList to create tabs on note click
- [ ] Update NoteEditor to sync with active tab
- [ ] Handle tab switching in MainContent
- [ ] Sync activeNoteId with tab state

---

## 23.4: Keyboard Shortcuts

### New Shortcuts
```
Ctrl+T        → New tab (same type as current)
Ctrl+W        → Close current tab
Ctrl+Tab      → Next tab
Ctrl+Shift+Tab → Previous tab
Ctrl+1-9      → Switch to tab 1-9
```

### Tasks:
- [ ] Add shortcuts to useKeyboardShortcuts
- [ ] Handle Ctrl+W (don't close browser!)
- [ ] Cycle through tabs with Ctrl+Tab

---

## 23.5: Tab Context Menu

### Right-click Options
- Close
- Close Others
- Close All
- Close to the Right
- Pin/Unpin
- Duplicate

### Tasks:
- [ ] Create TabContextMenu component
- [ ] Implement all menu actions

---

## File Changes

### New Files
```
src/stores/tabStore.ts
src/components/layout/TabContextMenu.tsx
```

### Modified Files
```
src/components/layout/TabBar.tsx
src/components/layout/MainContent.tsx
src/components/notes/NoteList.tsx
src/hooks/useKeyboardShortcuts.ts
```

---

## Acceptance Criteria

- [ ] Can open multiple notes in tabs
- [ ] Can close tabs individually
- [ ] Tab state persists on refresh
- [ ] Keyboard shortcuts work
- [ ] Tab overflow handled gracefully
- [ ] Maximum 10 tabs enforced

---

## Technical Notes

### Tab ID Generation
Use `crypto.randomUUID()` or timestamp-based ID

### Tab-Module Sync
When tab becomes active:
1. Update tabStore.activeTabId
2. Update relevant module store (e.g., noteStore.activeNoteId)
3. Update uiStore.activeModule if needed

### Edge Cases
- Closing last tab → show empty state or create new tab
- Deleting entity → close its tab
- Renaming entity → update tab title

---

*Sprint 23 - Multi-Tab Support*
*Estimated: 3-4 days*
*Priority: MEDIUM*
