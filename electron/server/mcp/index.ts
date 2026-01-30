import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { resourceList, readResource } from './resources';
import { toolList, executeTool } from './tools';
import { promptList, getPrompt } from './prompts';
import { logger } from '../utils/logger';

let mcpServer: Server | null = null;

// Idempotency cache for tool calls - prevents duplicate execution
// Key: hash of (toolName + arguments), Value: { result, timestamp }
const toolCallCache = new Map<string, { result: unknown; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

// Generate cache key from tool name and arguments
function generateCacheKey(toolName: string, args: Record<string, unknown>): string {
  // Sort keys for consistent hashing
  const sortedArgs = JSON.stringify(args, Object.keys(args).sort());
  return `${toolName}:${sortedArgs}`;
}

// Clean up expired cache entries
function cleanupCache(): void {
  const now = Date.now();
  for (const [key, value] of toolCallCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      toolCallCache.delete(key);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupCache, 60 * 1000);

export function createMCPServer(): Server {
  const server = new Server(
    {
      name: 'bytepad',
      version: '0.24.2',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
        prompts: {},
      },
    }
  );

  // List resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    logger.debug('MCP: Listing resources');
    return {
      resources: resourceList.map(r => ({
        uri: r.uri,
        name: r.name,
        description: r.description,
        mimeType: r.mimeType,
      })),
    };
  });

  // Read resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    logger.debug(`MCP: Reading resource ${request.params.uri}`);
    return readResource(request.params.uri);
  });

  // List tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('MCP: Listing tools');
    return {
      tools: toolList.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    };
  });

  // Call tool with idempotency for create operations
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const args = (request.params.arguments || {}) as Record<string, unknown>;

    // Only apply idempotency to create operations (to prevent duplicates)
    const isCreateOperation = toolName.startsWith('create_') || toolName === 'write_journal';

    if (isCreateOperation) {
      const cacheKey = generateCacheKey(toolName, args);
      const cached = toolCallCache.get(cacheKey);

      // Check if we have a recent cached result (within TTL)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        logger.info(`MCP: Returning cached result for ${toolName} (idempotency)`);
        return cached.result as { content: { type: 'text'; text: string }[] };
      }

      // Execute tool and cache result
      logger.debug(`MCP: Calling tool ${toolName}`);
      const result = await executeTool(toolName, args);

      // Cache the result
      toolCallCache.set(cacheKey, { result, timestamp: Date.now() });

      return result;
    }

    // Non-create operations execute normally without caching
    logger.debug(`MCP: Calling tool ${toolName}`);
    return executeTool(toolName, args);
  });

  // List prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    logger.debug('MCP: Listing prompts');
    return {
      prompts: promptList.map(p => ({
        name: p.name,
        description: p.description,
        arguments: p.arguments,
      })),
    };
  });

  // Get prompt
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    logger.debug(`MCP: Getting prompt ${request.params.name}`);
    return getPrompt(
      request.params.name,
      (request.params.arguments || {}) as Record<string, string>
    );
  });

  return server;
}

// Start MCP server with stdio transport (for Claude Desktop)
export async function startMCPStdioServer(): Promise<void> {
  if (mcpServer) {
    logger.warn('MCP stdio server already running');
    return;
  }

  mcpServer = createMCPServer();
  const transport = new StdioServerTransport();

  await mcpServer.connect(transport);
  logger.info('MCP stdio server started');
}

// Stop MCP server
export async function stopMCPStdioServer(): Promise<void> {
  if (mcpServer) {
    await mcpServer.close();
    mcpServer = null;
    logger.info('MCP stdio server stopped');
  }
}

export { mcpServer };
