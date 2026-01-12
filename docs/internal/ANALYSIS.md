# ADHD Productivity Super App - Kapsamlı Analiz ve Geliştirme Kılavuzu

## Proje Özeti

**Konsept:** Notepad++ estetiğinde, keyboard-first, retro görünümlü ama modern AI özellikleriyle donatılmış bir productivity super app. ADHD beyinler için optimize edilmiş.

**Hedef Kullanıcı:** ADHD sahibi bireyler, productivity araçlarından bunalmış kullanıcılar, minimal ama güçlü araç arayanlar.

---

## 1. Temel Modüller

### 1.1 Notes (Defter)
- Markdown destekli metin editörü
- Klasör/etiket sistemi
- Hızlı arama (fuzzy search)
- Otomatik kaydetme
- Vim-style keyboard shortcuts opsiyonel

### 1.2 Habits (Günlük Alışkanlıklar)
- Günlük/haftalık tekrarlayan görevler
- Streak takibi
- Basit check/uncheck sistemi
- Kategori bazlı gruplama (sağlık, iş, kişisel)

### 1.3 Tasks (Yapılacaklar)
- Deadline'lı görevler
- Öncelik seviyeleri (P1-P4 veya basit high/medium/low)
- Subtask desteği
- Kanban view opsiyonel

### 1.4 Journal (Günlük)
- Günlük mood tracking
- Serbest yazı alanı
- Prompt önerileri (opsiyonel)
- Günlük energy level kaydı

### 1.5 Weekly Analysis (AI-Powered)
- Haftalık özet raporu
- Habit completion rate
- Task completion analizi
- Mood/energy pattern analizi
- ADHD-spesifik tavsiyeler
- Motivasyonel mesajlar

---

## 2. Teknik Mimari

### 2.1 Frontend Stack
```
React + TypeScript
Tailwind CSS (retro tema için custom config)
Zustand veya Jotai (state management)
LocalStorage + IndexedDB (offline-first)
```

### 2.2 Veri Yapısı
```typescript
interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  category: string;
  completions: Record<string, boolean>; // date -> completed
  streak: number;
  createdAt: Date;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  deadline?: Date;
  completed: boolean;
  completedAt?: Date;
  subtasks: SubTask[];
  createdAt: Date;
}

interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mood: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  content: string;
  tags: string[];
}

interface WeeklyAnalysis {
  weekStart: string;
  weekEnd: string;
  habitStats: HabitStat[];
  taskStats: TaskStat;
  moodTrend: number[];
  energyTrend: number[];
  aiInsights: string[];
  recommendations: string[];
  generatedAt: Date;
}
```

### 2.3 Keyboard Shortcuts Sistemi
```typescript
const SHORTCUTS = {
  // Global
  'Ctrl+1': 'Navigate to Notes',
  'Ctrl+2': 'Navigate to Habits',
  'Ctrl+3': 'Navigate to Tasks',
  'Ctrl+4': 'Navigate to Journal',
  'Ctrl+5': 'Navigate to Analysis',
  'Ctrl+K': 'Command Palette',
  'Ctrl+S': 'Save current',
  'Ctrl+N': 'New item',
  'Ctrl+F': 'Search',
  'Escape': 'Close modal/Cancel',
  
  // Notes specific
  'Ctrl+B': 'Bold',
  'Ctrl+I': 'Italic',
  'Ctrl+Shift+C': 'Code block',
  
  // Task specific
  'Space': 'Toggle complete',
  'E': 'Edit',
  'D': 'Delete',
  '1-4': 'Set priority',
};
```

---

## 3. UI/UX Tasarım Kılavuzu

### 3.1 Retro Notepad++ Estetiği

**Renk Paleti:**
```css
:root {
  /* Ana renkler - Notepad++ teması */
  --bg-primary: #1E1E1E;      /* Koyu arka plan */
  --bg-secondary: #252526;    /* Panel arka plan */
  --bg-tertiary: #2D2D30;     /* Hover/active states */
  --bg-editor: #1E1E1E;       /* Editör alanı */
  
  /* Metin renkleri */
  --text-primary: #D4D4D4;    /* Ana metin */
  --text-secondary: #808080;  /* Soluk metin */
  --text-accent: #569CD6;     /* Keyword blue */
  
  /* Syntax highlighting inspired */
  --accent-green: #6A9955;    /* Comments/success */
  --accent-orange: #CE9178;   /* Strings/warnings */
  --accent-purple: #C586C0;   /* Keywords */
  --accent-yellow: #DCDCAA;   /* Functions */
  --accent-blue: #9CDCFE;     /* Variables */
  
  /* UI elements */
  --border-color: #3C3C3C;
  --scrollbar-bg: #1E1E1E;
  --scrollbar-thumb: #424242;
  --selection-bg: #264F78;
  
  /* Status colors */
  --success: #4EC9B0;
  --warning: #CE9178;
  --error: #F14C4C;
  --info: #3794FF;
}
```

**Typography:**
```css
/* Monospace her yerde - Notepad++ hissi */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
--font-size-xs: 11px;
--font-size-sm: 12px;
--font-size-base: 13px;
--font-size-lg: 14px;
--font-size-xl: 16px;

/* Line numbers, status bar gibi yerlerde */
--line-height-tight: 1.4;
--line-height-normal: 1.6;
```

### 3.2 Layout Yapısı
```
┌─────────────────────────────────────────────────────────────┐
│ Menu Bar: File  Edit  View  Tools  Help          [_][□][X] │
├──────────┬──────────────────────────────────────────────────┤
│ Sidebar  │  Tab Bar: [Notes] [Habits] [Tasks] [+]          │
│ ──────── │ ────────────────────────────────────────────────│
│ > Notes  │                                                  │
│ > Habits │              Main Editor Area                    │
│ > Tasks  │                                                  │
│ > Journal│              (Content based on active tab)       │
│ ──────── │                                                  │
│ Analysis │                                                  │
│          │                                                  │
├──────────┴──────────────────────────────────────────────────┤
│ Status Bar: Ln 42, Col 15 | UTF-8 | Today: 3/5 habits ✓   │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Komponent Stilleri

**Buttons:**
```css
.btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 4px 12px;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
}
.btn:hover {
  background: #094771;
  border-color: #094771;
}
.btn:focus {
  outline: 1px solid var(--accent-blue);
}
```

**Inputs:**
```css
.input {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-family: var(--font-mono);
  padding: 6px 8px;
}
.input:focus {
  border-color: var(--accent-blue);
  outline: none;
}
```

**Checkboxes (Retro style):**
```css
.checkbox {
  appearance: none;
  width: 14px;
  height: 14px;
  border: 1px solid var(--text-secondary);
  background: var(--bg-primary);
}
.checkbox:checked {
  background: var(--accent-green);
  border-color: var(--accent-green);
}
.checkbox:checked::after {
  content: '✓';
  color: var(--bg-primary);
  font-size: 10px;
}
```

---

## 4. AI Analiz Sistemi

### 4.1 Haftalık Analiz Algoritması
```typescript
interface WeeklyAnalysisInput {
  habits: Habit[];
  tasks: Task[];
  journalEntries: JournalEntry[];
  notes: Note[];
  weekRange: { start: Date; end: Date };
}

function generateWeeklyAnalysis(input: WeeklyAnalysisInput): WeeklyAnalysis {
  // 1. Habit completion rate hesapla
  const habitStats = calculateHabitStats(input.habits, input.weekRange);
  
  // 2. Task completion analizi
  const taskStats = calculateTaskStats(input.tasks, input.weekRange);
  
  // 3. Mood/Energy trendleri
  const moodTrend = extractMoodTrend(input.journalEntries);
  const energyTrend = extractEnergyTrend(input.journalEntries);
  
  // 4. ADHD-spesifik pattern analizi
  const patterns = detectADHDPatterns({
    habitStats,
    taskStats,
    moodTrend,
    energyTrend
  });
  
  // 5. AI ile insight ve öneri üretimi
  const aiInsights = generateInsights(patterns);
  const recommendations = generateRecommendations(patterns);
  
  return {
    weekStart: input.weekRange.start.toISOString(),
    weekEnd: input.weekRange.end.toISOString(),
    habitStats,
    taskStats,
    moodTrend,
    energyTrend,
    aiInsights,
    recommendations,
    generatedAt: new Date()
  };
}
```

### 4.2 ADHD Pattern Detection
```typescript
interface ADHDPattern {
  type: 'hyperfocus' | 'energy-dip' | 'task-avoidance' | 'streak-break' | 'overwhelm';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedDays: string[];
}

const PATTERN_DETECTORS = {
  hyperfocus: (data) => {
    // Belirli günlerde aşırı üretkenlik, sonraki günlerde düşüş
  },
  energyDip: (data) => {
    // Energy level'ın belirli saatlerde/günlerde düşüşü
  },
  taskAvoidance: (data) => {
    // P1 taskların sürekli ertelenmesi
  },
  streakBreak: (data) => {
    // Habit streak'lerin kırılma pattern'i
  },
  overwhelm: (data) => {
    // Çok fazla incomplete task + düşük mood
  }
};
```

### 4.3 AI Prompt Şablonları

**Haftalık Analiz Promptu:**
```
Sen bir ADHD koçusun. Aşağıdaki haftalık verileri analiz et ve kişiselleştirilmiş, motive edici öneriler sun.

## Bu Hafta Verileri:
- Habit tamamlama oranı: {{habitCompletionRate}}%
- Tamamlanan görevler: {{completedTasks}}/{{totalTasks}}
- Ortalama mood: {{avgMood}}/5
- Ortalama enerji: {{avgEnergy}}/5

## Tespit Edilen Pattern'ler:
{{patterns}}

## İstenen Çıktı:
1. Bu haftanın 3 pozitif yanı (kutlama)
2. Dikkat edilmesi gereken 2 alan
3. Gelecek hafta için 3 pratik öneri (ADHD-dostu, küçük adımlar)
4. Motivasyonel bir kapanış mesajı

Ton: Destekleyici, yargılayıcı değil, pratik odaklı.
```

---

## 5. ADHD-Spesifik Özellikler

### 5.1 Focus Mode
- Tek bir göreve odaklanma modu
- Dikkat dağıtıcı elementlerin gizlenmesi
- Pomodoro timer entegrasyonu (opsiyonel)
- "Body doubling" simülasyonu (arka plan sesleri)

### 5.2 Quick Capture
- `Ctrl+Shift+N`: Herhangi bir yerden hızlı not
- Floating window desteği
- Inbox sistemi (sonra organize et)

### 5.3 Gentle Reminders
- Agresif olmayan bildirimler
- "Nudge" sistemi (nazik hatırlatmalar)
- Customizable reminder frequency

### 5.4 Dopamine Hits
- Streak animasyonları (ama abartısız, retro tarzda)
- Progress bar'lar
- Achievement sistemi (basit, motivasyonel)
- "Level up" mekanizması (opsiyonel)

### 5.5 Time Blindness Helpers
- Görsel timeline
- "Time until deadline" göstergeleri
- Otomatik time estimates for tasks
- "How long has it been?" tracker

---

## 6. Command Palette Sistemi

```typescript
interface Command {
  id: string;
  title: string;
  shortcut?: string;
  category: 'navigation' | 'action' | 'settings' | 'ai';
  action: () => void;
}

const COMMANDS: Command[] = [
  { id: 'new-note', title: 'New Note', shortcut: 'Ctrl+N', category: 'action' },
  { id: 'new-task', title: 'New Task', shortcut: 'Ctrl+T', category: 'action' },
  { id: 'quick-habit', title: 'Quick Habit Check', category: 'action' },
  { id: 'goto-notes', title: 'Go to Notes', shortcut: 'Ctrl+1', category: 'navigation' },
  { id: 'goto-habits', title: 'Go to Habits', shortcut: 'Ctrl+2', category: 'navigation' },
  { id: 'goto-tasks', title: 'Go to Tasks', shortcut: 'Ctrl+3', category: 'navigation' },
  { id: 'goto-journal', title: 'Go to Journal', shortcut: 'Ctrl+4', category: 'navigation' },
  { id: 'run-analysis', title: 'Generate Weekly Analysis', category: 'ai' },
  { id: 'ai-suggest', title: 'AI: Suggest Next Action', category: 'ai' },
  { id: 'focus-mode', title: 'Toggle Focus Mode', shortcut: 'Ctrl+Shift+F', category: 'action' },
  { id: 'toggle-theme', title: 'Toggle Light/Dark', category: 'settings' },
];
```

---

## 7. Dosya Yapısı

```
adhd-productivity-app/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── CommandPalette.tsx
│   │   │   └── StatusBar.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TabBar.tsx
│   │   │   ├── MenuBar.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── notes/
│   │   │   ├── NoteEditor.tsx
│   │   │   ├── NoteList.tsx
│   │   │   └── FolderTree.tsx
│   │   ├── habits/
│   │   │   ├── HabitList.tsx
│   │   │   ├── HabitItem.tsx
│   │   │   ├── StreakBadge.tsx
│   │   │   └── HabitForm.tsx
│   │   ├── tasks/
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskItem.tsx
│   │   │   ├── TaskForm.tsx
│   │   │   └── PriorityBadge.tsx
│   │   ├── journal/
│   │   │   ├── JournalEditor.tsx
│   │   │   ├── MoodPicker.tsx
│   │   │   └── EnergyPicker.tsx
│   │   └── analysis/
│   │       ├── WeeklyReport.tsx
│   │       ├── HabitChart.tsx
│   │       ├── MoodChart.tsx
│   │       └── AIInsights.tsx
│   ├── stores/
│   │   ├── noteStore.ts
│   │   ├── habitStore.ts
│   │   ├── taskStore.ts
│   │   ├── journalStore.ts
│   │   └── uiStore.ts
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useCommandPalette.ts
│   │   └── useFocusMode.ts
│   ├── services/
│   │   ├── aiService.ts
│   │   ├── analysisService.ts
│   │   └── storageService.ts
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   ├── analysisUtils.ts
│   │   └── patternDetection.ts
│   ├── types/
│   │   └── index.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── notepad-theme.css
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── fonts/
│       └── JetBrainsMono/
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 8. Geliştirme Öncelikleri (MVP)

### Phase 1: Core Infrastructure
1. Layout ve tema sistemi
2. Keyboard shortcuts altyapısı
3. LocalStorage persistence
4. Command palette

### Phase 2: Core Modules
1. Notes modülü (markdown editor)
2. Tasks modülü (CRUD + priority)
3. Habits modülü (daily tracking)
4. Journal modülü (mood + text)

### Phase 3: AI Integration
1. Weekly analysis algoritması
2. AI prompt integration (Anthropic API)
3. Pattern detection sistemi
4. Insight/recommendation UI

### Phase 4: Polish
1. Focus mode
2. Animations (subtle, retro)
3. Data export/import
4. PWA support

---

## 9. Örnek Kullanıcı Akışları

### Sabah Rutini
1. App'i aç → Bugünün habits'leri görünür
2. `Space` ile tamamlananları işaretle
3. `Ctrl+3` ile tasks'a git, bugün yapılacakları gör
4. `Ctrl+N` ile günün planı notunu yaz

### Akşam Kapanışı
1. `Ctrl+4` ile journal'a git
2. Mood ve energy seç
3. Günün kısa özetini yaz
4. Yarına kalan task'ları gözden geçir

### Hafta Sonu Analizi
1. `Ctrl+5` ile analysis'e git
2. "Generate Weekly Report" tıkla
3. AI insights'ları oku
4. Önerileri not al, gerekirse habit/task ayarla

---

## 10. Claude Code İçin Talimatlar

Claude Code'ye bu analizi verirken şunları belirt:

1. **Öncelik:** MVP için Phase 1 ve 2'ye odaklan
2. **Stil:** Notepad++ temasını birebir uygula, modern UI pattern'lerden kaçın
3. **Keyboard-first:** Her action keyboard ile yapılabilmeli
4. **Offline-first:** İnternet olmadan çalışmalı
5. **Performans:** Minimal dependency, hızlı load
6. **Kod kalitesi:** TypeScript strict mode, proper types

**Başlangıç komutu örneği:**
```
Bu ADHD productivity app analizini oku ve MVP'yi oluştur.
Önce layout ve tema sistemini kur, sonra notes modülünü implement et.
Notepad++ estetiğine sadık kal, keyboard shortcuts'ları ilk günden ekle.
```
