export interface AuthCredentials {
  key: string
  hash: string
}

export interface ManifestEndpoint {
  slug: string
  method: 'POST'
  path: string
  full_url: string
  base_url: string
  auth: 'api-key-and-hash'
  request_shape: string
  response_success_shape: string
  error_codes: number[]
  notes: string
  mcp_tool?: string
  input_schema?: Record<string, unknown>
  summary: { tr: string; en: string }
  title: { tr: string; en: string }
  description: { tr: string; en: string }
  doc_url: { tr: string; en: string }
  md_url: { tr: string; en: string }
  last_updated: string
}

export interface ApiManifest {
  schema_version: string
  generated_at: string
  source: string
  base_url: string
  authentication: {
    type: 'api-key-and-hash'
    location: string
    panel_prerequisite: string
    panel_url: string
  }
  endpoints: ManifestEndpoint[]
  webhook: Record<string, unknown>
  llm_resources: Record<string, string>
}

export type ManifestSource = 'live' | 'cache' | 'fallback'

export interface ManifestLoadResult {
  manifest: ApiManifest
  source: ManifestSource
  fetched_at: string
}
