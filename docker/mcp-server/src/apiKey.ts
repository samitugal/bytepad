/**
 * API key handling for the standalone Docker MCP server.
 *
 * Unlike the embedded (Electron) server, this server has no local keychain
 * to generate/persist a key in - the operator must supply one via the
 * BYTEPAD_API_KEY environment variable. There is no fallback: an unset or
 * blank key means the server will not start (see startServer() in server.ts).
 */

import { timingSafeEqual } from 'crypto';

const API_KEY = process.env.BYTEPAD_API_KEY || '';

// True only when a non-blank key is configured.
export function hasApiKey(): boolean {
  return API_KEY.trim().length > 0;
}

export function validateApiKey(token: string | undefined | null): boolean {
  if (!token || !token.trim() || !API_KEY) {
    return false;
  }

  const tokenBuffer = Buffer.from(token);
  const keyBuffer = Buffer.from(API_KEY);

  // timingSafeEqual throws on length mismatch, so compare the token against
  // itself in that case to avoid a length-based timing side channel while
  // still returning false.
  if (tokenBuffer.length !== keyBuffer.length) {
    timingSafeEqual(tokenBuffer, tokenBuffer);
    return false;
  }

  return timingSafeEqual(tokenBuffer, keyBuffer);
}
