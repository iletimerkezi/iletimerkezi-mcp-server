import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { loadManifest } from '../src/manifest.js'
import { makeManifest } from './fixtures/manifest.js'

async function makeTmpDir(): Promise<string> {
  return await fs.mkdtemp(path.join(os.tmpdir(), 'imcp-'))
}

function makeFetch(impl: (url: string) => Promise<Response>): typeof fetch {
  return ((url: string) => impl(url)) as unknown as typeof fetch
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('loadManifest', () => {
  it('fetches live manifest and writes to cache', async () => {
    const dir = await makeTmpDir()
    const file = path.join(dir, 'manifest.json')
    const fixture = makeManifest()
    const result = await loadManifest({
      manifestUrl: 'https://example/api/manifest.json',
      cacheDir: dir,
      cacheFile: file,
      fetchImpl: makeFetch(async () => jsonResponse(fixture)),
    })
    expect(result.source).toBe('live')
    expect(result.manifest.endpoints[0].mcp_tool).toBe('get_balance')
    // cache write is fire-and-forget; allow microtasks to flush
    await new Promise((r) => setTimeout(r, 20))
    const cached = JSON.parse(await fs.readFile(file, 'utf8'))
    expect(cached.manifest.endpoints[0].mcp_tool).toBe('get_balance')
  })

  it('returns cache when fresh', async () => {
    const dir = await makeTmpDir()
    const file = path.join(dir, 'manifest.json')
    const fixture = makeManifest()
    await fs.writeFile(
      file,
      JSON.stringify({ fetched_at: new Date().toISOString(), manifest: fixture }),
      'utf8',
    )
    let fetched = false
    const result = await loadManifest({
      cacheDir: dir,
      cacheFile: file,
      fetchImpl: makeFetch(async () => {
        fetched = true
        return jsonResponse(fixture)
      }),
    })
    expect(result.source).toBe('cache')
    expect(fetched).toBe(false)
  })

  it('ignores stale cache (>24h) and refetches', async () => {
    const dir = await makeTmpDir()
    const file = path.join(dir, 'manifest.json')
    const fixture = makeManifest()
    const stale = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    await fs.writeFile(
      file,
      JSON.stringify({ fetched_at: stale, manifest: fixture }),
      'utf8',
    )
    let fetched = false
    const result = await loadManifest({
      cacheDir: dir,
      cacheFile: file,
      fetchImpl: makeFetch(async () => {
        fetched = true
        return jsonResponse(fixture)
      }),
    })
    expect(fetched).toBe(true)
    expect(result.source).toBe('live')
  })

  it('throws clear error when fetch fails and no cache, no fallback', async () => {
    const dir = await makeTmpDir()
    const file = path.join(dir, 'manifest.json')
    await expect(
      loadManifest({
        cacheDir: dir,
        cacheFile: file,
        fetchImpl: makeFetch(async () => {
          throw new Error('network down')
        }),
        fallbackPaths: [],
      }),
    ).rejects.toThrow(/manifest is unavailable/)
  })

  it('uses fallback when fetch fails and a fallback path is provided', async () => {
    const dir = await makeTmpDir()
    const file = path.join(dir, 'manifest.json')
    const fallbackFile = path.join(dir, 'manifest.fallback.json')
    await fs.writeFile(fallbackFile, JSON.stringify(makeManifest()), 'utf8')
    const result = await loadManifest({
      cacheDir: dir,
      cacheFile: file,
      fetchImpl: makeFetch(async () => {
        throw new Error('network down')
      }),
      fallbackPaths: [fallbackFile],
    })
    expect(result.source).toBe('fallback')
    expect(result.manifest.endpoints[0].mcp_tool).toBe('get_balance')
  })
})
