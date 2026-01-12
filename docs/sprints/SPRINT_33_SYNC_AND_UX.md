# Sprint 33: Sync Simplification & UX Improvements

**Status:** 🔄 In Progress  
**Version:** 0.17.0 → 0.18.0  
**Date:** 2026-01-12

## Objectives

Bu sprint'te Gist sync mekanizmasını basitleştiriyoruz ve çeşitli UX iyileştirmeleri yapıyoruz.

## Tasks

### 1. ✅ Gist Sync Simplification (TOP PRIORITY)
- [x] Auto-sync özelliğini kaldır
- [x] Uygulama açılınca otomatik Pull
- [x] Uygulama kapanınca otomatik Push
- [x] Manuel Push/Pull butonları korunsun

### 2. ⬜ Calendar Drag & Drop
- [ ] Task'ları takvimde sürükle-bırak ile taşıma
- [ ] @dnd-kit entegrasyonu

### 3. ⬜ Bookmark Wikilink Autocomplete
- [ ] Bookmark'larda `[[` yazınca autocomplete çalışsın
- [ ] Task için ayrı format gereksiz - kaldır

### 4. ⬜ Global Search - Bookmark Support
- [ ] Global search'te bookmark'lar da aransın
- [ ] Tag'a tıklayınca ilgili bookmark'lar da listelensin

### 5. ⬜ Note Pinning
- [ ] Note'lara pin/unpin özelliği ekle
- [ ] Pinned notlar en üstte gösterilsin
- [ ] Diğerleri oluşturma tarihine göre yeniden-eskiye sıralansın

### 6. ⬜ Version Number Fix
- [ ] Footer'daki versiyon numarasını package.json'dan al
- [ ] Dinamik olarak güncellensin

## Technical Details

### Gist Sync Changes
```typescript
// Kaldırılacak:
- Auto-sync interval
- Debounced sync on data change
- syncInterval setting

// Eklenecek:
- Pull on app start (after hydration)
- Push on app close (before-quit event)
```

### Note Pinning
```typescript
interface Note {
  // existing fields...
  pinned?: boolean
}
```

## Files to Modify

- `src/services/gistSyncService.ts` - Sync simplification
- `src/components/calendar/CalendarModule.tsx` - Drag & drop
- `src/components/bookmarks/*` - Wikilink autocomplete
- `src/components/common/CommandPalette.tsx` - Global search
- `src/stores/noteStore.ts` - Pinning support
- `src/components/notes/NoteList.tsx` - Pin UI
- `src/types/index.ts` - Note interface update
- `src/components/layout/StatusBar.tsx` - Version fix

## Testing

- [ ] Uygulama açılınca Gist'ten pull yapılıyor
- [ ] Uygulama kapanınca Gist'e push yapılıyor
- [ ] Manuel Push/Pull çalışıyor
- [ ] Calendar'da task sürüklenebiliyor
- [ ] Bookmark'larda wikilink autocomplete çalışıyor
- [ ] Global search'te bookmark'lar görünüyor
- [ ] Tag'a tıklayınca bookmark'lar da listeleniyor
- [ ] Not pinlenebiliyor ve en üstte görünüyor
- [ ] Footer'da doğru versiyon görünüyor
