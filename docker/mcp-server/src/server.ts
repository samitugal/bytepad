/**
 * Standalone MCP Server for Docker
 * Runs independently without Electron
 */

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer, Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { fileStoreBridge, initializeStore, onStoreChange } from './fileStoreBridge';
import { createRoutes } from './routes';
import { logger } from './logger';

const PORT = parseInt(process.env.MCP_PORT || '3847', 10);
const HOST = process.env.MCP_HOST || '0.0.0.0';
const API_KEY = process.env.BYTEPAD_API_KEY || '';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const DATA_DIR = process.env.DATA_DIR || '/app/data';

let app: Express | null = null;
let httpServer: HttpServer | null = null;
let wss: WebSocketServer | null = null;

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
      version: process.env.npm_package_version || '0.24.1',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
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
