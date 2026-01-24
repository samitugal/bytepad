// Local API Status Tool
// Provides a way to check if the Electron app is running

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { ToolResult } from '../store/index.js'
import { localHealthCheck } from '../utils/index.js'

// Tool definitions - just the status check
export const localApiToolDefinitions: Tool[] = [
  {
    name: 'app_status',
    description:
      'Check if the Electron app is running. When the app is running, all data operations sync to Gist automatically.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
]

// Tool executors
export const localApiToolExecutors: Record<
  string,
  (args: Record<string, unknown>) => Promise<ToolResult>
> = {
  app_status: async () => {
    const result = await localHealthCheck()

    if (result.success) {
      const data = result.data as { status: string; version: string }
      return {
        success: true,
        message: `Electron app is running (v${data.version}). All changes sync to Gist automatically.`,
        data: {
          appRunning: true,
          version: data.version,
          syncMode: 'automatic',
        },
      }
    }

    return {
      success: true,
      message:
        'Electron app is not running. Changes are stored locally in file store. Start the app to enable Gist sync.',
      data: {
        appRunning: false,
        syncMode: 'file-store',
      },
    }
  },
}
