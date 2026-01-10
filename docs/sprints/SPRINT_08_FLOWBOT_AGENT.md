# Sprint 8: FlowBot Agent Mode
**Hedef:** FlowBot'u pasif chatbot'tan aktif agent'a dönüştürme
**Süre:** 7-10 gün
**Durum:** ✅ TAMAMLANDI

---

## Konsept
FlowBot artık sadece soru-cevap yapmayacak, uygulama içinde **aksiyon alabilecek**:
- Task oluşturma/düzenleme/silme
- Bookmark ekleme (web araması ile)
- Not oluşturma
- Habit tracking
- Gün planlama
- Veri analizi

---

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

---

## 8.2: LLM Integration for Tool Calling (2 gün) ✓
- [x] OpenAI Function Calling entegrasyonu
- [x] Anthropic Tool Use entegrasyonu
- [x] Multi-step execution (birden fazla tool çağırma)
- [x] Tool sonuçlarını LLM'e geri besleme

---

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

---

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

---

## 8.5: Confirmation & Safety (1 gün) ✓
- [x] Destructive action'lar tanımlandı (delete_task, delete_habit, delete_note, delete_bookmark)
- [x] Tool execution sonuçları gösteriliyor
- [ ] Undo desteği (sonraki iterasyon)
- [ ] Rate limiting (sonraki iterasyon)

---

## 8.6: Agent UI Enhancements (1 gün) ✓
- [x] Tool execution indicator ("FlowBot düşünüyor...")
- [x] Action log ("Yapılan işlemler" bölümü)
- [x] Quick action buttons
- [ ] Inline task/bookmark preview (sonraki iterasyon)

---

## 8.7: Advanced Prompt Engineering (2 gün) ✓
**Hedef:** FlowBot'u gerçek bir ADHD koçuna dönüştürme
**Durum:** TAMAMLANDI (2026-01-10)

### Yapılan İyileştirmeler:
- ✅ **Rich Tool Results**: Tool mesajları artık task isimlerini, priority'leri ve deadline'ları gösteriyor
- ✅ **Conversational Flow**: Follow-up prompt güçlendirildi, directive talimatlar eklendi
- ✅ **Context Awareness**: Mevcut task listesi system prompt'a ekleniyor
- ✅ **Actionable Planning**: plan_day zaman blokları ve detaylı liste içeriyor
- ✅ **Task Details**: get_pending_tasks, plan_day, get_daily_summary detaylı mesajlar döndürüyor
- ✅ **System Prompt**: Basitleştirildi, İngilizce'ye çevrildi, daha directive yapıldı

### Güncellenen Dosyalar:
- `src/services/agentService.ts` - Tool mesajları zenginleştirildi
- `src/services/llmService.ts` - System prompt ve follow-up prompt iyileştirildi

---

## 8.8: Predefined Commands (1 gün) ✓
- [x] `/plan` veya "günümü planla" - plan_day tool'u
- [x] `/find <query>` veya "... hakkında kaynak bul" - web_search tool'u
- [x] `/quick <title>` veya "hızlı task: ..." - create_task tool'u
- [x] get_daily_summary, get_weekly_summary tool'ları

---

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

---

## Tamamlanma Kriterleri ✓
- [x] Agent tool'ları tanımlı ve çalışıyor (toolRegistry.ts)
- [x] LLM function calling entegre (OpenAI & Anthropic native)
- [x] Web search ile bookmark ekleme çalışıyor (Tavily API)
- [x] Gün planlama özelliği çalışıyor (plan_day)
- [x] Destructive action'lar tanımlı
- [x] Tool execution UI gösteriliyor
- [x] Predefined commands çalışıyor
