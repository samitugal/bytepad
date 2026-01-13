# Sprint 35: Universal Entity Linking & Editor Improvements

**Start Date:** 2026-01-13  
**Target Version:** v0.21.0  
**Status:** 🔄 IN PROGRESS

---

## Sprint Goals

1. Create a unified wikilink/autocomplete system for all entity types
2. Fix Notes editor UX issues (Tab indent, CodeBlock support)
3. Fix Knowledge Graph to show cross-entity links (bookmark ↔ note)
4. Enable bidirectional linking between all entity types

---

## 🔴 TODO (Must Have)

### Task 1: Universal WikilinkAutocomplete Component
**Priority:** P1 | **Effort:** M | **Status:** ⬜

**Problem:**
- Currently, wikilink autocomplete exists separately in BookmarksModule
- Notes can only link to other notes via `[[Note Name]]`
- No way to link notes to bookmarks, tasks, or habits
- Each component has its own autocomplete implementation

**Solution:**
Create a shared `WikilinkAutocomplete` component in `src/components/common/` that:
- Supports all entity types: notes, tasks, habits, bookmarks, journal entries
- Uses unified syntax: `[[Entity Name]]` with type prefix detection
- Provides keyboard navigation (↑↓ Enter Escape)
- Shows entity type icons and colors
- Can be used in any textarea/input across the app

**Implementation:**
```
src/components/common/WikilinkAutocomplete.tsx
- WikilinkAutocomplete component (wrapper for textarea)
- useWikilinkSuggestions hook (shared logic)
- Entity type detection and filtering
- Keyboard event handling
```

**Syntax Support:**
| Syntax | Entity Type | Example |
|--------|-------------|---------|
| `[[Name]]` | Auto-detect (searches all) | `[[OpenAI Research]]` |
| `[[note:Name]]` | Note only | `[[note:Meeting Notes]]` |
| `[[task:Name]]` | Task only | `[[task:Fix bug]]` |
| `[[habit:Name]]` | Habit only | `[[habit:Exercise]]` |
| `[[bookmark:Name]]` | Bookmark only | `[[bookmark:React Docs]]` |

**Files to modify:**
- [ ] Create `src/components/common/WikilinkAutocomplete.tsx`
- [ ] Create `src/hooks/useWikilinkSuggestions.ts`
- [ ] Update `src/components/common/index.ts` exports
- [ ] Refactor BookmarksModule to use shared component
- [ ] Update Notes editor to use shared component

---

### Task 2: Notes Editor - CodeBlock Support
**Priority:** P1 | **Effort:** S | **Status:** ⬜

**Problem:**
- No quick way to insert code blocks in notes
- Users need to manually type ``` which is slow

**Solution:**
Add `Ctrl+Shift+C` shortcut to insert a code block at cursor position.

**Implementation:**
```typescript
// In NoteEditor or NotesModule
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'C') {
    e.preventDefault()
    insertCodeBlock()
  }
}

const insertCodeBlock = () => {
  const textarea = textareaRef.current
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.slice(start, end)
  
  const codeBlock = selectedText 
    ? `\`\`\`\n${selectedText}\n\`\`\``
    : `\`\`\`\n\n\`\`\``
  
  // Insert and position cursor inside block
  const newContent = content.slice(0, start) + codeBlock + content.slice(end)
  setContent(newContent)
  // Position cursor after first ```\n
}
```

**Files to modify:**
- [ ] `src/components/notes/NoteEditor.tsx` or equivalent

---

### Task 3: Notes Editor - Tab Indent Fix
**Priority:** P1 | **Effort:** S | **Status:** ⬜

**Problem:**
- Pressing Tab in notes editor moves focus to next element
- Expected behavior: Tab should insert indentation (2 or 4 spaces)
- This breaks code editing experience

**Solution:**
Intercept Tab key in notes textarea and insert spaces instead.

**Implementation:**
```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === 'Tab') {
    e.preventDefault()
    const textarea = e.currentTarget
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    // Insert 2 spaces (or 4, configurable)
    const indent = '  '
    const newContent = content.slice(0, start) + indent + content.slice(end)
    setContent(newContent)
    
    // Move cursor after indent
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + indent.length
    }, 0)
  }
}
```

**Files to modify:**
- [ ] `src/components/notes/NoteEditor.tsx` or equivalent

---

### Task 4: Knowledge Graph - Cross-Entity Link Bug Fix
**Priority:** P1 | **Effort:** M | **Status:** ⬜

**Problem:**
- Bookmark description contains `[[Note Name]]` wikilink
- Graph does not show connection between bookmark and note
- Links are parsed for display but not for graph edges

**Root Cause Analysis:**
The graph builder likely only looks at:
- Note content for `[[wikilinks]]`
- Tags for tag-based connections
- Does NOT parse bookmark descriptions for wikilinks

**Solution:**
Update graph builder to:
1. Parse bookmark descriptions for wikilinks
2. Parse task descriptions for wikilinks
3. Create edges for all cross-entity wikilinks

**Implementation:**
```typescript
// In graphStore.ts or graph builder
function parseWikilinks(text: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g
  const matches = []
  let match
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1])
  }
  return matches
}

// When building graph edges:
// 1. Parse note content for wikilinks → create note-note edges
// 2. Parse bookmark descriptions for wikilinks → create bookmark-note edges
// 3. Parse task descriptions for wikilinks → create task-note edges
```

**Files to modify:**
- [ ] `src/stores/graphStore.ts` or graph builder logic
- [ ] Verify edge creation for bookmark → note links

---

### Task 5: Notes - Bookmark Linking via Autocomplete
**Priority:** P2 | **Effort:** S | **Status:** ⬜

**Problem:**
- Notes autocomplete only shows other notes
- Cannot link to bookmarks from within notes
- Limits cross-referencing capability

**Solution:**
After Task 1 (Universal WikilinkAutocomplete), integrate it into Notes editor.
The autocomplete should show:
- Notes (📝)
- Tasks (✅)
- Habits (🔄)
- Bookmarks (🔖)

**Depends on:** Task 1

---

## 🟡 Nice to Have

### Task 6: Inline Code Support
**Priority:** P3 | **Effort:** S | **Status:** ⬜

Add `Ctrl+\`` shortcut to wrap selected text in inline code backticks.

### Task 7: Link Preview on Hover
**Priority:** P3 | **Effort:** M | **Status:** ⬜

Show a small preview popup when hovering over wikilinks.

---

## 📋 Implementation Order

1. **Task 1** - Universal WikilinkAutocomplete (foundation)
2. **Task 3** - Tab indent fix (quick win)
3. **Task 2** - CodeBlock shortcut (quick win)
4. **Task 4** - Graph bug fix (important)
5. **Task 5** - Notes bookmark linking (depends on Task 1)

---

## 🧪 Testing Checklist

### Universal Autocomplete
- [ ] Type `[[` in notes → shows all entity types
- [ ] Type `[[note:` → filters to notes only
- [ ] Type `[[bookmark:` → filters to bookmarks only
- [ ] Arrow keys navigate suggestions
- [ ] Enter selects suggestion
- [ ] Escape closes dropdown
- [ ] Works in: Notes, Bookmarks description, Task description

### CodeBlock
- [ ] `Ctrl+Shift+C` inserts empty code block
- [ ] With selection: wraps selected text in code block
- [ ] Cursor positioned inside block after insert

### Tab Indent
- [ ] Tab inserts spaces (not focus change)
- [ ] Shift+Tab removes indent (optional)
- [ ] Works at any cursor position

### Graph Links
- [ ] Bookmark with `[[Note]]` in description shows edge to note
- [ ] Task with `[[Note]]` in description shows edge to note
- [ ] Bidirectional: note linking to bookmark shows edge

---

## 📊 Effort Legend

- **S** = Small (< 2 hours)
- **M** = Medium (2-8 hours)
- **L** = Large (1-3 days)

## 📌 Status Legend

- ⬜ = Not Started
- 🔄 = In Progress
- ✅ = Completed
- ⏸️ = On Hold

---

## 🔗 Dependencies

- Task 5 depends on Task 1
- All tasks are otherwise independent

---

## ⚠️ Risks

| Risk | Mitigation |
|------|------------|
| Autocomplete performance with many entities | Limit suggestions to 10, debounce input |
| Graph rebuild performance | Only rebuild affected edges, not full graph |
| Tab key accessibility concerns | Provide Escape to exit textarea |

---

*Last Updated: 2026-01-13*
