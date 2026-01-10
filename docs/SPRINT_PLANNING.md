# Sprint Planning: Post-MVP Audit → Sprint Roadmap Generator
**Goal:** Run the production-ready PWA, detect missing areas/bugs, and produce a sprint-by-sprint execution plan (with priorities, acceptance criteria, and risk notes).
**Duration:** 3–5 days (planning sprint)
**Priority:** HIGH
**Status:** PLANNED

---

## Why this sprint exists
MVP3 is completed and production-ready. Before we ship major post-MVP features (Global Search, Theme Toggle, Knowledge Graph, Cloud Sync), we need a **systematic audit**:
- Find bugs, UX papercuts, and edge cases users will hit immediately
- Validate keyboard-first flows end-to-end
- Confirm offline-first PWA behavior and data integrity
- Produce an actionable multi-sprint plan with clear milestones

---

## Inputs (what the audit should use)
- App runtime behavior (manual test + keyboard-first exploration)
- Console logs + network panel
- Lighthouse (PWA + performance + accessibility)
- Storage inspection (IndexedDB/localStorage size, migrations)
- Notification permissions + scheduling behavior
- Existing docs:
  - `docs/ROADMAP.md`
  - `docs/ANALYSIS.md`
  - `docs/CHANGELOG.md`

---

## Output (what this sprint must produce)
1) **Bug & UX Audit Report** (top issues grouped by module)
2) **Sprint roadmap proposal** (4–6 sprints), each with:
   - Scope, tasks, dependencies, acceptance criteria, risk notes
3) **Prioritized backlog** (P0–P4) with labels:
   - `[bug]`, `[feat]`, `[perf]`, `[ux]`, `[tech-debt]`, `[security]`, `[test]`
4) **Definition of Done** updated for post-MVP work (tests + QA gates)

---

## 0) Audit Execution Checklist

### 0.1: Setup & Baseline (0.5 day)
- [ ] Pull latest `main`, install deps, run dev and prod builds
- [ ] Verify TypeScript strict mode passes
- [ ] Run lint/format checks
- [ ] Capture current app version and commit hash for the report
- [ ] Verify PWA install works (desktop + mobile if possible)

### 0.2: “Keyboard-first” UX Walkthrough (0.5 day)
Test ONLY using keyboard:
- [ ] Module navigation (Ctrl+1-5)
- [ ] Command Palette (Ctrl+K): searchability and action coverage
- [ ] FlowBot open/close (Ctrl+/), Escape behavior
- [ ] Focus Mode (Ctrl+Shift+F) + exit recovery
- [ ] Notification Center (Ctrl+Shift+N)
- [ ] Modal stacking: Escape closes top-most only, no stuck focus
- [ ] Tab order correctness; no keyboard traps

### 0.3: Functional Smoke Tests by Module (1 day)
- Notes
  - [ ] Create/edit/delete notes, autosave correctness
  - [ ] Large note performance (10k+ chars)
- Tasks
  - [ ] Create task, edit, complete, recurring logic (if any)
  - [ ] Sorting/filtering correctness
- Habits
  - [ ] Daily check-in accuracy, streak calculations, timezone handling
- Journal
  - [ ] Daily entry create/edit, date navigation
- Pomodoro
  - [ ] Timer accuracy, pause/resume, background behavior
- FlowBot
  - [ ] Prompt safety: no UI freezes, streaming/latency tolerance
  - [ ] Session persistence rules (if any)
- Notifications
  - [ ] Permission flow, reminder scheduling, snooze/dismiss behavior
  - [ ] Offline scheduling reliability (best-effort)
- Weekly Analysis
  - [ ] Week boundaries, timezone correctness, empty-state handling

### 0.4: PWA + Offline + Data Integrity (0.5–1 day)
- [ ] App loads offline after first load
- [ ] Service worker updates don’t break state
- [ ] Data migrations (if any): old data still readable
- [ ] Storage limits: behavior when nearing quota
- [ ] “Reset data” / recovery plan documented (even if dev-only)

### 0.5: Quality Gates (0.5 day)
- Lighthouse:
  - [ ] PWA
  - [ ] Performance
  - [ ] Accessibility
  - [ ] Best Practices
- [ ] Bundle size snapshot + top offenders
- [ ] Error monitoring strategy decision (even if postponed)

## 0.6: Opportunity & Good-to-Have Discovery (MANDATORY)

Goal: Actively discover non-critical but high-leverage improvements that increase flow, delight, or long-term usability.

For each module (Notes, Tasks, Habits, Journal, Pomodoro, FlowBot, Search, PWA):
- Identify at least:
  - 1 “Nice-to-have” improvement
  - 1 “Power-user” feature
  - 1 “Future unlock” (not for now, but enabled by current architecture)

Rules:
- These are NOT bugs.
- These should NOT block release.
- Each item must state:
  - User value (why it matters)
  - Cognitive load impact (reduce / neutral / increase)
  - Implementation effort (S/M/L)

---

## 1) AI Audit Prompt (ENGLISH – copy/paste into FlowBot/Claude)
> Use this prompt to generate findings while you run the app and paste observations/logs.

**Prompt:**
You are a senior product engineer auditing a keyboard-first, ADHD-friendly PWA (React + TypeScript + Tailwind + Zustand) with a Notepad++ aesthetic.

Your job:
1) Identify missing product capabilities, UX gaps, and bugs across modules: Notes, Tasks, Habits, Journal, Pomodoro, FlowBot, Notifications, Weekly Analysis, PWA.
2) Classify each finding with:
   - Severity: P0 (crash/data loss), P1 (major), P2 (moderate), P3 (minor), P4 (nice-to-have)
   - Type: [bug]/[ux]/[perf]/[tech-debt]/[security]/[test]
   - Repro steps (clear and minimal)
   - Expected vs actual
   - Suggested fix direction (no code required)
3) Output a proposed sprint plan (4–6 sprints) that groups work logically and respects dependencies:
   - Global Search (Alt+U)
   - Theme toggle (Dark/Light)
   - Knowledge graph (wikilinks)
   - Cloud sync
4) Keep all technical text and task titles in English. Keep it concise but complete.

Constraints:
- Assume offline-first; avoid breaking local data.
- Preserve keyboard-first flows and shortcuts.
- Components should remain under ~150 lines; prefer small hooks/utils.
- Do not invent features not mentioned unless clearly justified as quality gates.

Return format:
- Findings table (grouped by module)
- Sprint plan with tasks and acceptance criteria
- Risk register (top 5 risks) + mitigations

---

## 2) Draft Findings Template (fill after audit)
> Fill this section after running the checklist.

### 2.1: Top P0/P1 Issues
- [ ] (Example) P0 [bug] Data loss when refreshing during edit…
- [ ] …
  
### 2.2: UX Papercuts (Keyboard-first)
- [ ] (Example) Command Palette doesn’t include habit actions…
- [ ] …

### 2.3: Performance / Stability
- [ ] (Example) Large notes cause input lag…
- [ ] …

### 2.4: PWA / Offline
- [ ] (Example) Service worker update breaks hydration…
- [ ] …

---

## 3) Proposed Sprint Roadmap (Post-MVP)

## 4.0: Stabilization & Quality Gates (HIGH) (5–7 days)
- [ ] Fix all P0/P1 issues found in audit
- [ ] Add minimal regression test coverage for critical flows (keyboard + storage)
- [ ] Improve error boundaries + user-friendly recovery states
- [ ] Verify notification scheduling edge cases (permission denied, revoked, OS sleep)
- [ ] Define “data model versioning” policy (for future cloud sync)
- [ ] Lighthouse targets agreed and documented

**Completion Criteria**
- [ ] Zero known P0 issues
- [ ] All P1 issues either fixed or explicitly deferred with rationale
- [ ] Lighthouse: no critical PWA failures; accessibility baseline improved
- [ ] No keyboard traps; Escape behavior consistent across modals

---

## 4.1: Global Search (Alt+U) (HIGH) (5–8 days)
Scope: Cross-module search (Notes/Tasks/Habits/Journal) with keyboard-first UX.
- [ ] Define searchable entities + fields per module
- [ ] Implement unified search index strategy (local-first)
- [ ] Command Palette integration: search results as actions
- [ ] Result ranking rules (recent, frequency, exact match)
- [ ] Highlight matches + quick navigation
- [ ] Empty-state + “no results” UX
- [ ] Performance constraints for large datasets
- [ ] Shortcut: Alt+U opens Global Search instantly

**Dependencies**
- Stabilization sprint (4.0)

**Completion Criteria**
- [ ] Alt+U works everywhere; no focus issues
- [ ] Search returns correct results across modules
- [ ] Search feels instant for typical datasets (define target)
- [ ] Works offline; no network dependency

---

## 4.2: Theme Toggle (Dark/Light) (MEDIUM) (3–5 days)
Scope: Toggle between dark/light while preserving Notepad++ vibe.
- [ ] Define light theme tokens matching current CSS variables
- [ ] Implement theme switcher UI (command palette action + settings)
- [ ] Persist preference locally
- [ ] Ensure contrast/accessibility for both themes
- [ ] Verify all components respect tokens (no hardcoded colors)
- [ ] Add “system preference” option (optional)

**Dependencies**
- Stabilization sprint (4.0)

**Completion Criteria**
- [ ] Theme toggle is instant and persistent
- [ ] No unreadable text/low contrast surfaces
- [ ] No visual regressions in key screens

---

## 4.3: Knowledge Graph (Wikilinks) (MEDIUM/HIGH) (7–12 days)
Scope: Simple wikilinks and a minimal graph view (local-first).
- [ ] Define wikilink syntax (e.g. [[Note Title]] or @tag style)
- [ ] Auto-create missing linked notes (optional, behind setting)
- [ ] Backlinks panel for the current note
- [ ] Graph view: minimal nodes/edges + search/filter
- [ ] Prevent graph from becoming a performance disaster
- [ ] Keyboard navigation for backlinks/graph

**Dependencies**
- Global Search helpful but not strictly required
- Stabilization sprint (4.0)

**Completion Criteria**
- [ ] Wikilinks create navigable connections reliably
- [ ] Backlinks are correct and update on edit
- [ ] Graph view doesn’t freeze the app on medium datasets

---

## 4.4: Cloud Sync (Phase 1) (HIGH but risky) (10–20 days)
Scope: Optional sync without harming offline-first reliability.
- [ ] Decide sync model: account-based vs anonymous, provider choice
- [ ] Define conflict resolution strategy (CRDT vs last-write-wins vs manual)
- [ ] Encrypt sensitive data at rest/in transit (define minimal security baseline)
- [ ] Implement “Sync status” UI and failure recovery
- [ ] Implement incremental sync + migrations
- [ ] Add export/import as fallback (if not already)

**Dependencies**
- Data model versioning policy from 4.0
- Security review checklist agreed

**Completion Criteria**
- [ ] Local-first remains true (app fully usable offline)
- [ ] Sync can be enabled/disabled safely
- [ ] Conflicts are handled predictably
- [ ] No data loss in simulated multi-device scenarios

---

## 4) Risk Register (keep updated)
- [ ] R1: Data loss during migrations → Mitigation: versioned schema + backups + tests
- [ ] R2: Notifications unreliable across OS/browser → Mitigation: best-effort UX + clear status
- [ ] R3: Knowledge graph performance → Mitigation: incremental index + limits + memoization
- [ ] R4: Cloud sync conflicts → Mitigation: explicit strategy + user-visible conflict UI
- [ ] R5: Keyboard UX regressions → Mitigation: shortcut + focus regression test checklist

---

## 5) Definition of Done (Post-MVP)
- [ ] Keyboard-only walkthrough passes for changed areas
- [ ] No new P0/P1 issues
- [ ] Offline load and basic functionality verified
- [ ] Storage integrity verified (no silent corruption)
- [ ] Changelog + roadmap updated
- [ ] PR includes screenshots or short capture for UX-impacting changes

---
