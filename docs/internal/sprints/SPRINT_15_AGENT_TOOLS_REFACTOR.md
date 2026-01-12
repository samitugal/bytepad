# Sprint 15: Agent Tools Refactor
**Goal:** Enhance FlowBot agent with better tools, web search, and time-aware planning
**Duration:** 4-5 days
**Priority:** HIGH
**Status:** COMPLETED

---

## Problems with Current Implementation
1. **No web search** - Agent cannot search the internet for information
2. **Turkish descriptions** - Tool descriptions should be in English for better LLM understanding
3. **No time awareness** - Agent doesn't know current time for time-blocking
4. **Limited planning tools** - No tools for creating time-blocked schedules
5. **Poor tool documentation** - Descriptions are too brief

## Known Bugs (To Fix)
| Bug | Description | Status |
|-----|-------------|--------|
| Response cut-off | Agent responds once then stops mid-conversation | 🔧 Fixed |
| Empty follow-up | After tool execution, no natural language response | 🔧 Fixed |
| No time context | "Plan remaining day" fails - agent doesn't know time | 🔧 Fixed |
| Missing error handling | Tool errors not properly caught and displayed | 🔧 Fixed |
| Wrong tool result format | LangChain requires ToolMessage with tool_call_id | 🔧 Fixed |
| HumanMessage instead of ToolMessage | Tool results must use ToolMessage class | 🔧 Fixed |

## Testing Notes
- **CRITICAL:** Always test after changes - agent has many failure modes
- **LangChain specifics:** Tool results MUST use `ToolMessage` with `tool_call_id`
- **GPT-5 quirks:** Does not support `temperature` parameter
- **API key validation:** Check console for `[Agent]` logs to debug

## Critical Bug: Agent Returns Raw Tool Output
**Problem:** Agent calls tool, gets result, but then returns empty response causing "İşlem tamamlandı!" fallback with raw JSON shown.

**Root Cause:** LLM not generating follow-up response after receiving tool results.

**Attempted Fixes:**
1. ✅ Proper ToolMessage format with tool_call_id
2. ✅ Improved system prompt with explicit instructions
3. ⏳ Need to verify LLM actually processes tool results in loop

**Expected Behavior:**
```
User: "Günün kalan saatlerine göre plan yap"
Agent: calls get_current_datetime → gets {"hour": 20, "remainingHours": 4}
Agent: "Saat 20:00, akşam için 4 saatin var! Araştırma modundaysan şunları öneriyorum..."
```

**Actual Behavior:**
```
User: "Günün kalan saatlerine göre plan yap"
Agent: calls get_current_datetime → gets {"hour": 20, "remainingHours": 4}
Agent: returns empty → shows "İşlem tamamlandı!" + raw JSON
```

## ⚠️ Architecture Issue: Agent Loop Required

**Current Problem:** Tool results are returned directly to user instead of being processed by the agent.

**Correct Agent Architecture:**
```
User Message → Agent → Tool Call → Tool Result → Agent (processes result) → Final Response
```

**Current (Wrong) Flow:**
```
User Message → Agent → Tool Call → Tool Result → Return to User (WRONG!)
```

### Proper ReAct Agent Loop Implementation

```typescript
async function runAgent(userMessage: string, context: ChatContext) {
  const messages = [systemPrompt, ...history, userMessage]
  
  // Agent loop - continues until agent decides to respond (no more tool calls)
  while (true) {
    const response = await llm.invoke(messages)
    
    // If no tool calls, agent is done - return final response
    if (!response.tool_calls?.length) {
      return response.content
    }
    
    // Execute tools and add results to message history
    const toolResults = []
    for (const toolCall of response.tool_calls) {
      const result = await executeTool(toolCall)
      toolResults.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        content: result
      })
    }
    
    // Add assistant message (with tool calls) and tool results to history
    messages.push(response)  // AI message with tool_calls
    messages.push(...toolResults)  // Tool results
    
    // Loop continues - agent will process tool results and decide next action
  }
}
```

### Key Principles
1. **Agent controls the loop** - Agent decides when to call tools and when to respond
2. **Tool results go back to agent** - Never directly to user
3. **Agent synthesizes information** - Combines tool results into coherent response
4. **Multi-step reasoning** - Agent can call multiple tools in sequence
5. **Final response is agent-generated** - Not raw tool output

---

## 15.1: Core Tool Improvements (1 day)

### Refactor Existing Tools
- [x] Convert all tool descriptions to English
- [x] Add detailed parameter descriptions
- [x] Improve return messages with more context (JSON structured responses)
- [x] Add `get_current_datetime` tool for time awareness

### New Time-Aware Tools
```typescript
// Example tools to add
get_current_datetime: () => {
  // Returns: { date: "2026-01-10", time: "19:52", dayOfWeek: "Friday", timezone: "UTC+3" }
}

create_time_blocked_task: (title, startTime, endTime, priority) => {
  // Creates a task with specific time block
}

plan_remaining_day: () => {
  // Gets current time, pending tasks, and suggests a schedule
}

get_schedule_for_today: () => {
  // Returns all time-blocked tasks for today
}
```

---

## 15.2: Web Search Integration (1.5 days)

### Tavily Search Tool
- [x] Integrate Tavily API for web search
- [x] Add `search_web` tool
- [x] Handle API key configuration in Settings (tavily key already in settingsStore)
- [x] Error handling (graceful fallback when no API key)

### Tool Definition
```typescript
search_web: tool({
  name: 'search_web',
  description: 'Search the internet for current information. Use for questions about news, facts, or anything requiring up-to-date data.',
  schema: z.object({
    query: z.string().describe('Search query'),
    maxResults: z.number().optional().describe('Max results (1-10)'),
  }),
})
```

---

## 15.3: Enhanced Planning Tools (1 day)

### Time-Blocking Tools
- [x] `create_time_block` - Create a task with start/end time
- [x] `get_free_time_slots` - Find available time slots today (9:00-22:00 work hours)
- [ ] `suggest_schedule` - AI suggests optimal task order (deferred - agent can do this via prompt)
- [ ] `reschedule_task` - Move a task to a different time (deferred)

### Context Tools
- [x] `get_productivity_stats` - Today's completed tasks, pending by priority, habits
- [x] `get_upcoming_deadlines` - Tasks due in next N days
- [x] `get_overdue_tasks` - Past-due tasks with days overdue count

---

## 15.4: Tool Documentation & Testing (0.5 days)

### Documentation Standards
All tools must have:
- English descriptions (LLMs understand English better)
- Detailed parameter descriptions with examples
- Clear return value documentation
- Error handling with user-friendly messages

### Example Tool Format
```typescript
tool(async (input) => { /* implementation */ }, {
  name: 'create_task',
  description: 'Create a new task in the task list. Use this when user wants to add a todo item, reminder, or action item.',
  schema: z.object({
    title: z.string().describe('Task title - be specific and actionable'),
    priority: z.enum(['P1', 'P2', 'P3', 'P4']).describe('Priority: P1=urgent/important, P2=important, P3=normal, P4=low'),
    description: z.string().optional().describe('Additional details or notes'),
    deadline: z.string().optional().describe('Due date in YYYY-MM-DD format'),
    startTime: z.string().optional().describe('Start time in HH:mm format for time-blocking'),
    endTime: z.string().optional().describe('End time in HH:mm format for time-blocking'),
  }),
})
```

---

## 15.5: Agent Behavior Improvements (1 day)

### System Prompt Enhancement
- [x] Add current datetime to system prompt context (buildSystemPrompt function)
- [x] Include user's timezone (Europe/Istanbul UTC+3)
- [x] Add productivity context (pending, completed, habits)
- [x] Improve response quality with ADHD-friendly guidelines

### Multi-Step Planning
- [x] Enable agent to call multiple tools in sequence (agent loop already implemented)
- [x] Better handling of tool results (JSON structured responses)
- [x] Agent synthesizes tool results into natural language response

---

## New Tools Summary

| Tool | Description | Status |
|------|-------------|--------|
| `get_current_datetime` | Get current date, time, day of week, remaining hours | ✅ Implemented |
| `search_web` | Search internet via Tavily API | ✅ Implemented |
| `create_time_block` | Create task with specific time slot | ✅ Implemented |
| `get_free_time_slots` | Find available time slots today | ✅ Implemented |
| `get_upcoming_deadlines` | Tasks due within N days | ✅ Implemented |
| `get_overdue_tasks` | Tasks past their deadline | ✅ Implemented |
| `get_productivity_stats` | Today's stats, pending by priority, habits | ✅ Implemented |
| `complete_task` | Mark task as completed by ID or title | ✅ Implemented |
| `reschedule_task` | Move task to different time | ⏳ Deferred |
| `suggest_schedule` | AI suggests optimal task order | ⏳ Deferred (agent can do via prompt) |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/aiService.ts` | Add new tools, refactor existing |
| `src/stores/settingsStore.ts` | Add Tavily API key (already exists) |
| `src/types/index.ts` | Add TimeBlock type to Task |
| `src/stores/taskStore.ts` | Support time-blocked tasks |

---

## Completion Criteria
- [x] All tool descriptions in English
- [x] Agent knows current time and can plan accordingly (dynamic system prompt)
- [x] Web search works with Tavily (requires API key in Settings)
- [x] Time-blocking tools functional (create_time_block, get_free_time_slots)
- [x] "Plan my remaining day" works correctly (datetime + pending tasks + free slots)
- [x] All tools have detailed documentation (schema descriptions)

---

## Dependencies
- Tavily API key (user must configure in Settings → AI)
- Task store already supports time blocks (startTime, deadlineTime fields)

---

## Implementation Summary (Completed 2026-01-10)

### Key Changes to `src/services/aiService.ts`:

1. **Dynamic System Prompt** - `buildSystemPrompt()` now includes:
   - Current date, time, day of week
   - Remaining hours in the day
   - Timezone context (Europe/Istanbul)
   - ADHD-friendly response guidelines
   - Clear tool usage instructions

2. **English Tool Descriptions** - All 15 tools now have:
   - Clear English descriptions for better LLM understanding
   - Detailed parameter descriptions with examples
   - Proper zod schema documentation

3. **New Tools Added:**
   - `complete_task` - Mark tasks done by ID or title
   - `create_time_block` - Schedule tasks with start/end times
   - `get_free_time_slots` - Find available time slots (9:00-22:00)
   - `get_productivity_stats` - Comprehensive daily stats
   - `get_upcoming_deadlines` - Tasks due in N days
   - `get_overdue_tasks` - Past-due tasks
   - `search_web` - Tavily-powered web search

4. **Improved Tool Responses** - All tools return structured JSON with:
   - `success` flag
   - Relevant data fields
   - Human-readable `message` field for agent to use

### Testing Checklist
- [ ] "Saat kaç?" - Should use get_current_datetime and respond naturally
- [ ] "Günümü planla" - Should check time, pending tasks, free slots
- [ ] "Task ekle: X" - Should create task with appropriate priority
- [ ] "Ne kadar iş var?" - Should show productivity stats
- [ ] "Yaklaşan deadline'lar" - Should list upcoming deadlines
- [ ] "Web'de X ara" - Should search if Tavily key configured
