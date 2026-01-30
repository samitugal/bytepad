import { randomBytes } from 'crypto';
import Store from 'electron-store';

const store = new Store();

export function getOrCreateApiKey(): string {
  let key = store.get('mcp.apiKey') as string | undefined;
  if (!key) {
    key = `bp_${randomBytes(32).toString('hex')}`;
    store.set('mcp.apiKey', key);
    console.log('[MCP] Generated new API key');
  }
  return key;
}

export function validateApiKey(key: string): boolean {
  const storedKey = store.get('mcp.apiKey') as string | undefined;
  return key === storedKey;
}

export function regenerateApiKey(): string {
  const key = `bp_${randomBytes(32).toString('hex')}`;
  store.set('mcp.apiKey', key);
  console.log('[MCP] Regenerated API key');
  return key;
}

export function getApiKey(): string | undefined {
  return store.get('mcp.apiKey') as string | undefined;
}
