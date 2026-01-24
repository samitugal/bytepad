// Tools Index - registers all tools for MCP server

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { ToolResult } from '../store/index.js'

// Import tool definitions and executors
import { taskToolDefinitions, taskToolExecutors } from './taskTools.js'
import { habitToolDefinitions, habitToolExecutors } from './habitTools.js'
import { noteToolDefinitions, noteToolExecutors } from './noteTools.js'
import { journalToolDefinitions, journalToolExecutors } from './journalTools.js'
import { bookmarkToolDefinitions, bookmarkToolExecutors } from './bookmarkTools.js'
import { summaryToolDefinitions, summaryToolExecutors } from './summaryTools.js'
import { syncToolDefinitions, syncToolExecutors } from './syncTools.js'
import { localApiToolDefinitions, localApiToolExecutors } from './localApiTools.js'

// Combine all tool definitions
export const allToolDefinitions: Tool[] = [
  ...taskToolDefinitions,
  ...habitToolDefinitions,
  ...noteToolDefinitions,
  ...journalToolDefinitions,
  ...bookmarkToolDefinitions,
  ...summaryToolDefinitions,
  ...syncToolDefinitions,
  ...localApiToolDefinitions,
]

// Combine all tool executors
export const allToolExecutors: Record<string, (args: Record<string, unknown>) => Promise<ToolResult>> = {
  ...taskToolExecutors,
  ...habitToolExecutors,
  ...noteToolExecutors,
  ...journalToolExecutors,
  ...bookmarkToolExecutors,
  ...summaryToolExecutors,
  ...syncToolExecutors,
  ...localApiToolExecutors,
}

// Execute a tool by name
export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const executor = allToolExecutors[name]

  if (!executor) {
    return {
      success: false,
      message: `Unknown tool: ${name}`,
    }
  }

  try {
    return await executor(args)
  } catch (error) {
    return {
      success: false,
      message: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Get tool names
export function getToolNames(): string[] {
  return allToolDefinitions.map((t) => t.name)
}

// Get tool by name
export function getToolDefinition(name: string): Tool | undefined {
  return allToolDefinitions.find((t) => t.name === name)
}
