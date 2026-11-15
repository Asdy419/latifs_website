import './PhotoViewer.css'
import { photoFullUrl, type Photo } from '../utils/cloudinary'

/** Widths asked of Cloudinary for the full view (px): a few steps, so its cache goes further. */
const WIDTHS = [640, 960, 1280, 1600, 1920, 2560]
const OPEN_MS = 340
const CLOSE_MS = 220

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

/**
 * A photo, big, in a frame with an even white border (so the frame keeps the
 * photo's own shape; the user didn't want a polaroid here). It grows out of
 * the polaroid on the wall (with a little overshoot) and shrinks back into it
 * when closed. It shows the
 * small copy straight away, then fades to the sharp one once it has loaded
 * (sized for the screen: "full res" without downloading more than it can show).
 *
 * It covers the page and the title banner but not the corner HUD, so BACK
 * closes it (the page wires that up: see pages/gallery.ts); so does a click
 * or tap anywhere.
 */
export class PhotoViewer {
  private el: HTMLElement | null = null
  /** The polaroid it grew out of (hidden meanwhile: it's "off the wall"). */
  private source: HTMLElement | null = null
  /** Called as it starts closing (by any means). */
  onClose: (() => void) | null = null
  /** A click/tap closed it (play a sound, say): runs before onClose. */
  onDismiss: (() => void) | null = null

  get isOpen(): boolean {
    return this.el !== null
  }

  /** Opens `photo`, growing out of `source` (the polaroid element), showing `previewSrc` until the full photo loads. */
  open(photo: Photo, source: HTMLElement, previewSrc: string): void {
    if (this.el) this.remove()
    const ratio = photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 3 / 2
    const el = document.createElement('div')
    el.className = 'photo-viewer'
    el.setAttribute('role', 'dialog')
    el.setAttribute('aria-modal', 'true')
    el.setAttribute('aria-label', photo.alt || 'Photo')
    el.innerHTML = `
      <figure class="photo-viewer-frame">
        <div class="photo-viewer-photo" style="--ratio: ${ratio}">
          <img class="photo-viewer-preview" alt="" draggable="false" />
          <img class="photo-viewer-full" alt="" draggable="false" decoding="async" />
        </div>
      </figure>
    `
    el.querySelector<HTMLImageElement>('.photo-viewer-preview')!.src = previewSrc
    el.addEventListener('click', () => {
      this.onDismiss?.()
      this.close()
    })

    // over the page and banner, under the corner HUD (same layer, so it goes just before it)
    const app = document.getElementById('app') ?? document.body
    app.insertBefore(el, app.querySelector('.hud'))
    this.el = el
    this.source = source
    source.classList.add('lifted')

    // the full photo, as wide as it's shown in device pixels (rounded up to a step)
    const box = el.querySelector<HTMLElement>('.photo-viewer-photo')!
    const needed = box.clientWidth * (window.devicePixelRatio || 1)
    const full = el.querySelector<HTMLImageElement>('.photo-viewer-full')!
    full.addEventListener('load', () => full.classList.add('loaded'), { once: true })
    full.src = photoFullUrl(photo, WIDTHS.find(w => w >= needed) ?? WIDTHS[WIDTHS.length - 1])

    // grow out of the polaroid: start at its spot and size, spring to the middle
    if (!reducedMotion.matches) {
      el.querySelector('.photo-viewer-frame')!.animate(
        [{ transform: fromTransform(el, source) }, { transform: 'none' }],
        { duration: OPEN_MS, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.15)' },
      )
    }
  }

  /** Shrinks back into the polaroid and goes. */
  close(): void {
    const el = this.el
    const source = this.source
    if (!el) return
    this.el = null
    this.source = null
    el.classList.add('closing')
    this.onClose?.()
    const done = () => {
      el.remove()
      source?.classList.remove('lifted')
    }
    if (reducedMotion.matches || !source) {
      done()
      return
    }
    const shrink = el.querySelector('.photo-viewer-frame')!.animate(
      [{ transform: 'none' }, { transform: fromTransform(el, source) }],
      { duration: CLOSE_MS, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'forwards' },
    )
    shrink.finished.then(done, done)
    setTimeout(done, CLOSE_MS + 200) // in case the animation never finishes (hidden tab)
  }

  private remove(): void {
    this.el?.remove()
    this.source?.classList.remove('lifted')
    this.el = null
    this.source = null
  }
}

/** The transform that puts the big frame exactly over `source` (in plain px: see utils/selectJump.ts on Safari). */
function fromTransform(viewer: HTMLElement, source: HTMLElement): string {
  const frame = viewer.querySelector<HTMLElement>('.photo-viewer-frame')!
  const to = frame.getBoundingClientRect()
  const from = source.querySelector('.polaroid-frame')?.getBoundingClientRect() ?? source.getBoundingClientRect()
  const dx = from.left + from.width / 2 - (to.left + to.width / 2)
  const dy = from.top + from.height / 2 - (to.top + to.height / 2)
  return `translate(${dx}px, ${dy}px) scale(${from.width / to.width}, ${from.height / to.height})`
}
