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

  // Call tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    logger.debug(`MCP: Calling tool ${request.params.name}`);
    return executeTool(
      request.params.name,
      (request.params.arguments || {}) as Record<string, unknown>
    );
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
