import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { SERVER_VERSION } from '../src/server.js'

const pkg = JSON.parse(
  readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')
) as { version: string }

describe('SERVER_VERSION', () => {
  it('matches the package.json version reported in the MCP handshake', () => {
    expect(SERVER_VERSION).toBe(pkg.version)
  })

  it('is a semver string', () => {
    expect(SERVER_VERSION).toMatch(
      /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/
    )
  })
})
