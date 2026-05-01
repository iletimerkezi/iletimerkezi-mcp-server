#!/usr/bin/env node
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { spawn } from 'node:child_process'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ENTRY = resolve(ROOT, 'dist/index.js')
const CACHE_DIR = mkdtempSync(join(tmpdir(), 'imcp-smoke-'))

function send(child, message) {
  child.stdin.write(JSON.stringify(message) + '\n')
}

async function main() {
  const child = spawn('node', [ENTRY], {
    cwd: ROOT,
    env: {
      ...process.env,
      ILETIMERKEZI_API_KEY: process.env.ILETIMERKEZI_API_KEY || 'smoke',
      ILETIMERKEZI_API_HASH: process.env.ILETIMERKEZI_API_HASH || 'smoke',
      ILETIMERKEZI_MANIFEST_URL: 'http://127.0.0.1:9/never-resolves',
      ILETIMERKEZI_MCP_CACHE_DIR: CACHE_DIR,
    },
    stdio: ['pipe', 'pipe', 'inherit'],
  })

  let buffer = ''
  const responses = []
  child.stdout.on('data', (chunk) => {
    buffer += chunk.toString('utf8')
    let idx
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, idx).trim()
      buffer = buffer.slice(idx + 1)
      if (line) responses.push(JSON.parse(line))
    }
  })

  send(child, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'smoke', version: '0' },
    },
  })

  await new Promise((r) => setTimeout(r, 300))
  send(child, { jsonrpc: '2.0', method: 'notifications/initialized' })

  send(child, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })
  await new Promise((r) => setTimeout(r, 500))

  child.kill()
  try {
    rmSync(CACHE_DIR, { recursive: true, force: true })
  } catch {
    // best-effort cleanup
  }

  const initResp = responses.find((r) => r.id === 1)
  const toolsResp = responses.find((r) => r.id === 2)

  if (!initResp) throw new Error('No initialize response')
  if (!toolsResp) throw new Error('No tools/list response')

  console.log('initialize ok:', initResp.result.serverInfo)
  const tools = toolsResp.result.tools
  console.log(`tools/list returned ${tools.length} tools:`)
  for (const t of tools) {
    const props = Object.keys(t.inputSchema?.properties || {}).length
    console.log(`  - ${t.name} (input properties: ${props})`)
  }
  if (tools.length !== 10) {
    console.error(`EXPECTED 10 tools, got ${tools.length}`)
    process.exit(1)
  }
  const expected = [
    'send_sms',
    'cancel_order',
    'get_report',
    'get_reports',
    'get_balance',
    'get_sender',
    'get_blacklist',
    'add_blacklist',
    'delete_blacklist',
    'iys_register',
  ]
  const got = tools.map((t) => t.name).sort()
  if (JSON.stringify(got) !== JSON.stringify([...expected].sort())) {
    console.error('Tool name set mismatch:', got)
    process.exit(1)
  }
  console.log('smoke OK')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
