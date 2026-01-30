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
// Key: hash of (toolName + arguments)
interface CacheEntry {
  result: unknown;
  timestamp: number;
}
interface PendingEntry {
  promise: Promise<unknown>;
  resolvers: { resolve: (value: unknown) => void; reject: (error: unknown) => void }[];
}
const toolCallCache = new Map<string, CacheEntry>();
const pendingOperations = new Map<string, PendingEntry>();
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
      version: '0.24.3',
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
      const requestId = Math.random().toString(36).slice(2, 8);
      logger.info(`MCP [${requestId}]: Processing ${toolName}, cacheKey=${cacheKey.slice(0, 50)}...`);

      // Step 1: Check completed cache
      const cached = toolCallCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        logger.info(`MCP [${requestId}]: Returning cached result for ${toolName} (idempotency)`);
        return cached.result as { content: { type: 'text'; text: string }[] };
      }

      // Step 2: Check if operation is already pending
      const pending = pendingOperations.get(cacheKey);
      if (pending) {
        logger.info(`MCP [${requestId}]: Waiting for pending operation for ${toolName} (idempotency)`);
        // Create a new promise that will resolve when the original completes
        return new Promise((resolve, reject) => {
          pending.resolvers.push({ resolve, reject });
        });
      }

      // Step 3: Mark as pending SYNCHRONOUSLY before any async work
      logger.info(`MCP [${requestId}]: Starting new operation for ${toolName}, pendingOps size before: ${pendingOperations.size}`);
      const pendingEntry: PendingEntry = {
        promise: Promise.resolve(), // Will be replaced
        resolvers: [],
      };
      pendingOperations.set(cacheKey, pendingEntry);
      logger.info(`MCP [${requestId}]: Pending set, size now: ${pendingOperations.size}`);

      try {
        // Execute the tool
        const result = await executeTool(toolName, args);

        // Store in completed cache
        toolCallCache.set(cacheKey, { result, timestamp: Date.now() });

        // Resolve all waiting promises
        for (const resolver of pendingEntry.resolvers) {
          resolver.resolve(result);
        }

        // Remove from pending
        pendingOperations.delete(cacheKey);

        return result;
      } catch (error) {
        // Reject all waiting promises
        for (const resolver of pendingEntry.resolvers) {
          resolver.reject(error);
        }

        // Remove from pending
        pendingOperations.delete(cacheKey);

        throw error;
      }
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
