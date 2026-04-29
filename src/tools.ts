import type { ApiManifest, AuthCredentials, ManifestEndpoint } from './types.js'
import { callEndpoint, extractApiStatusCode } from './http.js'

export interface McpToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  endpoint: ManifestEndpoint
}

export function buildToolDefinitions(manifest: ApiManifest): McpToolDefinition[] {
  return manifest.endpoints
    .filter((ep) => ep.mcp_tool && ep.input_schema)
    .map((ep) => ({
      name: ep.mcp_tool!,
      description: buildDescription(ep),
      inputSchema: ep.input_schema as Record<string, unknown>,
      endpoint: ep,
    }))
}

function buildDescription(ep: ManifestEndpoint): string {
  const summary = ep.summary?.en || ep.summary?.tr || ep.notes || ''
  const docUrl = ep.doc_url?.en || ep.doc_url?.tr
  const trimmed = summary.replace(/\s+/g, ' ').trim().slice(0, 600)
  const tail = docUrl ? `\n\nReference: ${docUrl}` : ''
  return `${trimmed}${tail}`.trim()
}

export interface ToolCallContext {
  credentials: AuthCredentials
  fetchImpl?: typeof fetch
  baseUrl?: string
}

export interface ToolCallOutcome {
  isError: boolean
  text: string
}

export async function executeTool(
  tool: McpToolDefinition,
  rawInput: unknown,
  ctx: ToolCallContext,
): Promise<ToolCallOutcome> {
  const input = (rawInput && typeof rawInput === 'object' ? rawInput : {}) as Record<string, unknown>
  const { status, body, request_url } = await callEndpoint({
    endpoint: tool.endpoint,
    input,
    credentials: ctx.credentials,
    fetchImpl: ctx.fetchImpl,
    baseUrl: ctx.baseUrl,
  })

  const apiCode = extractApiStatusCode(body)
  const ok = status >= 200 && status < 300 && (apiCode === null || apiCode === 200)
  const summary = ok
    ? `iletiMerkezi ${tool.endpoint.path} succeeded (HTTP ${status}${apiCode !== null ? `, response.status.code ${apiCode}` : ''}).`
    : `iletiMerkezi ${tool.endpoint.path} failed (HTTP ${status}${apiCode !== null ? `, response.status.code ${apiCode}` : ''}).`
  const guidance = ok ? '' : guidanceFor(apiCode, tool.endpoint)
  const payload = JSON.stringify(body, null, 2)

  return {
    isError: !ok,
    text: [summary, guidance, `Request URL: ${request_url}`, '```json', payload, '```']
      .filter(Boolean)
      .join('\n'),
  }
}

function guidanceFor(code: number | null, ep: ManifestEndpoint): string {
  const docUrl = ep.doc_url?.en || ep.doc_url?.tr || ''
  if (code === 401) {
    return [
      'Authentication failed (401). Verify:',
      '  1. ILETIMERKEZI_API_KEY and ILETIMERKEZI_API_HASH are set correctly in your MCP client config.',
      '  2. In panel.iletimerkezi.com → Settings → Security → Access Permissions, "Allow API access" is ON.',
      '  3. If IP allowlist is enabled, the request originates from a whitelisted IP.',
      `Auth reference: https://www.iletimerkezi.com/docs/api/authentication`,
    ].join('\n')
  }
  if (code !== null) {
    return [
      `Error code ${code}. See the iletiMerkezi error codes reference and the endpoint page below.`,
      `Endpoint reference: ${docUrl}`,
      'Error codes: https://www.iletimerkezi.com/docs/api/error-codes',
    ].join('\n')
  }
  return docUrl ? `Endpoint reference: ${docUrl}` : ''
}
