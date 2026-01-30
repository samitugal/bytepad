# Sprint 37: MCP Server Integration & Docker Bridge
**Goal:** Enable MCP (Model Context Protocol) server support for bytepad, allowing Docker containers and external AI tools to interact with local data
**Duration:** 5-7 days
**Priority:** HIGH
**Status:** PLANNED

---

## Background

### Current State
- Purely client-side React + Electron application
- All data stored in localStorage (browser) / electron-store (desktop)
- Remote sync only via GitHub Gist REST API
- No local API/server for external access
- No MCP protocol support

### Use Case
1. **Docker Bridge**: bytepad runs in Docker → needs to sync changes to local instance
2. **AI Tool Integration**: Claude Code, Cursor, or other AI tools can interact with bytepad data via MCP
3. **Cross-Device Sync**: Local API enables real-time sync without relying solely on Gist
4. **Automation**: External scripts/tools can create tasks, notes, etc.

### Why MCP?
- **Standardized Protocol**: Model Context Protocol is becoming the standard for AI tool communication
- **Claude Code Native**: Claude Code supports MCP servers natively
- **Extensible**: Can expose any bytepad functionality as MCP tools
- **Bidirectional**: Both read (resources) and write (tools) operations supported

---

## Technical Analysis

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        DOCKER CONTAINER                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Claude Code / AI Agent                                  │    │
│  │  ┌─────────────────────────────────────────────────────┐│    │
│  │  │ MCP Client                                          ││    │
│  │  └─────────────────────────────────────────────────────┘│    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket (host.docker.internal:3847)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        LOCAL MACHINE                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  bytepad MCP Server (Express + WebSocket)               │    │
│  │  ├─ REST API endpoints (/api/*)                         │    │
│  │  ├─ WebSocket real-time sync                            │    │
│  │  └─ MCP Protocol handler                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              │ IPC / Direct Store Access         │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  bytepad Electron App                                    │    │
│  │  ├─ Zustand Stores (notes, tasks, habits, etc.)         │    │
│  │  ├─ Gist Sync Service                                   │    │
│  │  └─ UI Renderer                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Two Implementation Approaches

#### Option A: Embedded Server (Recommended)
Server runs inside Electron main process
- **Pros**: Direct store access, single process, no sync issues
- **Cons**: Requires Electron to be running

#### Option B: Standalone Server
Separate Node.js process that syncs with Electron via IPC
- **Pros**: Can run without Electron UI
- **Cons**: Complex sync, potential data conflicts

**Decision: Option A** - Embedded server in Electron main process

### Technology Stack for MCP Server

```
Server Framework:  Express.js (REST) + ws (WebSocket)
MCP SDK:           @modelcontextprotocol/sdk
Port:              3847 (configurable)
Authentication:    API key (generated on first run)
Data Access:       Direct Zustand store integration
```

---

## Phase 1: Foundation (Day 1-2)

### 37.1.1: Create Server Infrastructure

#### Task: Install server dependencies
```bash
npm install express ws cors helmet
npm install -D @types/express @types/ws @types/cors
```

**Files to create:**
- `electron/server/index.ts` - Main server entry
- `electron/server/routes/index.ts` - Route aggregator
- `electron/server/middleware/auth.ts` - API key authentication
- `electron/server/middleware/cors.ts` - CORS configuration

**Acceptance Criteria:**
- [ ] Express server starts on port 3847
- [ ] Basic health check endpoint `/health` returns 200
- [ ] CORS configured for Docker (host.docker.internal)
- [ ] Server lifecycle tied to Electron app

---

### 37.1.2: API Key Management

#### Task: Implement API key generation and storage

**Files to modify:**
- `electron/main.ts` - Add API key to electron-store
- `electron/server/middleware/auth.ts` - Validate API key

**Files to create:**
- `electron/server/utils/apiKey.ts` - Key generation utility

**Implementation:**
```typescript
// electron/server/utils/apiKey.ts
import { randomBytes } from 'crypto';
import Store from 'electron-store';

const store = new Store();

export function getOrCreateApiKey(): string {
  let key = store.get('mcp.apiKey') as string;
  if (!key) {
    key = `bp_${randomBytes(32).toString('hex')}`;
    store.set('mcp.apiKey', key);
  }
  return key;
}

export function validateApiKey(key: string): boolean {
  return key === store.get('mcp.apiKey');
}
```

**Acceptance Criteria:**
- [ ] API key generated on first run (format: `bp_<64-hex-chars>`)
- [ ] Key persisted in electron-store
- [ ] All API routes require `Authorization: Bearer <key>` header
- [ ] Invalid key returns 401 Unauthorized

---

### 37.1.3: Store Bridge Layer

#### Task: Create bridge between server and Zustand stores

**Challenge:** Zustand stores run in renderer process, server in main process

**Solution:** IPC-based store access

**Files to create:**
- `electron/server/bridges/storeBridge.ts` - Main process store access
- `src/services/ipcStoreService.ts` - Renderer IPC handlers

**Implementation Flow:**
```
Server Request → IPC to Renderer → Zustand Store → IPC Response → Server Response
```

**IPC Channels:**
```typescript
// Main → Renderer
'store:get' (storeName, selector?)
'store:set' (storeName, data)
'store:action' (storeName, actionName, ...args)

// Renderer → Main
'store:response' (requestId, data)
'store:changed' (storeName, data) // For real-time updates
```

**Acceptance Criteria:**
- [ ] Can read all store data via IPC
- [ ] Can invoke store actions via IPC
- [ ] Changes in renderer propagate to server via IPC events
- [ ] Request/response uses unique IDs to prevent race conditions

---

## Phase 2: REST API Endpoints (Day 2-3)

### 37.2.1: Notes API

**File:** `electron/server/routes/notes.ts`

**Endpoints:**
```
GET    /api/notes              - List all notes
GET    /api/notes/:id          - Get single note
POST   /api/notes              - Create note
PUT    /api/notes/:id          - Update note
DELETE /api/notes/:id          - Delete note
GET    /api/notes/search?q=    - Search notes by content/title
GET    /api/notes/:id/backlinks - Get notes that link to this note
```

**Request/Response Format:**
```typescript
// POST /api/notes
Request: {
  title: string;
  content?: string;
  tags?: string[];
  folderId?: string;
}

Response: {
  success: true;
  data: Note;
}
```

**Acceptance Criteria:**
- [ ] All CRUD operations work
- [ ] Search supports title and content
- [ ] Backlinks calculated correctly
- [ ] Tags stored as array
- [ ] Timestamps auto-generated

---

### 37.2.2: Tasks API

**File:** `electron/server/routes/tasks.ts`

**Endpoints:**
```
GET    /api/tasks              - List all tasks (supports ?completed=, ?priority=, ?tag=)
GET    /api/tasks/:id          - Get single task with subtasks
POST   /api/tasks              - Create task
PUT    /api/tasks/:id          - Update task
DELETE /api/tasks/:id          - Delete task
POST   /api/tasks/:id/complete - Mark task as completed
POST   /api/tasks/:id/subtasks - Add subtask
PUT    /api/tasks/:id/subtasks/:subId - Update subtask
DELETE /api/tasks/:id/subtasks/:subId - Delete subtask
```

**Request/Response Format:**
```typescript
// POST /api/tasks
Request: {
  title: string;
  description?: string;
  priority?: 'P1' | 'P2' | 'P3' | 'P4';
  deadline?: string; // ISO date
  tags?: string[];
  subtasks?: { title: string }[];
}

Response: {
  success: true;
  data: Task;
}
```

**Acceptance Criteria:**
- [ ] All CRUD operations work
- [ ] Subtasks management functional
- [ ] Priority filtering works
- [ ] Deadline handling correct
- [ ] Completion triggers gamification XP

---

### 37.2.3: Habits API

**File:** `electron/server/routes/habits.ts`

**Endpoints:**
```
GET    /api/habits             - List all habits with today's status
GET    /api/habits/:id         - Get single habit with completion history
POST   /api/habits             - Create habit
PUT    /api/habits/:id         - Update habit
DELETE /api/habits/:id         - Delete habit
POST   /api/habits/:id/complete - Toggle completion for today
POST   /api/habits/:id/complete/:date - Toggle completion for specific date
GET    /api/habits/:id/stats   - Get habit statistics (streak, completion rate)
```

**Acceptance Criteria:**
- [ ] All CRUD operations work
- [ ] Completion toggle works for any date
- [ ] Streak calculation correct
- [ ] Stats endpoint returns useful metrics

---

### 37.2.4: Journal API

**File:** `electron/server/routes/journal.ts`

**Endpoints:**
```
GET    /api/journal            - List all entries (supports ?from=, ?to=)
GET    /api/journal/:date      - Get entry for specific date (YYYY-MM-DD)
POST   /api/journal            - Create/update entry
DELETE /api/journal/:date      - Delete entry
GET    /api/journal/moods      - Get mood statistics over time
```

**Acceptance Criteria:**
- [ ] Date-based CRUD operations work
- [ ] Mood/energy values validated (1-5)
- [ ] Date range filtering works

---

### 37.2.5: Bookmarks API

**File:** `electron/server/routes/bookmarks.ts`

**Endpoints:**
```
GET    /api/bookmarks          - List all bookmarks (supports ?collection=, ?tag=)
GET    /api/bookmarks/:id      - Get single bookmark
POST   /api/bookmarks          - Create bookmark
PUT    /api/bookmarks/:id      - Update bookmark
DELETE /api/bookmarks/:id      - Delete bookmark
POST   /api/bookmarks/:id/read - Mark as read/unread
```

**Acceptance Criteria:**
- [ ] All CRUD operations work
- [ ] URL validation
- [ ] Favicon/image URL optional
- [ ] Collection/tag filtering works

---

### 37.2.6: Ideas API

**File:** `electron/server/routes/ideas.ts`

**Endpoints:**
```
GET    /api/ideas              - List all ideas
GET    /api/ideas/:id          - Get single idea
POST   /api/ideas              - Create idea
PUT    /api/ideas/:id          - Update idea
DELETE /api/ideas/:id          - Delete idea
POST   /api/ideas/:id/convert  - Convert to note or task
POST   /api/ideas/:id/archive  - Archive idea
```

**Acceptance Criteria:**
- [ ] All CRUD operations work
- [ ] Content max 280 chars enforced
- [ ] Color validation (allowed values only)
- [ ] Convert to note/task creates linked entity

---

### 37.2.7: Sync API

**File:** `electron/server/routes/sync.ts`

**Endpoints:**
```
GET    /api/sync/status        - Get current sync status (enabled, lastSync, pending)
POST   /api/sync/push          - Force push to Gist
POST   /api/sync/pull          - Force pull from Gist
POST   /api/sync/trigger       - Trigger smart sync (pull if needed, push if changed)
GET    /api/sync/gist-info     - Get Gist ID and last modified time
```

**Acceptance Criteria:**
- [ ] Status shows Gist sync configuration
- [ ] Push/pull operations work via API
- [ ] Smart sync follows existing logic
- [ ] Returns meaningful error messages

---

### 37.2.8: Bulk Operations API

**File:** `electron/server/routes/bulk.ts`

**Endpoints:**
```
POST   /api/bulk/export        - Export all data as JSON
POST   /api/bulk/import        - Import data from JSON
GET    /api/bulk/stats         - Get aggregate statistics
```

**Acceptance Criteria:**
- [ ] Export matches Gist sync format
- [ ] Import validates data structure
- [ ] Stats include counts for all entities

---

## Phase 3: MCP Protocol Implementation (Day 3-4)

### 37.3.1: MCP Server Setup

#### Task: Integrate @modelcontextprotocol/sdk

**Install:**
```bash
npm install @modelcontextprotocol/sdk
```

**File:** `electron/server/mcp/index.ts`

**Implementation:**
```typescript
import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';

export function createMCPServer() {
  const server = new Server({
    name: 'bytepad',
    version: '1.0.0',
  }, {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    }
  });

  // Register handlers...

  return server;
}
```

**Acceptance Criteria:**
- [ ] MCP server initializes correctly
- [ ] Server info exposed correctly
- [ ] Capabilities declared

---

### 37.3.2: MCP Resources (Read Operations)

**File:** `electron/server/mcp/resources.ts`

**Resources to expose:**
```typescript
// List all available resources
resources/list → [
  { uri: 'bytepad://notes', name: 'All Notes', mimeType: 'application/json' },
  { uri: 'bytepad://notes/{id}', name: 'Single Note', mimeType: 'application/json' },
  { uri: 'bytepad://tasks', name: 'All Tasks', mimeType: 'application/json' },
  { uri: 'bytepad://tasks/{id}', name: 'Single Task', mimeType: 'application/json' },
  { uri: 'bytepad://habits', name: 'All Habits', mimeType: 'application/json' },
  { uri: 'bytepad://journal', name: 'Journal Entries', mimeType: 'application/json' },
  { uri: 'bytepad://journal/{date}', name: 'Journal Entry', mimeType: 'application/json' },
  { uri: 'bytepad://bookmarks', name: 'All Bookmarks', mimeType: 'application/json' },
  { uri: 'bytepad://ideas', name: 'All Ideas', mimeType: 'application/json' },
  { uri: 'bytepad://today', name: 'Today Summary', mimeType: 'application/json' },
  { uri: 'bytepad://stats', name: 'Productivity Stats', mimeType: 'application/json' },
]

// Read resource
resources/read → { contents: [{ uri, mimeType, text }] }
```

**Special Resource: `bytepad://today`**
Returns aggregated daily view:
```json
{
  "date": "2025-01-29",
  "tasks": { "pending": 5, "completed": 3, "overdue": 1 },
  "habits": { "completed": 4, "remaining": 2 },
  "journal": { "mood": 4, "energy": 3 },
  "focusSessions": 2,
  "xpEarned": 150
}
```

**Acceptance Criteria:**
- [ ] All resources listed correctly
- [ ] Read returns JSON with correct structure
- [ ] Parameterized URIs (with {id}) work
- [ ] Today summary aggregates correctly

---

### 37.3.3: MCP Tools (Write Operations)

**File:** `electron/server/mcp/tools.ts`

**Tools to expose:**
```typescript
tools/list → [
  // Notes
  { name: 'create_note', description: 'Create a new note', inputSchema: {...} },
  { name: 'update_note', description: 'Update existing note', inputSchema: {...} },
  { name: 'delete_note', description: 'Delete a note', inputSchema: {...} },

  // Tasks
  { name: 'create_task', description: 'Create a new task', inputSchema: {...} },
  { name: 'update_task', description: 'Update existing task', inputSchema: {...} },
  { name: 'complete_task', description: 'Mark task as completed', inputSchema: {...} },
  { name: 'add_subtask', description: 'Add subtask to a task', inputSchema: {...} },

  // Habits
  { name: 'create_habit', description: 'Create a new habit', inputSchema: {...} },
  { name: 'toggle_habit', description: 'Toggle habit completion for today', inputSchema: {...} },

  // Journal
  { name: 'write_journal', description: 'Write or update journal entry', inputSchema: {...} },

  // Ideas
  { name: 'create_idea', description: 'Capture a quick idea', inputSchema: {...} },
  { name: 'convert_idea', description: 'Convert idea to note or task', inputSchema: {...} },

  // Sync
  { name: 'sync_gist', description: 'Trigger Gist sync', inputSchema: {...} },
  { name: 'force_push', description: 'Force push local data to Gist', inputSchema: {...} },

  // Bulk
  { name: 'search', description: 'Search across all entities', inputSchema: {...} },
]

// Execute tool
tools/call → { content: [{ type: 'text', text: 'Result...' }] }
```

**Tool Schema Example:**
```typescript
{
  name: 'create_task',
  description: 'Create a new task in bytepad',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Task title' },
      description: { type: 'string', description: 'Optional description' },
      priority: { type: 'string', enum: ['P1', 'P2', 'P3', 'P4'], default: 'P3' },
      deadline: { type: 'string', format: 'date', description: 'Due date (YYYY-MM-DD)' },
      tags: { type: 'array', items: { type: 'string' } },
      subtasks: { type: 'array', items: { type: 'string' } }
    },
    required: ['title']
  }
}
```

**Acceptance Criteria:**
- [ ] All tools listed with correct schemas
- [ ] Tool execution invokes correct store actions
- [ ] Results returned in MCP format
- [ ] Errors handled gracefully

---

### 37.3.4: MCP Prompts (Context Templates)

**File:** `electron/server/mcp/prompts.ts`

**Prompts to expose:**
```typescript
prompts/list → [
  {
    name: 'daily_planning',
    description: 'Get context for daily planning',
    arguments: [{ name: 'date', description: 'Date to plan for', required: false }]
  },
  {
    name: 'task_context',
    description: 'Get full context for a specific task',
    arguments: [{ name: 'task_id', description: 'Task ID', required: true }]
  },
  {
    name: 'weekly_review',
    description: 'Get data for weekly review',
    arguments: []
  },
  {
    name: 'project_status',
    description: 'Get all tasks and notes for a project tag',
    arguments: [{ name: 'tag', description: 'Project tag', required: true }]
  }
]

// Get prompt
prompts/get → { messages: [{ role: 'user', content: {...} }] }
```

**Acceptance Criteria:**
- [ ] All prompts listed
- [ ] Arguments validated
- [ ] Context returned in useful format

---

## Phase 4: Real-Time Sync (Day 4-5)

### 37.4.1: WebSocket Server

**File:** `electron/server/websocket/index.ts`

**Features:**
- Real-time push notifications when data changes
- Subscribe to specific stores/entities
- Heartbeat/ping-pong for connection health

**Protocol:**
```typescript
// Client → Server
{ type: 'subscribe', store: 'notes' }
{ type: 'subscribe', store: 'tasks', filter: { completed: false } }
{ type: 'unsubscribe', store: 'notes' }
{ type: 'ping' }

// Server → Client
{ type: 'subscribed', store: 'notes', success: true }
{ type: 'update', store: 'notes', action: 'created', data: Note }
{ type: 'update', store: 'notes', action: 'updated', data: Note }
{ type: 'update', store: 'notes', action: 'deleted', id: string }
{ type: 'pong' }
```

**Acceptance Criteria:**
- [ ] WebSocket server on same port as HTTP (/ws path)
- [ ] Authentication via query param or first message
- [ ] Subscription filtering works
- [ ] Graceful disconnect handling
- [ ] Reconnection support

---

### 37.4.2: Store Change Detection

**File:** `src/services/storeChangeEmitter.ts`

**Implementation:**
Wrap Zustand stores to emit IPC events on any change

```typescript
// For each store, add middleware
const useNoteStore = create<NoteStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // ... existing store implementation
      }),
      { name: 'bytepad-notes' }
    )
  )
);

// Subscribe to changes
useNoteStore.subscribe(
  (state) => state.notes,
  (notes, prevNotes) => {
    window.electronAPI?.emitStoreChange?.('notes', notes, detectChanges(notes, prevNotes));
  }
);
```

**Acceptance Criteria:**
- [ ] All content stores emit change events
- [ ] Change detection identifies created/updated/deleted
- [ ] Events include minimal diff, not full state
- [ ] No performance impact on normal usage

---

### 37.4.3: Docker Bridge Configuration

**File:** `electron/server/config.ts`

**Configuration options:**
```typescript
interface ServerConfig {
  port: number;              // Default: 3847
  host: string;              // Default: '0.0.0.0' (all interfaces)
  enableCors: boolean;       // Default: true
  corsOrigins: string[];     // Default: ['*']
  enableWebSocket: boolean;  // Default: true
  enableMcp: boolean;        // Default: true
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
```

**Docker usage:**
```bash
# From Docker container, access host machine
curl -H "Authorization: Bearer $BYTEPAD_API_KEY" \
  http://host.docker.internal:3847/api/tasks
```

**Acceptance Criteria:**
- [ ] Server accessible from Docker via host.docker.internal
- [ ] Port configurable via settings
- [ ] CORS allows Docker origin
- [ ] Clear documentation for Docker setup

---

## Phase 5: UI & Settings (Day 5-6)

### 37.5.1: MCP Settings Panel

**File:** `src/components/Settings/MCPSettings.tsx`

**UI Elements:**
- Toggle: Enable/disable MCP server
- Display: API key (with copy button, masked by default)
- Button: Regenerate API key
- Input: Port number
- Toggle: Enable WebSocket real-time sync
- Display: Server status (running/stopped)
- Display: Connected clients count
- Button: View server logs

**Acceptance Criteria:**
- [ ] Settings persisted in electron-store
- [ ] API key copyable
- [ ] Server restarts on port change
- [ ] Clear status indicators

---

### 37.5.2: Connection Status Indicator

**File:** `src/components/StatusBar/MCPStatus.tsx`

**Display:**
- Icon showing MCP server status (green=running, gray=disabled)
- Tooltip with: port, connected clients, last activity
- Click to open MCP settings

**Acceptance Criteria:**
- [ ] Status updates in real-time
- [ ] Minimal UI footprint
- [ ] Accessible from status bar

---

### 37.5.3: Activity Log

**File:** `electron/server/utils/activityLog.ts`

**Log entries:**
```typescript
interface ActivityEntry {
  timestamp: string;
  type: 'connection' | 'request' | 'sync' | 'error';
  source: string;  // IP address or client ID
  action: string;  // e.g., 'POST /api/tasks'
  duration?: number;
  success: boolean;
  error?: string;
}
```

**Storage:** Last 1000 entries in memory, persisted to file on app close

**Acceptance Criteria:**
- [ ] All API requests logged
- [ ] WebSocket events logged
- [ ] Errors captured with stack traces
- [ ] Log viewable in settings

---

## Phase 6: Gist Auto-Sync Integration (Day 6)

### 37.6.1: Sync on External Change

**File:** Modify `src/services/gistSyncService.ts`

**New behavior:**
When data is modified via MCP API:
1. Mark local data as "dirty"
2. Debounce (5 seconds)
3. Auto-push to Gist if enabled
4. Update lastModified timestamp

**Acceptance Criteria:**
- [ ] External changes trigger Gist sync
- [ ] Debouncing prevents excessive API calls
- [ ] Sync status visible in UI
- [ ] Conflicts handled gracefully

---

### 37.6.2: Sync Status API

**File:** `electron/server/routes/sync.ts` (enhance)

**New fields in status:**
```typescript
{
  gistEnabled: boolean;
  gistId: string | null;
  lastLocalChange: string;
  lastGistSync: string;
  pendingChanges: boolean;
  syncInProgress: boolean;
  lastError: string | null;
}
```

**Acceptance Criteria:**
- [ ] Status accurately reflects sync state
- [ ] Pending changes tracked
- [ ] Errors surfaced

---

## Phase 7: Documentation & Testing (Day 6-7)

### 37.7.1: API Documentation

**File:** `docs/api/MCP_SERVER_API.md`

**Contents:**
- Authentication setup
- REST API reference (all endpoints)
- MCP protocol reference
- WebSocket protocol reference
- Docker integration guide
- Claude Code MCP config example
- Error codes and troubleshooting

---

### 37.7.2: Claude Code MCP Configuration

**File:** `docs/api/CLAUDE_CODE_SETUP.md`

**Example claude_desktop_config.json:**
```json
{
  "mcpServers": {
    "bytepad": {
      "command": "node",
      "args": ["/path/to/bytepad/electron/server/mcp-stdio.js"],
      "env": {
        "BYTEPAD_API_KEY": "bp_your_api_key_here"
      }
    }
  }
}
```

**Alternative HTTP transport:**
```json
{
  "mcpServers": {
    "bytepad": {
      "url": "http://localhost:3847/mcp",
      "headers": {
        "Authorization": "Bearer bp_your_api_key_here"
      }
    }
  }
}
```

---

### 37.7.3: Integration Tests

**File:** `tests/server/` (new directory)

**Test files:**
- `api.test.ts` - REST API endpoint tests
- `mcp.test.ts` - MCP protocol tests
- `websocket.test.ts` - WebSocket tests
- `sync.test.ts` - Gist sync integration tests

**Test coverage targets:**
- All API endpoints
- All MCP resources and tools
- Error handling
- Authentication
- Concurrent access

---

## Deliverables Checklist

### Phase 1: Foundation
- [ ] Express server running in Electron main process
- [ ] API key authentication
- [ ] IPC bridge for store access

### Phase 2: REST API
- [ ] Notes API (CRUD + search + backlinks)
- [ ] Tasks API (CRUD + subtasks + completion)
- [ ] Habits API (CRUD + toggle + stats)
- [ ] Journal API (CRUD + moods)
- [ ] Bookmarks API (CRUD + collections)
- [ ] Ideas API (CRUD + convert)
- [ ] Sync API (status + push + pull)
- [ ] Bulk API (export + import + stats)

### Phase 3: MCP Protocol
- [ ] MCP server initialization
- [ ] Resources (read operations)
- [ ] Tools (write operations)
- [ ] Prompts (context templates)

### Phase 4: Real-Time Sync
- [ ] WebSocket server
- [ ] Store change detection
- [ ] Docker bridge configuration

### Phase 5: UI & Settings
- [ ] MCP settings panel
- [ ] Connection status indicator
- [ ] Activity log

### Phase 6: Gist Integration
- [ ] Auto-sync on external changes
- [ ] Enhanced sync status API

### Phase 7: Documentation
- [ ] API documentation
- [ ] Claude Code setup guide
- [ ] Integration tests

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| IPC latency | Cache frequently accessed data in main process |
| Concurrent writes | Optimistic locking with version numbers |
| Security (exposed API) | API key + localhost only by default |
| Memory usage | Limit WebSocket connections to 10 |
| Electron not running | Clear error message, document requirement |

---

## Success Metrics

1. **Latency**: API response time < 50ms for reads, < 100ms for writes
2. **Reliability**: 99.9% uptime when Electron is running
3. **Sync accuracy**: No data loss during Docker ↔ Local sync
4. **Developer experience**: < 5 minutes to set up MCP in Claude Code

---

## Future Enhancements (Out of Scope)

- [ ] Standalone server mode (without Electron)
- [ ] Multi-user support with user isolation
- [ ] End-to-end encryption for API
- [ ] Rate limiting per client
- [ ] GraphQL API alternative
- [ ] gRPC support for high-performance clients
