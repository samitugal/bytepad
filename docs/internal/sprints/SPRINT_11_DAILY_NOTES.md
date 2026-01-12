# Sprint 11: Daily Notes
**Goal:** Quick daily notes with card-based grid layout (Notion/Obsidian style)
**Duration:** 2-3 days
**Priority:** MEDIUM
**Status:** ✅ COMPLETED (2026-01-10)

## Konsept
Günlük hızlı notlar için ayrı bir tab. Her gün için bir "sayfa" açılır, içinde kartlar halinde notlar tutulur.
- Grid layout (2-3 sütun)
- Her kart bir mini not
- Pinned/Newest/By Tags filtreleme
- Tarih bazlı organizasyon

## 11.1: Data Model & Store (0.5 gün) ✓
- [x] `DailyNote` ve `DailyNoteCard` interface tanımla
- [x] `useDailyNotesStore` Zustand store oluştur
- [x] LocalStorage persistence
- [x] CRUD operations (add/update/delete card)

## 11.2: Daily Notes Tab UI (1 gün) ✓
- [x] Sidebar'a "Daily Notes" tab ekle (^2 shortcut - 2. sırada)
- [x] Ana görünüm: Tarih seçici + Grid layout
- [x] "Daily Note Ekle" butonu → O gün için boş sayfa oluştur
- [x] Tarih navigasyonu (← Dün | Bugün | Yarın →)
- [x] Boş state: "Bugün için not yok, ekle!"

## 11.3: Card Component (0.5 gün) ✓
- [x] Card UI: Icon + Title + Content + Tags
- [x] Yeni kart ekleme (+ butonu)
- [x] Kart düzenleme (click to edit, inline)
- [x] Kart silme (× butonu, confirm)
- [x] Kart pinleme (📌 toggle)
- [x] Default title: Tarih formatı (10.01.2026 - Saturday)

## 11.4: Filtering & Toolbar (0.5 gün) ✓
- [x] Filter tabs: Pinned | Newest | All
- [x] Search (kart içeriğinde)
- [x] Keyboard shortcuts: N=new, T=today, ←→=navigate
- [ ] Expand/collapse all

## 11.5: Styling & Polish (0.5 gün) ✓
- [x] Notepad++ tema uyumu
- [x] Icon seçici (emoji picker - 15 emoji)
- [x] Tag renkleri (cyan)
- [x] Responsive grid (1/2/3 sütun)
- [x] Hover/focus states

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
