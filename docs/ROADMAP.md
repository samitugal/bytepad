# MyFlowSpace - Project Roadmap

## Genel Bakış

| MVP | Odak | Süre | Durum |
|-----|------|------|-------|
| MVP1 | Core Foundation + Notes | 2 hafta | ✅ Tamamlandı |
| MVP2 | Productivity Modules | 3 hafta | ✅ Tamamlandı |
| MVP3 | AI & Smart Features | 2 hafta | 🔄 Aktif |

---

# MVP1: Core Foundation
**Hedef:** Çalışan bir iskelet + Notes modülü
**Süre:** 2 hafta

## Sprint 1.1: Project Setup (3 gün) 
- [x] Vite + React + TypeScript init
- [x] Tailwind CSS setup
- [x] Notepad++ theme CSS variables
- [x] JetBrains Mono font entegrasyonu
- [x] Temel dosya yapısı oluşturma
- [x] Git repo + ilk commit

**Çıktı:** Boş ama styled bir sayfa

## Sprint 1.2: Layout System (3 gün) 
- [x] MainLayout component
- [x] Sidebar component (collapsible)
- [x] TabBar component
- [x] MenuBar component (File, Edit, View, Help)
- [x] StatusBar component
- [x] Responsive breakpoints

**Çıktı:** Notepad++ benzeri boş layout

## Sprint 1.3: Core Infrastructure (4 gün) 
- [x] Zustand store setup
- [x] LocalStorage persistence hook
- [x] useKeyboardShortcuts hook
- [x] CommandPalette component
- [x] Modal component
- [x] Toast/notification primitives
- [x] Router setup (hash-based)

**Çıktı:** Keyboard shortcuts + Command Palette çalışır

## Sprint 1.4: Notes Module (4 gün) 
- [x] Note type/interface
- [x] noteStore (Zustand)
- [x] NoteList component
- [x] NoteEditor component (basic textarea)
- [x] Markdown preview (react-markdown)
- [x] Note CRUD operations
- [x] Folder/tag system (basic)
- [x] Search/filter

**Çıktı:** Tam çalışan Notes modülü

### MVP1 Tamamlanma Kriterleri 
- [x] Notepad++ teması uygulanmış
- [x] Ctrl+K ile Command Palette açılıyor
- [x] Ctrl+1 ile Notes'a gidiliyor
- [x] Not oluşturma/düzenleme/silme çalışıyor
- [x] Veriler refresh sonrası kalıcı
- [x] Mobile responsive

---

# MVP2: Productivity Modules
**Hedef:** Tasks, Habits, Journal + Pomodoro
**Süre:** 3 hafta
**Başlangıç:** MVP1 tamamlandıktan sonra

## Sprint 2.1: Tasks Module (4 gün) ✓
- [x] Task type/interface
- [x] taskStore (Zustand)
- [x] TaskList component
- [x] TaskItem component
- [x] TaskForm component (modal)
- [x] Priority system (P1-P4) + renk kodları
- [x] Deadline picker
- [x] Subtasks support
- [x] Task filtering (priority, status, date)
- [x] Keyboard: Space=toggle, E=edit, D=delete

**Çıktı:** Tam çalışan Tasks modülü

## Sprint 2.2: Habits Module (4 gün) ✓
- [x] Habit type/interface
- [x] habitStore (Zustand)
- [x] HabitList component
- [x] HabitItem component (daily checkbox row)
- [x] HabitForm component
- [x] Streak calculation logic
- [x] StreakBadge component
- [x] Category grouping
- [x] Weekly view (7 günlük grid)
- [x] Habit completion sounds (subtle)

**Çıktı:** Tam çalışan Habits modülü

## Sprint 2.3: Journal Module (3 gün) ✓
- [x] JournalEntry type/interface
- [x] journalStore (Zustand)
- [x] JournalEditor component
- [x] MoodPicker component (1-5, visual)
- [x] EnergyPicker component (1-5, visual)
- [x] Date navigation (prev/next day)
- [x] Journal entry templates/prompts
- [x] Tag support

**Çıktı:** Tam çalışan Journal modülü

## Sprint 2.4: Pomodoro Timer (4 gün) ✓
- [x] PomodoroSettings type/interface
- [x] pomodoroStore (Zustand)
- [x] PomodoroTimer component (circular or linear)
- [x] Timer logic (work/short-break/long-break)
- [x] PomodoroPanel component (sidebar veya modal)
- [x] Task linking (hangi task üzerinde çalışıyorum)
- [x] Session history
- [x] Sound notifications (end of session)
- [x] Keyboard: Ctrl+P=panel, Ctrl+Shift+P=start/pause

**Çıktı:** Tam çalışan Pomodoro

## Sprint 2.5: Cross-Module Integration (3 gün) ✓
- [x] StatusBar'da günlük özet (habits done, active pomodoro)
- [x] Task'tan Pomodoro başlatma
- [x] Today view (bugünün tasks + habits)
- [x] Quick capture (Ctrl+Shift+N = hızlı not/task)
- [x] Data export (JSON)
- [x] Data import

**Çıktı:** Entegre çalışan modüller

### MVP2 Tamamlanma Kriterleri ✓
- [x] 4 core modül tam çalışıyor (Notes, Tasks, Habits, Journal)
- [x] Pomodoro timer çalışıyor ve task'lara bağlanabiliyor
- [x] Tüm modüller keyboard-first
- [x] Streak'ler doğru hesaplanıyor
- [x] Cross-module navigation sorunsuz

---

# MVP3: AI & Smart Features
**Hedef:** AI Coach, Notifications, Weekly Analysis
**Süre:** 2 hafta
**Başlangıç:** MVP2 tamamlandıktan sonra

## Sprint 3.1: AI Coach - FlowBot (5 gün) ✓
- [x] ChatMessage type/interface
- [x] chatStore (Zustand)
- [x] ChatWindow component
- [x] ChatMessage component
- [x] ChatInput component
- [x] Multi-provider API integration (OpenAI, Anthropic, Google, Groq, Ollama)
- [x] System prompt (ADHD coach persona)
- [x] Context injection (current tasks, mood, energy)
- [x] Quick actions (/plan, /motivate, /stuck, /celebrate)
- [x] Conversation history (son 50 mesaj)
- [x] Keyboard: Ctrl+/ = open chat

**Çıktı:** Çalışan AI coach chatbot

## Sprint 3.2: Notification System (4 gün) ✓
- [x] NotificationPreferences type/interface
- [x] notificationStore (Zustand)
- [x] Browser Push Notification permission
- [x] NotificationCenter component
- [x] NotificationItem component
- [x] NotificationSettings component
- [x] Notification types (habit reminder, deadline, pomodoro, streak risk)
- [x] Quiet hours support
- [x] Snooze functionality
- [x] Keyboard: Ctrl+Shift+N = notification center

**Çıktı:** Browser notifications çalışıyor

## Sprint 3.3: Email Notifications (2 gün)
- [ ] EmailJS setup
- [ ] Email templates (daily summary, weekly report, streak alert)
- [ ] Email preferences UI
- [ ] Daily summary email (opsiyonel, kullanıcı seçer)
- [ ] Streak risk alerts

**Çıktı:** Email bildirimleri çalışıyor

## Sprint 3.4: Weekly Analysis (3 gün) ✓
- [x] WeeklyAnalysis type/interface
- [x] analysisService (hesaplama logic)
- [x] WeeklyReport component
- [x] HabitChart component (completion rate)
- [x] MoodChart component (trend line)
- [x] TaskStats component
- [ ] AI Insights integration
- [x] ADHD pattern detection (hyperfocus, energy dips, etc.)
- [x] Recommendations generation
- [ ] PDF/Image export (opsiyonel)

**Çıktı:** AI-powered haftalık analiz

## Sprint 3.5: Polish & PWA (3 gün) 
- [x] PWA manifest
- [x] Service worker (offline support)
- [x] Install prompt
- [x] App icon (SVG favicon)
- [x] Loading states
- [x] Error boundaries
- [x] Empty states
- [x] Onboarding flow (ilk kullanım)
- [x] Performance optimization
- [x] Final bug fixes

**Çıktı:** Production-ready PWA

### MVP3 Tamamlanma Kriterleri ✓
- [x] AI Coach çalışıyor ve context-aware
- [x] Browser notifications çalışıyor
- [ ] Email notifications çalışıyor (opsiyonel)
- [x] Weekly analysis AI insights veriyor
- [x] PWA olarak yüklenebilir
- [x] Offline çalışıyor (AI hariç)

---

# Post-MVP: Future Features

## Öncelikli Eklemeler (Tamamlandı )
- [x] **Habits: Daily Reminder & Saat Desteği**
  - Habit için hatırlatma saati belirleme
  - Browser notification ile hatırlatma
  - Günlük/haftalık reminder schedule
- [x] **Tasks: DateTime Desteği**
  - Task için tarih + saat seçimi
  - Deadline ile birlikte saat bilgisi
  - Reminder X dakika önce

## Sonraki Sprint: Advanced Features 
- [x] **Global Search (Alt+U)**
  - Tüm modüllerde (Notes, Tasks, Habits, Journal) arama
  - Fuzzy search desteği
  - Sonuçları kategorize göster
  
- [x] **Notes Markdown Preview Fix**
  - react-markdown render düzeltmesi
  - Heading stilleri iyileştirildi
  
- [x] **DateTime Picker Tema Uyumu**
  - Native date/time picker yerine custom component
  - Notepad++ temasına uygun styling
  
- [x] **Habits Günlük Reset & Raporlama**
  - Daily stats kaydı
  - Haftalık progress bar görünümü
  - Completion rate tracking
  
- [x] **Notes Tag-Based Search**
  - Tag'lere göre filtreleme
  - Tag cloud görünümü
  - Multi-tag intersection search
  
- [x] **Knowledge Graph (Obsidian-style)**
  - [[wikilink]] syntax desteği
  - Canvas-based force-directed graph
  - Backlinks panel

## Tamamlandı: UI/UX İyileştirmeleri ✓
- [x] **Resizable Sidebar**
  - Sol modül listesi genişletilebilir (drag handle)
  - Genişlik localStorage'da saklanıyor
  - Min: 80px, Max: 250px
- [x] **Font Size Settings**
  - Settings panelinde "// Display" bölümü en üstte
  - Extra Small, Small, Default, Large, Extra Large seçenekleri

- [x] **Cross-Tab Synchronization**
  - BroadcastChannel API ile aynı tarayıcıda sekmeler arası sync

## Tamamlandı: Bookmarks Module ✓
- [x] **Bookmarks (Raindrop.io benzeri)**
  - URL, title, description, tags desteği
  - Collections: Gold 🥇, Silver 🥈, Bronze 🥉, Unsorted
  - Sol sidebar'da en çok kullanılan 5 tag
  - Sıralama: tarih, başlık, domain
  - Okundu/okunmadı işaretleme
  - Cross-tab sync

## Tamamlandı: Cloud Sync & Authentication ✓
- [x] **Google Authentication (Firebase)**
  - Google hesabı ile giriş
  - Settings panelinde Account bölümü
  - User avatar ve email gösterimi

- [x] **Firebase Firestore Cloud Sync**
  - Farklı tarayıcılar/cihazlar arası real-time sync
  - User-isolated data (UID bazlı)
  - Debounced writes (1 saniye)
  - Senkronize edilen veriler:
    - Notes, Tasks, Habits, Journal, Bookmarks
  - Offline-first: İnternet olmadan çalışır, bağlanınca sync

## Sonraki: Planlanan Özellikler
- [ ] **Dark/Light Theme Toggle**
  - Tema değiştirme butonu
  - Sistem temasına uyum
  - Notepad++ Light theme variant

- [ ] **Calendar Integration**
  - Tasks ve Habits için takvim görünümü
  - Deadline'ları takvimde göster
  - Drag & drop ile tarih değiştirme
  - iCal/Google Calendar export

- [ ] **Multiple Workspaces**
  - Farklı projeler için ayrı workspace'ler
  - Workspace değiştirme
  - Workspace-specific settings

- [ ] **Collaboration**
  - Paylaşımlı listeler
  - Real-time collaboration
  - Yorum ve mention sistemi

---

## İleri Seviye Geliştirme Fikirleri

### AI & Automation
- [ ] **Smart Task Scheduling**
  - AI ile optimal task sıralaması
  - Energy level'a göre task önerisi
  - "En verimli saatleriniz" analizi
  
- [ ] **Auto-Tagging**
  - AI ile otomatik tag önerisi (Notes, Bookmarks)
  - İçerik analizi ile kategorizasyon
  
- [ ] **Predictive Analytics**
  - Habit completion tahminleri
  - "Bugün streak kırılma riski yüksek" uyarıları
  - Productivity pattern detection

- [ ] **Smart Reminders**
  - Context-aware hatırlatmalar
  - Lokasyon bazlı (eve gelince, işe gidince)
  - Hava durumuna göre (yağmurlu günlerde indoor habits)

### Productivity Features
- [ ] **Time Blocking**
  - Günlük/haftalık zaman blokları
  - Task'ları bloklara atama
  - Google Calendar sync

- [ ] **Templates & Recurring**
  - Not şablonları (meeting notes, daily standup)
  - Recurring tasks (her Pazartesi X yap)
  - Weekly review template

- [ ] **Quick Capture Widget**
  - Floating capture button
  - Screenshot annotation
  - Voice-to-text not alma

- [ ] **Focus Sessions Analytics**
  - Pomodoro istatistikleri
  - En verimli saatler grafiği
  - Distraction tracking

### Data & Visualization
- [ ] **Advanced Analytics Dashboard**
  - Customizable widgets
  - Trend grafikleri (30/60/90 gün)
  - Karşılaştırmalı analiz (bu hafta vs geçen hafta)

- [ ] **Habit Heatmap**
  - GitHub contribution graph benzeri
  - Yıllık habit görünümü
  - Streak calendar

- [ ] **Mind Map View**
  - Notes için mind map görünümü
  - Drag & drop node oluşturma
  - Knowledge graph ile entegrasyon

- [ ] **Export & Reports**
  - PDF weekly/monthly report
  - Notion/Obsidian export
  - CSV data export

### Integration & Extensions
- [ ] **Browser Extension**
  - Quick bookmark ekleme
  - Web clipper (sayfa içeriğini not olarak kaydet)
  - Tab manager integration

- [ ] **API & Webhooks**
  - Public REST API
  - Zapier/Make integration
  - Custom webhooks (task complete → Slack notification)

- [ ] **Third-Party Integrations**
  - Todoist/Asana import
  - Notion sync
  - Spotify (focus playlist)
  - Slack status sync

### Mobile & Cross-Platform
- [ ] **Progressive Web App Enhancements**
  - Background sync
  - Push notifications (mobile)
  - Share target (paylaş menüsünden içerik al)

- [ ] **React Native App**
  - iOS & Android native app
  - Widget support
  - Apple Watch / Wear OS companion

- [ ] **Desktop App (Electron/Tauri)**
  - System tray icon
  - Global hotkeys
  - Menu bar quick actions

### Social & Gamification
- [ ] **Achievement System**
  - Badges (7-day streak, 100 tasks completed)
  - Levels ve XP
  - Leaderboard (opsiyonel, privacy-first)

- [ ] **Accountability Partners**
  - Habit buddy sistemi
  - Shared goals
  - Progress sharing

- [ ] **Daily Challenges**
  - Rastgele günlük challenge
  - Streak bonusları
  - Seasonal events

### ADHD-Specific Features
- [ ] **Body Doubling Mode**
  - Virtual coworking sessions
  - "Birisi izliyor" motivasyonu
  - Pomodoro sync with others

- [ ] **Dopamine Menu**
  - Reward sistemi
  - Task tamamlayınca mini-game
  - Celebration animations

- [ ] **Overwhelm Mode**
  - Sadece 1 task göster
  - Simplified UI
  - "Sadece 5 dakika" timer

- [ ] **Transition Helpers**
  - Task arası geçiş hatırlatmaları
  - "Şu an ne yapıyordun?" prompt
  - Context switching desteği

### Security & Privacy
- [ ] **End-to-End Encryption**
  - Client-side encryption
  - Zero-knowledge architecture
  - Local-only mode option

- [ ] **Data Portability**
  - Full data export (JSON, CSV)
  - Account deletion
  - GDPR compliance

## Potansiyel Eklemeler (Uzun Vadeli)
- [ ] Mobile app (React Native)
- [ ] Desktop app (Tauri)
- [ ] Voice input (Web Speech API)
- [ ] Email notifications (daily summary)
- [ ] Team/Enterprise version
- [ ] Plugin/Extension system
- [ ] Self-hosted option

---

# İlerleme Takibi

## Nasıl Kullanılır
1. Her sprint başında ilgili task'ları GitHub Issues'a aç
2. Task tamamlandığında checkbox'ı işaretle `[x]`
3. Sprint bitiminde commit at ve bu dosyayı güncelle
4. MVP tamamlandığında CHANGELOG.md'ye ekle

## Durum Sembolleri
- [ ] Yapılmadı
- [x] Tamamlandı
- 🔄 Devam ediyor
- ⏳ Bekliyor
- ❌ İptal edildi

---

*Son güncelleme: 2026-01-10*