# Changelog

Bu dosya Claude Code tarafından otomatik güncellenir.

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
  - `MenuBar` - Üst menü çubuğu (File, Edit, View, Tools, Help)
  - `Sidebar` - Sol navigasyon paneli (modül listesi)
  - `TabBar` - Sekme çubuğu
  - `StatusBar` - Alt durum çubuğu
  - `MainContent` - Ana içerik alanı (placeholder'lar)

- **Keyboard Shortcuts**
  - `Ctrl+1-5` - Modül navigasyonu (Notes, Habits, Tasks, Journal, Analysis)
  - `Ctrl+K` - Command Palette (henüz implement edilmedi)
  - `Escape` - Modal kapatma

- **State Management**
  - Zustand store kurulumu (`uiStore`)
  - `activeModule` state'i
  - `commandPaletteOpen` state'i
  - `focusMode` state'i

- **Type Definitions**
  - `Note`, `Habit`, `Task`, `JournalEntry`, `WeeklyAnalysis` tipleri
  - `ModuleType` union tipi

### Technical
- React 18.3.1
- TypeScript 5.6
- Tailwind CSS 3.4
- Zustand 5.0
- Vite 6.0

---

## Geliştirme Geçmişi

### Sprint 1: Foundation
- [x] Proje setup
- [x] Tema sistemi
- [x] Layout components
- [x] Keyboard shortcuts
- [ ] Command Palette

### Sprint 2: Core Modules
- [ ] Notes modülü
- [ ] Tasks modülü
- [ ] Habits modülü
- [ ] Journal modülü

### Sprint 3: AI & Polish
- [ ] Weekly Analysis
- [ ] AI integration
- [ ] Data export/import
- [ ] PWA support
