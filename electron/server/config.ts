export interface ServerConfig {
  port: number;
  host: string;
  enableCors: boolean;
  corsOrigins: string[];
  enableWebSocket: boolean;
  enableMcp: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const defaultConfig: ServerConfig = {
  port: 3847,
  host: '0.0.0.0', // Allow Docker and external connections
  enableCors: true,
  corsOrigins: ['*'], // Allow all origins (Docker host.docker.internal)
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
