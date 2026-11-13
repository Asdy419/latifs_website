import { isMuted } from './audio'

/**
 * Background music: one random track from src/assets/bg_music at a time,
 * looping, at full volume (sound effects sit below it). Respects the mute
 * toggle, which only ever affects the music.
 *
 * Drop more files into bg_music and they're picked up automatically; the
 * "Now Playing" title comes from the file name (see trackTitle).
 *
 *   startMusic()  → resolves with the track title once it's audible
 *                   (or null if muted / no tracks)
 *   pauseMusic()  → fade out, keep the position (used by mute)
 *   stopMusic()   → fade out and drop the track (leaving the menu / page)
 */

const TRACKS = import.meta.glob<string>('../assets/bg_music/*.{mp3,m4a,ogg,wav}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const MUSIC_VOLUME = 1
const FADE_IN_MS = 800
const FADE_OUT_MS = 500

interface Track {
  audio: HTMLAudioElement
  title: string
  /** Resolves once the track is audible. */
  started: Promise<string>
}

let current: Track | null = null

/**
 * Start (or resume) the background music. Call it from inside a tap/key
 * handler where possible: iOS only lets audio start from a user gesture.
 * If the browser blocks it, it starts on the visitor's next tap/key press.
 */
export function startMusic(): Promise<string | null> {
  if (isMuted()) return Promise.resolve(null)

  if (current) {
    wanted.add(current.audio)
    // Paused, or still fading out from a quick mute → bring it back
    if (current.audio.paused || fadingOut.has(current.audio)) {
      const track = current
      track.started = playWhenAllowed(track.audio).then(() => track.title)
    }
    return current.started
  }

  const path = pickTrack()
  if (!path) return Promise.resolve(null)
  const audio = new Audio(TRACKS[path])
  audio.loop = true
  audio.preload = 'auto'
  const title = trackTitle(path)
  wanted.add(audio)
  const track: Track = { audio, title, started: playWhenAllowed(audio).then(() => title) }
  current = track
  return track.started
}

/** Fade out and pause, keeping the place in the track (mute). */
export function pauseMusic(): void {
  if (!current) return
  wanted.delete(current.audio)
  fadeOut(current.audio)
}

/** Fade out and drop the current track (leaving the page or menu). */
export function stopMusic(): void {
  if (!current) return
  const { audio } = current
  current = null
  wanted.delete(audio)
  fadeOut(audio, () => { audio.removeAttribute('src'); audio.load() }) // stop downloading too
}

// Back/forward cache: browsers pause media when you leave; resume on return.
window.addEventListener('pageshow', e => {
  if (e.persisted && current?.audio.paused) startMusic()
})

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * "Y2Mate.is - Rogues Gallery - Mirage Saloon Zone Act 2.mp3"
 *   → "Rogues Gallery - Mirage Saloon Zone Act 2"
 * Strips the folder, extension, downloader prefixes and "(128 kbps)"-style tags,
 * and turns "_ " back into ": " (file names can't contain colons).
 */
function trackTitle(path: string): string {
  return path
    .replace(/^.*\//, '')
    .replace(/\.[^.]+$/, '')
    .replace(/^y2mate(\.[a-z]+)?\s*-\s*/i, '')
    .replace(/\s*[([]\s*\d+\s*kbps\s*[)\]]\s*$/i, '')
    .replace(/_ /g, ': ')
    .trim()
}

const LAST_TRACK_KEY = 'portfolio:lastTrack'

/** A random track from bg_music — never the same one twice in a row when there's a choice. */
function pickTrack(): string | undefined {
  const paths = Object.keys(TRACKS)
  let last: string | null = null
  try { last = sessionStorage.getItem(LAST_TRACK_KEY) } catch { /* storage blocked */ }
  const choices = paths.length > 1 ? paths.filter(p => p !== last) : paths
  const path = choices[Math.floor(Math.random() * choices.length)]
  try { if (path) sessionStorage.setItem(LAST_TRACK_KEY, path) } catch { /* storage blocked */ }
  return path
}

/** play() now if allowed, otherwise on the first tap/key press. Fades in either way. */
function playWhenAllowed(audio: HTMLAudioElement): Promise<void> {
  const start = () => {
    if (audio.paused) audio.volume = 0 // (if it was mid fade-out, fade back up from where it is)
    return audio.play().then(() => { fade(audio, MUSIC_VOLUME, FADE_IN_MS) })
  }
  return start().catch(() => new Promise<void>(resolve => {
    const events = ['pointerdown', 'keydown', 'touchend'] as const
    const retry = () => {
      events.forEach(type => window.removeEventListener(type, retry, true))
      start().then(resolve, () => {})
    }
    events.forEach(type => window.addEventListener(type, retry, true))
  }))
}

// Whether each track should be audible right now — the latest request wins.
// A fade-out only pauses if nobody has asked for the music back in the meantime
// (e.g. mute → unmute faster than the fade), so it can never strand it paused.
const wanted = new WeakSet<HTMLAudioElement>()
const fadingOut = new WeakSet<HTMLAudioElement>()

function fadeOut(audio: HTMLAudioElement, then?: () => void): void {
  fadingOut.add(audio)
  fade(audio, 0, FADE_OUT_MS).then(finished => {
    fadingOut.delete(audio)
    if (!finished || wanted.has(audio)) return // a fade-in / unmute took over
    audio.pause()
    then?.()
  })
}

// Each element's latest fade wins, so a fade-in can't fight a fade-out.
const fades = new WeakMap<HTMLAudioElement, number>()

/**
 * Ramp the volume (iOS ignores volume, so there it just jumps at the end).
 * Resolves true when it finishes, false if a newer fade replaced it.
 *
 * Animation frames drive the ramp, but browsers stop those in hidden tabs, so
 * a timer guarantees the fade still finishes on time (otherwise muting and
 * switching tab straight away could leave the music playing).
 */
function fade(audio: HTMLAudioElement, to: number, ms: number): Promise<boolean> {
  const id = (fades.get(audio) ?? 0) + 1
  fades.set(audio, id)
  const from = audio.volume
  const t0 = performance.now()
  return new Promise(resolve => {
    let done = false
    const finish = (finished: boolean) => {
      if (done) return
      done = true
      clearTimeout(backup)
      if (finished) audio.volume = to
      resolve(finished)
    }
    const step = (now: number) => {
      if (done) return
      if (fades.get(audio) !== id) return finish(false)
      const t = Math.min(1, (now - t0) / ms)
      if (t >= 1) return finish(true)
      // never let rounding push it outside 0–1 (e.g. 0.37 + 0.63 = 1.0000000000000002)
      audio.volume = Math.min(1, Math.max(0, from + (to - from) * t))
      requestAnimationFrame(step)
    }
    const backup = setTimeout(() => finish(fades.get(audio) === id), ms + 50)
    requestAnimationFrame(step)
  })
}
