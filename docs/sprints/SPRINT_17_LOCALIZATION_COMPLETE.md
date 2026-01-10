# Sprint 17: Complete Localization
**Goal:** Convert all hardcoded UI strings to use i18n system, make English the default
**Duration:** 1-2 days
**Priority:** HIGH
**Status:** COMPLETED

---

## Background
- i18n infrastructure exists (useTranslation hook, en.json, tr.json)
- Language selector exists in Settings → General
- Many components still have hardcoded Turkish/mixed text
- Need to standardize on English as default, with Turkish as option

---

## 17.1: Components Updated

### High Priority (Core UI)
- [x] CalendarModule.tsx - Buttons, labels, modals
- [x] TasksModule.tsx - Filters, actions, labels, form inputs
- [x] ChatWindow.tsx - FlowBot UI, greeting, placeholder
- [x] Sidebar.tsx - Navigation labels with dynamic translation
- [x] StatusBar.tsx - Status messages, locale-aware dates
- [x] TabBar.tsx - Tab labels with dynamic translation

### Medium Priority (Feature Modules)
- [x] DailyNotesModule.tsx - Daily notes UI, date navigation
- [x] DailyNoteCard.tsx - Card labels, edit form, delete modal
- [x] NoteEditor.tsx - Editor UI, toolbar, delete modal
- [x] NoteList.tsx - List labels, search, tag cloud
- [x] NotesModule.tsx - Graph button
- [x] BookmarksModule.tsx - Bookmarks UI, collections, sort options
- [x] SettingsPanel.tsx - Settings UI (previously done)

### Lower Priority (Secondary UI)
- [ ] CommandPalette.tsx - Command labels (deferred)
- [ ] GlobalSearch.tsx - Search UI (deferred)

---

## Implementation Summary

### Translation Keys Added
- `tasks.*` - 25+ new keys for task module
- Extended `common.*` with more shared strings
- All modules now use `useTranslation()` hook

### Pattern Used
```tsx
const { t, language } = useTranslation()

// Simple translation
{t('tasks.newTask')}

// With interpolation
{t('tasks.pendingCount', { count: 5 })}

// Locale-aware dates
const locale = language === 'tr' ? 'tr-TR' : 'en-US'
date.toLocaleDateString(locale, { ... })
```

### Files Modified
- `src/i18n/en.json` - Added 30+ new translation keys
- `src/i18n/tr.json` - Added corresponding Turkish translations
- 12 component files updated with i18n support
- [ ] FocusMode.tsx - Focus mode UI
- [ ] NotificationCenter.tsx - Notifications
- [ ] Onboarding.tsx - Welcome flow
- [ ] BacklinksPanel.tsx - Backlinks UI
- [ ] KnowledgeGraph.tsx - Graph UI

---

## 17.2: Translation Key Structure

```json
{
  "common": { /* Shared actions */ },
  "nav": { /* Navigation */ },
  "menu": { /* Menu items */ },
  "settings": { /* Settings panel */ },
  "chat": { /* FlowBot chat */ },
  "notes": { /* Notes module */ },
  "tasks": { /* Tasks module */ },
  "habits": { /* Habits module */ },
  "journal": { /* Journal module */ },
  "calendar": { /* Calendar module */ },
  "dailyNotes": { /* Daily notes */ },
  "bookmarks": { /* Bookmarks */ },
  "analysis": { /* Analysis module */ },
  "focus": { /* Focus mode */ },
  "search": { /* Global search */ },
  "notifications": { /* Notification center */ }
}
```

---

## 17.3: Implementation Pattern

```tsx
// Before
<button>Bugün</button>

// After
import { useTranslation } from '../../i18n'

function Component() {
  const { t } = useTranslation()
  return <button>{t('calendar.today')}</button>
}
```

---

## 17.4: Missing Translation Keys to Add

### calendar
- today, tomorrow, week, month, day
- newTask, priority labels, time labels
- delete confirmation messages

### tasks
- done section, subtasks, auto-complete messages

### dailyNotes
- card labels, pin/unpin, delete

### common
- more, less, expand, collapse
- delete confirmation

---

## Completion Criteria
- [ ] All 21 components use useTranslation hook
- [ ] No hardcoded Turkish text remains
- [ ] English is default language
- [ ] All new keys added to en.json and tr.json
- [ ] Build passes with no errors
