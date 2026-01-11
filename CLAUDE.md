# MyFlowSpace - ADHD Productivity Super App

## Sprint 17 Tamamlandı! Full i18n Support

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

### Planlanan Sprint'ler
- [ ] Sprint 18: Gamification Core (XP, Levels, Achievements)
- [x] Sprint 19: Enhanced Focus Mode (Time logging, animated timer) ✓
- [ ] Sprint 20: AI Productivity Report (Strengths, weaknesses, advice)
- [ ] Sprint 21: Electron Desktop App ⭐ (CRITICAL)

> Detaylı görevler için: `docs/sprints/` klasörü

---

## Proje Özeti
Notepad++ estetiğinde, keyboard-first, ADHD-friendly productivity app.
Tüm promptlar ve teknik kodlar ingilizce olmalıdır.

**Platform:** PWA (Electron Desktop planned) | **Stack:** React + TypeScript + Tailwind + Zustand

## Özellikler
| Modül | Özellikler | Durum |
|-------|------------|-------|
| Notes | Markdown, tags, backlinks, knowledge graph | ✅ |
| Tasks | Priority, subtasks, due dates, calendar view | ✅ |
| Habits | Daily tracking, streaks, statistics | ✅ |
| Journal | Daily notes, mood/energy tracking | ✅ |
| Focus | Pomodoro timer, task selection | ✅ |
| FlowBot | AI coach, tool calling, context-aware | ✅ |
| Analysis | Weekly stats, AI insights | ✅ |
| i18n | English (default) + Turkish | ✅ |

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
Ctrl+1-6      → Module navigation
Ctrl+/        → FlowBot AI Coach
Ctrl+Shift+F  → Focus Mode
Ctrl+Shift+N  → Notification Center
Escape        → Close modals
```

## Dokümanlar
```
docs/
├── ROADMAP.md              # MVP ve Sprint özeti
├── CHANGELOG.md            # Değişiklik geçmişi
├── GAMIFICATION.md         # Gamification spec
├── sprints/
│   ├── SPRINT_15_AGENT_TOOLS_REFACTOR.md
│   ├── SPRINT_16_TASKS_UI_IMPROVEMENTS.md
│   ├── SPRINT_17_LOCALIZATION_COMPLETE.md
│   ├── SPRINT_18_GAMIFICATION_CORE.md
│   ├── SPRINT_19_FOCUS_MODE_ENHANCED.md
│   ├── SPRINT_20_AI_PRODUCTIVITY_REPORT.md
│   └── SPRINT_21_ELECTRON_DESKTOP_APP.md
```

## i18n (Localization)
- **Default:** English (en)
- **Supported:** Turkish (tr)
- **Files:** `src/i18n/en.json`, `src/i18n/tr.json`
- **Hook:** `useTranslation()` → `{ t, language, setLanguage }`
- **Setting:** Settings → General → Language

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
   
   ---
   
   ## XX.1: Alt görev başlığı
   - [ ] Task 1
   - [ ] Task 2
   
   ## Acceptance Criteria
   - [ ] Kriter 1
   - [ ] Kriter 2
   ```

3. **Dosya isimlendirme:** `SPRINT_XX_UPPERCASE_NAME.md`

## Öncelik Sırası
1. **Sprint 21** - Electron Desktop (günlük kullanım kolaylığı)
2. **Sprint 18** - Gamification (motivasyon)
3. **Sprint 19** - Focus Mode (time tracking)
4. **Sprint 20** - AI Report (depends on 18 & 19)
