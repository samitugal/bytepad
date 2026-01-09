# MyFlowSpace - ADHD Productivity Super App

> **Bu doküman Claude Code tarafından otomatik güncellenir.**
> Son güncelleme: 2026-01-09

## Proje Durumu

### Aktif Sprint
- [ ] PWA support
- [ ] Gelişmiş AI insights (API entegrasyonu)
- [ ] Dark/Light theme toggle
- [ ] Notifications

### Tamamlanan
- [x] Proje setup (Vite + React + TypeScript)
- [x] Tailwind + Notepad++ tema
- [x] Layout components (MenuBar, Sidebar, TabBar, StatusBar, MainContent)
- [x] Keyboard shortcuts (Ctrl+1-5 navigation, Ctrl+K palette, Escape)
- [x] Command Palette (fuzzy search, keyboard navigation)
- [x] Notes modülü (CRUD, tags, search, line numbers, auto-save)
- [x] Habits modülü (CRUD, streaks, categories, daily tracking)
- [x] Tasks modülü (CRUD, P1-P4 priority, filters, sorting, deadlines)
- [x] Journal modülü (mood/energy tracking, date navigation, tags)
- [x] Weekly Analysis (stats, charts, insights, recommendations)
- [x] Focus Mode (Pomodoro timer, task selection, Ctrl+Shift+F)
- [x] Data export/import (JSON backup/restore)
- [x] Settings panel (shortcuts, data management)

---

## Proje Özeti
Notepad++ estetiğinde, keyboard-first, retro görünümlü productivity super app. ADHD beyinler için optimize edilmiş.

## Tech Stack
- Vite + React + TypeScript
- Tailwind CSS (custom Notepad++ dark theme)
- Zustand (state management)  
- LocalStorage + IndexedDB (offline-first)

## Modüller
1. **Notes** - Markdown editor, folder/tag system
2. **Habits** - Daily tracking, streaks, categories
3. **Tasks** - Priority (P1-P4), deadlines, subtasks
4. **Journal** - Mood (1-5), energy (1-5), free text
5. **Weekly Analysis** - AI-powered insights

## Keyboard Shortcuts
```
Ctrl+K       → Command Palette
Ctrl+1-5     → Module navigation
Ctrl+Shift+F → Focus Mode
Ctrl+N       → New item
Ctrl+S       → Save
Space        → Toggle complete
Escape       → Cancel/Close
```

## Notepad++ Theme
```css
--bg-primary: #1E1E1E;
--bg-secondary: #252526;
--bg-tertiary: #2D2D30;
--text-primary: #D4D4D4;
--text-secondary: #808080;
--accent-blue: #569CD6;
--accent-green: #6A9955;
--accent-orange: #CE9178;
--accent-purple: #C586C0;
--border: #3C3C3C;
--font: 'JetBrains Mono', 'Consolas', monospace;
```

## Layout
```
┌─────────────────────────────────────────────┐
│ Menu Bar                          [_][□][X] │
├────────┬────────────────────────────────────┤
│Sidebar │ Tab Bar: [Notes][Habits][Tasks][+] │
│        ├────────────────────────────────────│
│> Notes │                                    │
│> Habits│         Main Content Area          │
│> Tasks │                                    │
│> Jrnl  │                                    │
│────────│                                    │
│Analyze │                                    │
├────────┴────────────────────────────────────┤
│ Status: Ln 1, Col 0 | 3/5 habits ✓         │
└─────────────────────────────────────────────┘
```

## Detaylı Dokümanlar
- `docs/ANALYSIS.md` - Tam teknik analiz
- `docs/SKILL.md` - Hızlı referans
- `docs/CHANGELOG.md` - Değişiklik geçmişi

## Git Workflow
- Her feature tamamlandığında commit at
- Commit mesajı formatı: `feat(module): description` veya `fix(module): description`
- Her sprint sonunda CLAUDE.md'yi güncelle

## Kod Standartları
- TypeScript strict mode
- Kompakt, okunabilir kod
- Components max 150 lines
- Proper error handling
