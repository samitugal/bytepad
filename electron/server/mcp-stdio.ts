#!/usr/bin/env node
/**
 * MCP Stdio Server for bytepad
 *
 * This script runs the MCP server with stdio transport for use with Claude Desktop.
 *
 * Usage in claude_desktop_config.json:
 * {
 *   "mcpServers": {
 *     "bytepad": {
 *       "command": "node",
 *       "args": ["/path/to/bytepad/electron/server/mcp-stdio.js"]
 *     }
 *   }
 * }
 */

import { startMCPStdioServer } from './mcp';

async function main() {
  try {
    console.error('[bytepad-mcp] Starting stdio server...');
    await startMCPStdioServer();
    console.error('[bytepad-mcp] Server running');
  } catch (error) {
    console.error('[bytepad-mcp] Failed to start:', error);
    process.exit(1);
  }
}

main();
