import menuAcceptUrl from '../assets/shared/MenuAccept.mp3'
import menuBleepUrl from '../assets/shared/MenuBleep.wav'
import menuWooshUrl from '../assets/shared/MenuWoosh.wav'

/**
 * Sound effects, played through the Web Audio API:
 *  - instant playback (HTML <audio> has a noticeable delay on iOS)
 *  - real volume control everywhere (iOS ignores <audio>.volume)
 *
 * Mute only affects background music (see music.ts), never these.
 */

/** Sound effects sit under the background music (0.45 ≈ -5 dB below the old 0.8, which the user found too loud). */
const SFX_VOLUME = 0.45

export interface SoundEffect {
  readonly url: string
  buffer: AudioBuffer | null
  loading: Promise<void> | null
}

const effect = (url: string): SoundEffect => ({ url, buffer: null, loading: null })

export const sfx = {
  /** Confirm / select */
  accept: effect(menuAcceptUrl),
  /** Selection moved */
  bleep: effect(menuBleepUrl),
  /** A project's details opening (the user's pick; its silent tail trimmed off) */
  woosh: effect(menuWooshUrl),
}

// Decoding happens in an OfflineAudioContext so nothing audible is created
// before the first tap/key press (browsers warn about that).
let decoder: OfflineAudioContext | null = null

function load(sound: SoundEffect): Promise<void> {
  sound.loading ??= fetch(sound.url)
    .then(res => res.arrayBuffer())
    .then(data => (decoder ??= new OfflineAudioContext(1, 1, 44100)).decodeAudioData(data))
    .then(buffer => { sound.buffer = buffer })
    .catch(() => {})
  return sound.loading
}

/**
 * Download + decode every sound effect (safe to call more than once).
 * Resolves when they're ready, or after `timeoutMs` at the latest.
 */
export function loadSounds(timeoutMs = 1500): Promise<void> {
  const all = Promise.all(Object.values(sfx).map(load)).then(() => {})
  const timeout = new Promise<void>(resolve => setTimeout(resolve, timeoutMs))
  return Promise.race([all, timeout])
}

// The playback context is created on the first play (always inside a tap/key
// handler) and suspended again when idle, so the audio hardware can sleep.
let context: AudioContext | null = null
let output: GainNode | null = null
let idleTimer = 0
const IDLE_SUSPEND_MS = 5000

function playbackContext(): { ctx: AudioContext; out: GainNode } | null {
  if (!context) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    context = new Ctx()
    output = context.createGain()
    output.gain.value = SFX_VOLUME
    output.connect(context.destination)
  }
  if (context.state !== 'running') context.resume().catch(() => {})
  clearTimeout(idleTimer)
  idleTimer = window.setTimeout(() => { context?.suspend().catch(() => {}) }, IDLE_SUSPEND_MS)
  return { ctx: context, out: output! }
}

/** Play a sound effect from the start. Overlapping plays are fine. */
export function playSfx(sound: SoundEffect): void {
  const audio = playbackContext()
  if (!audio) return
  const start = () => {
    const source = audio.ctx.createBufferSource()
    source.buffer = sound.buffer
    source.connect(audio.out)
    source.start()
  }
  if (sound.buffer) {
    start()
  } else {
    // Not decoded yet (very slow connection): play it if it arrives promptly,
    // otherwise skip rather than beep long after the press.
    const pressedAt = performance.now()
    load(sound).then(() => { if (sound.buffer && performance.now() - pressedAt < 300) start() })
  }
}

/** Duration of a sound in seconds, or `fallback` if it hasn't loaded yet. */
export function durationOf(sound: SoundEffect, fallback: number): number {
  return sound.buffer?.duration ?? fallback
}

/**
 * Fades the sound effects still playing to silence over `ms`: used just
 * before leaving the page (core/pageTransition.ts), which would otherwise cut
 * the confirm sound's tail off with a click.
 */
export function fadeOutEffects(ms: number): void {
  if (!context || !output) return
  const now = context.currentTime
  output.gain.cancelScheduledValues(now)
  output.gain.setValueAtTime(output.gain.value, now)
  output.gain.linearRampToValueAtTime(0, now + ms / 1000)
}

// Back on this page from the browser's back/forward cache: effects at full volume again
window.addEventListener('pageshow', e => {
  if (!e.persisted || !context || !output) return
  output.gain.cancelScheduledValues(context.currentTime)
  output.gain.value = SFX_VOLUME
})

// ── Mute (background music only; remembered across pages and visits) ───────

const MUTE_KEY = 'portfolio:muted'
let muted = readStoredMute()

function readStoredMute(): boolean {
  try { return localStorage.getItem(MUTE_KEY) === '1' } catch { return false }
}

export function isMuted(): boolean {
  return muted
}

/** Flips mute on/off and returns the new state. */
export function toggleMute(): boolean {
  muted = !muted
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0') } catch { /* storage blocked — just don't persist */ }
  return muted
}
