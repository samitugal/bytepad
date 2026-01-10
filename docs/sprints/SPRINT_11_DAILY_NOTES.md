# Sprint 11: Daily Notes
**Goal:** Quick daily notes with card-based grid layout (Notion/Obsidian style)
**Duration:** 2-3 days
**Priority:** MEDIUM
**Status:** PLANNED

## Konsept
Günlük hızlı notlar için ayrı bir tab. Her gün için bir "sayfa" açılır, içinde kartlar halinde notlar tutulur.
- Grid layout (2-3 sütun)
- Her kart bir mini not
- Pinned/Newest/By Tags filtreleme
- Tarih bazlı organizasyon

## 11.1: Data Model & Store (0.5 gün)
- [ ] `DailyNote` ve `DailyNoteCard` interface tanımla
- [ ] `useDailyNotesStore` Zustand store oluştur
- [ ] LocalStorage persistence
- [ ] CRUD operations (add/update/delete card)

## 11.2: Daily Notes Tab UI (1 gün)
- [ ] Sidebar'a "Daily Notes" tab ekle (^8 shortcut)
- [ ] Ana görünüm: Tarih seçici + Grid layout
- [ ] "Daily Note Ekle" butonu → O gün için boş sayfa oluştur
- [ ] Tarih navigasyonu (← Dün | Bugün | Yarın →)
- [ ] Boş state: "Bugün için not yok, ekle!"

## 11.3: Card Component (0.5 gün)
- [ ] Card UI: Icon + Title + Content + Tags
- [ ] Yeni kart ekleme (+ butonu)
- [ ] Kart düzenleme (click to edit, inline)
- [ ] Kart silme (× butonu, confirm)
- [ ] Kart pinleme (📌 toggle)

## 11.4: Filtering & Toolbar (0.5 gün)
- [ ] Filter tabs: Pinned | Newest | By Tags
- [ ] Sort options
- [ ] Search (kart içeriğinde)
- [ ] Expand/collapse all

## 11.5: Styling & Polish (0.5 gün)
- [ ] Notepad++ tema uyumu
- [ ] Icon seçici (emoji picker)
- [ ] Tag renkleri
- [ ] Responsive grid (1/2/3 sütun)
- [ ] Hover/focus states

## Data Model
```typescript
interface DailyNote {
  id: string
  date: string // YYYY-MM-DD
  cards: DailyNoteCard[]
  createdAt: Date
  updatedAt: Date
}

interface DailyNoteCard {
  id: string
  title: string
  content: string
  icon?: string
  pinned: boolean
  tags: string[]
  createdAt: Date
}
```

## UI Layout
```
┌─────────────────────────────────────────────────────┐
│ Daily Notes          ← 9 Ocak | 10 Ocak | 11 Ocak → │
├─────────────────────────────────────────────────────┤
│ [Pinned] [Newest] [By Tags]    🔍 Search   [+ New]  │
├─────────────────────────────────────────────────────┤
│ ┌───────────────┐  ┌───────────────┐                │
│ │ 📋 Card Title │  │ 🎯 Card Title │                │
│ │ Content...    │  │ Content...    │                │
│ │ #tag1 #tag2   │  │ #tag1         │                │
│ └───────────────┘  └───────────────┘                │
│ ┌───────────────┐  ┌───────────────┐                │
│ │ 💡 Card Title │  │     + New     │                │
│ │ Content...    │  │     Card      │                │
│ └───────────────┘  └───────────────┘                │
└─────────────────────────────────────────────────────┘
```

## Files to Create
| File | Description |
|------|-------------|
| `src/stores/dailyNotesStore.ts` | Zustand store |
| `src/components/dailynotes/DailyNotesModule.tsx` | Ana modül |
| `src/components/dailynotes/DailyNoteCard.tsx` | Kart component |
| `src/components/dailynotes/CardEditor.tsx` | Inline editor |

## FlowBot Entegrasyonu (Gelecek Sprint)
- [ ] `create_daily_note_card` tool
- [ ] `get_today_notes` tool
- [ ] "Bugünkü notlarıma ekle: ..." komutu

## Completion Criteria
- [ ] Daily Notes tab çalışıyor (^8)
- [ ] Tarih bazlı sayfa oluşturma
- [ ] Kart CRUD (ekleme/düzenleme/silme/pinleme)
- [ ] Pinned/Newest/Tags filtreleme
- [ ] Grid layout responsive
- [ ] LocalStorage persistence
