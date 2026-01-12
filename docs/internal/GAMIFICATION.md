# MyFlowSpace - Gamification System

## Felsefe: Oldschool & Authentic Progress

Abartılı animasyonlar, parlak rozetler veya "AMAZING!" popup'ları yok. Bunun yerine:
- **Sessiz tatmin**: İşi bitirmenin huzuru
- **Gerçek ilerleme**: Sayılarla görünen somut gelişim
- **Terminal estetiği**: ASCII art, monospace font, minimal UI
- **ADHD-friendly**: Dopamin spike'ları yerine sürdürülebilir motivasyon

---

## 1. XP (Experience Points) Sistemi

### XP Kazanma Yolları

| Aksiyon | XP | Açıklama |
|---------|-----|----------|
| Task tamamla | +10 | Temel XP |
| P1 Task tamamla | +25 | Yüksek öncelik bonusu |
| Habit tamamla | +5 | Günlük alışkanlık |
| 7 gün streak | +50 | Haftalık streak bonusu |
| 30 gün streak | +200 | Aylık streak bonusu |
| Journal yaz | +10 | Günlük yazma |
| Pomodoro tamamla | +15 | 25 dakika odaklanma |
| Note oluştur | +3 | Bilgi biriktirme |

### XP Çarpanları

```
Streak Multiplier:
  1-6 gün:   1.0x
  7-13 gün:  1.2x
  14-29 gün: 1.5x
  30+ gün:   2.0x

Combo Bonus (aynı gün içinde):
  3+ task:   +10 XP
  5+ task:   +25 XP
  All habits: +20 XP
```

---

## 2. Level Sistemi

### Level Progression

```
Level 1:    0 XP      [Novice]
Level 2:    100 XP    [Apprentice]
Level 3:    250 XP    [Journeyman]
Level 4:    500 XP    [Adept]
Level 5:    1000 XP   [Expert]
Level 6:    2000 XP   [Master]
Level 7:    4000 XP   [Grandmaster]
Level 8:    8000 XP   [Legend]
Level 9:    16000 XP  [Mythic]
Level 10:   32000 XP  [Transcendent]
```

### Level-Up Gösterimi (Oldschool Style)

```
╔════════════════════════════════════╗
║                                    ║
║     LEVEL UP!                      ║
║                                    ║
║     ██████████ Level 5             ║
║     >> Expert <<                   ║
║                                    ║
║     Total XP: 1,247                ║
║     Next: 753 XP to Level 6        ║
║                                    ║
╚════════════════════════════════════╝
```

---

## 3. Achievement Sistemi

### Achievement Kategorileri

#### 🎯 Task Achievements

| ID | İsim | Koşul | ASCII Badge |
|----|------|-------|-------------|
| T01 | First Blood | İlk task'ı tamamla | `[✓]` |
| T02 | Productive Day | Bir günde 5 task | `[✓✓✓]` |
| T03 | Task Slayer | 100 task tamamla | `[SLAYER]` |
| T04 | Priority Master | 10 P1 task tamamla | `[P1!]` |
| T05 | Centurion | 100 task tamamla | `[C]` |
| T06 | Task Machine | 500 task tamamla | `[===]` |

#### 🔥 Streak Achievements

| ID | İsim | Koşul | ASCII Badge |
|----|------|-------|-------------|
| S01 | Week Warrior | 7 gün streak | `[7d]` |
| S02 | Fortnight | 14 gün streak | `[14d]` |
| S03 | Monthly Master | 30 gün streak | `[30d]` |
| S04 | Quarter King | 90 gün streak | `[90d]` |
| S05 | Yearly Legend | 365 gün streak | `[365]` |

#### 📝 Notes Achievements

| ID | İsim | Koşul | ASCII Badge |
|----|------|-------|-------------|
| N01 | First Note | İlk not | `[n]` |
| N02 | Notebook | 10 not | `[nb]` |
| N03 | Library | 50 not | `[lib]` |
| N04 | Archive | 100 not | `[arc]` |
| N05 | Knowledge Base | 500 not | `[KB]` |

#### ⏱️ Focus Achievements

| ID | İsim | Koşul | ASCII Badge |
|----|------|-------|-------------|
| F01 | First Focus | İlk pomodoro | `[25m]` |
| F02 | Hour Power | 1 saat toplam | `[1h]` |
| F03 | Deep Work | 4 saat bir günde | `[4h]` |
| F04 | Focus Master | 100 saat toplam | `[100h]` |

#### 📊 Journal Achievements

| ID | İsim | Koşul | ASCII Badge |
|----|------|-------|-------------|
| J01 | Dear Diary | İlk journal | `[j]` |
| J02 | Reflector | 7 gün üst üste | `[ref]` |
| J03 | Chronicler | 30 gün journal | `[chr]` |
| J04 | Historian | 100 journal | `[hist]` |

#### 🏆 Special Achievements

| ID | İsim | Koşul | ASCII Badge |
|----|------|-------|-------------|
| X01 | Early Bird | Sabah 6'dan önce task | `[🌅]` |
| X02 | Night Owl | Gece 12'den sonra task | `[🦉]` |
| X03 | Weekend Warrior | Hafta sonu 10 task | `[WW]` |
| X04 | Perfect Week | Tüm habit'ler 7 gün | `[***]` |
| X05 | Comeback | 7 gün ara sonrası streak | `[>>]` |

---

## 4. Progress Bar & Stats

### StatusBar'da Gösterim

```
[Lv.5 Expert] ████████░░ 1247/2000 XP | 🔥14 | ✓847 tasks
```

### Detaylı Stats Panel

```
╭─────────────────────────────────────╮
│  STATS                              │
├─────────────────────────────────────┤
│  Level:     5 (Expert)              │
│  XP:        1,247 / 2,000           │
│  Progress:  ████████░░ 62%          │
│                                     │
│  Total Tasks:     847               │
│  Total Habits:    2,341             │
│  Total Pomodoros: 156               │
│  Total Notes:     89                │
│                                     │
│  Current Streak:  14 days           │
│  Best Streak:     47 days           │
│                                     │
│  Achievements:    23/45             │
╰─────────────────────────────────────╯
```

---

## 5. Daily/Weekly Challenges

### Daily Challenges (Opsiyonel)

```
TODAY'S CHALLENGE:
┌─────────────────────────────────────┐
│ Complete 3 tasks before noon        │
│ Reward: +30 XP                      │
│ Progress: ██░░░ 2/3                 │
└─────────────────────────────────────┘
```

### Weekly Challenges

```
WEEKLY CHALLENGE:
┌─────────────────────────────────────┐
│ Maintain all habits for 5 days      │
│ Reward: +100 XP + [Consistent] badge│
│ Progress: ████░░░ 4/5 days          │
└─────────────────────────────────────┘
```

---

## 6. Leaderboard (Kendi Kendinle Yarış)

### Personal Records

```
YOUR RECORDS
─────────────────────────────────────
Best Day:        12 tasks (2026-01-05)
Best Week:       47 tasks (Week 2)
Best Month:      156 tasks (January)
Longest Streak:  47 days
Most Pomodoros:  8 in one day
─────────────────────────────────────
```

### Monthly Progress Graph (ASCII)

```
January 2026 - Tasks Completed
─────────────────────────────────────
Week 1: ████████████████ 16
Week 2: ██████████████████████████ 26
Week 3: ████████████████████ 20
Week 4: ████████████ 12
─────────────────────────────────────
Total: 74 tasks | Avg: 2.6/day
```

---

## 7. UI/UX Tasarım Prensipleri

### Renk Paleti (Notepad++ Theme)

```css
--xp-bar-fill: #80FF80;      /* Yeşil - ilerleme */
--xp-bar-bg: #2D2D2D;        /* Koyu gri - arka plan */
--level-text: #569CD6;       /* Mavi - level */
--achievement-new: #FFD700;  /* Altın - yeni achievement */
--streak-fire: #FF6B35;      /* Turuncu - streak */
```

### Animasyonlar

- **XP kazanma**: Sayı yukarı kayarak artar (300ms)
- **Level up**: Basit fade-in box (500ms)
- **Achievement**: Sağ alt köşede 3 saniye notification
- **Streak**: Sadece sayı değişimi, animasyon yok

### Ses Efektleri (Opsiyonel)

```
XP gain:      Subtle "ding" (8-bit style)
Level up:     Short fanfare (retro)
Achievement:  Coin collect sound
Streak lost:  Soft "womp" (optional, can disable)
```

---

## 8. Data Model

### TypeScript Interfaces

```typescript
interface UserStats {
  level: number
  currentXP: number
  totalXP: number
  
  tasksCompleted: number
  habitsCompleted: number
  pomodorosCompleted: number
  notesCreated: number
  journalEntries: number
  
  currentStreak: number
  bestStreak: number
  
  achievements: string[] // Achievement IDs
  
  dailyChallengeProgress?: DailyChallenge
  weeklyChallengeProgress?: WeeklyChallenge
}

interface Achievement {
  id: string
  name: string
  description: string
  condition: () => boolean
  xpReward: number
  badge: string // ASCII badge
  unlockedAt?: Date
}

interface DailyChallenge {
  id: string
  description: string
  target: number
  current: number
  xpReward: number
  expiresAt: Date
}
```

---

## 9. Implementation Öncelikleri

### Phase 1: Core (MVP)
- [ ] XP sistemi ve level progression
- [ ] StatusBar'da XP/Level gösterimi
- [ ] Temel achievements (10 tane)
- [ ] Stats panel

### Phase 2: Enhancement
- [ ] Tüm achievements
- [ ] Daily challenges
- [ ] Personal records
- [ ] ASCII progress graphs

### Phase 3: Polish
- [ ] Weekly challenges
- [ ] Sound effects (optional)
- [ ] Achievement notifications
- [ ] Export stats

---

## 10. ADHD-Specific Considerations

### Dopamine Management
- Küçük, sık ödüller yerine **anlamlı milestone'lar**
- "Streak kaybettin" yerine **"Yeni başlangıç"** mesajı
- Karşılaştırma yok, sadece **kendi ilerlemenle yarış**

### Overwhelm Prevention
- Gamification **tamamen opsiyonel**
- Tek tuşla **tüm sistemi gizle**
- Notification'lar **minimal ve sessiz**

### Motivation Patterns
- Sabah: Günün challenge'ını göster
- Akşam: Günün özeti (sadece pozitif)
- Hafta sonu: Haftalık recap

---

*Bu doküman MyFlowSpace gamification sisteminin teknik ve tasarım spesifikasyonudur.*
*Son güncelleme: 2026-01-10*
