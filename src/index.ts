#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createServer } from './server.js'

async function main(): Promise<void> {
  const server = await createServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  // stderr is safe; stdout is reserved for MCP framing
  process.stderr.write(`iletimerkezi-mcp-server: fatal error: ${err instanceof Error ? err.stack || err.message : String(err)}\n`)
  process.exit(1)
})
