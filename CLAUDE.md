# bytepad - productivity app

## Aktif Sprint
- [ ] Sprint 39: Technical Debt Cleanup 📋 (PLANNED)
- [ ] Sprint 40: Auto-Update Feature 📋 (PLANNED)
- [ ] Sprint 41: Code Signing (Windows & macOS) 📋 (PLANNED)

## Son Tamamlanan Sprint'ler
- [x] Sprint 38: GitHub Releases Update Checker ✓
- [x] Sprint 37: MCP Server Integration + Docker Support ✓
- [x] Sprint 33: Sync & UX (Task tags, entity linking, graph connections) ✓
- [x] Sprint 32: UX Enhancements & Sync Improvements ✓
- [x] Sprint 30: Performance Optimization ✓
- [x] Sprint 29: Knowledge Graph Interactivity ✓
- [x] Sprint 28: UX & Bug Fixes ✓

### Tüm Tamamlanan Sprint'ler
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
- [x] Sprint 20: AI Productivity Report (Daily/Weekly, ADHD insights, i18n) ✓
- [x] Sprint 21: Electron Desktop App (System tray, shortcuts, portable EXE) ✓
- [x] Sprint 25: Knowledge Graph Enhanced ✓
- [x] Sprint 27: Wikilink Autocomplete ✓
- [x] Sprint 28: UX & Bug Fixes (Subtask logic, FlowBot wrap, Wikilink preview) ✓
- [x] Sprint 29: Graph Interactivity (Drag & drop nodes) ✓
- [x] Sprint 30: Performance Optimization (80% bundle reduction) ✓
- [x] Sprint 31: Image Support ❌ CANCELLED (Gist storage limits)
- [x] Sprint 32: UX Enhancements & Sync Improvements ✓
- [x] Sprint 33: Sync & UX (Task tags, entity linking, graph connections) ✓

### Son Yapılan İyileştirmeler (v0.19.0)
- Task'lara tag ve linkedBookmarkIds desteği
- Task UI'da tag gösterimi ve düzenleme
- Description'da [[entity]] autocomplete
- Linked Resources editor (bookmark linkleme)
- Knowledge Graph'ta Task-Bookmark ve Task-Tag bağlantıları
- Graph filtreleri localStorage'da persist
- Autocomplete'de ]] duplikasyon fix

> Detaylı görevler için: `docs/internal/sprints/` klasörü

---

## Proje Özeti
Notepad++ estetiğinde, keyboard-first productivity app.
Tüm promptlar ve teknik kodlar ingilizce olmalıdır.

**Platform:** PWA + Electron Desktop | **Stack:** React + TypeScript + Tailwind + Zustand

## Özellikler
| Modül | Özellikler | Durum |
|-------|------------|-------|
| Notes | Markdown, tags, backlinks (max 3), wikilink autocomplete, image URL | ✅ |
| Graph | Unified knowledge graph (notes, tasks, habits, tags), drag & drop | ✅ |
| Tasks | Priority, subtasks, due dates, calendar view | ✅ |
| Habits | Daily tracking, streaks, statistics | ✅ |
| Journal | Daily notes, mood/energy tracking | ✅ |
| Focus | Pomodoro timer, task selection, mini timer widget | ✅ |
| FlowBot | AI coach, tool calling, context-aware | ✅ |
| Analysis | Weekly stats, AI insights, Productivity Reports | ✅ |
| Reports | AI productivity reports (daily/weekly), ADHD insights | ✅ |
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
Ctrl+1-9      → Module navigation (1:Notes, 8:Graph, 9:Analyze)
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
├── README.md                    # Docs index (TODO)
├── getting-started/             # User guides (TODO)
├── features/                    # Feature documentation (TODO)
├── development/                 # Developer guides (TODO)
├── internal/                    # Internal docs (Sprint 34'te taşınacak)
│   ├── sprints/                 # Sprint history
│   ├── CHANGELOG.md
│   ├── AUDIT_REPORT.md
│   └── ROADMAP.md
└── sprints/                     # Current location (will move to internal/)
    ├── SPRINT_33_SYNC_AND_UX.md ✅
    ├── SPRINT_34_REFACTOR_AND_OPENSOURCE.md 📋 PLANNED
    ├── SPRINT_40_AUTO_UPDATE.md 📋 PLANNED
    └── SPRINT_41_CODE_SIGNING.md 📋 PLANNED
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
- **Output:** `dist-electron/bytepad-x.x.x-x64.exe`
- **Features:** System tray, global shortcuts, auto-start

### EXE Oluşturma Adımları
```bash
# 1. Tüm değişiklikleri kaydet ve commit et
git add -A
git commit -m "feat: description"

# 2. (Opsiyonel) Remote'a push et
git push origin main

# 3. EXE oluştur (Windows)
npm run package:win

# 4. Çıktı dosyası
# dist-electron/bytepad-{version}-win-x64.exe
# dist-electron/win-unpacked/bytepad.exe (portable)
```

### Diğer Platformlar
```bash
npm run package:mac    # macOS (.dmg)
npm run package:linux  # Linux (.AppImage, .deb)
npm run package:all    # Windows + macOS
```

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

1. **Ayrı MD dosyası oluştur:** `docs/internal/sprints/SPRINT_XX_FEATURE_NAME.md`
2. **Dosya formatı:**
   ```markdown
   # Sprint XX: Feature Name
   **Goal:** Kısa açıklama
   **Duration:** X gün
   **Priority:** HIGH/MEDIUM/LOW
   **Status:** PLANNED/IN_PROGRESS/COMPLETED
   ```

3. **Dosya isimlendirme:** `SPRINT_XX_UPPERCASE_NAME.md`
