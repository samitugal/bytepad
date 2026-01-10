# Sprint 10: Agent Framework Migration
**Goal:** Migrate FlowBot to LangChain.js for better tool calling
**Duration:** 3-4 days
**Priority:** HIGH
**Status:** ✅ COMPLETED (2026-01-10)

> **Note:** LangChain.js ile migration tamamlandı. `llmService.ts` silindi, yeni `aiService.ts` oluşturuldu.

---

## Why Vercel AI SDK?
- **Most popular:** 2.8M weekly downloads (vs 795K for next best)
- **React native:** Perfect fit for our stack
- **Built-in streaming:** Real-time responses out of the box
- **Multi-provider:** OpenAI, Anthropic, Google, Groq, Ollama all supported
- **Tool calling:** Native support with type safety (Zod schemas)
- **Active development:** AI SDK 6 released with major improvements

---

## 10.1: Core Migration (1.5 days)
- [ ] Install packages: `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `zod`
- [ ] Create `src/services/aiAgentService.ts` using Vercel AI SDK
- [ ] Migrate system prompt and context building
- [ ] Implement tool definitions with Zod schemas
- [ ] Handle streaming responses

### New Architecture Example:
```typescript
import { generateText, streamText, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

const tools = {
  create_task: tool({
    description: 'Create a new task',
    parameters: z.object({
      title: z.string(),
      priority: z.enum(['P1', 'P2', 'P3', 'P4']),
      deadline: z.string().optional(),
    }),
    execute: async ({ title, priority, deadline }) => {
      // Task creation logic
    },
  }),
  // ... other tools
}

const result = await generateText({
  model: openai('gpt-5'),
  system: SYSTEM_PROMPT,
  messages,
  tools,
  maxSteps: 5, // Multi-step tool execution
})
```

---

## 10.2: Provider Abstraction (0.5 days)
- [ ] Create provider factory for OpenAI, Anthropic, Google, Groq, Ollama
- [ ] Handle provider-specific configurations (GPT-5 Response API, etc.)
- [ ] Remove old `llmService.ts` code

---

## 10.3: Streaming UI (1 day)
- [ ] Update `ChatWindow.tsx` for streaming responses
- [ ] Show real-time text generation
- [ ] Display tool execution progress
- [ ] Handle partial responses gracefully

### Streaming Implementation:
```typescript
const { textStream, toolCalls } = await streamText({
  model: openai('gpt-4o'),
  messages,
  tools,
})

for await (const chunk of textStream) {
  onChunk(chunk) // Update UI with each chunk
}
```

---

## 10.4: Testing & Cleanup (0.5 days)
- [ ] Test all providers (OpenAI, Anthropic, etc.)
- [ ] Test all tools (create_task, plan_day, etc.)
- [ ] Remove deprecated code
- [ ] Update documentation

---

## Benefits After Migration
1. **Less code:** ~500 lines → ~150 lines
2. **Type safety:** Zod schemas for tool parameters
3. **Streaming:** Built-in, no custom implementation
4. **Reliability:** Battle-tested by millions of users
5. **Future-proof:** Easy to add new providers/features

---

## Files to Change
| File | Action |
|------|--------|
| `src/services/llmService.ts` | DELETE |
| `src/services/aiAgentService.ts` | CREATE |
| `src/services/agentService.ts` | KEEP |
| `src/services/toolRegistry.ts` | MIGRATE to Zod |
| `src/components/chat/ChatWindow.tsx` | UPDATE |

---

## Completion Criteria
- [ ] All existing functionality works with Vercel AI SDK
- [ ] Streaming responses in chat UI
- [ ] All providers supported
- [ ] Tool calling works with type safety
- [ ] Code reduced by 60%+
