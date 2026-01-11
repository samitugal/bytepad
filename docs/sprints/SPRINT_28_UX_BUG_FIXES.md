# Sprint 28: UX Bug Fixes & Improvements

## Overview
Fix critical UX bugs and improve user experience across multiple modules.

## Status: COMPLETED ✅
- Start: 2026-01-11
- Completed: 2026-01-11

## Tasks

### 1. Subtask Undone Bug Fix [HIGH] ✅
- [x] Fix: When parent task with subtasks is marked done, it cannot be undone
- [x] Remove auto-complete logic that re-completes parent when subtasks are done
- [x] Allow manual toggle of parent task regardless of subtask state

### 2. FlowBot Text Wrap [MEDIUM] ✅
- [x] Ensure long messages wrap properly in chat panel
- [x] Add word-break for long URLs/text (break-words class)
- [x] Fix overflow issues (overflow-wrap-anywhere)

### 3. Wikilink Formatting Enhancement [HIGH] ✅
- [x] Replace [[link]] plain text with styled links
- [x] Add distinct color for wikilinks in preview (cyan for notes, orange for tasks)
- [x] Show icons (📝 for notes, ✓ for tasks, ⚠ for not found)
- [x] Handle clicks to navigate to linked content

## Acceptance Criteria
- [x] Sprint plan created
- [x] Subtask toggle works bidirectionally
- [x] Chat messages wrap properly
- [x] Wikilinks are visually distinct and interactive

## Technical Notes
- TasksModule.tsx has auto-complete useEffect that causes the bug
- NoteEditor.tsx uses ReactMarkdown - need custom components for wikilinks
- ChatWindow.tsx already has whitespace-pre-wrap but may need word-break
