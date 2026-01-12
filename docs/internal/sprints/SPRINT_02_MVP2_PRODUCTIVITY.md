# MVP2: Productivity Modules
**Hedef:** Tasks, Habits, Journal + Pomodoro
**Süre:** 3 hafta
**Durum:** ✅ TAMAMLANDI

---

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

---

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

---

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

---

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

---

## Sprint 2.5: Cross-Module Integration (3 gün) ✓
- [x] StatusBar'da günlük özet (habits done, active pomodoro)
- [x] Task'tan Pomodoro başlatma
- [x] Today view (bugünün tasks + habits)
- [x] Quick capture (Ctrl+Shift+N = hızlı not/task)
- [x] Data export (JSON)
- [x] Data import

**Çıktı:** Entegre çalışan modüller

---

## Tamamlanma Kriterleri ✓
- [x] 4 core modül tam çalışıyor (Notes, Tasks, Habits, Journal)
- [x] Pomodoro timer çalışıyor ve task'lara bağlanabiliyor
- [x] Tüm modüller keyboard-first
- [x] Streak'ler doğru hesaplanıyor
- [x] Cross-module navigation sorunsuz
