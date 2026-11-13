import './ProjectPopup.css'
import { PixelCanvas } from './PixelCanvas'
import { PixelLabel } from './PixelText'
import { barShape } from './ButtonMenu'
import { languageBar, type Project } from './ProjectCard'
import { menuTextArt, menuTextWidth } from '../utils/menuFont'
import { playSelectJump } from '../utils/selectJump'

/** Title bar length: as the menu's buttons (room for the text, at least the menu's bar length). */
const titleBarLength = (title: string) => Math.max(140, menuTextWidth(title) + 29)

/**
 * The details pop-up for a project (the Projects page opens it on Enter /
 * CONFIRM / tapping the selected box). Its title sits on a menu-style bar with
 * the menu's highlight and jump; then a fun one-liner, a few highlights, the
 * languages (logos, GitHub-style bar and percentages) and links.
 *
 * It sits under the corner HUD, so [B] BACK closes it and [↵] CONFIRM opens
 * the repo (the page wires that up: see pages/projects.ts).
 */
export class ProjectPopup {
  private el: HTMLElement | null = null
  private project: Project | null = null
  /** Called when it closes (by any means). */
  onClose: (() => void) | null = null

  get isOpen(): boolean {
    return this.el !== null
  }

  open(project: Project): void {
    if (this.el) this.remove()
    this.project = project
    const length = titleBarLength(project.title)
    const el = document.createElement('div')
    el.className = 'project-popup'
    el.setAttribute('role', 'dialog')
    el.setAttribute('aria-modal', 'true')
    el.setAttribute('aria-label', project.title)
    el.innerHTML = `
      <div class="project-popup-panel" tabindex="-1">
        <div class="project-popup-heading" style="--bar-len: ${length}">
          <div class="project-popup-highlight"></div>
          <div class="project-popup-bar"></div>
          <div class="project-popup-title"></div>
        </div>
        <div class="project-popup-tagline"></div>
        <ul class="project-popup-points"></ul>
        <div class="project-popup-langs">
          <div class="project-popup-logos"></div>
          <div class="project-popup-langbar">
            ${languageBar(project.languages, 'project-popup-bar-chart')}
            <div class="project-popup-legend"></div>
          </div>
        </div>
        <div class="project-popup-actions">
          <a class="project-popup-btn primary" target="_blank" rel="noopener"></a>
          <button class="project-popup-btn" type="button" data-close></button>
          <span class="project-popup-year"></span>
        </div>
      </div>
    `
    // all text in the references' small text font (sizes and colours in ProjectPopup.css)
    const q = <T extends Element>(s: string) => el.querySelector<T>(s)!
    const label = (text: string) => new PixelLabel(text).element
    const paragraph = (text: string) => new PixelLabel(text, { wrap: true }).element
    const keyCap = (key: string) => {
      const b = document.createElement('b')
      b.append(label(key))
      return b
    }
    q<HTMLElement>('.project-popup-year').append(label(String(project.year)))
    q<HTMLElement>('.project-popup-tagline').append(paragraph(project.tagline))
    q<HTMLElement>('.project-popup-points').append(...project.highlights.map(text => {
      const li = document.createElement('li')
      li.append(paragraph(text))
      return li
    }))
    q<HTMLElement>('.project-popup-logos').append(...project.logos.map(src => {
      const img = document.createElement('img')
      img.src = src
      img.alt = ''
      return img
    }))
    q<HTMLElement>('.project-popup-legend').append(...project.languages.map(l => {
      const span = document.createElement('span')
      span.style.setProperty('--dot', l.color)
      span.append(label(`${l.name} ${l.share}%`))
      return span
    }))
    const github = q<HTMLAnchorElement>('.project-popup-btn.primary')
    github.href = project.url
    github.append(keyCap('↵'), label('View on GitHub'))
    q<HTMLElement>('[data-close]').append(keyCap('B'), label('Close'))
    for (const link of project.links ?? []) {
      const a = document.createElement('a')
      a.className = 'project-popup-btn'
      a.target = '_blank'
      a.rel = 'noopener'
      a.href = link.url
      a.append(label(link.label))
      github.after(a)
    }
    const shape = barShape(length)
    q<HTMLElement>('.project-popup-highlight').style.clipPath = shape
    q<HTMLElement>('.project-popup-bar').style.clipPath = shape
    const art = menuTextArt(project.title)
    const title = new PixelCanvas(art, project.title)
    title.element.style.width = `calc(${art.width} * var(--art-px))`
    title.element.style.height = `calc(${art.height} * var(--art-px))`
    q<HTMLElement>('.project-popup-title').append(title.element)

    // close on the backdrop or the Close button; links work as links
    el.addEventListener('click', e => {
      const target = e.target as Element
      if (target === el || target.closest('[data-close]')) this.close()
    })

    // inside #app, beside the HUD and banner (#app is position: fixed, so it has
    // its own layer order): there z-index 9 puts the pop-up under them
    ;(document.getElementById('app') ?? document.body).append(el)
    this.el = el
    q<HTMLElement>('.project-popup-panel').focus({ preventScroll: true })
    // the title bar does the menu's jump as it appears
    const bar = q<HTMLElement>('.project-popup-bar')
    requestAnimationFrame(() => playSelectJump({
      bar: [bar, q('.project-popup-title')],
      highlight: q('.project-popup-highlight'),
    }, bar.getBoundingClientRect().height / 25))
  }

  /** Opens the project's GitHub page in a new tab. */
  openLink(): void {
    if (this.project) window.open(this.project.url, '_blank', 'noopener')
  }

  close(): void {
    const el = this.el
    if (!el) return
    this.el = null
    this.project = null
    el.classList.add('closing')
    el.addEventListener('animationend', () => el.remove(), { once: true })
    setTimeout(() => el.remove(), 400) // in case animations are off
    this.onClose?.()
  }

  private remove(): void {
    this.el?.remove()
    this.el = null
  }
}
