#!/usr/bin/env node
// Generates src/version.ts from package.json so the MCP handshake always
// reports the published package version. Runs automatically via `prebuild`.
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'))

const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/
if (!pkg.version || !SEMVER.test(pkg.version)) {
  console.error(`generate-version: invalid version in package.json: ${pkg.version}`)
  process.exit(1)
}

const content = `// Generated from package.json by scripts/generate-version.mjs - do not edit.
export const PACKAGE_VERSION = '${pkg.version}'
`

writeFileSync(resolve(ROOT, 'src/version.ts'), content)
console.log(`generate-version: src/version.ts -> ${pkg.version}`)
