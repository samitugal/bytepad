# Sprint 12: Stabilization & Polish
**Goal:** Fix bundle size, add missing Command Palette actions, improve Calendar UX
**Duration:** 3-5 days
**Priority:** HIGH
**Status:** IN PROGRESS

---

## 12.1: Bundle Size Optimization (1 day)
- [ ] Analyze bundle with rollup-plugin-visualizer
- [ ] Lazy load Firebase (only when needed)
- [ ] Lazy load AI SDK (defer until FlowBot opened)
- [ ] Dynamic imports for heavy modules (Calendar, Analyze)
- [ ] Target: <500KB (currently 686KB)

## 12.2: Command Palette Actions (0.5 day)
- [ ] Add habit toggle action
- [ ] Add bookmark creation action
- [ ] Add daily note creation action
- [ ] Add calendar navigation actions
- [ ] Improve action discoverability

## 12.3: Calendar Task Spans (0.5 day)
- [ ] Show tasks with startDate-endDate as visual spans
- [ ] Multi-day task rendering in week/month view
- [ ] Proper positioning and overflow handling

## 12.4: Offline Indicator (0.5 day)
- [ ] Add offline status to status bar
- [ ] Show sync status when online
- [ ] Visual feedback for pending changes

## 12.5: Error Boundaries (0.5 day)
- [ ] Add error boundaries to each module
- [ ] User-friendly error messages
- [ ] Recovery actions (reload, clear cache)

---

## Completion Criteria
- [ ] Bundle size <500KB
- [ ] All Command Palette actions working
- [ ] Calendar shows multi-day tasks correctly
- [ ] Offline indicator visible in status bar
- [ ] No unhandled errors crash the app

