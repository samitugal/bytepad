# Sprint 24: FlowBot Note Reading Tools
**Goal:** Enable FlowBot to read and analyze user's notes
**Duration:** 2-3 days
**Priority:** HIGH
**Status:** PLANNED

---

## Background

### Current State
- FlowBot has tools for tasks, habits, calendar
- Cannot read or search notes
- Cannot provide insights based on note content
- Limited context about user's knowledge base

### Why Note Tools?
1. **Context**: FlowBot can reference user's notes in conversations
2. **Analysis**: Summarize, find patterns, suggest connections
3. **Search**: Find relevant notes based on queries
4. **Productivity**: "What did I write about X?" queries

---

## 24.1: GetAllNotes Tool

### Purpose
Return a list of all notes with metadata and content preview

### Tool Definition
```typescript
{
  name: 'get_all_notes',
  description: 'Get a list of all notes with titles, tags, dates, and content preview. Use this to browse user\'s notes or find relevant ones.',
  parameters: {
    type: 'object',
    properties: {
      sortBy: {
        type: 'string',
        enum: ['date', 'title', 'updated'],
        description: 'Sort order for notes',
        default: 'updated'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of notes to return',
        default: 20
      },
      tag: {
        type: 'string',
        description: 'Filter by tag (optional)'
      },
      search: {
        type: 'string',
        description: 'Search in title and content (optional)'
      }
    }
  }
}
```

### Response Format
```typescript
interface NotePreview {
  id: string
  title: string
  tags: string[]
  createdAt: string
  updatedAt: string
  contentPreview: string  // First 200 characters
  wordCount: number
}

// Returns: NotePreview[]
```

### Implementation
```typescript
function getAllNotes(args: {
  sortBy?: 'date' | 'title' | 'updated'
  limit?: number
  tag?: string
  search?: string
}): string {
  const { notes } = useNoteStore.getState()
  let filtered = [...notes]

  // Filter by tag
  if (args.tag) {
    filtered = filtered.filter(n => 
      n.tags.some(t => t.toLowerCase().includes(args.tag!.toLowerCase()))
    )
  }

  // Search in title and content
  if (args.search) {
    const query = args.search.toLowerCase()
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(query) ||
      n.content.toLowerCase().includes(query)
    )
  }

  // Sort
  const sortBy = args.sortBy || 'updated'
  filtered.sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title)
    if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  // Limit
  const limit = args.limit || 20
  filtered = filtered.slice(0, limit)

  // Format response
  const previews = filtered.map(n => ({
    id: n.id,
    title: n.title || 'Untitled',
    tags: n.tags,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    contentPreview: n.content.slice(0, 200) + (n.content.length > 200 ? '...' : ''),
    wordCount: n.content.split(/\s+/).filter(Boolean).length
  }))

  return JSON.stringify(previews, null, 2)
}
```

### Tasks:
- [ ] Add tool definition to `aiService.ts`
- [ ] Implement executor function
- [ ] Add to toolExecutors map
- [ ] Test with various queries

---

## 24.2: GetNoteDetail Tool

### Purpose
Return full content of a specific note

### Tool Definition
```typescript
{
  name: 'get_note_detail',
  description: 'Get the full content of a specific note by ID. Use after get_all_notes to read a note in detail.',
  parameters: {
    type: 'object',
    properties: {
      noteId: {
        type: 'string',
        description: 'The ID of the note to retrieve'
      }
    },
    required: ['noteId']
  }
}
```

### Response Format
```typescript
interface NoteDetail {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
  wordCount: number
  backlinks: string[]  // IDs of notes that link to this one
}
```

### Implementation
```typescript
function getNoteDetail(args: { noteId: string }): string {
  const { notes } = useNoteStore.getState()
  const note = notes.find(n => n.id === args.noteId)

  if (!note) {
    return JSON.stringify({ error: 'Note not found' })
  }

  // Find backlinks
  const backlinks = notes
    .filter(n => n.content.includes(`[[${note.title}]]`))
    .map(n => n.id)

  const detail = {
    id: note.id,
    title: note.title || 'Untitled',
    content: note.content,
    tags: note.tags,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    wordCount: note.content.split(/\s+/).filter(Boolean).length,
    backlinks
  }

  return JSON.stringify(detail, null, 2)
}
```

### Tasks:
- [ ] Add tool definition to `aiService.ts`
- [ ] Implement executor function
- [ ] Add to toolExecutors map
- [ ] Test with valid and invalid IDs

---

## 24.3: SearchNotes Tool (Bonus)

### Purpose
Semantic search across notes (if time permits)

### Tool Definition
```typescript
{
  name: 'search_notes',
  description: 'Search notes by keyword or phrase. Returns matching notes with highlighted snippets.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query'
      },
      limit: {
        type: 'number',
        description: 'Maximum results',
        default: 10
      }
    },
    required: ['query']
  }
}
```

### Tasks:
- [ ] Implement basic keyword search
- [ ] Return context snippets around matches
- [ ] Rank by relevance

---

## 24.4: Update System Prompt

### Add Note Context
```typescript
const SYSTEM_PROMPT = `...
Available note tools:
- get_all_notes: Browse and search user's notes
- get_note_detail: Read full content of a specific note

When user asks about their notes:
1. First use get_all_notes to find relevant notes
2. Then use get_note_detail to read specific ones
3. Summarize or analyze as requested
...`
```

### Tasks:
- [ ] Update system prompt with note tool instructions
- [ ] Add examples of note-related queries

---

## File Changes

### Modified Files
```
src/services/aiService.ts  - Add tool definitions and executors
```

---

## Example Interactions

### User: "Notlarımda ne var?"
```
FlowBot: get_all_notes({ sortBy: 'updated', limit: 10 })
→ "Son 10 notunuz: 1. Blog yazısı (3 gün önce), 2. Meeting notes..."
```

### User: "LLM hakkında yazdıklarımı özetle"
```
FlowBot: get_all_notes({ search: 'LLM', limit: 5 })
→ Finds relevant notes
FlowBot: get_note_detail({ noteId: 'xxx' })
→ Reads full content
→ "LLM hakkında 3 notunuz var. Ana konular: 1. Agent mimarisi, 2. Memory yönetimi..."
```

---

## Acceptance Criteria

- [ ] FlowBot can list all notes
- [ ] FlowBot can read specific note content
- [ ] Search/filter by tag works
- [ ] Search by keyword works
- [ ] Proper error handling for missing notes

---

*Sprint 24 - FlowBot Note Reading Tools*
*Estimated: 2-3 days*
*Priority: HIGH*
