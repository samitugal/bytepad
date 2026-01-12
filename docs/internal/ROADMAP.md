# MyFlowSpace - Project Roadmap

## Genel Bakış

| MVP | Odak | Süre | Durum |
|-----|------|------|-------|
| MVP1 | Core Foundation + Notes | 2 hafta | ✅ Tamamlandı |
| MVP2 | Productivity Modules | 3 hafta | ✅ Tamamlandı |
| MVP3 | AI & Smart Features | 2 hafta | ✅ Tamamlandı |

---

## Sprint Dosyaları

Tüm sprint detayları ayrı dosyalarda bulunmaktadır:

| Sprint | Dosya | Durum |
|--------|-------|-------|
| MVP1: Core Foundation | [SPRINT_01_MVP1_CORE.md](./sprints/SPRINT_01_MVP1_CORE.md) | ✅ Tamamlandı |
| MVP2: Productivity | [SPRINT_02_MVP2_PRODUCTIVITY.md](./sprints/SPRINT_02_MVP2_PRODUCTIVITY.md) | ✅ Tamamlandı |
| MVP3: AI Features | [SPRINT_03_MVP3_AI.md](./sprints/SPRINT_03_MVP3_AI.md) | ✅ Tamamlandı |
| Sprint 7: Calendar | [SPRINT_07_CALENDAR.md](./sprints/SPRINT_07_CALENDAR.md) | ✅ Tamamlandı |
| Sprint 8: FlowBot Agent | [SPRINT_08_FLOWBOT_AGENT.md](./sprints/SPRINT_08_FLOWBOT_AGENT.md) | ✅ Tamamlandı |
| Sprint 9: Settings & i18n | [SPRINT_09_SETTINGS_I18N.md](./sprints/SPRINT_09_SETTINGS_I18N.md) | ✅ Tamamlandı |
| Sprint 10: Agent Framework | [SPRINT_10_AGENT_FRAMEWORK.md](./sprints/SPRINT_10_AGENT_FRAMEWORK.md) | 📋 Planlandı |
| Sprint 11: Daily Notes | [SPRINT_11_DAILY_NOTES.md](./sprints/SPRINT_11_DAILY_NOTES.md) | 📋 Planlandı |

---

## Aktif Sprint Özeti

### Sprint 10: Agent Framework Migration
**Goal:** Vercel AI SDK'ya geçiş
**Duration:** 3-4 gün
**Priority:** HIGH

- [ ] Vercel AI SDK kurulumu
- [ ] Tool definitions with Zod schemas
- [ ] Streaming responses
- [ ] Provider abstraction

### Sprint 11: Daily Notes
**Goal:** Grid layout günlük notlar (Notion/Obsidian style)
**Duration:** 2-3 gün
**Priority:** MEDIUM

- [ ] Data model & Zustand store
- [ ] Daily Notes tab UI (^8)
- [ ] Card CRUD operations
- [ ] Filtering & search

---

## Post-MVP: Tamamlanan Özellikler

### Öncelikli Eklemeler ✓
- [x] **Habits: Daily Reminder & Saat Desteği**
- [x] **Tasks: DateTime Desteği**
- [x] **Global Search (Alt+U)**
- [x] **Notes Markdown Preview Fix**
- [x] **DateTime Picker Tema Uyumu**
- [x] **Habits Günlük Reset & Raporlama**
- [x] **Notes Tag-Based Search**
- [x] **Knowledge Graph (Obsidian-style)**

### UI/UX İyileştirmeleri ✓
- [x] **Resizable Sidebar**
- [x] **Font Size Settings**
- [x] **Cross-Tab Synchronization**
- [x] **Dark/Light Theme Toggle**

### Tamamlanan Modüller ✓
- [x] **Bookmarks Module** (Raindrop.io benzeri)
- [x] **Google Authentication** (Firebase)
- [x] **Firebase Firestore Cloud Sync**
- [x] **GitHub Gist Sync**

### AI & Automation ✓
- [x] **Smart Task Scheduling**
- [x] **Auto-Tagging**
- [x] **Predictive Analytics**

---

## Gelecek Özellikler (Backlog)

### Productivity Features
- [ ] Time Blocking
- [ ] Templates & Recurring
- [ ] Quick Capture Widget
- [ ] Focus Sessions Analytics

### Data & Visualization
- [ ] Advanced Analytics Dashboard
- [ ] Habit Heatmap
- [ ] Mind Map View
- [ ] Export & Reports (PDF)

### Integration & Extensions
- [ ] Browser Extension
- [ ] API & Webhooks
- [ ] Third-Party Integrations

### Mobile & Cross-Platform
- [ ] PWA Enhancements
- [ ] React Native App
- [ ] Desktop App (Electron/Tauri)

### Social & Gamification
- [ ] Achievement System
- [ ] Accountability Partners
- [ ] Daily Challenges

### ADHD-Specific Features
- [ ] Body Doubling Mode
- [ ] Dopamine Menu
- [ ] Overwhelm Mode
- [ ] Transition Helpers

### Security & Privacy
- [ ] End-to-End Encryption
- [ ] Data Portability

---

## İlerleme Takibi

### Nasıl Kullanılır
1. Her sprint başında ilgili task'ları GitHub Issues'a aç
2. Task tamamlandığında checkbox'ı işaretle `[x]`
3. Sprint bitiminde commit at ve bu dosyayı güncelle
4. MVP tamamlandığında CHANGELOG.md'ye ekle

### Durum Sembolleri
- [ ] Yapılmadı
- [x] Tamamlandı
- 🔄 Devam ediyor
- 📋 Planlandı
- ❌ İptal edildi

---

*Son güncelleme: 2026-01-10 (Sprint dosyaları ayrıldı)*
