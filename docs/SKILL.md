---
name: adhd-productivity-app
description: ADHD kullanıcıları için keyboard-first, retro Notepad++ estetiğinde productivity super app geliştirme skill'i. Notes, Habits, Tasks, Journal modülleri ve AI-powered haftalık analiz özelliği içerir. Bu skill'i kullan: (1) ADHD productivity app oluştururken, (2) Retro/Notepad++ tarzı UI yaparken, (3) Keyboard-first uygulamalar geliştirirken, (4) AI-powered self-improvement araçları yaparken.
---

# ADHD Productivity Super App Development Skill

## Proje Özeti

Notepad++ estetiğinde, keyboard-first, retro görünümlü ama modern AI özellikleriyle donatılmış bir productivity super app.

## Temel Prensipler

### 1. Keyboard-First
Her action keyboard ile yapılabilmeli. Mouse opsiyonel.

```typescript
const CORE_SHORTCUTS = {
  'Ctrl+K': 'Command Palette (en önemli)',
  'Ctrl+1-5': 'Module navigation',
  'Ctrl+N': 'New item',
  'Ctrl+S': 'Save',
  'Escape': 'Cancel/Close',
  'Space': 'Toggle (tasks/habits)',
};
```

### 2. Retro Aesthetic
Notepad++ koyu teması, monospace font, minimal dekorasyon.

```css
:root {
  --bg-primary: #1E1E1E;
  --bg-secondary: #252526;
  --text-primary: #D4D4D4;
  --accent-blue: #569CD6;
  --accent-green: #6A9955;
  --font-mono: 'JetBrains Mono', 'Consolas', monospace;
}
```

### 3. ADHD-Friendly
- Minimal distraction
- Quick capture
- Gentle reminders
- Small dopamine hits for completions
- Time blindness helpers

### 4. Offline-First
LocalStorage + IndexedDB. İnternet gerektirmez (AI hariç).

## Modüller

### Notes
- Markdown editor
- Folder/tag system
- Fuzzy search

### Habits
- Daily/weekly tracking
- Streak counter
- Category grouping

### Tasks
- Priority levels (P1-P4)
- Deadline tracking
- Subtasks

### Journal
- Daily mood (1-5)
- Energy level (1-5)
- Free text entry

### Weekly Analysis (AI)
- Habit completion stats
- Task performance
- Mood/energy trends
- ADHD pattern detection
- Personalized recommendations

## Geliştirme Workflow

### Phase 1: Foundation
1. Vite + React + TypeScript setup
2. Tailwind with custom Notepad++ theme
3. Layout components (Sidebar, TabBar, StatusBar)
4. Keyboard shortcuts hook
5. Command palette

### Phase 2: Core Modules
1. Notes module with markdown
2. Tasks module with priorities
3. Habits module with streaks
4. Journal module with mood picker

### Phase 3: AI Integration
1. Analysis service
2. Pattern detection algorithms
3. AI prompt templates
4. Weekly report UI

## Kod Standartları

### TypeScript Strict
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Component Structure
```typescript
// Minimal, focused components
interface Props {
  // Explicit types, no any
}

export function Component({ prop }: Props) {
  // Hooks at top
  // Event handlers
  // Early returns
  // Clean JSX
}
```

### State Management
Zustand ile basit store'lar:

```typescript
interface NoteStore {
  notes: Note[];
  activeNoteId: string | null;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
}
```

## UI Referansları

### Layout
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
│ Status: Ln 1, Col 0 | 3/5 habits done ✓    │
└─────────────────────────────────────────────┘
```

### Renk Kullanımı
- `--accent-green`: Success, completed items
- `--accent-orange`: Warnings, deadlines
- `--accent-blue`: Links, active states
- `--accent-purple`: Keywords, tags

## AI Integration

### Analysis Prompt Template
```
ADHD koçu rolünde haftalık analiz yap.

Veriler:
- Habit completion: {{rate}}%
- Tasks: {{done}}/{{total}}
- Avg mood: {{mood}}/5
- Avg energy: {{energy}}/5

Çıktı:
1. 3 pozitif nokta
2. 2 dikkat alanı
3. 3 pratik öneri (küçük adımlar)
4. Motivasyonel kapanış
```

### Pattern Detection
- Hyperfocus cycles
- Energy dips
- Task avoidance
- Streak breaks
- Overwhelm signals

## Önemli Notlar

1. **Basit tut**: ADHD kullanıcıları karmaşıklıktan kaçınır
2. **Hızlı feedback**: Her action'a anında yanıt
3. **Undo her yerde**: Hata korkusu olmasın
4. **Progressive disclosure**: İleri özellikler gizli ama erişilebilir
5. **No shame**: Kaçırılan günler için yargılayıcı olmayan dil
