# Sprint 26: Keyboard Shortcuts Fix & Enhancement
**Goal:** Fix broken shortcuts and add missing ones
**Duration:** 1-2 days
**Priority:** HIGH
**Status:** PLANNED

---

## Background

### Reported Issues
- `Ctrl+N` doesn't create new note
- Some shortcuts may conflict with browser defaults
- Missing shortcuts for common actions

### Current Shortcuts (from useKeyboardShortcuts.ts)
```
Ctrl+K        → Command Palette
Ctrl+1-8      → Module navigation
Ctrl+/        → FlowBot
Ctrl+Shift+F  → Focus Mode
Ctrl+Shift+N  → Notification Center
Escape        → Close modals
```

---

## 26.1: Fix Ctrl+N (New Note)

### Problem
`Ctrl+N` is captured by browser (opens new window)

### Solution Options
1. **Use different shortcut**: `Ctrl+Shift+N` or `Alt+N`
2. **Prevent default**: May not work in all browsers
3. **Context-aware**: Only work when in Notes module

### Implementation
```typescript
// In useKeyboardShortcuts.ts
if (e.ctrlKey && e.key === 'n') {
  e.preventDefault()
  e.stopPropagation()
  
  const { activeModule } = useUIStore.getState()
  
  if (activeModule === 'notes') {
    const { addNote, setActiveNoteId } = useNoteStore.getState()
    const newNote = addNote()
    setActiveNoteId(newNote.id)
  } else if (activeModule === 'tasks') {
    // Open new task modal
  } else if (activeModule === 'dailynotes') {
    // Create new daily note card
  }
}
```

### Tasks:
- [ ] Add Ctrl+N handler with preventDefault
- [ ] Make context-aware (different action per module)
- [ ] Test in Chrome, Firefox, Edge

---

## 26.2: Add Missing Shortcuts

### New Shortcuts to Add
```
Ctrl+N        → New item (context-aware)
Ctrl+S        → Save current item
Ctrl+D        → Duplicate current item
Ctrl+Delete   → Delete current item (with confirm)
Ctrl+F        → Focus search in current module
Ctrl+G        → Go to Graph (new)
Ctrl+E        → Toggle edit/preview mode (notes)
Alt+1-9       → Quick switch tabs (when multi-tab ready)
```

### Tasks:
- [ ] Implement Ctrl+N (new)
- [ ] Implement Ctrl+S (save) - already in NoteEditor
- [ ] Implement Ctrl+D (duplicate)
- [ ] Implement Ctrl+Delete (delete)
- [ ] Implement Ctrl+F (search)
- [ ] Implement Ctrl+G (graph)
- [ ] Implement Ctrl+E (edit/preview)

---

## 26.3: Shortcut Conflict Resolution

### Browser Conflicts
| Shortcut | Browser Action | Our Action | Resolution |
|----------|---------------|------------|------------|
| Ctrl+N | New window | New item | preventDefault |
| Ctrl+W | Close tab | Close tab (ours) | Use Ctrl+Shift+W |
| Ctrl+T | New tab | New tab (ours) | Use Ctrl+Shift+T |
| Ctrl+S | Save page | Save item | preventDefault |
| Ctrl+F | Find in page | Search | preventDefault |

### Electron-specific
In Electron, we have more control. Can use:
- `Ctrl+N` without conflict
- `Ctrl+W` for our tabs
- Global shortcuts work even when app not focused

### Tasks:
- [ ] Document all shortcuts
- [ ] Test browser conflicts
- [ ] Add Electron-specific shortcuts

---

## 26.4: Shortcuts Help Modal

### Feature
Show all available shortcuts in a modal

### Trigger
- `Ctrl+?` or `Ctrl+Shift+/`
- Also accessible from Help menu

### UI Design
```
┌─────────────────────────────────────────┐
│ ⌨️ Keyboard Shortcuts                   │
├─────────────────────────────────────────┤
│ Navigation                              │
│   Ctrl+1-8      Switch modules          │
│   Ctrl+K        Command Palette         │
│   Ctrl+G        Knowledge Graph         │
│                                         │
│ Actions                                 │
│   Ctrl+N        New item                │
│   Ctrl+S        Save                    │
│   Ctrl+D        Duplicate               │
│   Delete        Delete item             │
│                                         │
│ Focus Mode                              │
│   Ctrl+Shift+F  Toggle Focus Mode       │
│   Space         Pause/Resume timer      │
│                                         │
│ FlowBot                                 │
│   Ctrl+/        Open FlowBot            │
│   Escape        Close                   │
└─────────────────────────────────────────┘
```

### Tasks:
- [ ] Create ShortcutsModal component
- [ ] Add Ctrl+? trigger
- [ ] Group shortcuts by category
- [ ] Make searchable

---

## 26.5: Customizable Shortcuts (Future)

### Settings Integration
Allow users to customize shortcuts in Settings

### Data Structure
```typescript
interface ShortcutConfig {
  action: string
  keys: string[]  // e.g., ['ctrl', 'n']
  description: string
  category: string
}
```

### Tasks (Future Sprint):
- [ ] Add shortcuts section to Settings
- [ ] Allow rebinding
- [ ] Detect conflicts
- [ ] Reset to defaults

---

## File Changes

### Modified Files
```
src/hooks/useKeyboardShortcuts.ts
src/components/common/ShortcutsModal.tsx (new)
src/components/common/index.ts
```

---

## Acceptance Criteria

- [ ] Ctrl+N creates new note when in Notes module
- [ ] Ctrl+N creates new task when in Tasks module
- [ ] Shortcuts don't conflict with browser
- [ ] Shortcuts help modal accessible
- [ ] All documented shortcuts work

---

## Testing Checklist

- [ ] Test Ctrl+N in Notes module
- [ ] Test Ctrl+N in Tasks module
- [ ] Test Ctrl+S saves note
- [ ] Test Ctrl+K opens Command Palette
- [ ] Test Ctrl+/ opens FlowBot
- [ ] Test Ctrl+Shift+F toggles Focus Mode
- [ ] Test Escape closes modals
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Electron app

---

*Sprint 26 - Keyboard Shortcuts Fix*
*Estimated: 1-2 days*
*Priority: HIGH*
