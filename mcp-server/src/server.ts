// MCP Server Implementation

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

import { allToolDefinitions, executeTool } from './tools/index.js'
import { resourceDefinitions, readResource } from './resources/index.js'
import { logger } from './utils/index.js'

export function createServer(): Server {
  const server = new Server(
    {
      name: 'bytepad-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  )

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug(`Listing ${allToolDefinitions.length} tools`)
    return {
      tools: allToolDefinitions,
    }
  })

  // Execute tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params
    logger.info(`Executing tool: ${name}`, args)

    const result = await executeTool(name, args || {})

    logger.debug(`Tool result: ${result.success ? 'success' : 'failure'}`, {
      message: result.message,
    })

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    }
  })

  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    logger.debug(`Listing ${resourceDefinitions.length} resources`)
    return {
      resources: resourceDefinitions,
    }
  })

  // Read resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params
    logger.info(`Reading resource: ${uri}`)

    const result = readResource(uri)

    if (!result) {
      throw new Error(`Resource not found: ${uri}`)
    }

    return {
      contents: [
        {
          uri,
          mimeType: result.mimeType,
          text: result.content,
        },
      ],
    }
  })

  return server
}

export async function runServer(): Promise<void> {
  const server = createServer()
  const transport = new StdioServerTransport()

  logger.info('Starting Bytepad MCP server...')

  await server.connect(transport)

  logger.info('Bytepad MCP server connected and ready')

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down...')
    await server.close()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    logger.info('Shutting down...')
    await server.close()
    process.exit(0)
  })
}
