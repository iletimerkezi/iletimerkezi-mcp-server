import type { ApiManifest } from '../../src/types.js'

export function makeManifest(): ApiManifest {
  return {
    schema_version: '1',
    generated_at: '2026-04-29T16:29:48.636Z',
    source: 'test-fixture',
    base_url: 'https://api.iletimerkezi.com',
    authentication: {
      type: 'api-key-and-hash',
      location: 'request.authentication.{key,hash}',
      panel_prerequisite: 'Settings → Security → Access Permissions → Allow API access',
      panel_url: 'panel.iletimerkezi.com/settings/security/access',
    },
    endpoints: [
      {
        slug: 'get-balance',
        method: 'POST',
        base_url: 'https://api.iletimerkezi.com',
        path: '/v1/get-balance/json',
        full_url: 'https://api.iletimerkezi.com/v1/get-balance/json',
        auth: 'api-key-and-hash',
        request_shape: 'request.{authentication}',
        response_success_shape: 'response.{status, balance:{amount, sms}}',
        error_codes: [200, 401],
        notes: 'Yan etkisiz, kontör harcamaz.',
        mcp_tool: 'get_balance',
        input_schema: { type: 'object', properties: {}, additionalProperties: false },
        summary: { tr: 'Bakiye sorgular.', en: 'Returns the account balance.' },
        title: { tr: 'Bakiye API', en: 'Balance API' },
        description: { tr: 'Bakiye', en: 'Balance' },
        last_updated: '2026-04-29',
        doc_url: {
          tr: 'https://www.iletimerkezi.com/docs/api/get-balance',
          en: 'https://www.iletimerkezi.com/en/docs/api/get-balance',
        },
        md_url: {
          tr: 'https://www.iletimerkezi.com/docs/api/get-balance.md',
          en: 'https://www.iletimerkezi.com/en/docs/api/get-balance.md',
        },
      },
    ],
    webhook: {},
    llm_resources: {},
  }
}
