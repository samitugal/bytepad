# Sprint 34: Refactor & Open Source Preparation

**Status:** 📋 PLANNED  
**Version:** 0.19.0 → 0.20.0  
**Date:** 2026-01-12  
**Priority:** HIGH

## Objectives

BytePad'i open source olarak yayınlamaya hazırlamak için kod kalitesini artırmak, dokümantasyonu düzenlemek ve potansiyel refactor alanlarını belirlemek.

---

## Phase 1: Code Refactoring

### 1.1 Component Decomposition
Büyük component'leri daha küçük, yeniden kullanılabilir parçalara ayırma:

| Component | Lines | Target | Priority |
|-----------|-------|--------|----------|
| `TasksModule.tsx` | ~1350 | <300 | HIGH |
| `NoteEditor.tsx` | ~410 | <200 | MEDIUM |
| `ChatWindow.tsx` | ~500 | <250 | MEDIUM |
| `CalendarModule.tsx` | ~600 | <300 | MEDIUM |

**TasksModule.tsx Refactor Plan:**
```
src/components/tasks/
├── TasksModule.tsx          # Main container (~100 lines)
├── TaskForm.tsx             # New/Edit task form
├── TaskItem.tsx             # Single task card (extract from SortableTaskItem)
├── TaskList.tsx             # Task list with DnD
├── TaskFilters.tsx          # Filter/Sort controls
├── LinkedResourcesEditor.tsx # Move to common/
├── EntityLinkInput.tsx      # Move to common/
└── index.ts                 # Exports
```

### 1.2 Store Optimization
- [ ] Zustand store'ları için selector optimization
- [ ] Gereksiz re-render'ları önleme
- [ ] Store action'larını gruplandırma

### 1.3 Type Safety Improvements
- [ ] `any` tiplerini kaldırma
- [ ] Strict null checks
- [ ] Interface'leri ayrı dosyalara taşıma (`src/types/`)

### 1.4 Service Layer Cleanup
- [ ] `aiService.ts` (~1000 lines) → Modüler yapıya ayırma
- [ ] `agentService.ts` → Tool executor'ları ayrı dosyalara
- [ ] API key management standardization

---

## Phase 2: Documentation Restructure

### 2.1 Yeni Docs Yapısı
```
docs/
├── README.md                    # Docs index
├── getting-started/
│   ├── installation.md          # Kurulum rehberi
│   ├── configuration.md         # Ayarlar
│   └── first-steps.md           # İlk adımlar
├── features/
│   ├── notes.md                 # Notes modülü kullanımı
│   ├── tasks.md                 # Tasks modülü
│   ├── habits.md                # Habits modülü
│   ├── flowbot.md               # AI Coach kullanımı
│   ├── knowledge-graph.md       # Graph kullanımı
│   ├── focus-mode.md            # Pomodoro/Focus
│   └── sync.md                  # Gist sync
├── development/
│   ├── architecture.md          # Proje mimarisi
│   ├── contributing.md          # Katkı rehberi
│   ├── code-style.md            # Kod standartları
│   └── testing.md               # Test rehberi
├── api/
│   ├── stores.md                # Zustand store API
│   ├── services.md              # Service layer API
│   └── components.md            # Component API
└── internal/                    # Eski docs (internal use)
    ├── sprints/                 # Sprint history
    ├── CHANGELOG.md
    ├── AUDIT_REPORT.md
    └── ROADMAP.md
```

### 2.2 README.md Güncelleme
- [ ] Proje açıklaması
- [ ] Feature listesi (screenshots ile)
- [ ] Quick start guide
- [ ] Tech stack badges
- [ ] License bilgisi
- [ ] Contributing link

### 2.3 CONTRIBUTING.md Oluşturma
- [ ] Development setup
- [ ] Code style guidelines
- [ ] PR process
- [ ] Issue templates

---

## Phase 3: Code Quality

### 3.1 Linting & Formatting
- [ ] ESLint kurallarını sıkılaştırma
- [ ] Prettier config standardization
- [ ] Pre-commit hooks (husky)

### 3.2 Testing Foundation
- [ ] Vitest setup
- [ ] Component test örnekleri
- [ ] Store test örnekleri
- [ ] E2E test setup (Playwright)

### 3.3 Performance Audit
- [ ] Bundle size analysis
- [ ] Lazy loading opportunities
- [ ] Memory leak check

---

## Phase 4: Open Source Preparation

### 4.1 Security Review
- [ ] API key handling review
- [ ] Environment variables documentation
- [ ] `.env.example` dosyası

### 4.2 License & Legal
- [ ] LICENSE dosyası (MIT önerisi)
- [ ] Third-party licenses check
- [ ] Attribution requirements

### 4.3 Community Setup
- [ ] Issue templates
- [ ] PR template
- [ ] Code of Conduct
- [ ] Security policy

---

## Refactor Priority Matrix

| Area | Impact | Effort | Priority |
|------|--------|--------|----------|
| TasksModule decomposition | HIGH | MEDIUM | 1 |
| Docs restructure | HIGH | LOW | 2 |
| README update | HIGH | LOW | 3 |
| aiService modularization | MEDIUM | HIGH | 4 |
| Test foundation | MEDIUM | MEDIUM | 5 |
| Store optimization | LOW | MEDIUM | 6 |

---

## Files to Create/Modify

### New Files
- `docs/README.md`
- `docs/getting-started/*.md`
- `docs/features/*.md`
- `docs/development/*.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `.env.example`
- `src/components/tasks/TaskForm.tsx`
- `src/components/tasks/TaskFilters.tsx`
- `src/components/common/EntityLinkInput.tsx`
- `src/components/common/LinkedResourcesEditor.tsx`

### Files to Move
- `docs/*.md` → `docs/internal/`
- `docs/sprints/` → `docs/internal/sprints/`

### Files to Update
- `README.md` - Complete rewrite for open source
- `CLAUDE.md` - Update with new structure
- `package.json` - Add repository, bugs, homepage fields

---

## Success Criteria

- [ ] TasksModule.tsx < 300 lines
- [ ] All docs accessible and well-organized
- [ ] README has screenshots and clear instructions
- [ ] No `any` types in critical paths
- [ ] At least 5 component tests
- [ ] Bundle size < 1MB (gzipped)
- [ ] MIT License added
- [ ] CONTRIBUTING.md complete

---

## Notes

Bu sprint birden fazla küçük PR'a bölünebilir:
1. PR #1: Docs restructure
2. PR #2: TasksModule refactor
3. PR #3: Common components extraction
4. PR #4: README & open source files
5. PR #5: Test foundation
