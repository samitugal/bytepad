# MyFlowSpace - ADHD Productivity Super App

## MVP3 Tamamlandı! Production-Ready PWA

### Tamamlanan Sprint'ler
- [x] MVP1: Foundation + Notes ✓
- [x] MVP2: Tasks, Habits, Journal, Pomodoro ✓
- [x] Sprint 3.1: FlowBot AI Coach ✓
- [x] Sprint 3.2: Notifications + Reminders ✓
- [x] Sprint 3.4: Weekly Analysis ✓
- [x] Sprint 3.5: PWA & Polish ✓

### Sonraki Adımlar (Post-MVP)
- [ ] Global Search (Alt+U)
- [ ] Dark/Light theme toggle
- [ ] Knowledge graph (wikilinks)
- [ ] Cloud sync

> Detaylı görevler için: `docs/ROADMAP.md`

---

## Proje Özeti
Notepad++ estetiğinde, keyboard-first, ADHD-friendly productivity app.
Tüm promptlar ve teknik kodlar ingilizce olmalıdır.

**Platform:** PWA | **Stack:** React + TypeScript + Tailwind + Zustand

## MVP'ler
| MVP | İçerik | Durum |
|-----|--------|-------|
| MVP1 | Foundation + Notes | ✅ Tamamlandı |
| MVP2 | Tasks, Habits, Journal, Pomodoro | ✅ Tamamlandı |
| MVP3 | AI Coach, Notifications, Analysis, PWA | ✅ Tamamlandı |

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
Ctrl+1-5      → Module navigation
Ctrl+/        → FlowBot AI Coach
Ctrl+Shift+F  → Focus Mode
Ctrl+Shift+N  → Notification Center
Escape        → Close modals
```

## Dokümanlar
- `docs/ROADMAP.md` - MVP ve Sprint detayları
- `docs/ANALYSIS.md` - Teknik analiz
- `docs/CHANGELOG.md` - Değişiklik geçmişi

## Git Workflow
```bash
# Commit format
feat(module): description
fix(module): description

# Her sprint sonunda
# 1. ROADMAP.md'de checkbox'ları işaretle
# 2. CHANGELOG.md'ye ekle
# 3. Commit at
```

## Kod Standartları
- TypeScript strict mode
- Components max 150 lines
- Keyboard-first design

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
   
   ## XX.1: Alt görev başlığı (süre)
   - [ ] Task 1
   - [ ] Task 2
   
   ## Completion Criteria
   - [ ] Kriter 1
   - [ ] Kriter 2
   ```

3. **ROADMAP.md'yi güncelle:** Sprint tablosuna yeni satır ekle
4. **Dosya isimlendirme:** `SPRINT_XX_UPPERCASE_NAME.md` (örn: `SPRINT_12_MOBILE_APP.md`)
