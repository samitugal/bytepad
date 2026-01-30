# Sprint 39: Technical Debt Cleanup
**Goal:** Code quality, maintainability ve güvenlik iyileştirmeleri
**Duration:** 5-7 gün
**Priority:** HIGH
**Status:** PLANNED

---

## Özet

Bu sprint, birikmiş teknik borçları temizlemeye odaklanır. Kod kalitesi, güvenlik, test coverage ve maintainability artırılacak.

---

## 1. Güvenlik Açıkları (CRITICAL)

### 1.1 NPM Vulnerabilities
**Durum:** 7 vulnerability (1 moderate, 6 high)

```
lodash 4.0.0 - 4.17.21    → Prototype Pollution (moderate)
tar <=7.5.6               → Path Traversal (high)
```

**Çözüm:**
```bash
npm audit fix
# Eğer fix çalışmazsa:
npm update lodash tar
```

**Dosyalar:**
- `package.json`
- `package-lock.json`

**Acceptance Criteria:**
- [ ] `npm audit` 0 vulnerability göstermeli
- [ ] Tüm bağımlılıklar güncel olmalı

---

## 2. Büyük Dosyaların Refactor'ü (HIGH)

### 2.1 SettingsPanel.tsx (1423 satır)
**Problem:** Tek dosyada çok fazla sorumluluk

**Çözüm:** Tab bazlı modüler yapıya geçiş
```
src/components/settings/
├── SettingsPanel.tsx      (ana container, ~100 satır)
├── GeneralSettings.tsx    (~150 satır)
├── KeyboardSettings.tsx   (~150 satır)
├── AISettings.tsx         (~200 satır)
├── IntegrationsSettings.tsx (~200 satır)
├── SyncSettings.tsx       (~200 satır)
├── DataSettings.tsx       (~150 satır)
└── index.ts               (exports)
```

**Acceptance Criteria:**
- [ ] Her settings tab'ı ayrı dosyada
- [ ] Ana SettingsPanel 150 satırın altında
- [ ] Mevcut işlevsellik korunmalı

---

### 2.2 aiService.ts (1217 satır)
**Problem:** AI logic, tool definitions ve agent loop aynı dosyada

**Çözüm:** Concern separation
```
src/services/ai/
├── index.ts              (exports)
├── aiService.ts          (ana servis, ~200 satır)
├── toolDefinitions.ts    (tool tanımları, ~400 satır)
├── agentLoop.ts          (agent execution, ~300 satır)
├── providers/
│   ├── openai.ts
│   ├── anthropic.ts
│   ├── google.ts
│   └── ollama.ts
└── types.ts              (AI types)
```

**Acceptance Criteria:**
- [ ] Tool definitions ayrı dosyada
- [ ] Provider logic ayrılmış
- [ ] Agent loop izole edilmiş

---

## 3. Console.log Temizliği (MEDIUM)

### 3.1 Production Console Statements
**Problem:** 30+ console.log statement production kodda

**Etkilenen Dosyalar:**
- `src/services/updateService.ts` (2)
- `src/services/cloudSync.ts` (7)
- `src/services/aiService.ts` (7)
- `src/services/gistSyncService.ts` (8)
- `src/services/ipcStoreService.ts` (4)
- `src/services/localNotesService.ts` (1)
- `src/hooks/useServiceWorker.ts` (6)

**Çözüm:**
1. Logger utility oluştur
2. Environment-based logging
3. Console.log → logger.debug/info/warn/error

```typescript
// src/utils/logger.ts
const isDev = import.meta.env.DEV;

export const logger = {
  debug: (...args: unknown[]) => isDev && console.log('[DEBUG]', ...args),
  info: (...args: unknown[]) => isDev && console.log('[INFO]', ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
};
```

**Acceptance Criteria:**
- [ ] Logger utility oluşturuldu
- [ ] Tüm console.log'lar logger'a migrate edildi
- [ ] Production'da sadece warn/error görünür

---

## 4. Test Coverage (HIGH)

### 4.1 Unit Tests
**Problem:** 0 test dosyası mevcut

**Öncelikli Test Hedefleri:**
1. **Stores** (kritik iş mantığı)
   - `taskStore.ts` - task CRUD, subtasks, completion
   - `habitStore.ts` - streak hesaplama
   - `gamificationStore.ts` - XP hesaplama

2. **Services**
   - `updateService.ts` - version comparison
   - `gistSyncService.ts` - sync logic
   - `autoTaggingService.ts` - tag suggestions

3. **Utils**
   - `storage.ts`
   - Date/time helpers

**Setup:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Hedef:** Minimum %40 coverage

**Acceptance Criteria:**
- [ ] Vitest konfigüre edildi
- [ ] En az 20 test yazıldı
- [ ] CI'da testler çalışıyor

---

## 5. TypeScript Strict Mode İyileştirmeleri (MEDIUM)

### 5.1 Explicit Any Kullanımları
**Problem:** `@ts-ignore` ve `any` kullanımları

**Dosyalar:**
- `src/services/ipcStoreService.ts:281-282`

**Çözüm:** Proper typing

```typescript
// Önce
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const actionExecutors: Record<string, Record<string, (...args: any[]) => unknown>>

// Sonra
type StoreAction<T = unknown> = (...args: T[]) => unknown;
type StoreActions = Record<string, StoreAction>;
const actionExecutors: Record<string, StoreActions>
```

**Acceptance Criteria:**
- [ ] 0 `@ts-ignore` comment
- [ ] 0 `eslint-disable` for any types
- [ ] Tüm tipler explicit

---

## 6. Kod Duplikasyonu (MEDIUM)

### 6.1 localStorage Erişimi
**Problem:** 7 farklı dosyada direkt localStorage erişimi

**Dosyalar:**
- `src/services/updateService.ts`
- `src/components/graph/GraphModule.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/common/ResizablePanel.tsx`
- `src/services/dataService.ts`
- `src/utils/storage.ts`
- `src/components/common/ErrorBoundary.tsx`

**Çözüm:** Merkezi storage abstraction
```typescript
// src/utils/storage.ts (genişlet)
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {...},
  set: <T>(key: string, value: T): void => {...},
  remove: (key: string): void => {...},
  clear: (): void => {...},
};
```

**Acceptance Criteria:**
- [ ] Tüm localStorage erişimi storage utility üzerinden
- [ ] Type-safe getter/setter

---

## 7. Bundle Size Optimizasyonu (LOW)

### 7.1 Large Vendor Chunks
**Durum:**
- `vendor.js` → 1,744 KB (gzip: 529 KB)
- `vendor-firebase.js` → 197 KB
- `vendor-react.js` → 169 KB

**Çözüm:**
1. Dynamic imports for heavy modules
2. Tree shaking improvements
3. Firebase modular imports

```typescript
// Önce
import { initializeApp } from 'firebase/app';

// Sonra
const { initializeApp } = await import('firebase/app');
```

**Acceptance Criteria:**
- [ ] Ana vendor chunk < 1MB
- [ ] Initial load time iyileştirildi

---

## 8. Documentation (LOW)

### 8.1 Missing JSDoc
**Problem:** Kritik fonksiyonlarda JSDoc yok

**Öncelikli:**
- Store actions
- Service public methods
- Utility functions

**Acceptance Criteria:**
- [ ] Tüm public API'lar documented
- [ ] Complex logic açıklanmış

---

## 9. Error Handling (MEDIUM)

### 9.1 Tutarsız Error Handling
**Problem:** try-catch pattern tutarsız

**Çözüm:** Merkezi error handling
```typescript
// src/utils/errorHandler.ts
export function handleError(error: unknown, context: string): void {
  logger.error(`[${context}]`, error);
  // Optional: Send to error tracking service
}

export function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T | null> {
  return fn().catch(err => {
    handleError(err, context);
    return null;
  });
}
```

**Acceptance Criteria:**
- [ ] Error handler utility oluşturuldu
- [ ] Kritik servislerde kullanıldı

---

## 10. Performance (LOW)

### 10.1 Unnecessary Re-renders
**Problem:** 61 useEffect with empty deps

**Analiz:** Gereksiz re-render'lar için React DevTools profiling

**Çözüm:**
- useMemo/useCallback where needed
- React.memo for expensive components

---

## Deliverables Checklist

### Critical (Must Have)
- [ ] NPM vulnerabilities fixed
- [ ] Test setup complete
- [ ] Logger utility implemented

### High Priority
- [ ] SettingsPanel refactored
- [ ] aiService refactored
- [ ] Console.log cleanup

### Medium Priority
- [ ] TypeScript strict improvements
- [ ] localStorage abstraction
- [ ] Error handling standardized

### Low Priority
- [ ] Bundle optimization
- [ ] JSDoc documentation
- [ ] Performance profiling

---

## Tahmini Effort

| Kategori | Effort | Öncelik |
|----------|--------|---------|
| Güvenlik (npm audit) | 1-2 saat | CRITICAL |
| SettingsPanel refactor | 4-6 saat | HIGH |
| aiService refactor | 4-6 saat | HIGH |
| Console.log cleanup | 2-3 saat | MEDIUM |
| Test setup + 20 tests | 8-10 saat | HIGH |
| TypeScript improvements | 2-3 saat | MEDIUM |
| localStorage abstraction | 2-3 saat | MEDIUM |
| Error handling | 3-4 saat | MEDIUM |
| Bundle optimization | 4-6 saat | LOW |
| Documentation | 2-3 saat | LOW |

**Toplam:** ~35-45 saat (5-7 gün)

---

## Success Metrics

1. **Code Quality**
   - 0 npm vulnerabilities
   - No files > 500 lines
   - 0 console.log in production

2. **Test Coverage**
   - Minimum %40 coverage
   - All critical paths tested

3. **Maintainability**
   - Clear module boundaries
   - Consistent patterns

---

*Sprint 39 - Technical Debt Cleanup*
