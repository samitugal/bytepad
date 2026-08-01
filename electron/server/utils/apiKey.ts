import { randomBytes, timingSafeEqual } from 'crypto';
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

  if (!key || !storedKey) {
    return false;
  }

  const keyBuffer = Buffer.from(key);
  const storedBuffer = Buffer.from(storedKey);

  // timingSafeEqual throws on length mismatch, so compare the key against
  // itself in that case to avoid a length-based timing side channel while
  // still returning false.
  if (keyBuffer.length !== storedBuffer.length) {
    timingSafeEqual(keyBuffer, keyBuffer);
    return false;
  }

  return timingSafeEqual(keyBuffer, storedBuffer);
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
