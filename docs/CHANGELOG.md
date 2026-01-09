# Changelog

Bu dosya Claude Code tarafından otomatik güncellenir.

## [0.2.0] - 2026-01-09

### Added
- **Command Palette**
  - `Ctrl+K` ile açılır
  - Fuzzy search desteği
  - Keyboard navigation (↑↓ Enter Escape)
  - Navigation, Action, Settings kategorileri

- **Notes Modülü**
  - Not oluşturma, düzenleme, silme
  - Tag sistemi
  - Arama (fuzzy search)
  - Line numbers (Notepad++ style)
  - Auto-save (Ctrl+S ve blur)
  - LocalStorage persistence

- **Habits Modülü**
  - Habit oluşturma, düzenleme, silme
  - Günlük tracking (checkbox toggle)
  - Streak hesaplama
  - Kategori sistemi (health, work, personal, learning)
  - LocalStorage persistence

- **Tasks Modülü**
  - Task oluşturma, düzenleme, silme
  - Priority sistemi (P1-P4, color-coded)
  - Deadline desteği
  - Filter: all / active / completed
  - Sort: priority / deadline / created
  - Expandable task details
  - LocalStorage persistence

- **Journal Modülü**
  - Günlük entry oluşturma ve düzenleme
  - Mood tracking (1-5, emoji picker)
  - Energy tracking (1-5, emoji picker)
  - Date navigation (prev/next/today)
  - Tag sistemi
  - Entry listesi sidebar
  - LocalStorage persistence

- **Dynamic Status Bar**
  - Her modül için dinamik bilgi gösterimi
  - Notes: toplam not sayısı
  - Habits: bugün tamamlanan / toplam
  - Tasks: bekleyen task sayısı
  - Journal: bugünün tarihi

### Changed
- MainContent artık gerçek modülleri render ediyor
- StatusBar store'lardan veri çekiyor

---

## [0.1.0] - 2026-01-09

### Added
- **Proje Kurulumu**
  - Vite + React + TypeScript projesi oluşturuldu
  - Tailwind CSS entegrasyonu yapıldı
  - ESLint konfigürasyonu eklendi
  - TypeScript strict mode aktif

- **Notepad++ Teması**
  - Dark theme renk paleti (`np-bg-primary`, `np-text-primary`, vb.)
  - JetBrains Mono font entegrasyonu
  - Custom scrollbar stilleri
  - Retro buton ve input stilleri

- **Layout Componentleri**
  - `MenuBar` - Üst menü çubuğu
  - `Sidebar` - Sol navigasyon paneli
  - `TabBar` - Sekme çubuğu
  - `StatusBar` - Alt durum çubuğu
  - `MainContent` - Ana içerik alanı

- **Keyboard Shortcuts**
  - `Ctrl+1-5` - Modül navigasyonu
  - `Ctrl+K` - Command Palette
  - `Escape` - Modal kapatma

- **State Management**
  - Zustand store kurulumu
  - UI state yönetimi

- **Type Definitions**
  - `Note`, `Habit`, `Task`, `JournalEntry`, `WeeklyAnalysis` tipleri

### Technical
- React 18.3.1
- TypeScript 5.6
- Tailwind CSS 3.4
- Zustand 5.0
- Vite 6.0

---

## Geliştirme Geçmişi

### Sprint 1: Foundation ✓
- [x] Proje setup
- [x] Tema sistemi
- [x] Layout components
- [x] Keyboard shortcuts
- [x] Command Palette

### Sprint 2: Core Modules ✓
- [x] Notes modülü
- [x] Tasks modülü
- [x] Habits modülü
- [x] Journal modülü

### Sprint 3: AI & Polish
- [ ] Weekly Analysis
- [ ] AI integration
- [ ] Focus Mode
- [ ] Data export/import
- [ ] PWA support
