import './Scene.css'
import { COLORS } from '../config'
import { lockInput } from './inputLock'
import { setBackground } from './page'

let current: Scene | null = null

/**
 * A full-screen "screen" inside a single HTML page (e.g. title screen → menu).
 *
 * Subclasses implement render() (HTML string) and onMount() (wire up logic).
 * Anything that should stop when the scene is replaced — event listeners,
 * animation loops — should use `this.signal`:
 *
 *   document.addEventListener('keydown', fn, { signal: this.signal })
 */
export abstract class Scene {
  protected readonly app = document.querySelector<HTMLDivElement>('#app')!

  /** Background colour shown behind the scene (also covers the iOS bottom-bar gap). */
  protected readonly background: string = COLORS.yellow

  private readonly lifetime = new AbortController()

  /** Aborted when this scene is replaced by another one. */
  protected readonly signal: AbortSignal = this.lifetime.signal

  /** Returns the HTML to put in #app. */
  protected abstract render(): string

  /** Called right after render()'s HTML is in the DOM. */
  protected abstract onMount(): void

  show(): void {
    current?.lifetime.abort()
    current = this
    setBackground(this.background)
    this.app.innerHTML = this.render()
    this.onMount()
  }
}

/**
 * Fades to blue, swaps to `next`, then fades back.
 * Input is blocked from the start of the fade until `next` is on screen.
 */
export function transitionTo(next: Scene, inSeconds: number, outSeconds: number = inSeconds): void {
  const unlock = lockInput()
  const fade = document.createElement('div')
  fade.className = 'scene-fade'
  fade.style.animationDuration = `${inSeconds}s`
  document.body.appendChild(fade)

  fade.addEventListener('animationend', () => {
    next.show()
    unlock()
    fade.style.animationDuration = `${outSeconds}s`
    fade.classList.add('out')
    fade.addEventListener('animationend', () => fade.remove(), { once: true })
  }, { once: true })
}
