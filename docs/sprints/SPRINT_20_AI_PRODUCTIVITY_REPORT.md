# Sprint 20: AI-Powered Productivity Report
**Goal:** Generate comprehensive AI reports analyzing user's productivity with strengths, weaknesses, achievements, and personalized advice
**Duration:** 3-4 days
**Priority:** HIGH
**Status:** PLANNED

---

## Background
- Basic analysis exists in `AnalysisModule.tsx` with weekly stats
- `generateAIInsights()` in `analysisService.ts` provides simple AI analysis
- Need: Comprehensive report with detailed sections (strengths, weaknesses, achievements, missed items, advice)
- Integration with Focus Mode time tracking (Sprint 19)

---

## 20.1: Enhanced Data Collection

### Data Sources to Aggregate
```typescript
interface ProductivityData {
  // Tasks
  tasks: {
    completed: Task[]
    pending: Task[]
    overdue: Task[]
    byPriority: Record<string, { completed: number; total: number }>
    avgCompletionTime: number // hours from creation to completion
    peakProductivityHours: number[] // 0-23
  }
  
  // Habits
  habits: {
    completionRate: number
    streaks: { name: string; current: number; best: number }[]
    mostConsistent: string[]
    leastConsistent: string[]
    dailyPattern: number[] // completion by day of week
  }
  
  // Focus Sessions (from Sprint 19)
  focus: {
    totalTime: number // minutes
    sessions: number
    avgSessionLength: number
    mostFocusedTasks: { taskId: string; title: string; time: number }[]
    focusByDayOfWeek: number[] // minutes per day
    focusByHour: number[] // peak focus hours
  }
  
  // Notes
  notes: {
    created: number
    totalWords: number
    topTags: string[]
    linkedNotes: number // notes with backlinks
  }
  
  // Journal
  journal: {
    entries: number
    avgMood: number
    avgEnergy: number
    moodTrend: 'improving' | 'declining' | 'stable'
    energyTrend: 'improving' | 'declining' | 'stable'
    commonThemes: string[] // extracted from journal content
  }
}
```

### Tasks:
- [ ] Create `collectProductivityData()` function
- [ ] Aggregate data from all stores
- [ ] Calculate derived metrics (trends, patterns, averages)
- [ ] Support daily and weekly time ranges

---

## 20.2: AI Report Generation

### Report Structure
```typescript
interface ProductivityReport {
  period: 'daily' | 'weekly'
  dateRange: { start: string; end: string }
  generatedAt: Date
  
  // Sections
  summary: string // 2-3 sentence overview
  
  strengths: {
    title: string
    description: string
    evidence: string // specific data point
  }[]
  
  weaknesses: {
    title: string
    description: string
    suggestion: string // actionable advice
  }[]
  
  achievements: {
    title: string
    description: string
    impact: string // why it matters
  }[]
  
  missed: {
    title: string
    description: string
    recovery: string // how to catch up
  }[]
  
  advice: {
    category: 'focus' | 'habits' | 'tasks' | 'wellbeing' | 'general'
    title: string
    description: string
    actionItems: string[]
  }[]
  
  // Metrics
  productivityScore: number // 0-100
  comparisonToPrevious: number // percentage change
  
  // ADHD-specific
  adhdInsights: {
    hyperfocusDetected: boolean
    energyPatterns: string
    consistencyScore: number
    dopamineManagement: string
  }
}
```

### AI Prompt Template
```
Sen bir ADHD-uzmanı productivity koçusun. Kullanıcının {period} verilerini analiz et ve detaylı bir rapor oluştur.

## Veriler
{productivityData}

## Rapor Formatı
1. **Özet**: 2-3 cümle genel değerlendirme
2. **Güçlü Yönler**: En az 2-3 madde, somut verilerle destekle
3. **Gelişim Alanları**: En az 2-3 madde, çözüm önerileriyle
4. **Başarılar**: Bu dönemde elde edilen somut başarılar
5. **Kaçırılanlar**: Tamamlanamayan önemli görevler, telafi önerileri
6. **Tavsiyeler**: ADHD-friendly, küçük adımlı, pratik öneriler

## Kurallar
- Pozitif ve motive edici ol, ama gerçekçi
- ADHD perspektifinden değerlendir (hyperfocus, enerji dalgalanmaları, tutarsızlık)
- Somut, ölçülebilir öneriler ver
- Küçük kazanımları kutla
- Başarısızlıkları yargılama, çözüm odaklı ol
```

### Tasks:
- [ ] Create `generateProductivityReport()` function
- [ ] Build comprehensive AI prompt
- [ ] Parse AI response into structured report
- [ ] Handle API errors gracefully

---

## 20.3: Report UI Components

### Report View Layout
```
╭─────────────────────────────────────────────────────╮
│  📊 PRODUCTIVITY REPORT                             │
│  January 6-12, 2026 (Weekly)                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  PRODUCTIVITY SCORE: 78/100  ████████░░ (+5%)       │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  📝 SUMMARY                                         │
│  "Bu hafta task tamamlama oranın %15 arttı.         │
│   Focus session'ların düzenli ama kısa. Habit      │
│   streak'lerin güçlü devam ediyor."                 │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  💪 STRENGTHS                    ⚠️ WEAKNESSES      │
│  ┌─────────────────────┐        ┌─────────────────┐ │
│  │ ✓ P1 Task Focus     │        │ ! Short Focus   │ │
│  │   %100 P1 complete  │        │   Avg 18 min    │ │
│  │                     │        │   → Try 25 min  │ │
│  │ ✓ Habit Streaks     │        │                 │ │
│  │   3 habits 7+ days  │        │ ! Evening Dip   │ │
│  └─────────────────────┘        └─────────────────┘ │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  🏆 ACHIEVEMENTS                 ❌ MISSED          │
│  • 50 tasks milestone           • Project deadline │
│  • 7-day meditation streak      • 2 P1 tasks       │
│  • 10 hours focus time                             │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  💡 PERSONALIZED ADVICE                             │
│  ┌─────────────────────────────────────────────────┐│
│  │ 1. Focus sessions'ı 25 dakikaya çıkar           ││
│  │ 2. Akşam 8'den sonra hafif task'lar planla      ││
│  │ 3. Sabah rutinine 1 habit daha ekle             ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  🧠 ADHD INSIGHTS                                   │
│  "Çarşamba günü hyperfocus tespit edildi (4 saat   │
│   kesintisiz). Perşembe enerji düşüşü normal."     │
│                                                     │
╰─────────────────────────────────────────────────────╯
```

### Components:
- [ ] `ProductivityReport.tsx` - Main report container
- [ ] `ReportSummary.tsx` - Score and overview
- [ ] `StrengthsWeaknesses.tsx` - Side-by-side comparison
- [ ] `AchievementsMissed.tsx` - What was done vs missed
- [ ] `PersonalizedAdvice.tsx` - Actionable recommendations
- [ ] `ADHDInsights.tsx` - ADHD-specific analysis

---

## 20.4: Report Generation Flow

### User Flow
1. User goes to Analysis module
2. Selects "Daily Report" or "Weekly Report"
3. Clicks "Generate AI Report"
4. Loading state with progress indicator
5. Report displays with all sections
6. Option to export/save report

### Tasks:
- [ ] Add report type selector (Daily/Weekly)
- [ ] Add "Generate Report" button
- [ ] Implement loading state with messages
- [ ] Display generated report
- [ ] Add export functionality (Markdown/PDF)

---

## 20.5: Report History

### Store Reports
```typescript
interface ReportHistory {
  reports: {
    id: string
    period: 'daily' | 'weekly'
    dateRange: { start: string; end: string }
    generatedAt: Date
    report: ProductivityReport
  }[]
}
```

### Tasks:
- [ ] Create `reportStore.ts` for storing reports
- [ ] Save generated reports automatically
- [ ] Show report history list
- [ ] Allow viewing past reports
- [ ] Compare reports over time

---

## 20.6: Scheduled Reports (Optional)

### Auto-generate Reports
- Daily report: Generated at end of day (configurable time)
- Weekly report: Generated on Sunday evening
- Notification when report is ready

### Tasks:
- [ ] Add report schedule settings
- [ ] Implement background report generation
- [ ] Show notification for new reports

---

## 20.7: Integration Points

### From Other Stores
```typescript
// taskStore
- tasks, completed tasks, overdue tasks
- completion timestamps

// habitStore  
- habits, completions, streaks

// focusStore (Sprint 19)
- focus sessions, duration per task

// noteStore
- notes created, tags, word count

// journalStore
- entries, mood, energy

// gamificationStore (Sprint 18)
- XP earned, level, achievements unlocked
```

### Tasks:
- [ ] Import data from all relevant stores
- [ ] Calculate cross-store metrics
- [ ] Correlate mood/energy with productivity

---

## 20.8: i18n Support

### New Translation Keys
```json
{
  "report": {
    "title": "Productivity Report",
    "daily": "Daily Report",
    "weekly": "Weekly Report",
    "generate": "Generate AI Report",
    "generating": "Analyzing your data...",
    "score": "Productivity Score",
    "summary": "Summary",
    "strengths": "Strengths",
    "weaknesses": "Areas for Improvement",
    "achievements": "Achievements",
    "missed": "Missed Items",
    "advice": "Personalized Advice",
    "adhdInsights": "ADHD Insights",
    "export": "Export Report",
    "history": "Report History",
    "comparedToPrevious": "compared to previous",
    "noData": "Not enough data to generate report"
  }
}
```

### Tasks:
- [ ] Add report keys to en.json
- [ ] Add report keys to tr.json
- [ ] Update all components with translations

---

## File Structure

```
src/
├── stores/
│   └── reportStore.ts              # NEW
├── services/
│   └── analysisService.ts          # ENHANCED
├── components/
│   └── analysis/
│       ├── AnalysisModule.tsx      # ENHANCED
│       ├── ProductivityReport.tsx  # NEW
│       ├── ReportSummary.tsx       # NEW
│       ├── StrengthsWeaknesses.tsx # NEW
│       ├── AchievementsMissed.tsx  # NEW
│       ├── PersonalizedAdvice.tsx  # NEW
│       ├── ADHDInsights.tsx        # NEW
│       └── ReportHistory.tsx       # NEW
```

---

## Acceptance Criteria

1. ✅ Daily and weekly report options available
2. ✅ AI generates comprehensive report with all sections
3. ✅ Strengths identified with supporting data
4. ✅ Weaknesses shown with actionable suggestions
5. ✅ Achievements celebrated with context
6. ✅ Missed items listed with recovery plans
7. ✅ Personalized advice is ADHD-friendly
8. ✅ ADHD-specific insights included
9. ✅ Productivity score calculated
10. ✅ Reports can be exported
11. ✅ Report history is saved
12. ✅ All strings translated (en/tr)

---

## Report Quality Guidelines

### Strengths Section
- Must cite specific data (e.g., "100% P1 task completion")
- Focus on patterns, not one-off events
- Highlight consistency and improvement

### Weaknesses Section
- Never judgmental or negative tone
- Always paired with actionable suggestion
- Frame as "opportunities" not "failures"

### Achievements Section
- Include both big and small wins
- Connect to user's goals
- Celebrate streaks and milestones

### Missed Section
- Focus on important items only
- Provide realistic recovery plan
- Don't overwhelm with long lists

### Advice Section
- Maximum 5 recommendations
- Each must be specific and actionable
- ADHD-friendly: small steps, clear actions
- Prioritized by impact

### ADHD Insights
- Detect hyperfocus patterns
- Identify energy fluctuations
- Note consistency challenges
- Suggest dopamine management strategies

---

## Example AI Prompt (Full)

```
Sen bir ADHD-uzmanı productivity koçusun. Aşağıdaki verileri analiz et.

## Dönem: 6-12 Ocak 2026 (Haftalık)

## Task Verileri
- Toplam: 24 task
- Tamamlanan: 18 (%75)
- P1: 5/5 (%100) ✓
- P2: 8/10 (%80)
- P3: 5/9 (%56)
- Geciken: 3 task
- En verimli saat: 10:00-12:00

## Habit Verileri
- 5 habit takip ediliyor
- Ortalama tamamlama: %68
- En tutarlı: "Meditation" (7/7 gün)
- En az tutarlı: "Exercise" (2/7 gün)
- Aktif streak'ler: Meditation 14 gün, Reading 7 gün

## Focus Verileri
- Toplam: 8 saat 45 dakika
- 21 session
- Ortalama session: 25 dakika
- En çok odaklanılan: "Project Proposal" (3 saat)

## Journal Verileri
- 5/7 gün yazıldı
- Ortalama mood: 3.8/5
- Ortalama enerji: 3.2/5
- Trend: Mood stabil, enerji hafif düşüşte

## Rapor Oluştur (JSON formatında)
{
  "summary": "2-3 cümle özet",
  "productivityScore": 0-100,
  "strengths": [
    {"title": "...", "description": "...", "evidence": "..."}
  ],
  "weaknesses": [
    {"title": "...", "description": "...", "suggestion": "..."}
  ],
  "achievements": [
    {"title": "...", "description": "...", "impact": "..."}
  ],
  "missed": [
    {"title": "...", "description": "...", "recovery": "..."}
  ],
  "advice": [
    {"category": "...", "title": "...", "description": "...", "actionItems": ["..."]}
  ],
  "adhdInsights": {
    "hyperfocusDetected": true/false,
    "energyPatterns": "...",
    "consistencyScore": 0-100,
    "dopamineManagement": "..."
  }
}
```

---

## Sprint Dependencies

- **Sprint 18** (Gamification): XP and achievement data
- **Sprint 19** (Focus Mode): Focus session data and time tracking

---

*Sprint 20 - AI-Powered Productivity Report*
*Estimated: 3-4 days*
*Depends on: Sprint 18, Sprint 19*
