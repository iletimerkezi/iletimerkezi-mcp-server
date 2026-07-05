import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { SERVER_VERSION } from '../src/server.js'

// Resolved relative to this test file (not the CWD Jest was launched from),
// so IDE runners and scripted invocations read the right package.json.
// Note: __dirname is available because ts-jest compiles tests to CJS here;
// import.meta is not usable under this Jest setup.
const pkg = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'package.json'), 'utf8')
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
