#!/usr/bin/env node
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const MANIFEST_URL =
  process.env.ILETIMERKEZI_MANIFEST_URL || 'https://www.iletimerkezi.com/api/manifest.json'
const TARGET = resolve(ROOT, 'dist/manifest.fallback.json')

async function main() {
  process.stdout.write(`[fetch-fallback] GET ${MANIFEST_URL}\n`)
  const res = await fetch(MANIFEST_URL, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!Array.isArray(json.endpoints) || json.endpoints.length === 0) {
    throw new Error('Manifest has no endpoints')
  }
  await mkdir(dirname(TARGET), { recursive: true })
  await writeFile(TARGET, JSON.stringify(json, null, 2) + '\n', 'utf8')
  process.stdout.write(
    `[fetch-fallback] wrote ${TARGET} (${json.endpoints.length} endpoints, generated_at ${json.generated_at})\n`,
  )
}

main().catch((err) => {
  process.stderr.write(`[fetch-fallback] failed: ${err.message}\n`)
  process.exit(1)
})
