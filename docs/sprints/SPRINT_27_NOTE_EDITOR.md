# Sprint 27: Note Editor Improvements
**Duration:** 3-5 days
**Priority:** MEDIUM
**Status:** PLANNED

---

## Overview
Improve the note editor experience with better line number synchronization, syntax highlighting, and usability enhancements.

---

## Problem Statement
The current note editor has a critical UX issue where line numbers become desynchronized with text content when lines wrap. This is especially noticeable in long notes with paragraphs that span multiple visual lines.

---

## Tasks

### 1. Fix Line Numbers Sync [P2] [bug]
**Current Issue:** 
- Line numbers count logical lines (split by `\n`)
- Textarea wraps long lines visually
- Result: Line 104 shows different content than expected

**Solutions (choose one):**

**Option A: CodeMirror Integration**
- Replace textarea with CodeMirror
- Pros: Full editor features, built-in line numbers
- Cons: Bundle size increase (~150KB), learning curve

**Option B: Monaco Editor**
- Replace textarea with Monaco
- Pros: VS Code-like experience, excellent TypeScript support
- Cons: Large bundle (~2MB), overkill for notes

**Option C: Custom Virtual Lines**
- Calculate wrapped line heights using hidden div
- Sync line number heights with visual lines
- Pros: No new dependencies
- Cons: Complex implementation, edge cases

**Option D: Disable Wrap (Current)**
- Use `white-space: pre` with horizontal scroll
- Pros: Simple, line numbers always sync
- Cons: Poor UX for prose writing

**Recommendation:** Option A (CodeMirror) for best balance

### 2. Markdown Syntax Highlighting [P4] [feat]
- Highlight headers, bold, italic, links
- Use existing color tokens (np-cyan, np-purple, etc.)
- Maintain Notepad++ aesthetic

### 3. Word/Character Count [P4] [ux]
- Show word count in status bar
- Show character count
- Update in real-time (debounced)

### 4. Quick Note Creation Shortcut [P3] [ux]
- Global shortcut: Ctrl+Alt+N
- Creates new note and focuses editor
- Works from any module

### 5. Split View Improvements [P4] [ux]
- Better responsive behavior
- Sync scroll between edit and preview
- Remember split position preference

---

## Acceptance Criteria
- [ ] Line numbers match visible content at all scroll positions
- [ ] No horizontal scroll in default editing mode
- [ ] Word count visible in status bar
- [ ] Ctrl+Alt+N creates new note from anywhere
- [ ] Split view scrolls are synchronized

---

## Technical Notes

### CodeMirror Integration (if chosen)
```bash
npm install @codemirror/state @codemirror/view @codemirror/lang-markdown
```

```typescript
// Basic setup
import { EditorView, basicSetup } from 'codemirror'
import { markdown } from '@codemirror/lang-markdown'

const view = new EditorView({
  extensions: [basicSetup, markdown()],
  parent: document.body
})
```

### Theme Tokens to Use
- Headers: `text-np-cyan`, `text-np-blue`
- Bold: `text-np-orange`
- Italic: `text-np-purple`
- Links: `text-np-cyan`
- Code: `text-np-green`, `bg-np-bg-tertiary`

---

## Dependencies
- None (standalone improvement)

---

## Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| CodeMirror bundle size | MEDIUM | Lazy load, tree-shaking |
| Breaking existing notes | LOW | Preserve content format |
| Performance with large notes | MEDIUM | Virtual scrolling |

---

## Definition of Done
- [ ] All acceptance criteria met
- [ ] No new lint errors
- [ ] Keyboard navigation works
- [ ] Works offline
- [ ] Mobile-friendly (if applicable)
