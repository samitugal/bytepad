# Sprint 35: Ideas Module & UX Improvements

**Status:** ✅ COMPLETED  
**Version:** 0.20.0 → 0.21.0  
**Date:** 2026-01-14  
**Priority:** HIGH

## Objectives

1. Yeni "Ideas" modülü eklemek (Daily Notes altında, Habits üstünde)
2. Global shortcut davranışını düzeltmek
3. Tamamlanan task'ları otomatik arşivleme

---

## Feature 1: Ideas Module

### Konsept
Hızlı fikir yakalama için minimalist bir modül. Post-it tarzı Daily Notes'tan farklı, daha kompakt ve etkileşimli bir tasarım.

### Konum
- Sidebar'da 3. tab (Daily Notes altında, Habits üstünde)
- Keyboard shortcut: `Ctrl+4` (mevcut sıralama kayacak)

### UI/UX Tasarım Önerileri

#### Seçenek 1: Kanban-style Cards
```
┌─────────────────────────────────────────────┐
│ 💡 Ideas                          [+ New]   │
├─────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │ 🟡      │ │ 🟢      │ │ 🔵      │        │
│ │ API     │ │ Dark    │ │ Mobile  │        │
│ │ redesign│ │ mode    │ │ app     │        │
│ │         │ │ toggle  │ │         │        │
│ │ #tech   │ │ #ui     │ │ #future │        │
│ └─────────┘ └─────────┘ └─────────┘        │
│                                             │
│ ┌─────────┐ ┌─────────┐                    │
│ │ 🟣      │ │ 🟠      │                    │
│ │ Weekly  │ │ Export  │                    │
│ │ review  │ │ feature │                    │
│ └─────────┘ └─────────┘                    │
└─────────────────────────────────────────────┘
```

#### Seçenek 2: Compact List with Quick Actions
```
┌─────────────────────────────────────────────┐
│ 💡 Ideas                          [+ New]   │
├─────────────────────────────────────────────┤
│ 🟡 API redesign for better perf    #tech  → │
│ 🟢 Dark mode toggle in header      #ui    → │
│ 🔵 Mobile app consideration        #future→ │
│ 🟣 Weekly review automation        #habit → │
│ 🟠 Export to markdown feature      #feat  → │
├─────────────────────────────────────────────┤
│ [Type your idea...              ] [💡 Add]  │
└─────────────────────────────────────────────┘
```

#### Seçenek 3: Bubble/Tag Cloud Style
```
┌─────────────────────────────────────────────┐
│ 💡 Ideas                                    │
├─────────────────────────────────────────────┤
│                                             │
│    ╭──────────────╮   ╭─────────╮          │
│    │ API redesign │   │ Mobile  │          │
│    │    #tech     │   │  app    │          │
│    ╰──────────────╯   ╰─────────╯          │
│         ╭───────────────╮                   │
│         │  Dark mode    │                   │
│         │   toggle #ui  │                   │
│         ╰───────────────╯                   │
│    ╭─────────╮   ╭──────────────╮          │
│    │ Export  │   │ Weekly review│          │
│    ╰─────────╯   ╰──────────────╯          │
│                                             │
│ [+ Add new idea]                            │
└─────────────────────────────────────────────┘
```

### Önerilen Tasarım: Seçenek 1 (Kanban-style Cards) ✅
- Görsel ve sezgisel
- Drag & drop ile sıralama
- Renk kategorileri belirgin
- Gist sync için position bilgisi saklanır (x, y koordinatları yerine order index)

### Data Model

```typescript
interface Idea {
  id: string
  content: string           // Kısa fikir metni (max 280 karakter)
  color: IdeaColor          // Renk kategorisi
  tags: string[]            // Etiketler
  linkedNoteIds: string[]   // Bağlı notlar
  linkedTaskIds: string[]   // Bağlı tasklar
  status: 'active' | 'archived' | 'converted'
  order: number             // Sıralama için (drag & drop)
  createdAt: Date
  updatedAt: Date
}

type IdeaColor = 'yellow' | 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'cyan'
```

### Store: ideaStore.ts

```typescript
interface IdeaStore {
  ideas: Idea[]
  filter: 'all' | 'active' | 'archived'
  
  // Actions
  addIdea: (idea: Partial<Idea>) => void
  updateIdea: (id: string, updates: Partial<Idea>) => void
  deleteIdea: (id: string) => void
  archiveIdea: (id: string) => void
  convertToNote: (id: string) => string  // Returns new note ID
  linkToNote: (ideaId: string, noteId: string) => void
  linkToTask: (ideaId: string, taskId: string) => void
}
```

### Autocomplete Integration

Tüm `[[entity]]` autocomplete'lere Ideas eklenecek:
- `EntityLinkInput.tsx`
- `NoteEditor.tsx` (wikilink)
- `BookmarksModule.tsx`
- `TaskItem.tsx` (LinkedDescription)

```typescript
// Autocomplete suggestion type
type EntityType = 'note' | 'bookmark' | 'task' | 'idea' | 'habit'

// Idea suggestions
ideas.forEach(idea => {
  if (idea.content.toLowerCase().includes(query)) {
    results.push({ 
      type: 'idea', 
      id: idea.id, 
      title: idea.content.slice(0, 50) + (idea.content.length > 50 ? '...' : '')
    })
  }
})
```

### Knowledge Graph Integration

```typescript
// GraphModule.tsx - buildGraphData içinde
ideas.forEach(idea => {
  // Idea node
  nodes.push({
    id: `idea-${idea.id}`,
    label: idea.content.slice(0, 30),
    type: 'idea',
    color: getIdeaColor(idea.color)
  })
  
  // Idea -> Note edges
  idea.linkedNoteIds.forEach(noteId => {
    edges.push({
      source: `idea-${idea.id}`,
      target: `note-${noteId}`
    })
  })
  
  // Idea -> Task edges
  idea.linkedTaskIds.forEach(taskId => {
    edges.push({
      source: `idea-${idea.id}`,
      target: `task-${taskId}`
    })
  })
  
  // Idea -> Tag edges
  idea.tags.forEach(tag => {
    edges.push({
      source: `idea-${idea.id}`,
      target: `tag-${tag}`
    })
  })
})
```

### i18n Keys

```json
{
  "ideas": {
    "title": "Ideas",
    "addIdea": "Add idea",
    "placeholder": "Type your idea...",
    "archive": "Archive",
    "convertToNote": "Convert to note",
    "linkToNote": "Link to note",
    "noIdeas": "No ideas yet",
    "createFirst": "Capture your first idea!",
    "archived": "Archived",
    "colors": {
      "yellow": "Yellow",
      "green": "Green",
      "blue": "Blue",
      "purple": "Purple",
      "orange": "Orange"
    }
  }
}
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+4` | Ideas modülüne git |
| `n` | Yeni idea (Ideas modülündeyken) |
| `Enter` | Idea ekle (input focus) |
| `e` | Seçili idea'yı düzenle |
| `d` | Seçili idea'yı sil |
| `a` | Seçili idea'yı arşivle |

---

## Feature 2: Global Shortcut Fix

### Problem
`Ctrl+Shift+F` minimize edilmiş uygulamayı öne getiriyor - istenmeyen davranış.

### Çözüm
Electron main process'te `globalShortcut` kaydını kaldır veya sadece uygulama aktifken çalışacak şekilde değiştir.

### Dosya
`electron/main.ts`

```typescript
// KALDIRILACAK veya DEĞİŞTİRİLECEK:
globalShortcut.register('CommandOrControl+Shift+F', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  }
})
```

---

## Feature 3: Task Auto-Archive

### Problem
Tamamlanan task'lar Done bölümünde birikiyor.

### Çözüm
- Tamamlanan task'lar X gün sonra otomatik arşivlensin
- Arşivlenen task'lar ayrı bir "Archive" bölümünde gösterilsin
- Settings'te arşivleme süresi ayarlanabilir (default: 3 gün)

### Data Model Update

```typescript
interface Task {
  // ... existing fields
  archivedAt?: Date  // Yeni alan
}
```

### Store Update

```typescript
interface TaskStore {
  // ... existing
  archiveTask: (id: string) => void
  unarchiveTask: (id: string) => void
  autoArchiveOldTasks: (daysOld: number) => void
}
```

### Settings

```typescript
interface Settings {
  // ... existing
  taskAutoArchiveDays: number  // Default: 3
}
```

### UI
- Done bölümünde "Archive old tasks" butonu
- Settings'te "Auto-archive completed tasks after X days" seçeneği

---

## Implementation Order

1. **Ideas Module** (Ana özellik)
   - [x] ideaStore.ts oluştur
   - [x] IdeasModule.tsx component
   - [x] Sidebar'a ekle (Ctrl+3)
   - [x] i18n keys ekle
   - [x] Autocomplete integration
   - [x] Graph integration

2. **Global Shortcut Fix**
   - [x] electron/main.ts düzenle

3. **Task Auto-Archive**
   - [x] taskStore'a archive logic ekle
   - [x] App.tsx'te auto-archive çağrısı (3 gün)

---

## Files to Create/Modify

### New Files
- `src/stores/ideaStore.ts`
- `src/components/ideas/IdeasModule.tsx`
- `src/components/ideas/IdeaItem.tsx`
- `src/components/ideas/IdeaInput.tsx`
- `src/components/ideas/index.ts`

### Files to Modify
- `src/components/layout/Sidebar.tsx` - Ideas tab ekle
- `src/components/common/EntityLinkInput.tsx` - Idea autocomplete
- `src/components/notes/NoteEditor.tsx` - Idea wikilink
- `src/components/graph/GraphModule.tsx` - Idea nodes
- `src/stores/taskStore.ts` - Archive logic
- `src/i18n/en.json` - Ideas translations
- `src/i18n/tr.json` - Ideas translations
- `electron/main.ts` - Global shortcut fix
- `src/types/index.ts` - Idea type

---

## Success Criteria

- [x] Ideas modülü çalışıyor
- [x] Fikirler kaydediliyor ve listeleniyor
- [x] Autocomplete'lerde idea'lar görünüyor
- [x] Graph'ta idea node'ları var
- [x] Idea -> Note dönüşümü çalışıyor
- [x] Ctrl+Shift+F minimize'dan açmıyor
- [x] Eski task'lar otomatik arşivleniyor (3 gün)
