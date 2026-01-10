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

## Sprint 3.3: Email Notifications (2 gün) ✓
- [x] EmailJS setup (@emailjs/browser)
- [x] Email templates (daily summary, weekly report, streak alert)
- [x] Email preferences UI (Settings panel)
- [x] Daily summary email (opsiyonel, kullanıcı seçer)
- [x] Streak risk alerts

**Çıktı:** Email bildirimleri çalışıyor

## Sprint 3.4: Weekly Analysis (3 gün) ✓
- [x] WeeklyAnalysis type/interface
- [x] analysisService (hesaplama logic)
- [x] WeeklyReport component
- [x] HabitChart component (completion rate)
- [x] MoodChart component (trend line)
- [x] TaskStats component
- [x] AI Insights integration (generateAIInsights fonksiyonu)
- [x] ADHD pattern detection (hyperfocus, energy dips, etc.)
- [x] Recommendations generation
- [ ] PDF/Image export (sonraki iterasyon)

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

## UI/UX İyileştirmeleri 
- [x] **Resizable Sidebar**
  - Sol modül listesi genişletilebilir (drag handle) ✓
  - Notes modülü iç panel genişletilebilir (ResizablePanel component) ✓
  - Genişlik localStorage'da saklanıyor ✓
  - Min: 80px, Max: 250px ✓
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

- [x] **GitHub Gist Sync** ✓ YENİ
  - Private Gist ile cihazlar arası sync
  - GitHub Personal Access Token ile kimlik doğrulama
  - Yeni Gist oluşturma veya mevcut Gist'e bağlanma
  - Auto-sync (1/5/15/30 dakika aralıklarla)
  - Manuel sync, force push, force pull
  - Son sync durumu ve hata gösterimi
  - Senkronize edilen veriler: Notes, Tasks, Habits, Journal, Bookmarks

## Sonraki: Planlanan Özellikler
- [ ] **Dark/Light Theme Toggle**
  - Tema değiştirme butonu
  - Sistem temasına uyum
  - Notepad++ Light theme variant

- [ ] **Calendar Module** ⭐ ÖNCELİKLİ
  - Detaylı analiz aşağıda (Sprint 7)

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

# Sprint 7: Calendar Module 
**Hedef:** Task'ları takvim üzerinde görselleştirme ve takvimden task oluşturma
**Süre:** 5-7 gün
**Durum:** TAMAMLANDI

## 7.1: Task Model Güncellemesi (1 gün) 
- [x] Task type'a `endDate` field ekle (opsiyonel)
- [x] Task type'a `allDay` boolean ekle
- [x] Task'ın tarih aralığı hesaplama (startDate → endDate)
- [x] Migration: Mevcut task'lar için endDate = deadline

```typescript
interface Task {
  // ... mevcut alanlar
  deadline?: Date        // Başlangıç tarihi (mevcut)
  endDate?: Date         // Bitiş tarihi (YENİ)
  allDay?: boolean       // Tüm gün mü? (YENİ)
}
```

## 7.2: Calendar Store & Logic (1 gün) 
- [x] calendarStore (Zustand)
  - currentView: 'month' | 'week' | 'day'
  - currentDate: Date
  - selectedDate: Date | null
- [x] View navigation (prev/next month/week/day)
- [x] Task'ları tarihe göre gruplama
- [x] Tarih aralığına göre task filtreleme

## 7.3: Calendar UI - Month View (2 gün) 
- [x] CalendarModule component
- [x] MonthView component
  - 7 sütun (Pzt-Paz)
  - 5-6 satır (haftalar)
  - Her hücrede o günün task'ları
- [x] CalendarCell component
  - Tarih numarası
  - Task bar'ları (renk = priority)
  - Çok günlü task'lar için spanning bar
- [x] CalendarHeader component
  - Ay/Yıl gösterimi
  - Prev/Next navigasyon
  - View switcher (Month/Week/Day)
  - Today butonu

## 7.4: Calendar UI - Week & Day View (1 gün) 
- [x] WeekView component
  - 7 sütun, saatlik satırlar
  - Task'lar zaman bloğu olarak
- [x] DayView component
  - Tek gün, saatlik detay
  - Task'lar zaman bloğu olarak
- [x] Responsive tasarım

## 7.5: Task Creation from Calendar (1 gün) 
- [x] Takvim hücresine tıklayınca task oluşturma modal
  - Seçilen tarih otomatik doldurulur
  - End date picker
  - Priority seçimi
- [ ] Drag to create (opsiyonel)
  - Başlangıç hücresinden bitiş hücresine sürükle
  - Tarih aralığı otomatik belirlenir
- [x] Task oluşturulunca taskStore'a eklenir

## 7.6: Task Interaction on Calendar (1 gün)
- [ ] Task'a tıklayınca detay popup
- [ ] Drag & drop ile tarih değiştirme
- [ ] Resize ile süre değiştirme (week/day view)
- [ ] Quick complete (checkbox)
- [ ] Task'ı sil/düzenle

## 7.7: Visual Design & Polish 
- [x] Notepad++ tema uyumu
- [x] Priority renk kodları (P1=kırmızı, P2=turuncu, vb.)
- [x] Completed task'lar için strikethrough
- [x] Today highlight
- [x] Weekend farklı arka plan
- [ ] Keyboard shortcuts
  - `←/→` = prev/next period
  - `T` = today
  - `M/W/D` = month/week/day view
  - `N` = new task on selected date

## Teknik Notlar

### Çok Günlü Task Gösterimi
```
Pazartesi  Salı     Çarşamba  Perşembe  Cuma
┌─────────────────────────────────────────┐
│ ████████ Project X (P1) ████████████████│  ← 5 günlük task
└─────────────────────────────────────────┘
         ┌──────────────────┐
         │ Meeting (P2) ████│              ← 2 günlük task
         └──────────────────┘
```

### Veri Akışı
```
Calendar Click → TaskForm (with date) → taskStore.addTask() → Calendar re-render
Task Drag      → taskStore.updateTask() → Calendar re-render
```

### Önerilen Kütüphaneler
- `date-fns` - Tarih manipülasyonu (zaten mevcut)
- Custom CSS Grid - Takvim layout
- Native drag & drop API

## Tamamlanma Kriterleri
- [x] Month/Week/Day view'lar çalışıyor
- [x] Task'lar takvimde doğru tarihlerde görünüyor
- [x] Çok günlü task'lar spanning bar olarak görünüyor
- [x] Takvimden yeni task oluşturulabiliyor
- [ ] Drag & drop ile tarih değiştirilebiliyor (sonraki iterasyon)
- [ ] Keyboard navigation çalışıyor (sonraki iterasyon)
- [x] Cloud sync ile senkronize

---

# Sprint 8: FlowBot Agent Mode ✓
**Hedef:** FlowBot'u pasif chatbot'tan aktif agent'a dönüştürme
**Süre:** 7-10 gün
**Durum:** TAMAMLANDI

## Konsept
FlowBot artık sadece soru-cevap yapmayacak, uygulama içinde **aksiyon alabilecek**:
- Task oluşturma/düzenleme/silme
- Bookmark ekleme (web araması ile)
- Not oluşturma
- Habit tracking
- Gün planlama
- Veri analizi

## 8.1: Agent Architecture (2 gün) ✓
### Function Calling / Tool Use
```typescript
interface AgentTool {
  name: string
  description: string
  parameters: JSONSchema
  execute: (params: unknown) => Promise<ToolResult>
}
```

### Mevcut Tool'lar
- [x] **Task Management**: create_task, list_tasks, complete_task, update_task, delete_task
- [x] **Bookmark Management**: create_bookmark, search_bookmarks, list_bookmarks
- [x] **Note Management**: create_note, search_notes
- [x] **Habit Management**: get_today_habits, toggle_habit_today, create_habit, get_habit_streaks
- [x] **Journal**: create_journal_entry, get_recent_journal
- [x] **Analytics**: get_daily_summary, get_weekly_summary
- [x] **Planning**: plan_day
- [x] **Web Search**: web_search, save_search_results_as_bookmarks

## 8.2: LLM Integration for Tool Calling (2 gün) ✓
- [x] OpenAI Function Calling entegrasyonu
- [x] Anthropic Tool Use entegrasyonu
- [x] Multi-step execution (birden fazla tool çağırma)
- [x] Tool sonuçlarını LLM'e geri besleme

## 8.3: Web Search Integration (1 gün) ✓
- [x] Tavily API entegrasyonu
- [x] Arama sonuçlarını parse etme
- [x] Sonuçlardan bookmark oluşturma
- [x] Error handling

**Örnek:**
```
User: "Prompt engineering ile ilgili kaynaklar bul"
FlowBot: 
1. Web'de arar
2. En iyi 5 sonucu seçer
3. Her biri için bookmark oluşturur
4. Kullanıcıya özet sunar
```

## 8.4: Day Planning Feature (1 gün) ✓
- [x] `plan_day` tool'u
- [x] Mevcut task'ları analiz et
- [x] Priority ve deadline'a göre sırala
- [x] Energy level'a göre öner
- [x] Habit durumunu dahil et

**Örnek:**
```
User: "Günümü planla"
FlowBot:
1. Aktif task'ları çeker
2. Bugünün mood/energy'sini kontrol eder
3. Habits'leri kontrol eder
4. Optimize edilmiş plan önerir:
   Sabah: P1 task'lar (yüksek enerji)
   Öğlen: P2 task'lar + habits
   Akşam: Hafif işler + journal
```

## 8.5: Confirmation & Safety (1 gün) ✓
- [x] Destructive action'lar tanımlandı (delete_task, delete_habit, delete_note, delete_bookmark)
- [x] Tool execution sonuçları gösteriliyor
- [ ] Undo desteği (sonraki iterasyon)
- [ ] Rate limiting (sonraki iterasyon)

## 8.6: Agent UI Enhancements (1 gün) ✓
- [x] Tool execution indicator ("FlowBot düşünüyor...")
- [x] Action log ("Yapılan işlemler" bölümü)
- [x] Quick action buttons
- [ ] Inline task/bookmark preview (sonraki iterasyon)

## 8.7: Predefined Commands (1 gün) ✓
- [x] `/plan` veya "günümü planla" - plan_day tool'u
- [x] `/find <query>` veya "... hakkında kaynak bul" - web_search tool'u
- [x] `/quick <title>` veya "hızlı task: ..." - create_task tool'u
- [x] get_daily_summary, get_weekly_summary tool'ları

## Örnek Senaryolar

### Senaryo 1: Kaynak Bulma
```
User: "React best practices hakkında kaynaklar bul"
FlowBot: Web'de arar → 5 sonuç bulur → Bookmark'lara ekler → Özet sunar
```

### Senaryo 2: Gün Planlama
```
User: "Bugün çok enerjik değilim, günümü planla"
FlowBot: Task'ları çeker → Düşük enerji için optimize eder → Plan önerir
```

### Senaryo 3: Hızlı Task
```
User: "Yarın 3'te doktor randevusu"
FlowBot: Task oluşturur → Hatırlatma ayarlar → Onay verir
```

## Tamamlanma Kriterleri ✓
- [x] Agent tool'ları tanımlı ve çalışıyor (toolRegistry.ts)
- [x] LLM function calling entegre (OpenAI & Anthropic native)
- [x] Web search ile bookmark ekleme çalışıyor (Tavily API)
- [x] Gün planlama özelliği çalışıyor (plan_day)
- [x] Destructive action'lar tanımlı
- [x] Tool execution UI gösteriliyor
- [x] Predefined commands çalışıyor

---

# Sprint 9: Settings Redesign & i18n ✓
**Goal:** Improve Settings UX with tabs, add language support, fix logical rules
**Duration:** 3-4 days
**Priority:** HIGH
**Status:** COMPLETED

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

## 9.4: Code Cleanup (0.5 day)
- [ ] **Remove Hardcoded Turkish Text** (future iteration)
  - i18n infrastructure ready
  - Components can be migrated gradually

## Completion Criteria
- [x] Settings panel has 5 tabs (General, AI, Integrations, Sync, Data)
- [x] Chat button disabled when no API key
- [x] Language can be switched between EN/TR
- [x] i18n infrastructure ready (useTranslation hook)
- [ ] All UI text uses i18n system (ongoing)

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
- Devam ediyor
- Bekliyor
- İptal edildi

---

*Son güncelleme: 2026-01-10 (Sprint 9 tamamlandı: Settings Redesign & i18n)*