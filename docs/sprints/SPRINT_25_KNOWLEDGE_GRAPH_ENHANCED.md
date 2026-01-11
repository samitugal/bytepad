# Sprint 25: Enhanced Knowledge Graph
**Goal:** Move Knowledge Graph to sidebar, link all entities (notes, tasks, habits, tags)
**Duration:** 5-7 days
**Priority:** MEDIUM
**Status:** PLANNED

---

## Background

### Current State
- Knowledge Graph exists only in Notes module
- Shows only note-to-note connections via [[wikilinks]]
- Not accessible from other modules
- Limited to notes, doesn't include tasks/habits/tags

### Vision
A unified Knowledge Graph that shows relationships between:
- Notes ↔ Notes (via wikilinks)
- Notes ↔ Tasks (via tags or explicit links)
- Notes ↔ Habits (via tags)
- Tags as connection hubs
- All entities visible and navigable

---

## 25.1: Move Knowledge Graph to Sidebar

### Current Location
- Inside NotesModule as a modal/panel
- Only accessible when in Notes

### New Location
- New module in sidebar (below Calendar)
- Icon: 🕸️ or graph icon
- Full-screen dedicated view

### Sidebar Update
```typescript
const modules = [
  { id: 'notes', icon: '📝', label: 'Notes' },
  { id: 'dailynotes', icon: '📅', label: 'Daily Notes' },
  { id: 'habits', icon: '✓', label: 'Habits' },
  { id: 'tasks', icon: '☐', label: 'Tasks' },
  { id: 'journal', icon: '📔', label: 'Journal' },
  { id: 'bookmarks', icon: '🔖', label: 'Bookmarks' },
  { id: 'calendar', icon: '📆', label: 'Calendar' },
  { id: 'graph', icon: '🕸️', label: 'Graph' },  // NEW
  { id: 'analysis', icon: '📊', label: 'Analysis' },
]
```

### Tasks:
- [ ] Add 'graph' to ModuleType in types/index.ts
- [ ] Update Sidebar.tsx with new module
- [ ] Create GraphModule.tsx component
- [ ] Move KnowledgeGraph from notes to graph module
- [ ] Update keyboard shortcut (Ctrl+9 for Graph)

---

## 25.2: Unified Entity Model

### Entity Types
```typescript
type EntityType = 'note' | 'task' | 'habit' | 'journal' | 'bookmark' | 'tag'

interface GraphNode {
  id: string
  type: EntityType
  label: string
  tags: string[]
  createdAt: string
  metadata: Record<string, unknown>
}

interface GraphEdge {
  source: string
  target: string
  type: 'wikilink' | 'tag' | 'reference' | 'subtask'
  label?: string
}
```

### Tasks:
- [ ] Create GraphNode and GraphEdge types
- [ ] Create function to collect all entities
- [ ] Create function to compute all edges

---

## 25.3: Connection Types

### 1. Wikilink Connections (Note ↔ Note)
```
Note A contains [[Note B]] → Edge: A → B (type: wikilink)
```

### 2. Tag Connections (Any ↔ Tag ↔ Any)
```
Note has tag "project" → Edge: Note → Tag:project
Task has tag "project" → Edge: Task → Tag:project
Result: Note and Task connected via Tag:project
```

### 3. Reference Connections (Note ↔ Task)
```
Note mentions "Task: Buy groceries" → Edge: Note → Task (type: reference)
```

### 4. Date Connections (Optional)
```
Journal entry on 2024-01-15
Task due on 2024-01-15
→ Connected by date
```

### Tasks:
- [ ] Implement wikilink detection
- [ ] Implement tag-based connections
- [ ] Implement reference detection (optional)
- [ ] Color-code edges by type

---

## 25.4: Graph Visualization

### Library
Use **vis.js** or **react-force-graph** for visualization

### Node Styling
```typescript
const nodeColors = {
  note: '#569CD6',    // Blue
  task: '#6A9955',    // Green
  habit: '#CE9178',   // Orange
  journal: '#C586C0', // Purple
  bookmark: '#4EC9B0',// Cyan
  tag: '#DCDCAA',     // Yellow
}

const nodeShapes = {
  note: 'dot',
  task: 'square',
  habit: 'diamond',
  journal: 'triangle',
  bookmark: 'star',
  tag: 'hexagon',
}
```

### Features:
- [ ] Zoom and pan
- [ ] Click node to open entity
- [ ] Hover to show preview
- [ ] Filter by entity type
- [ ] Search/highlight specific nodes
- [ ] Cluster by tag

### Tasks:
- [ ] Install visualization library
- [ ] Create GraphVisualization component
- [ ] Implement node click handlers
- [ ] Add filter controls
- [ ] Add search functionality

---

## 25.5: Graph Controls Panel

### Filter Options
```
☑ Notes (45)
☑ Tasks (23)
☐ Habits (8)
☐ Journal (12)
☑ Tags (15)
```

### View Options
```
Layout: [Force] [Hierarchical] [Circular]
Show labels: ☑
Show orphans: ☐
Cluster by: [None] [Type] [Tag]
```

### Search
```
[🔍 Search nodes...]
```

### Tasks:
- [ ] Create GraphControls component
- [ ] Implement filter logic
- [ ] Implement layout switching
- [ ] Implement search with highlight

---

## 25.6: Entity Linking UI

### Quick Link from Any Entity
When editing a note/task/habit, ability to:
1. Type `[[` to search and link notes
2. Type `#` to add/create tags
3. Type `@task:` to reference a task

### Link Preview
When hovering over a link, show preview card with:
- Entity type icon
- Title
- Preview content
- Tags
- Quick actions (Open, Edit)

### Tasks:
- [ ] Add link autocomplete to editors
- [ ] Create LinkPreview component
- [ ] Implement hover detection

---

## File Changes

### New Files
```
src/components/graph/GraphModule.tsx
src/components/graph/GraphVisualization.tsx
src/components/graph/GraphControls.tsx
src/components/graph/GraphNode.tsx
src/components/common/LinkPreview.tsx
src/utils/graphUtils.ts
```

### Modified Files
```
src/types/index.ts           - Add 'graph' to ModuleType
src/components/layout/Sidebar.tsx
src/components/layout/MainContent.tsx
src/hooks/useKeyboardShortcuts.ts
```

---

## Dependencies

### New Package
```bash
npm install react-force-graph
# or
npm install vis-network
```

---

## Acceptance Criteria

- [ ] Knowledge Graph accessible from sidebar
- [ ] Shows notes, tasks, habits, tags as nodes
- [ ] Tag connections visible
- [ ] Wikilink connections visible
- [ ] Can filter by entity type
- [ ] Can search nodes
- [ ] Click node opens entity
- [ ] Responsive and performant with 100+ nodes

---

## Performance Considerations

- Lazy load graph data
- Limit visible nodes (pagination or clustering)
- Use Web Workers for layout calculation
- Debounce filter/search operations

---

*Sprint 25 - Enhanced Knowledge Graph*
*Estimated: 5-7 days*
*Priority: MEDIUM*
