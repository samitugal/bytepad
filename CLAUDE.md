# MyFlowSpace - ADHD Productivity Super App

## Sprint 22 Devam Ediyor! Bug Fixes & UX Improvements

### Tamamlanan Sprint'ler
- [x] MVP1: Foundation + Notes ✓
- [x] MVP2: Tasks, Habits, Journal, Pomodoro ✓
- [x] Sprint 3.1: FlowBot AI Coach ✓
- [x] Sprint 3.2: Notifications + Reminders ✓
- [x] Sprint 3.4: Weekly Analysis ✓
- [x] Sprint 3.5: PWA & Polish ✓
- [x] Sprint 15: Agent Tools Refactor ✓
- [x] Sprint 16: Tasks UI Improvements ✓
- [x] Sprint 17: Complete Localization (EN/TR) ✓
- [x] Sprint 18: Gamification Core (XP, Levels, Achievements) ✓
- [x] Sprint 19: Enhanced Focus Mode (Time logging, animated timer) ✓
- [x] Sprint 21: Electron Desktop App (System tray, shortcuts, portable EXE) ✓
- [~] Sprint 22: Bug Fixes & UX (6/7 completed - multi-tab pending)

### Planlanan Sprint'ler
- [ ] Sprint 20: AI Productivity Report
- [ ] Sprint 23: Multi-Tab Support
- [ ] Sprint 24: FlowBot Note Tools (GetAllNotes, GetNoteDetail)
- [ ] Sprint 25: Knowledge Graph Enhanced (sidebar, all entities)
- [ ] Sprint 26: Keyboard Shortcuts Fix (Ctrl+N, help modal)

> Detaylı görevler için: `docs/sprints/` klasörü

---

## Proje Özeti
Notepad++ estetiğinde, keyboard-first, ADHD-friendly productivity app.
Tüm promptlar ve teknik kodlar ingilizce olmalıdır.

**Platform:** PWA + Electron Desktop | **Stack:** React + TypeScript + Tailwind + Zustand

## Özellikler
| Modül | Özellikler | Durum |
|-------|------------|-------|
| Notes | Markdown, tags, backlinks, knowledge graph | ✅ |
| Tasks | Priority, subtasks, due dates, calendar view | ✅ |
| Habits | Daily tracking, streaks, statistics | ✅ |
| Journal | Daily notes, mood/energy tracking | ✅ |
| Focus | Pomodoro timer, task selection, mini timer widget | ✅ |
| FlowBot | AI coach, tool calling, context-aware | ✅ |
| Analysis | Weekly stats, AI insights | ✅ |
| i18n | English (default) + Turkish | ✅ |
| Gamification | XP, Levels, Achievements, Streak multipliers | ✅ |
| Desktop | Electron app, system tray, global shortcuts | ✅ |
| Gist Sync | Auto pull/push, interval sync | ✅ |

## Tema
```css
--bg-primary: #1E1E1E;
--bg-secondary: #252526;
--text-primary: #D4D4D4;
--accent-blue: #569CD6;
--accent-green: #6A9955;
--font: 'JetBrains Mono', monospace;
```

## Temel Shortcuts
```
Ctrl+K        → Command Palette
Ctrl+1-8      → Module navigation
Ctrl+/        → FlowBot AI Coach
Ctrl+Shift+F  → Focus Mode (global in Electron)
Ctrl+Shift+N  → Notification Center
Ctrl+Shift+T  → Quick add task (Electron)
Ctrl+Shift+P  → Start focus mode (Electron)
Escape        → Close modals
```

## Dokümanlar
```
docs/
├── ROADMAP.md              # MVP ve Sprint özeti
├── CHANGELOG.md            # Değişiklik geçmişi
├── AUDIT_REPORT.md         # Code audit & recommendations
├── GAMIFICATION.md         # Gamification spec
├── sprints/
│   ├── SPRINT_15-19        # Completed sprints
│   ├── SPRINT_20_AI_PRODUCTIVITY_REPORT.md
│   ├── SPRINT_21_ELECTRON_DESKTOP_APP.md ✅
│   ├── SPRINT_22_BUG_FIXES_UX.md (in progress)
│   ├── SPRINT_23_MULTI_TAB.md
│   ├── SPRINT_24_FLOWBOT_NOTE_TOOLS.md
│   ├── SPRINT_25_KNOWLEDGE_GRAPH_ENHANCED.md
│   └── SPRINT_26_KEYBOARD_SHORTCUTS_FIX.md
```

## i18n (Localization)
- **Default:** English (en)
- **Supported:** Turkish (tr)
- **Files:** `src/i18n/en.json`, `src/i18n/tr.json`
- **Hook:** `useTranslation()` → `{ t, language, setLanguage }`
- **Setting:** Settings → General → Language

## Electron Desktop
- **Dev:** `npm run dev:electron`
- **Build:** `npm run package:win`
- **Output:** `dist-electron/MyFlowSpace-x.x.x-x64.exe`
- **Features:** System tray, global shortcuts, auto-start

## Git Workflow
```bash
# Commit format
feat(module): description
fix(module): description

# Sprint commit
Sprint XX: Description
- Feature 1
- Feature 2
```

## Kod Standartları
- TypeScript strict mode
- Components max 150 lines
- Keyboard-first design
- All UI strings via i18n

## Sprint Dokümantasyon Kuralları
Yeni bir sprint veya özellik planlandığında:

1. **Ayrı MD dosyası oluştur:** `docs/sprints/SPRINT_XX_FEATURE_NAME.md`
2. **Dosya formatı:**
   ```markdown
   # Sprint XX: Feature Name
   **Goal:** Kısa açıklama
   **Duration:** X gün
   **Priority:** HIGH/MEDIUM/LOW
   **Status:** PLANNED/IN_PROGRESS/COMPLETED
   ```

3. **Dosya isimlendirme:** `SPRINT_XX_UPPERCASE_NAME.md`

## Öncelik Sırası
1. **Sprint 26** - Keyboard Shortcuts Fix (1-2 gün, hızlı kazanım)
2. **Sprint 24** - FlowBot Note Tools (2-3 gün, yüksek değer)
3. **Sprint 23** - Multi-Tab Support (3-4 gün)
4. **Sprint 25** - Knowledge Graph Enhanced (5-7 gün)
5. **Sprint 20** - AI Productivity Report (7-10 gün)
