/**
 * Standalone MCP Server for Docker
 * Runs independently without Electron
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer, Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { fileStoreBridge, initializeStore, onStoreChange } from './fileStoreBridge.js';
import { createRoutes } from './routes.js';
import { logger } from './logger.js';

const PORT = parseInt(process.env.MCP_PORT || '3847', 10);
const HOST = process.env.MCP_HOST || '0.0.0.0';
const API_KEY = process.env.BYTEPAD_API_KEY || '';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const DATA_DIR = process.env.DATA_DIR || '/app/data';

let app: Express | null = null;
let httpServer: HttpServer | null = null;
let wss: WebSocketServer | null = null;

// Store MCP SSE transports by session ID
const mcpTransports: Map<string, SSEServerTransport> = new Map();

// Idempotency cache for tool calls - prevents duplicate execution
interface CacheEntry {
  result: unknown;
  timestamp: number;
}
interface PendingEntry {
  resolvers: { resolve: (value: unknown) => void; reject: (error: unknown) => void }[];
}
const toolCallCache = new Map<string, CacheEntry>();
const pendingOperations = new Map<string, PendingEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function generateCacheKey(toolName: string, args: Record<string, unknown>): string {
  const sortedArgs = JSON.stringify(args, Object.keys(args || {}).sort());
  return `${toolName}:${sortedArgs}`;
}

// Cleanup expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of toolCallCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      toolCallCache.delete(key);
    }
  }
}, 60 * 1000);

// Create MCP server with tools and resources
function createMCPServer(): Server {
  const server = new Server(
    { name: 'bytepad', version: '0.24.2' },
    { capabilities: { resources: {}, tools: {} } }
  );

  // List resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      { uri: 'bytepad://notes', name: 'All Notes', description: 'List of all notes', mimeType: 'application/json' },
      { uri: 'bytepad://tasks', name: 'All Tasks', description: 'List of all tasks', mimeType: 'application/json' },
      { uri: 'bytepad://tasks/pending', name: 'Pending Tasks', description: 'Incomplete tasks', mimeType: 'application/json' },
      { uri: 'bytepad://habits', name: 'All Habits', description: 'List of all habits', mimeType: 'application/json' },
      { uri: 'bytepad://journal', name: 'Journal Entries', description: 'All journal entries', mimeType: 'application/json' },
      { uri: 'bytepad://bookmarks', name: 'All Bookmarks', description: 'List of all bookmarks', mimeType: 'application/json' },
      { uri: 'bytepad://ideas', name: 'All Ideas', description: 'List of all ideas', mimeType: 'application/json' },
      { uri: 'bytepad://today', name: 'Today Summary', description: "Today's summary", mimeType: 'application/json' },
    ],
  }));

  // Read resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const match = uri.match(/^bytepad:\/\/(\w+)(?:\/(.+))?$/);
    if (!match) throw new Error(`Invalid URI: ${uri}`);

    const [, type, id] = match;
    let data: unknown;

    switch (type) {
      case 'notes':
        data = id ? await fileStoreBridge.getById('notes', id) : await fileStoreBridge.getAll('notes');
        break;
      case 'tasks':
        if (id === 'pending') {
          const all = await fileStoreBridge.getAll('tasks');
          data = all.filter((t: { completed?: boolean; archivedAt?: string }) => !t.completed && !t.archivedAt);
        } else {
          data = id ? await fileStoreBridge.getById('tasks', id) : await fileStoreBridge.getAll('tasks');
        }
        break;
      case 'habits':
        data = id ? await fileStoreBridge.getById('habits', id) : await fileStoreBridge.getAll('habits');
        break;
      case 'journal':
        data = id ? await fileStoreBridge.getById('journal', id) : await fileStoreBridge.getAll('journal');
        break;
      case 'bookmarks':
        data = id ? await fileStoreBridge.getById('bookmarks', id) : await fileStoreBridge.getAll('bookmarks');
        break;
      case 'ideas':
        data = id ? await fileStoreBridge.getById('ideas', id) : await fileStoreBridge.getAll('ideas');
        break;
      case 'today': {
        const today = new Date().toISOString().split('T')[0];
        const tasks = await fileStoreBridge.getAll('tasks');
        const habits = await fileStoreBridge.getAll('habits');
        const activeTasks = tasks.filter((t: { archivedAt?: string }) => !t.archivedAt);
        data = {
          date: today,
          tasks: { total: activeTasks.length, pending: activeTasks.filter((t: { completed?: boolean }) => !t.completed).length },
          habits: { total: habits.length },
        };
        break;
      }
      default:
        throw new Error(`Unknown resource: ${type}`);
    }

    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
  });

  // List tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      { name: 'create_note', description: 'Create a new note', inputSchema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } }, required: ['title'] } },
      { name: 'create_task', description: 'Create a new task', inputSchema: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, priority: { type: 'string', enum: ['P1', 'P2', 'P3', 'P4'] }, deadline: { type: 'string' } }, required: ['title'] } },
      { name: 'complete_task', description: 'Complete a task', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
      { name: 'toggle_habit', description: 'Toggle habit completion', inputSchema: { type: 'object', properties: { id: { type: 'string' }, date: { type: 'string' } }, required: ['id'] } },
      { name: 'write_journal', description: 'Write journal entry', inputSchema: { type: 'object', properties: { date: { type: 'string' }, content: { type: 'string' }, mood: { type: 'number' }, energy: { type: 'number' } }, required: [] } },
      { name: 'create_idea', description: 'Create a quick idea', inputSchema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' }, color: { type: 'string' } }, required: ['title'] } },
      { name: 'search', description: 'Search across all entities', inputSchema: { type: 'object', properties: { query: { type: 'string' }, type: { type: 'string', enum: ['all', 'notes', 'tasks', 'bookmarks'] } }, required: ['query'] } },
    ],
  }));

  // Execute tool with idempotency for create operations
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const argsObj = (args || {}) as Record<string, unknown>;

    // Check idempotency cache for create operations
    const isCreateOperation = name.startsWith('create_') || name === 'write_journal';
    if (isCreateOperation) {
      const cacheKey = generateCacheKey(name, argsObj);

      // Step 1: Check completed cache
      const cached = toolCallCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        logger.info(`MCP: Returning cached result for ${name} (idempotency)`);
        return cached.result as { content: { type: 'text'; text: string }[] };
      }

      // Step 2: Check if operation is already pending
      const pending = pendingOperations.get(cacheKey);
      if (pending) {
        logger.info(`MCP: Waiting for pending operation for ${name} (idempotency)`);
        return new Promise((resolve, reject) => {
          pending.resolvers.push({ resolve, reject });
        });
      }

      // Step 3: Mark as pending SYNCHRONOUSLY before any async work
      logger.debug(`MCP: Calling tool ${name}`);
      const pendingEntry: PendingEntry = { resolvers: [] };
      pendingOperations.set(cacheKey, pendingEntry);

      try {
        let result: unknown;

        switch (name) {
          case 'create_note':
            result = await fileStoreBridge.create('notes', { title: args?.title, content: args?.content || '', tags: args?.tags || [] });
            break;
          case 'create_task':
            result = await fileStoreBridge.create('tasks', { title: args?.title, description: args?.description, priority: args?.priority || 'P3', deadline: args?.deadline });
            break;
          case 'write_journal': {
            const date = (args?.date as string) || new Date().toISOString().split('T')[0];
            result = await fileStoreBridge.create('journal', { id: date, date, content: args?.content || '', mood: args?.mood || 3, energy: args?.energy || 3 });
            break;
          }
          case 'create_idea':
            result = await fileStoreBridge.create('ideas', { title: args?.title, content: args?.content || '', color: args?.color || 'yellow', status: 'active' });
            break;
          default:
            throw new Error(`Unknown create tool: ${name}`);
        }

        const response = { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };

        // Store in completed cache
        toolCallCache.set(cacheKey, { result: response, timestamp: Date.now() });

        // Resolve all waiting promises
        for (const resolver of pendingEntry.resolvers) {
          resolver.resolve(response);
        }

        // Remove from pending
        pendingOperations.delete(cacheKey);

        return response;
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
    let result: unknown;

    switch (name) {
      case 'complete_task': {
        const task = await fileStoreBridge.getById('tasks', args?.id as string);
        if (task) {
          result = await fileStoreBridge.update('tasks', args?.id as string, { completed: !(task as { completed?: boolean }).completed, completedAt: new Date().toISOString() });
        }
        break;
      }
      case 'toggle_habit': {
        const date = (args?.date as string) || new Date().toISOString().split('T')[0];
        const habit = await fileStoreBridge.getById('habits', args?.id as string);
        if (habit) {
          const completions = { ...(habit as { completions: Record<string, boolean> }).completions };
          completions[date] = !completions[date];
          result = await fileStoreBridge.update('habits', args?.id as string, { completions });
        }
        break;
      }
      case 'search': {
        const query = (args?.query as string).toLowerCase();
        const type = (args?.type as string) || 'all';
        const results: Record<string, unknown[]> = {};
        if (type === 'all' || type === 'notes') {
          const notes = await fileStoreBridge.getAll('notes');
          results.notes = notes.filter((n: { title: string; content?: string }) => n.title.toLowerCase().includes(query) || n.content?.toLowerCase().includes(query));
        }
        if (type === 'all' || type === 'tasks') {
          const tasks = await fileStoreBridge.getAll('tasks');
          results.tasks = tasks.filter((t: { title: string; description?: string }) => t.title.toLowerCase().includes(query) || t.description?.toLowerCase().includes(query));
        }
        result = results;
        break;
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  });

  return server;
}

// Auth middleware
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Skip auth for health check
  if (req.path === '/api/health' || req.path === '/health') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice(7);
  if (token !== API_KEY) {
    return res.status(401).json({ success: false, error: 'Invalid API key' });
  }

  next();
}

async function startServer(): Promise<void> {
  // Initialize file-based store
  await initializeStore(DATA_DIR);
  logger.info(`Data directory: ${DATA_DIR}`);

  // Create Express app
  app = express();

  // Security
  app.use(helmet({ contentSecurityPolicy: false }));

  // CORS
  app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.debug(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
  });

  // Auth middleware
  app.use(authMiddleware);

  // API routes
  app.use('/api', createRoutes(fileStoreBridge));

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      service: 'bytepad-mcp-docker',
      version: process.env.npm_package_version || '0.24.2',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // MCP SSE endpoint - establishes SSE stream
  app.get('/mcp', async (req: Request, res: Response) => {
    logger.info('MCP SSE: New connection request');

    try {
      // Create SSE transport - messages endpoint is /messages
      const transport = new SSEServerTransport('/messages', res);
      const sessionId = transport.sessionId;

      // Store transport by session ID
      mcpTransports.set(sessionId, transport);

      // Set up cleanup handler
      transport.onclose = () => {
        logger.info(`MCP SSE: Session ${sessionId} closed`);
        mcpTransports.delete(sessionId);
      };

      // Create and connect MCP server
      const mcpServer = createMCPServer();
      await mcpServer.connect(transport);

      logger.info(`MCP SSE: Session established - ${sessionId}`);
    } catch (error) {
      logger.error(`MCP SSE: Error - ${(error as Error).message}`);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to establish SSE stream' });
      }
    }
  });

  // MCP messages endpoint - receives client JSON-RPC requests
  app.post('/messages', async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      res.status(400).json({ error: 'Missing sessionId parameter' });
      return;
    }

    const transport = mcpTransports.get(sessionId);
    if (!transport) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    try {
      await transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      logger.error(`MCP messages: Error - ${(error as Error).message}`);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to process message' });
      }
    }
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Not found' });
  });

  // Create HTTP server
  httpServer = createServer(app);

  // WebSocket server
  wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clientSubscriptions = new Map<WebSocket, Set<string>>();

  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    logger.info(`WebSocket client connected from ${clientIp}`);
    clientSubscriptions.set(ws, new Set());

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleWebSocketMessage(ws, message, clientSubscriptions);
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      }
    });

    ws.on('close', () => {
      logger.info(`WebSocket client disconnected`);
      clientSubscriptions.delete(ws);
    });

    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to bytepad MCP server (Docker)',
      timestamp: new Date().toISOString(),
    }));
  });

  // Broadcast store changes
  onStoreChange((storeName, action, data) => {
    if (!wss) return;
    const message = JSON.stringify({
      type: 'update',
      store: storeName,
      action,
      data,
      timestamp: new Date().toISOString(),
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        const subs = clientSubscriptions.get(client);
        if (subs && (subs.has(storeName) || subs.has('all'))) {
          client.send(message);
        }
      }
    });
  });

  // Start listening
  httpServer.listen(PORT, HOST, () => {
    logger.info(`MCP Server started on http://${HOST}:${PORT}`);
    logger.info(`WebSocket available at ws://${HOST}:${PORT}/ws`);
    if (!API_KEY) {
      logger.warn('No API key configured! Set BYTEPAD_API_KEY environment variable.');
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

function handleWebSocketMessage(
  ws: WebSocket,
  message: { type: string; store?: string },
  clientSubscriptions: Map<WebSocket, Set<string>>
) {
  const subs = clientSubscriptions.get(ws);

  switch (message.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      break;

    case 'subscribe':
      if (message.store && subs) {
        subs.add(message.store);
        ws.send(JSON.stringify({
          type: 'subscribed',
          store: message.store,
          success: true,
        }));
      }
      break;

    case 'unsubscribe':
      if (message.store && subs) {
        subs.delete(message.store);
        ws.send(JSON.stringify({
          type: 'unsubscribed',
          store: message.store,
          success: true,
        }));
      }
      break;

    case 'subscribe_all':
      if (subs) {
        subs.add('all');
        ws.send(JSON.stringify({
          type: 'subscribed',
          store: 'all',
          success: true,
        }));
      }
      break;

    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: `Unknown message type: ${message.type}`,
      }));
  }
}

async function shutdown() {
  logger.info('Shutting down...');

  if (wss) {
    wss.clients.forEach((client) => {
      client.close(1000, 'Server shutting down');
    });
    wss.close();
  }

  if (httpServer) {
    httpServer.close(() => {
      logger.info('Server stopped');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

// Start
startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
