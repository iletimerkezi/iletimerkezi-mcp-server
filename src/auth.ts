import type { AuthCredentials } from './types.js'

export class MissingCredentialsError extends Error {
  constructor() {
    super(
      'iletiMerkezi credentials missing. Set ILETIMERKEZI_API_KEY and ' +
        'ILETIMERKEZI_API_HASH environment variables in your MCP client config. ' +
        'Both values are issued from panel.iletimerkezi.com → Settings → Security → API Access. ' +
        'Also enable "Allow API access" under Settings → Security → Access Permissions, ' +
        'otherwise the API returns 401. See https://www.iletimerkezi.com/docs/api/authentication',
    )
    this.name = 'MissingCredentialsError'
  }
}

export function readCredentials(env: NodeJS.ProcessEnv = process.env): AuthCredentials {
  const key = (env.ILETIMERKEZI_API_KEY || '').trim()
  const hash = (env.ILETIMERKEZI_API_HASH || '').trim()
  if (!key || !hash) throw new MissingCredentialsError()
  return { key, hash }
}
