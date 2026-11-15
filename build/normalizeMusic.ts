import { execFile } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, rm } from 'node:fs/promises'
import { basename, extname, resolve } from 'node:path'
import { promisify } from 'node:util'
import ffmpegPath from 'ffmpeg-static'
import { normalizePath, type Plugin, type ResolvedConfig } from 'vite'

// Match perceived loudness, rather than peaks. A generous LRA preserves the
// music's dynamics; two-pass loudnorm uses a constant gain whenever possible.
// https://ffmpeg.org/ffmpeg-filters.html#loudnorm
const TARGET_LUFS = -18
const TRUE_PEAK_DB = -2
const FILTER = `loudnorm=I=${TARGET_LUFS}:TP=${TRUE_PEAK_DB}:LRA=50:dual_mono=true`
const ENCODING = ['-c:a', 'libmp3lame', '-b:a', '192k', '-ar', '44100', '-ac', '2']
const AUDIO_FILE = /\.(mp3|m4a|ogg|wav)$/i
const run = promisify(execFile)

interface Loudness {
  input_i: string
  input_tp: string
  input_lra: string
  input_thresh: string
  target_offset: string
}

async function ffmpeg(args: string[]): Promise<string> {
  if (!ffmpegPath) throw new Error('No FFmpeg binary for this platform. Set FFMPEG_BIN to a supported executable.')
  try {
    const { stderr } = await run(ffmpegPath, ['-hide_banner', '-nostdin', '-nostats', ...args], {
      windowsHide: true,
      maxBuffer: 2 * 1024 * 1024,
    })
    return stderr
  } catch (error) {
    throw new Error(`Music normalisation failed: ${error instanceof Error ? error.message : error}`)
  }
}

/** Original files are read only. Publish an atomic, content-addressed cache copy. */
function createNormaliser(cacheDir: string, log: (message: string) => void) {
  const pending = new Map<string, Promise<string>>()
  // Vite can request all tracks together. Encode one at a time to keep CPU and
  // memory use bounded, including on small build machines.
  let queue = Promise.resolve()

  return async (file: string): Promise<string> => {
    const source = await readFile(file)
    const key = createHash('sha256')
      .update(JSON.stringify({ version: 1, filter: FILTER, encoding: ENCODING }))
      .update(source)
      .digest('hex')
    const cached = resolve(cacheDir, `${key}.mp3`)
    if (existsSync(cached)) return cached
    const existing = pending.get(key)
    if (existing) return existing

    const task = queue.then(async () => {
      await mkdir(cacheDir, { recursive: true })
      log(`[music] Normalising ${basename(file)} to ${TARGET_LUFS} LUFS`)
      const input = ['-i', file, '-map', '0:a:0', '-vn', '-sn', '-dn']
      const analysis = await ffmpeg([
        ...input, '-af', `${FILTER}:print_format=json`, '-f', 'null', '-',
      ])
      const json = analysis.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0]
      if (!json) throw new Error(`No loudness measurement for ${basename(file)}`)
      const measured = JSON.parse(json) as Loudness
      const fields = ['input_i', 'input_tp', 'input_lra', 'input_thresh', 'target_offset'] as const
      if (!fields.every(field => Number.isFinite(Number(measured[field])))) {
        throw new Error(`Cannot normalise silent or invalid audio: ${basename(file)}`)
      }
      const secondPass = [
        FILTER,
        `measured_I=${measured.input_i}`,
        `measured_TP=${measured.input_tp}`,
        `measured_LRA=${measured.input_lra}`,
        `measured_thresh=${measured.input_thresh}`,
        `offset=${measured.target_offset}`,
        'linear=true',
      ].join(':')
      const temporary = `${cached}.${randomUUID()}.tmp.mp3`
      try {
        await ffmpeg([
          ...input, '-af', secondPass, ...ENCODING,
          '-map_metadata', '-1', '-id3v2_version', '0', '-write_id3v1', '0',
          temporary,
        ])
        await rename(temporary, cached)
      } finally {
        await rm(temporary, { force: true })
      }
      return cached
    })
    pending.set(key, task)
    queue = task.then(() => {}, () => {})
    try {
      return await task
    } finally {
      pending.delete(key)
    }
  }
}

/** Replace only bg_music URL imports, before Vite hashes the emitted audio. */
export function normalizeMusic(): Plugin {
  let config: ResolvedConfig
  let musicDir: string
  let normalise: ReturnType<typeof createNormaliser>

  return {
    name: 'normalize-background-music',
    enforce: 'pre',
    configResolved(resolved) {
      config = resolved
      musicDir = normalizePath(resolve(config.root, 'src/assets/bg_music')) + '/'
      normalise = createNormaliser(resolve(config.root, '.cache/music'), message => config.logger.info(message))
    },
    async load(id) {
      const [file, query = ''] = id.split('?')
      if (!normalizePath(file).startsWith(musicDir) || !AUDIO_FILE.test(file) || !new URLSearchParams(query).has('url')) return
      this.addWatchFile(file)
      const cached = await normalise(file)
      if (config.command === 'build') {
        const reference = this.emitFile({
          type: 'asset',
          name: `${basename(file, extname(file))}.mp3`,
          source: await readFile(cached),
        })
        return `export default ${JSON.stringify(`__VITE_ASSET__${reference}__`)}`
      }
      // Vite's file server supplies MIME types and range requests for seeking.
      const url = `${config.base}@fs/${normalizePath(cached)}`
      return `export default ${JSON.stringify(encodeURI(url))}`
    },
  }
}
