# FlowBot Agent - Sorun Analizi ve Çözüm Planı

**Tarih:** 2026-01-10
**Durum:** Kritik sorunlar mevcut, düzeltme gerekiyor
**Öncelik:** YÜKSEK

---

## 🔴 Mevcut Sorunlar

### Sorun 1: FlowBot Yanıt Vermiyor
**Belirti:** Kullanıcı mesaj gönderdiğinde FlowBot hiç yanıt vermiyor veya sadece "Yapılan işlemler" gösteriyor.

**Ekran Görüntüsü Analizi:**
- Kullanıcı: "Bana bugün için bir plan hazırla. 4 saatlik zamanım var prompt engineering alanında çalışmak istiyorum"
- FlowBot: Hiç yanıt yok (14:40'da mesaj gönderilmiş, yanıt gelmemiş)

**Olası Nedenler:**
1. LLM API çağrısı başarısız oluyor ama hata gösterilmiyor
2. Tool çağrısı yapılıyor ama content boş dönüyor
3. Follow-up LLM çağrısı da başarısız oluyor

---

### Sorun 2: Sadece "Yapılan İşlemler" Gösteriliyor
**Belirti:** FlowBot tool çalıştırıyor ama doğal dilde açıklama yapmıyor.

**Ekran Görüntüsü Analizi:**
- Kullanıcı: "Bugün için bir plan yapmama yardım et..."
- FlowBot yanıtı: 
  ```
  **Yapılan işlemler:**
  ✓ Today: 0 tasks done, 0/0 habits
  ```
- Beklenen: Task listesi, follow-up sorular, detaylı plan önerisi

**Olası Nedenler:**
1. `plan_day` tool'u çalışıyor ama sonuçlar LLM'e düzgün aktarılmıyor
2. LLM content boş döndürüyor, follow-up çağrısı yapılmıyor veya başarısız
3. Tool sonuçlarındaki `data` alanı (task isimleri, detaylar) kullanılmıyor

---

### Sorun 3: Task Detayları Gösterilmiyor
**Belirti:** "1 pending task" diyor ama task'ın adını söylemiyor.

**Beklenen Davranış:**
```
Şu an 1 bekleyen task'ın var:
- [P2] HUX AI: Projeler için Gist yapısının oluşturulması

Bugün kaç saatin var? Bu task'la başlamak ister misin?
```

**Gerçekleşen Davranış:**
```
✓ 1 pending task
```

---

### Sorun 4: Follow-up Soru Sormuyor
**Belirti:** Eksik bilgi olsa bile direkt işlem yapıyor veya genel cevap veriyor.

**Beklenen:**
- "Günümü planla" → "Bugün kaç saatin var? Hangi alana odaklanmak istiyorsun?"
- "Task ekle" → "Task'ın adı ne? Priority ve deadline?"

**Gerçekleşen:**
- Direkt plan_day çağırıyor, sonucu özet olarak gösteriyor

---

### Sorun 5: GPT-5 API Uyumsuzlukları
**Belirti:** GPT-5 modeli kullanıldığında API hataları alınıyor.

**Hatalar:**
1. `max_tokens is not supported, use max_completion_tokens` ✅ DÜZELTİLDİ
2. `temperature 0.7 is not supported, only default (1)` ✅ DÜZELTİLDİ

---

## 🟡 Kök Neden Analizi

### 1. LLM Response Flow Sorunu
```
Kullanıcı Mesajı
    ↓
LLM API Çağrısı (tool calling ile)
    ↓
LLM tool çağırır (plan_day, get_pending_tasks, vb.)
    ↓
Tool çalışır, sonuç döner (message + data)
    ↓
❌ SORUN: LLM content boş dönüyor
    ↓
Follow-up LLM çağrısı yapılıyor
    ↓
❌ SORUN: Follow-up da başarısız veya yetersiz
    ↓
Sadece "Yapılan işlemler" gösteriliyor
```

### 2. Context Aktarım Sorunu
- `ChatContext` içinde `taskList` ve `habitList` var ✅
- `buildContextMessage` bu listeyi system prompt'a ekliyor ✅
- AMA: LLM bu bilgiyi kullanmıyor veya görmüyor ❌

### 3. Tool Results Aktarım Sorunu
- Tool sonuçlarında `data` alanı var (task detayları)
- Follow-up mesajında bu data aktarılıyor ✅
- AMA: LLM bu datayı kullanarak detaylı cevap vermiyor ❌

---

## 🟢 Çözüm Planı

### Adım 1: Error Handling İyileştirmesi
**Dosya:** `src/services/llmService.ts`

```typescript
// sendMessageWithTools fonksiyonunda
try {
  // LLM çağrısı
} catch (error) {
  // Hata logla ve kullanıcıya göster
  console.error('LLM Error:', error)
  throw error // Hata ChatWindow'a ulaşsın
}
```

**Yapılacaklar:**
- [ ] Tüm API çağrılarına try-catch ekle
- [ ] Hataları console'a logla (debug için)
- [ ] Network hatalarını yakala ve anlamlı mesaj göster

---

### Adım 2: Follow-up Response Mekanizmasını Güçlendir
**Dosya:** `src/services/llmService.ts`

**Mevcut Sorun:**
```typescript
if (!result.content && toolResults.length > 0) {
  // Follow-up çağrısı yapılıyor ama yetersiz
}
```

**Çözüm:**
```typescript
// Her zaman follow-up yap, sadece content boşsa değil
if (toolResults.length > 0) {
  // Tool sonuçlarını zengin formatta aktar
  const richToolResults = formatRichToolResults(toolResults)
  
  // Follow-up prompt'u daha direktif yap
  const followUpPrompt = `
Tool sonuçları:
${richToolResults}

GÖREV: Yukarıdaki sonuçları kullanarak kullanıcıya DETAYLI yanıt ver.
- Task isimlerini ve priority'lerini MUTLAKA yaz
- Planlama yapıyorsan follow-up soru sor
- Somut adımlar öner
`
}
```

**Yapılacaklar:**
- [ ] `formatRichToolResults` fonksiyonu oluştur
- [ ] Follow-up prompt'u daha direktif yap
- [ ] Tool sonuçlarındaki tüm data'yı aktar

---

### Adım 3: System Prompt Optimizasyonu
**Dosya:** `src/services/llmService.ts`

**Mevcut Sorun:**
- System prompt çok uzun ve karmaşık
- LLM talimatları takip etmiyor

**Çözüm:**
```typescript
const ADHD_COACH_SYSTEM_PROMPT = `Sen FlowBot - ADHD productivity koçusun.

MUTLAKA UYULMASI GEREKEN KURALLAR:
1. Tool çağırdıktan sonra sonuçları DETAYLI açıkla
2. Task varsa İSİMLERİNİ ve PRIORITY'LERİNİ yaz
3. Planlama istendiyse FOLLOW-UP SORU sor
4. Türkçe konuş, kısa ve öz ol

ÖRNEK:
Kullanıcı: "Günümü planla"
Sen: "Şu an 2 bekleyen task'ın var:
- [P1] Proje sunumu (yarın deadline)
- [P2] Email'leri yanıtla

Bugün kaç saatin var? Hangi task'la başlamak istersin?"
`
```

**Yapılacaklar:**
- [ ] System prompt'u kısalt ve netleştir
- [ ] Örnek diyaloglar ekle
- [ ] "MUTLAKA" gibi vurgulu talimatlar kullan

---

### Adım 4: Tool Sonuçlarını Zenginleştir
**Dosya:** `src/services/agentService.ts`

**Mevcut Sorun:**
- `plan_day` sadece özet mesaj döndürüyor
- Task detayları `data` içinde ama LLM bunu görmüyor

**Çözüm:**
```typescript
case 'plan_day': {
  // ... mevcut kod ...
  
  // Mesajı zenginleştir
  let message = `📋 Günlük Plan Özeti:\n\n`
  
  if (priorityTasks.length > 0) {
    message += `**Öncelikli Task'lar:**\n`
    priorityTasks.forEach((t, i) => {
      message += `${i + 1}. [${t.priority}] ${t.title}`
      if (t.deadline) message += ` (deadline: ${t.deadline})`
      message += `\n`
    })
  } else {
    message += `Bekleyen öncelikli task yok.\n`
  }
  
  if (pendingHabits.length > 0) {
    message += `\n**Bugünkü Habit'ler:** ${pendingHabits.join(', ')}\n`
  }
  
  message += `\n💡 Öneri: ${taskRecommendation}`
  
  return {
    success: true,
    message, // Artık detaylı
    data: plan,
  }
}
```

**Yapılacaklar:**
- [ ] `plan_day` mesajını zenginleştir
- [ ] `get_pending_tasks` mesajını zenginleştir
- [ ] `get_daily_summary` mesajını zenginleştir

---

### Adım 5: ChatWindow Error Display
**Dosya:** `src/components/chat/ChatWindow.tsx`

**Mevcut Sorun:**
- Hata olduğunda sadece kırmızı kutu gösteriliyor
- Hangi hata olduğu net değil

**Çözüm:**
```typescript
// handleSend fonksiyonunda
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Bir hata oluştu'
  console.error('FlowBot Error:', err)
  setError(errorMessage)
  
  // Eğer API hatası ise özel mesaj
  if (errorMessage.includes('API key')) {
    setError('API key geçersiz veya eksik. Settings → AI bölümünden kontrol et.')
  }
}
```

**Yapılacaklar:**
- [ ] Hata mesajlarını daha açıklayıcı yap
- [ ] Console'a detaylı log ekle
- [ ] API key hatalarını özel handle et

---

### Adım 6: Debug Mode Ekle
**Dosya:** `src/services/llmService.ts`

**Amaç:** Geliştirme sırasında ne olduğunu görmek için

```typescript
const DEBUG_MODE = true // Production'da false

function debugLog(label: string, data: unknown) {
  if (DEBUG_MODE) {
    console.log(`[FlowBot Debug] ${label}:`, data)
  }
}

// Kullanım
debugLog('User Message', userMessage)
debugLog('Context', context)
debugLog('LLM Response', result)
debugLog('Tool Results', toolResults)
debugLog('Follow-up Response', followUpResult)
```

**Yapılacaklar:**
- [ ] Debug logging ekle
- [ ] Her adımda ne olduğunu logla
- [ ] Production'da kapatılabilir yap

---

## 📋 Uygulama Sırası

1. **Önce Debug Mode ekle** - Sorunun tam olarak nerede olduğunu gör
2. **Tool mesajlarını zenginleştir** - En kolay düzeltme
3. **Follow-up mekanizmasını güçlendir** - Kritik
4. **System prompt'u optimize et** - LLM davranışını düzelt
5. **Error handling ekle** - Kullanıcı deneyimi
6. **Test et** - Tüm senaryoları dene

---

## 🧪 Test Senaryoları

### Senaryo 1: Günlük Planlama
```
Kullanıcı: "Günümü planla"
Beklenen:
1. FlowBot mevcut task'ları listeler (isim + priority)
2. "Bugün kaç saatin var?" diye sorar
3. Kullanıcı cevap verir
4. FlowBot detaylı plan önerir
```

### Senaryo 2: Task Ekleme
```
Kullanıcı: "Task ekle"
Beklenen:
1. FlowBot sorar: "Task'ın adı ne?"
2. Kullanıcı cevap verir
3. FlowBot sorar: "Priority ve deadline?"
4. Task oluşturulur, onay verilir
```

### Senaryo 3: Mevcut Durumu Sorgulama
```
Kullanıcı: "Neymiş bu öncelikli görevim?"
Beklenen:
1. FlowBot get_pending_tasks çağırır
2. Task isimlerini ve detaylarını gösterir
3. Hangisiyle başlamak istediğini sorar
```

### Senaryo 4: Hata Durumu
```
Kullanıcı: (API key yok) "Merhaba"
Beklenen:
1. Anlamlı hata mesajı: "API key gerekli. Settings → AI"
2. Kırmızı hata kutusu
```

---

## 📁 Değiştirilecek Dosyalar

| Dosya | Değişiklik |
|-------|------------|
| `src/services/llmService.ts` | Follow-up mekanizması, debug mode, error handling |
| `src/services/agentService.ts` | Tool mesajlarını zenginleştir |
| `src/components/chat/ChatWindow.tsx` | Error display iyileştirmesi |
| `src/stores/settingsStore.ts` | Debug mode ayarı (opsiyonel) |

---

## ⏱️ Tahmini Süre

| Adım | Süre |
|------|------|
| Debug Mode | 30 dk |
| Tool Mesajları | 1 saat |
| Follow-up Mekanizması | 2 saat |
| System Prompt | 1 saat |
| Error Handling | 1 saat |
| Test | 1 saat |
| **TOPLAM** | **~6-7 saat** |

---

## 🔗 İlgili Dosyalar

- `src/services/llmService.ts` - Ana LLM entegrasyonu
- `src/services/agentService.ts` - Tool execution
- `src/services/toolRegistry.ts` - Tool tanımları
- `src/components/chat/ChatWindow.tsx` - Chat UI
- `src/stores/chatStore.ts` - Chat state
- `src/types/index.ts` - ChatContext type

---

*Bu doküman Claude Code tarafından oluşturulmuştur. Düzeltmeler için bu dosyayı referans alın.*
