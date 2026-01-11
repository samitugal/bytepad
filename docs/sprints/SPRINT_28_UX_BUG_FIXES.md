# Sprint 28: UX Bug Fixes & Improvements

## Overview
Fix critical UX bugs and improve user experience across multiple modules.

## Status: IN_PROGRESS
- Start: 2026-01-11
- Target: 2026-01-12

## Tasks

### 1. Subtask Undone Bug Fix [HIGH]
- [ ] Fix: When parent task with subtasks is marked done, it cannot be undone
- [ ] Remove or modify auto-complete logic that re-completes parent when subtasks are done
- [ ] Allow manual toggle of parent task regardless of subtask state

### 2. FlowBot Text Wrap [MEDIUM]
- [ ] Ensure long messages wrap properly in chat panel
- [ ] Add word-break for long URLs/text
- [ ] Fix any overflow issues

### 3. Wikilink Formatting Enhancement [HIGH]
- [ ] Replace [[link]] plain text with styled links
- [ ] Add distinct color for wikilinks in preview
- [ ] Show tooltip on hover with target info
- [ ] Handle clicks to navigate to linked content

## Acceptance Criteria
- [x] Sprint plan created
- [ ] Subtask toggle works bidirectionally
- [ ] Chat messages wrap properly
- [ ] Wikilinks are visually distinct and interactive

## Technical Notes
- TasksModule.tsx has auto-complete useEffect that causes the bug
- NoteEditor.tsx uses ReactMarkdown - need custom components for wikilinks
- ChatWindow.tsx already has whitespace-pre-wrap but may need word-break
