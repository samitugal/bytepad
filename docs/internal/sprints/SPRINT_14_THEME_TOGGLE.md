# Sprint 14: Theme Toggle
**Goal:** Add dark/light theme toggle while preserving Notepad++ aesthetic
**Duration:** 3-5 days
**Priority:** MEDIUM
**Status:** ✅ COMPLETED (2026-01-10)

---

## 14.1: Light Theme Tokens ✅
- [x] Define light theme CSS variables in `index.css`
- [x] Ensure contrast/accessibility
- [x] Match Notepad++ light theme vibe

## 14.2: Theme Switcher ✅
- [x] Add theme state to `themeStore.ts`
- [x] Create theme toggle in Settings → General
- [x] Persist preference with zustand/persist

## 14.3: System Preference ✅
- [x] Detect system preference
- [x] Add "System" option
- [x] Listen for preference changes

---

## Implementation Details
- **Theme Store:** `src/stores/themeStore.ts` handles theme state
- **CSS Variables:** `src/index.css` defines dark/light tokens
- **Settings UI:** Theme selector in SettingsPanel General tab

## Completion Criteria ✅
- [x] Theme toggle is instant and persistent
- [x] No unreadable text/low contrast
- [x] All components respect theme tokens
- [x] System preference option works

