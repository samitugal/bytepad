export interface ServerConfig {
  port: number;
  host: string;
  enableCors: boolean;
  corsOrigins: string[];
  enableWebSocket: boolean;
  enableMcp: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Defaults are intentionally conservative: bind to loopback only and allow
// no cross-origin browser access. Binding to '0.0.0.0' (LAN/Docker reachable)
// or adding CORS origins is an explicit opt-in via settings/store, not a
// built-in default, since it widens the server's network exposure.
export const defaultConfig: ServerConfig = {
  port: 3847,
  host: '127.0.0.1', // Loopback only by default; set mcp.host to opt in to wider exposure
  enableCors: true,
  corsOrigins: [], // No cross-origin browser access by default; add explicit origins to opt in
  enableWebSocket: true,
  enableMcp: true,
  logLevel: 'info',
};

export function getConfig(store: { get: (key: string) => unknown }): ServerConfig {
  return {
    port: (store.get('mcp.port') as number) || defaultConfig.port,
    host: (store.get('mcp.host') as string) || defaultConfig.host,
    enableCors: store.get('mcp.enableCors') as boolean ?? defaultConfig.enableCors,
    corsOrigins: (store.get('mcp.corsOrigins') as string[]) || defaultConfig.corsOrigins,
    enableWebSocket: store.get('mcp.enableWebSocket') as boolean ?? defaultConfig.enableWebSocket,
    enableMcp: store.get('mcp.enableMcp') as boolean ?? defaultConfig.enableMcp,
    logLevel: (store.get('mcp.logLevel') as ServerConfig['logLevel']) || defaultConfig.logLevel,
  };
}
