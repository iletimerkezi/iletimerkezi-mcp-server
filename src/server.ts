import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { readCredentials, MissingCredentialsError } from './auth.js'
import { loadManifest } from './manifest.js'
import { buildToolDefinitions, executeTool } from './tools.js'
import type { ManifestLoadResult } from './types.js'

const SERVER_NAME = 'iletimerkezi'
const SERVER_VERSION = '0.1.0'

export interface CreateServerOptions {
  manifest?: ManifestLoadResult
  fetchImpl?: typeof fetch
  env?: NodeJS.ProcessEnv
}

export async function createServer(options: CreateServerOptions = {}): Promise<Server> {
  const env = options.env || process.env
  const manifestResult =
    options.manifest || (await loadManifest({ fetchImpl: options.fetchImpl }))
  const tools = buildToolDefinitions(manifestResult.manifest)
  const toolByName = new Map(tools.map((t) => [t.name, t]))

  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      capabilities: { tools: {} },
      instructions: buildInstructions(manifestResult, tools.length),
    },
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }))

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = toolByName.get(request.params.name)
    if (!tool) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }],
      }
    }
    let credentials
    try {
      credentials = readCredentials(env)
    } catch (err) {
      const message = err instanceof MissingCredentialsError ? err.message : String(err)
      return { isError: true, content: [{ type: 'text', text: message }] }
    }
    try {
      const outcome = await executeTool(tool, request.params.arguments, {
        credentials,
        fetchImpl: options.fetchImpl,
      })
      return { isError: outcome.isError, content: [{ type: 'text', text: outcome.text }] }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        isError: true,
        content: [{ type: 'text', text: `Tool execution failed: ${message}` }],
      }
    }
  })

  return server
}

function buildInstructions(manifest: ManifestLoadResult, toolCount: number): string {
  return [
    'iletiMerkezi MCP server: a Turkish SMS API (BTK-licensed bulk SMS, OTP, A2P).',
    `Manifest source: ${manifest.source} (fetched_at: ${manifest.fetched_at}). ${toolCount} tools available.`,
    'Authentication: ILETIMERKEZI_API_KEY + ILETIMERKEZI_API_HASH must be set in the client config env. Issue both from panel.iletimerkezi.com → Settings → Security → API Access, and toggle "Allow API access" under Access Permissions.',
    'Reference: https://www.iletimerkezi.com/docs/api/overview',
  ].join('\n')
}
