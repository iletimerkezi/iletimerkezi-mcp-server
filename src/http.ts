import type { AuthCredentials, ManifestEndpoint } from './types.js'

export interface ApiCallOptions {
  endpoint: ManifestEndpoint
  input: Record<string, unknown>
  credentials: AuthCredentials
  baseUrl?: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

export interface ApiCallResult {
  status: number
  body: unknown
  request_url: string
}

export class ApiCallError extends Error {
  status: number
  body: unknown
  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiCallError'
    this.status = status
    this.body = body
  }
}

export async function callEndpoint(opts: ApiCallOptions): Promise<ApiCallResult> {
  const fetchImpl = opts.fetchImpl || globalThis.fetch
  const baseUrl = (opts.baseUrl || opts.endpoint.base_url).replace(/\/$/, '')
  const url = `${baseUrl}${opts.endpoint.path}`

  const body = {
    request: {
      authentication: { key: opts.credentials.key, hash: opts.credentials.hash },
      ...opts.input,
    },
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 30_000)
  try {
    const res = await fetchImpl(url, {
      method: opts.endpoint.method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const text = await res.text()
    let parsed: unknown
    try {
      parsed = text ? JSON.parse(text) : null
    } catch {
      parsed = text
    }
    return { status: res.status, body: parsed, request_url: url }
  } finally {
    clearTimeout(timer)
  }
}

export function extractApiStatusCode(body: unknown): number | null {
  if (!body || typeof body !== 'object') return null
  const obj = body as Record<string, unknown>
  const response = obj.response
  if (!response || typeof response !== 'object') return null
  const status = (response as Record<string, unknown>).status
  if (!status || typeof status !== 'object') return null
  const code = (status as Record<string, unknown>).code
  return typeof code === 'number' ? code : null
}
