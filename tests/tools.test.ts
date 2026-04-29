import { buildToolDefinitions, executeTool } from '../src/tools.js'
import { makeManifest } from './fixtures/manifest.js'

function makeFetch(impl: (url: string, init?: RequestInit) => Promise<Response>): typeof fetch {
  return ((url: string, init?: RequestInit) => impl(url, init)) as unknown as typeof fetch
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('buildToolDefinitions', () => {
  it('produces one tool per endpoint with mcp_tool + input_schema', () => {
    const tools = buildToolDefinitions(makeManifest())
    expect(tools).toHaveLength(1)
    expect(tools[0].name).toBe('get_balance')
    expect(tools[0].inputSchema).toEqual({
      type: 'object',
      properties: {},
      additionalProperties: false,
    })
    expect(tools[0].description).toContain('Returns the account balance')
    expect(tools[0].description).toContain('https://www.iletimerkezi.com/en/docs/api/get-balance')
  })

  it('strips Markdown formatting from descriptions', () => {
    const manifest = makeManifest()
    manifest.endpoints[0].summary.en =
      'The `send-sms` endpoint delivers messages. Use [`get-report`](./get-report.md) to track them. Treated as an **order**.'
    const tools = buildToolDefinitions(manifest)
    expect(tools[0].description).not.toContain('`')
    expect(tools[0].description).not.toContain('**')
    expect(tools[0].description).not.toContain('](')
    expect(tools[0].description).toContain('send-sms endpoint')
    expect(tools[0].description).toContain('get-report')
    expect(tools[0].description).toContain('order')
  })

  it('skips endpoints without mcp_tool', () => {
    const manifest = makeManifest()
    delete manifest.endpoints[0].mcp_tool
    expect(buildToolDefinitions(manifest)).toHaveLength(0)
  })
})

describe('executeTool — get_balance', () => {
  it('wraps input in request.authentication envelope and returns success body', async () => {
    const tools = buildToolDefinitions(makeManifest())
    const tool = tools[0]
    let captured: { url: string; body: unknown } | null = null
    const fetchImpl = makeFetch(async (url, init) => {
      captured = { url, body: JSON.parse(init!.body as string) }
      return jsonResponse({
        response: { status: { code: 200, message: 'OK' }, balance: { amount: 75.5, sms: 251 } },
      })
    })

    const outcome = await executeTool(tool, {}, {
      credentials: { key: 'k', hash: 'h' },
      fetchImpl,
    })

    expect(outcome.isError).toBe(false)
    expect(outcome.text).toContain('succeeded')
    expect(outcome.text).toContain('"amount": 75.5')
    expect(captured).not.toBeNull()
    expect(captured!.url).toBe('https://api.iletimerkezi.com/v1/get-balance/json')
    expect(captured!.body).toEqual({
      request: { authentication: { key: 'k', hash: 'h' } },
    })
  })

  it('returns 401 guidance pointing to panel toggle and auth doc', async () => {
    const tools = buildToolDefinitions(makeManifest())
    const tool = tools[0]
    const fetchImpl = makeFetch(async () =>
      jsonResponse({ response: { status: { code: 401, message: 'API erişim izniniz yok' } } }, 401),
    )

    const outcome = await executeTool(tool, {}, {
      credentials: { key: 'k', hash: 'h' },
      fetchImpl,
    })

    expect(outcome.isError).toBe(true)
    expect(outcome.text).toContain('failed')
    expect(outcome.text).toContain('Allow API access')
    expect(outcome.text).toContain(
      'https://www.iletimerkezi.com/docs/api/authentication',
    )
  })
})
