# Sprint 9: Settings Redesign & i18n
**Goal:** Improve Settings UX with tabs, add language support, fix logical rules
**Duration:** 3-4 days
**Priority:** HIGH
**Status:** ✅ COMPLETED

---

## 9.1: Settings Panel Tabs (1 day) ✓
- [x] Create tabbed interface for Settings
- [x] **General Tab**
  - Font size selection
  - Language selection (English/Turkish)
  - Keyboard shortcuts reference
- [x] **AI Tab**
  - LLM Provider selection
  - Model selection
  - API Key input with validation status
  - Ollama base URL
- [x] **Integrations Tab**
  - Tavily API key (web search)
  - Browser notifications
  - Email notifications (EmailJS config)
- [x] **Sync Tab**
  - GitHub Gist Sync settings
  - Firebase/Google Auth settings
- [x] **Data Tab**
  - Data statistics
  - Export/Import
  - Clear all data (danger zone)

---

## 9.2: Logical Rules & Validation (0.5 day) ✓
- [x] **Chat Button Disabled State**
  - Disable chat button when no API key configured
  - Show tooltip: "Configure API key in Settings → AI"
  - Visual indicator (grayed out, cursor not-allowed, red !)
- [x] **Gist Sync Validation**
  - Disable sync buttons when token/gist ID missing
  - Show validation errors inline
- [x] **Form Validations**
  - Required field indicators
  - Error messages for invalid inputs

---

## 9.3: Internationalization (i18n) (1.5 days) ✓
- [x] **i18n Infrastructure**
  - Create translation files (en.json, tr.json)
  - Create useTranslation hook
  - Zustand-based language store
- [x] **Language Selector**
  - Add to General settings tab
  - Persist selection to localStorage
  - Apply immediately without refresh
- [ ] **Translate UI Text** (ongoing)
  - Translation files ready
  - Components can use useTranslation hook
  - Gradual migration of hardcoded text

---

## 9.4: Code Cleanup (0.5 day)
- [ ] **Remove Hardcoded Turkish Text** (future iteration)
  - i18n infrastructure ready
  - Components can be migrated gradually

---

## Completion Criteria
- [x] Settings panel has 5 tabs (General, AI, Integrations, Sync, Data)
- [x] Chat button disabled when no API key
- [x] Language can be switched between EN/TR
- [x] i18n infrastructure ready (useTranslation hook)
- [ ] All UI text uses i18n system (ongoing)
