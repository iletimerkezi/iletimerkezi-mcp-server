import { promises as fs, readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { ApiManifest, ManifestLoadResult, ManifestSource } from './types.js'

const DEFAULT_MANIFEST_URL = 'https://www.iletimerkezi.com/api/manifest.json'
const FETCH_TIMEOUT_MS = 5_000
const CACHE_TTL_MS = 24 * 60 * 60 * 1_000

export interface LoadOptions {
  manifestUrl?: string
  cacheDir?: string
  cacheFile?: string
  fetchImpl?: typeof fetch
  now?: () => number
}

export function getManifestUrl(env: NodeJS.ProcessEnv = process.env): string {
  return (env.ILETIMERKEZI_MANIFEST_URL || DEFAULT_MANIFEST_URL).replace(/\/$/, '')
}

export function getCachePath(env: NodeJS.ProcessEnv = process.env): { dir: string; file: string } {
  const root = env.ILETIMERKEZI_MCP_CACHE_DIR || path.join(os.homedir(), '.cache', 'iletimerkezi-mcp')
  return { dir: root, file: path.join(root, 'manifest.json') }
}

interface CacheEnvelope {
  fetched_at: string
  manifest: ApiManifest
}

async function readCache(file: string, now: number): Promise<CacheEnvelope | null> {
  try {
    const raw = await fs.readFile(file, 'utf8')
    const parsed = JSON.parse(raw) as CacheEnvelope
    if (!parsed.fetched_at || !parsed.manifest) return null
    const age = now - new Date(parsed.fetched_at).getTime()
    if (Number.isNaN(age) || age < 0 || age > CACHE_TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

async function writeCache(dir: string, file: string, envelope: CacheEnvelope): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
  const tmp = `${file}.tmp.${process.pid}`
  await fs.writeFile(tmp, JSON.stringify(envelope, null, 2), 'utf8')
  await fs.rename(tmp, file)
}

async function fetchLive(url: string, fetchImpl: typeof fetch): Promise<ApiManifest> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetchImpl(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Manifest fetch failed: HTTP ${res.status}`)
    const json = (await res.json()) as ApiManifest
    if (!Array.isArray(json.endpoints)) throw new Error('Manifest missing endpoints array')
    return json
  } finally {
    clearTimeout(timer)
  }
}

function loadFallback(): ApiManifest {
  const scriptDir = process.argv[1] ? path.dirname(process.argv[1]) : process.cwd()
  const candidates = [
    process.env.ILETIMERKEZI_FALLBACK_MANIFEST,
    path.resolve(scriptDir, 'manifest.fallback.json'),
    path.resolve(scriptDir, '../manifest.fallback.json'),
    path.resolve(process.cwd(), 'dist/manifest.fallback.json'),
  ].filter((p): p is string => typeof p === 'string' && p.length > 0)
  for (const candidate of candidates) {
    try {
      return JSON.parse(readFileSync(candidate, 'utf8')) as ApiManifest
    } catch {
      // try next
    }
  }
  throw new Error(
    'iletiMerkezi manifest is unavailable: live fetch failed, no cache, and no fallback shipped with the package.',
  )
}

export async function loadManifest(options: LoadOptions = {}): Promise<ManifestLoadResult> {
  const url = options.manifestUrl || getManifestUrl()
  const cache = options.cacheFile
    ? { dir: options.cacheDir || path.dirname(options.cacheFile), file: options.cacheFile }
    : getCachePath()
  const now = options.now ? options.now() : Date.now()
  const fetchImpl = options.fetchImpl || globalThis.fetch

  const cached = await readCache(cache.file, now)
  if (cached) {
    return { manifest: cached.manifest, source: 'cache', fetched_at: cached.fetched_at }
  }

  try {
    const live = await fetchLive(url, fetchImpl)
    const fetched_at = new Date(now).toISOString()
    void writeCache(cache.dir, cache.file, { fetched_at, manifest: live }).catch(() => {})
    return { manifest: live, source: 'live', fetched_at }
  } catch {
    const fallback = loadFallback()
    return {
      manifest: fallback,
      source: 'fallback' as ManifestSource,
      fetched_at: fallback.generated_at,
    }
  }
}
