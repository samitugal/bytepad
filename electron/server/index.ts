import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server as HttpServer, createServer } from 'http';
import { WebSocketServer } from 'ws';
import Store from 'electron-store';

import { ServerConfig, getConfig, defaultConfig } from './config';
import { authMiddleware } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { getOrCreateApiKey } from './utils/apiKey';
import { logger, setLogLevel } from './utils/logger';
import apiRoutes from './routes';
import { onStoreChange } from './bridges/storeBridge';
import { createMCPServer } from './mcp';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

const store = new Store();

let app: Express | null = null;
let httpServer: HttpServer | null = null;
let wss: WebSocketServer | null = null;
let isRunning = false;

// Store MCP transports by session ID
const mcpTransports: Map<string, SSEServerTransport> = new Map();
const mcpStreamableTransports: Map<string, StreamableHTTPServerTransport> = new Map();

export interface MCPServerInfo {
  isRunning: boolean;
  port: number;
  host: string;
  apiKey: string;
  connectedClients: number;
  startedAt: string | null;
}

let serverStartedAt: string | null = null;

export function getServerInfo(): MCPServerInfo {
  const config = getConfig(store);
  return {
    isRunning,
    port: config.port,
    host: config.host,
    apiKey: getOrCreateApiKey(),
    connectedClients: wss?.clients?.size || 0,
    startedAt: serverStartedAt,
  };
}

export async function startMCPServer(config?: Partial<ServerConfig>): Promise<void> {
  if (isRunning) {
    logger.warn('MCP Server is already running');
    return;
  }

  const serverConfig: ServerConfig = {
    ...defaultConfig,
    ...getConfig(store),
    ...config,
  };

  setLogLevel(serverConfig.logLevel);

  // Ensure API key exists
  const apiKey = getOrCreateApiKey();
  logger.info(`API Key: ${apiKey.slice(0, 10)}...`);

  // Create Express app
  app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for API server
  }));

  // CORS configuration
  if (serverConfig.enableCors) {
    app.use(cors({
      origin: serverConfig.corsOrigins.includes('*') ? '*' : serverConfig.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));
  }

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.debug(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
  });

  // Auth middleware (skip for health check)
  app.use(authMiddleware);

  // API routes
  app.use('/api', apiRoutes);

  // Root health check redirect
  app.get('/health', (req, res) => {
    res.redirect('/api/health');
  });

  // MCP SSE endpoint - establishes SSE stream (GET /mcp)
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
      logger.error(`MCP SSE: Error establishing stream - ${(error as Error).message}`);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to establish SSE stream' });
      }
    }
  });

  // MCP Streamable HTTP endpoint (POST /mcp) - newer protocol
  app.post('/mcp', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    logger.info(`MCP Streamable HTTP: ${sessionId ? 'Existing session ' + sessionId : 'New request'}`);

    try {
      let transport: StreamableHTTPServerTransport;

      // Check for existing session
      if (sessionId && mcpStreamableTransports.has(sessionId)) {
        transport = mcpStreamableTransports.get(sessionId)!;
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // New session - create transport
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => crypto.randomUUID(),
          onsessioninitialized: (newSessionId) => {
            mcpStreamableTransports.set(newSessionId, transport);
            logger.info(`MCP Streamable HTTP: Session initialized - ${newSessionId}`);
          },
        });

        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid) {
            mcpStreamableTransports.delete(sid);
            logger.info(`MCP Streamable HTTP: Session ${sid} closed`);
          }
        };

        // Connect MCP server to transport
        const mcpServer = createMCPServer();
        await mcpServer.connect(transport);
      } else if (!sessionId) {
        // Non-init request without session
        res.status(400).json({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Bad Request: Missing mcp-session-id header' },
          id: null,
        });
        return;
      } else {
        // Unknown session
        res.status(404).json({
          jsonrpc: '2.0',
          error: { code: -32001, message: 'Session not found' },
          id: null,
        });
        return;
      }

      // Handle the request
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      logger.error(`MCP Streamable HTTP: Error - ${(error as Error).message}`);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: (error as Error).message },
          id: null,
        });
      }
    }
  });

  // MCP DELETE endpoint - close session (Streamable HTTP)
  app.delete('/mcp', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (!sessionId) {
      res.status(400).json({ error: 'Missing mcp-session-id header' });
      return;
    }

    const transport = mcpStreamableTransports.get(sessionId);
    if (transport) {
      await transport.close();
      mcpStreamableTransports.delete(sessionId);
      res.status(200).json({ success: true, message: 'Session closed' });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  });

  // MCP messages endpoint - receives client JSON-RPC requests
  app.post('/messages', async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      logger.warn('MCP messages: Missing sessionId parameter');
      res.status(400).json({ error: 'Missing sessionId parameter' });
      return;
    }

    const transport = mcpTransports.get(sessionId);
    if (!transport) {
      logger.warn(`MCP messages: Unknown session ${sessionId}`);
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    try {
      // Handle the message using the transport
      await transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      logger.error(`MCP messages: Error handling message - ${(error as Error).message}`);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to process message' });
      }
    }
  });

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Create HTTP server
  httpServer = createServer(app);

  // WebSocket server
  if (serverConfig.enableWebSocket) {
    wss = new WebSocketServer({
      server: httpServer,
      path: '/ws',
    });

    // Track subscriptions per client
    const clientSubscriptions = new Map<WebSocket, Set<string>>();

    wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      logger.info(`WebSocket client connected from ${clientIp}`);

      // Initialize subscription set for this client
      clientSubscriptions.set(ws, new Set());

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          handleWebSocketMessage(ws, message, clientSubscriptions);
        } catch (err) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
        }
      });

      ws.on('close', () => {
        logger.info(`WebSocket client disconnected from ${clientIp}`);
        clientSubscriptions.delete(ws);
      });

      ws.on('error', (err) => {
        logger.error(`WebSocket error: ${err.message}`);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to bytepad MCP server',
        timestamp: new Date().toISOString(),
      }));
    });

    // Listen for store changes and broadcast to subscribed clients
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
        if (client.readyState === 1) { // WebSocket.OPEN
          const subs = clientSubscriptions.get(client);
          // Send if subscribed to this store or subscribed to 'all'
          if (subs && (subs.has(storeName) || subs.has('all'))) {
            client.send(message);
          }
        }
      });
    });
  }

  // Start server
  return new Promise((resolve, reject) => {
    try {
      httpServer!.listen(serverConfig.port, serverConfig.host, () => {
        isRunning = true;
        serverStartedAt = new Date().toISOString();
        logger.info(`MCP Server started on http://${serverConfig.host}:${serverConfig.port}`);
        logger.info(`WebSocket available at ws://${serverConfig.host}:${serverConfig.port}/ws`);
        resolve();
      });

      httpServer!.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          logger.error(`Port ${serverConfig.port} is already in use`);
        }
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

export async function stopMCPServer(): Promise<void> {
  if (!isRunning) {
    logger.warn('MCP Server is not running');
    return;
  }

  return new Promise((resolve) => {
    // Close WebSocket connections
    if (wss) {
      wss.clients.forEach((client) => {
        client.close(1000, 'Server shutting down');
      });
      wss.close();
      wss = null;
    }

    // Close HTTP server
    if (httpServer) {
      httpServer.close(() => {
        logger.info('MCP Server stopped');
        isRunning = false;
        serverStartedAt = null;
        app = null;
        httpServer = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

export async function restartMCPServer(config?: Partial<ServerConfig>): Promise<void> {
  await stopMCPServer();
  await startMCPServer(config);
}

// WebSocket message handler
function handleWebSocketMessage(
  ws: WebSocket,
  message: { type: string; [key: string]: unknown },
  clientSubscriptions: Map<WebSocket, Set<string>>
) {
  const subs = clientSubscriptions.get(ws);

  switch (message.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      break;

    case 'subscribe': {
      const store = message.store as string;
      if (store && subs) {
        subs.add(store);
        logger.debug(`Client subscribed to: ${store}`);
      }
      ws.send(JSON.stringify({
        type: 'subscribed',
        store,
        success: true,
        activeSubscriptions: subs ? Array.from(subs) : [],
      }));
      break;
    }

    case 'unsubscribe': {
      const store = message.store as string;
      if (store && subs) {
        subs.delete(store);
        logger.debug(`Client unsubscribed from: ${store}`);
      }
      ws.send(JSON.stringify({
        type: 'unsubscribed',
        store,
        success: true,
        activeSubscriptions: subs ? Array.from(subs) : [],
      }));
      break;
    }

    case 'subscribe_all':
      if (subs) {
        subs.add('all');
        logger.debug('Client subscribed to all stores');
      }
      ws.send(JSON.stringify({
        type: 'subscribed',
        store: 'all',
        success: true,
      }));
      break;

    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: `Unknown message type: ${message.type}`,
      }));
  }
}

// Broadcast to all WebSocket clients
export function broadcast(data: object) {
  if (!wss) return;

  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

// Export for use in main process
export { getOrCreateApiKey, regenerateApiKey } from './utils/apiKey';
