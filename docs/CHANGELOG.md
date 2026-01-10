# Changelog

Bu dosya Claude Code tarafından otomatik güncellenir.

## [0.7.0] - 2026-01-10

### Added
- **PWA Support (Sprint 3.5 Complete)**
  - PWA manifest for installable app
  - Service worker for offline caching
  - ErrorBoundary component for graceful error handling
  - SVG icons for all PWA sizes
  - Apple mobile web app support

- **Notification Center**
  - Full notification center UI with Ctrl+Shift+N shortcut
  - Snooze functionality (15 min / 1 hour)
  - Pending and recent notifications view
  - Clear all notifications option

- **Onboarding Flow**
  - First-time user welcome tour
  - 5-step interactive guide
  - Keyboard shortcuts reference
  - Module overview
  - FlowBot AI Coach introduction

### Changed
- Updated keyboard shortcuts: added Ctrl+Shift+N for notification center
- ROADMAP: Sprint 3.5 marked as complete

---

## [0.6.0] - 2026-01-10

### Added
- **Notification System (Sprint 3.2 Complete)**
  - Browser push notifications
  - Habit daily reminder with time picker
  - Task deadline datetime support (date + time)
  - Task reminder (X minutes before deadline)
  - Quiet hours support
  - Notification preferences in Settings

### Changed
- Habit form: Added reminder time picker
- Task form: Added deadline time and reminder options
- Settings: Added Notifications section

---

## [0.5.0] - 2026-01-09

### Added
- **FlowBot AI Coach (Sprint 3.1 Complete)**
  - ADHD-friendly productivity coach chatbot
  - Multi-provider support (OpenAI, Anthropic, Google, Groq, Ollama)
  - Context-aware responses (tasks, habits, mood, energy)
  - Quick actions: Plan, Motivate, Stuck, Celebrate, Break
  - Keyboard shortcut: `Ctrl+/` to toggle
  - Chat history persistence
  - Turkish language support

### Changed
- MenuBar'a Chat butonu eklendi
- Settings'e FlowBot shortcut bilgisi eklendi

---

## [0.4.0] - 2026-01-09

### Added
- **Notes Markdown Preview**
  - Edit / Split / Preview view modes
  - Notepad++ styled markdown rendering
  - Syntax highlighting for code blocks
  - Live preview in split mode

- **LLM Settings Panel**
  - Provider selection (OpenAI, Anthropic, Google, Groq, Ollama)
  - Model selection per provider
  - Secure API key storage (localStorage)
  - Ollama local URL configuration
  - Connection status indicator

### Dependencies
- Added `react-markdown` for markdown rendering
- Added `@tailwindcss/typography` for prose styling

---

## [0.3.0] - 2026-01-09

### Added
- **Weekly Analysis Modülü**
  - Haftalık habit completion istatistikleri
  - Task completion rate ve priority breakdown
  - Mood/Energy trend grafikleri
  - ADHD-spesifik insight'lar
  - Kişiselleştirilmiş öneriler
  - Hafta navigasyonu (önceki/sonraki)
  - Active streaks gösterimi

- **Focus Mode**
  - `Ctrl+Shift+F` ile açılır
  - Task seçimi (priority sıralı)
  - Pomodoro timer (15/25/45/60 dakika)
  - Start/Pause/Resume/Stop kontrolleri
  - Task completion in focus
  - Desktop notification desteği
  - Full-screen distraction-free UI

- **Data Export/Import**
  - Tüm verileri JSON olarak export
  - Backup dosyasından import
  - Tarih damgalı dosya isimleri
  - Settings panelinden erişim

- **Settings Panel**
  - Data istatistikleri görüntüleme
  - Export/Import butonları
  - Tehlikeli bölge: Tüm verileri silme
  - Keyboard shortcuts referansı
  - Uygulama versiyonu

### Changed
- MenuBar'a Focus ve Settings menü öğeleri eklendi
- Keyboard shortcuts'a Focus Mode (Ctrl+Shift+F) eklendi

---

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

### Sprint 3: AI & Polish ✓
- [x] Weekly Analysis
- [x] Focus Mode
- [x] Data export/import
- [x] Settings Panel

### Sprint 3.5: PWA & Polish ✓
- [x] PWA support
- [x] Notification Center
- [x] Onboarding flow
- [x] Loading states & Error boundaries

### Sprint 4: Future Features
- [ ] Dark/Light theme toggle
- [ ] Global search (Alt+U)
- [ ] Knowledge graph (wikilinks)
- [ ] Cloud sync
