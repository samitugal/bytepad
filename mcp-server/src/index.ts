#!/usr/bin/env node
// Bytepad MCP Server Entry Point

import { initializeStore } from './store/index.js'
import { initializeSync } from './sync/index.js'
import { runServer } from './server.js'
import { logger } from './utils/index.js'

async function main() {
  try {
    // Initialize data store
    logger.info('Initializing data store...')
    await initializeStore()

    // Initialize sync (will start auto-sync if configured)
    logger.info('Initializing sync...')
    await initializeSync()

    // Start MCP server
    await runServer()
  } catch (error) {
    logger.error('Failed to start server', error)
    process.exit(1)
  }
}

main()
