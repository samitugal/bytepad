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
- [ ] Snooze functionality
- [ ] Keyboard: Ctrl+Shift+N = notification center

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
- [ ] AI Insights integration (Anthropic API)
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

### MVP3 Tamamlanma Kriterleri 
- [ ] AI Coach çalışıyor ve context-aware
- [ ] Browser notifications çalışıyor
- [ ] Email notifications çalışıyor (opsiyonel)
- [ ] Weekly analysis AI insights veriyor
- [ ] PWA olarak yüklenebilir
- [ ] Offline çalışıyor (AI hariç)

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
- [ ] **Global Search (Alt+U)**
  - Tüm modüllerde (Notes, Tasks, Habits, Journal) arama
  - Fuzzy search desteği
  - Sonuçları kategorize göster
  
- [ ] **Notes Markdown Preview Fix**
  - react-markdown render düzeltmesi
  - Kod blokları syntax highlighting
  
- [ ] **DateTime Picker Tema Uyumu**
  - Native date/time picker yerine custom component
  - Notepad++ temasına uygun styling
  
- [ ] **Habits Günlük Reset & Raporlama**
  - Gün sonunda completion status sıfırlama
  - Streak hesaplama mantığı güncelleme
  - Günlük/haftalık tamamlanan/tamamlanmayan raporlama
  
- [ ] **Notes Tag-Based Search**
  - Tag'lere göre filtreleme
  - Tag cloud görünümü
  - Multi-tag intersection search
  
- [ ] **Knowledge Graph (Obsidian-style)**
  - [[wikilink]] syntax desteği
  - Notlar arası bağlantı grafiği
  - D3.js veya force-graph ile görselleştirme
  - Backlinks panel

## Potansiyel Eklemeler
- [ ] Dark/Light theme toggle
- [ ] Multiple workspaces
- [ ] Cloud sync (Supabase/Firebase)
- [ ] Collaboration (paylaşımlı lists)
- [ ] Calendar integration
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] Widgets
- [ ] Voice input
- [ ] Gamification (achievements, levels)

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

*Son güncelleme: 2026-01-09*