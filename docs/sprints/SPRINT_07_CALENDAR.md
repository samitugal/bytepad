# Sprint 7: Calendar Module
**Hedef:** Task'ları takvim üzerinde görselleştirme ve takvimden task oluşturma
**Süre:** 5-7 gün
**Durum:** ✅ TAMAMLANDI

---

## 7.1: Task Model Güncellemesi (1 gün) ✓
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

---

## 7.2: Calendar Store & Logic (1 gün) ✓
- [x] calendarStore (Zustand)
  - currentView: 'month' | 'week' | 'day'
  - currentDate: Date
  - selectedDate: Date | null
- [x] View navigation (prev/next month/week/day)
- [x] Task'ları tarihe göre gruplama
- [x] Tarih aralığına göre task filtreleme

---

## 7.3: Calendar UI - Month View (2 gün) ✓
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

---

## 7.4: Calendar UI - Week & Day View (1 gün) ✓
- [x] WeekView component
  - 7 sütun, saatlik satırlar
  - Task'lar zaman bloğu olarak
- [x] DayView component
  - Tek gün, saatlik detay
  - Task'lar zaman bloğu olarak
- [x] Responsive tasarım

---

## 7.5: Task Creation from Calendar (1 gün) ✓
- [x] Takvim hücresine tıklayınca task oluşturma modal
  - Seçilen tarih otomatik doldurulur
  - End date picker
  - Priority seçimi
- [ ] Drag to create (opsiyonel - sonraki iterasyon)
  - Başlangıç hücresinden bitiş hücresine sürükle
  - Tarih aralığı otomatik belirlenir
- [x] Task oluşturulunca taskStore'a eklenir

---

## 7.6: Task Interaction on Calendar (1 gün) ✓
- [x] Task'a tıklayınca detay popup
- [ ] Drag & drop ile tarih değiştirme (sonraki iterasyon)
- [ ] Resize ile süre değiştirme (sonraki iterasyon)
- [x] Quick complete (popup'tan tamamla butonu)
- [x] Task'ı sil/düzenle

---

## 7.7: Visual Design & Polish ✓
- [x] Notepad++ tema uyumu
- [x] Priority renk kodları (P1=kırmızı, P2=turuncu, vb.)
- [x] Completed task'lar için strikethrough
- [x] Today highlight
- [x] Weekend farklı arka plan
- [x] Keyboard shortcuts
  - `←/→` = prev/next period
  - `T` = today
  - `M/W/D` = month/week/day view
  - `N` = new task on selected date
  - `Esc` = close modals

---

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

### Kullanılan Kütüphaneler
- `date-fns` - Tarih manipülasyonu
- Custom CSS Grid - Takvim layout
- Native drag & drop API

---

## Tamamlanma Kriterleri ✓
- [x] Month/Week/Day view'lar çalışıyor
- [x] Task'lar takvimde doğru tarihlerde görünüyor
- [x] Çok günlü task'lar spanning bar olarak görünüyor
- [x] Takvimden yeni task oluşturulabiliyor
- [ ] Drag & drop ile tarih değiştirilebiliyor (sonraki iterasyon)
- [x] Keyboard navigation çalışıyor (←→ T M W D N Esc)
- [x] Task detail popup (tıklayınca detay, tamamla, sil)
- [x] Cloud sync ile senkronize
