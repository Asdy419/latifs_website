import './ProjectPopup.css'
import { PixelLabel } from './PixelText'
import { measureText, TEXT_FONT_HEIGHT } from '../utils/textFont'
import { languageBar, languageLabel, type Project } from './ProjectCard'
import { sfx, playSfx } from '../utils/audio'

/** The pop-up's sections, as tabs (← → or a click switches). */
const SECTIONS = ['Overview', 'Features', 'Numbers', 'Timeline'] as const
type Section = (typeof SECTIONS)[number]

/**
 * The details pop-up for a project (the Projects page opens it on Enter /
 * CONFIRM / tapping the selected box). It fills nearly the whole screen under
 * the corner HUD (the title banner hides meanwhile). Its title is large plain
 * text (the user didn't want a menu-button bar there). On the left: a picture
 * slot (`shot`, blank until one is added), what kind of project it is and when,
 * and its languages. On the right: the write-up in sections (Overview,
 * Features, Numbers, Timeline), switched with ← → or the tabs; ↑ ↓ scroll a
 * long one. Along the bottom: links, Close and the year.
 *
 * [B] BACK closes it and [↵] CONFIRM opens the repo (the page wires that up:
 * see pages/projects.ts). Projects without a public repo get no GitHub button
 * (and CONFIRM does nothing); with no known languages, that part is left out.
 */
export class ProjectPopup {
  private el: HTMLElement | null = null
  private project: Project | null = null
  private section: Section = 'Overview'
  /** The tabs' text, redrawn when a tab's colours change (a PixelLabel only redraws by itself on resize). */
  private tabLabels = new Map<Section, PixelLabel>()
  private listeners: AbortController | null = null
  /** Called when it closes (by any means). */
  onClose: (() => void) | null = null

  get isOpen(): boolean {
    return this.el !== null
  }

  open(project: Project): void {
    if (this.el) this.remove()
    this.project = project
    const el = document.createElement('div')
    el.className = 'project-popup'
    el.classList.toggle('project-popup-balanced', project.detailsLayout === 'balanced')
    el.setAttribute('role', 'dialog')
    el.setAttribute('aria-modal', 'true')
    el.setAttribute('aria-label', project.title)
    el.innerHTML = `
      <div class="project-popup-panel" tabindex="-1">
        <h2 class="project-popup-heading"></h2>
        <div class="project-popup-body">
          <div class="project-popup-side">
            <div class="project-popup-shot"></div>
            <div class="project-popup-meta"></div>
            <div class="project-popup-langs">
              <div class="project-popup-langrow">
                <div class="project-popup-logos"></div>
                ${languageBar(project.languages, 'project-popup-bar-chart')}
              </div>
              <div class="project-popup-legend"></div>
            </div>
          </div>
          <div class="project-popup-main">
            <div class="project-popup-tabs" role="tablist"></div>
            <div class="project-popup-section" role="tabpanel"></div>
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

    // left: the picture slot, what and when, languages
    if (project.shot) {
      const img = document.createElement('img')
      img.src = project.shot
      img.alt = `${project.title} project image`
      img.decoding = 'async'
      if (project.shotFullWidth) img.classList.add('project-popup-shot-fill')
      q('.project-popup-shot').append(img)
    }
    const meta = q<HTMLElement>('.project-popup-meta')
    meta.append(paragraph(project.kind, 'project-popup-kind'), paragraph(project.when))
    if (project.tech?.length) meta.append(paragraph(project.tech.join(' / '), 'project-popup-tech'))
    q<HTMLElement>('.project-popup-logos').append(...project.logos.map(src => {
      const img = document.createElement('img')
      img.src = src
      img.alt = ''
      return img
    }))
    q<HTMLElement>('.project-popup-legend').append(...project.languages.map(l => {
      const span = document.createElement('span')
      span.style.setProperty('--dot', l.color)
      span.append(label(languageLabel(l)))
      return span
    }))
    if (!project.languages.length) q('.project-popup-langs').remove()

    // right: the section tabs
    const tabs = q<HTMLElement>('.project-popup-tabs')
    this.tabLabels.clear()
    for (const name of SECTIONS) {
      const tab = document.createElement('button')
      tab.type = 'button'
      tab.className = 'project-popup-tab'
      tab.dataset.section = name
      tab.setAttribute('role', 'tab')
      const text = new PixelLabel(name)
      this.tabLabels.set(name, text)
      tab.append(text.element)
      tab.addEventListener('click', e => {
        e.stopPropagation()
        if (this.section !== name) playSfx(sfx.bleep)
        this.showSection(name)
      })
      tabs.append(tab)
    }

    // bottom: links, Close, year
    q<HTMLElement>('.project-popup-year').append(label(String(project.year)))
    const github = q<HTMLAnchorElement>('.project-popup-btn.primary')
    const close = q<HTMLElement>('[data-close]')
    close.append(keyCap('B'), label('Close'))
    if (project.url) {
      github.href = project.url
      github.append(keyCap('↵'), label('View on GitHub'))
    } else {
      github.remove()
    }
    for (const link of project.links ?? []) { // in order, between GitHub and Close
      const a = document.createElement('a')
      a.className = 'project-popup-btn'
      a.target = '_blank'
      a.rel = 'noopener'
      a.href = link.url
      a.append(label(link.label))
      close.before(a)
    }

    const heading = q<HTMLElement>('.project-popup-heading')
    heading.style.setProperty('--title-em-width', String(measureText(project.title).width / TEXT_FONT_HEIGHT))
    heading.append(label(project.title))
    if (project.detailsLayout === 'balanced') q('.project-popup-side').prepend(heading)

    // close on the backdrop or the Close button; links work as links
    el.addEventListener('click', e => {
      const target = e.target as Element
      if (target === el || target.closest('[data-close]')) this.close()
    })

    // ← → switch sections, ↑ ↓ scroll the section (BACK and CONFIRM are the HUD's)
    this.listeners = new AbortController()
    document.addEventListener('keydown', e => this.handleKey(e), { signal: this.listeners.signal })

    // over the page and the banner, under the corner HUD (same layer, so it goes just before it)
    const app = document.getElementById('app') ?? document.body
    app.insertBefore(el, app.querySelector('.hud'))
    this.el = el
    this.showSection('Overview')
    q<HTMLElement>('.project-popup-panel').focus({ preventScroll: true })
  }

  /** Opens the project's GitHub page in a new tab (if it has a public one). */
  openLink(): void {
    if (this.project?.url) window.open(this.project.url, '_blank', 'noopener')
  }

  close(): void {
    const el = this.el
    if (!el) return
    this.el = null
    this.project = null
    this.listeners?.abort()
    this.listeners = null
    el.classList.add('closing')
    el.addEventListener('animationend', () => el.remove(), { once: true })
    setTimeout(() => el.remove(), 400) // in case animations are off
    this.onClose?.()
  }

  private remove(): void {
    this.listeners?.abort()
    this.listeners = null
    this.el?.remove()
    this.el = null
  }

  private handleKey(e: KeyboardEvent): void {
    if (!this.el) return
    const box = this.el.querySelector<HTMLElement>('.project-popup-section')!
    const i = SECTIONS.indexOf(this.section)
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowRight': {
        e.preventDefault()
        const next = i + (e.key === 'ArrowLeft' ? -1 : 1)
        if (next < 0 || next >= SECTIONS.length) return
        playSfx(sfx.bleep)
        this.showSection(SECTIONS[next])
        break
      }
      case 'ArrowUp':
      case 'ArrowDown':
        e.preventDefault()
        box.scrollBy({ top: (e.key === 'ArrowUp' ? -0.4 : 0.4) * box.clientHeight, behavior: 'smooth' })
        break
    }
  }

  /** Fills the right-hand side with one section of the write-up. */
  private showSection(name: Section): void {
    const project = this.project
    if (!this.el || !project) return
    this.section = name
    for (const tab of this.el.querySelectorAll<HTMLElement>('.project-popup-tab')) {
      const on = tab.dataset.section === name
      if (tab.classList.contains('selected') === on) continue
      tab.classList.toggle('selected', on)
      tab.setAttribute('aria-selected', String(on))
      this.tabLabels.get(tab.dataset.section as Section)?.render() // its ink and shadow colours changed
    }
    const box = this.el.querySelector<HTMLElement>('.project-popup-section')!
    box.replaceChildren(...sectionContent(project, name))
    box.scrollTop = 0
  }
}

function sectionContent(project: Project, name: Section): HTMLElement[] {
  switch (name) {
    case 'Overview': {
      const parts = [paragraph(project.tagline, 'project-popup-tagline'), paragraph(project.gist)]
      if (project.funFact) {
        const fact = document.createElement('div')
        fact.className = 'project-popup-fact'
        fact.append(label('Fun fact', 'project-popup-fact-title'), paragraph(project.funFact))
        parts.push(fact)
      }
      return parts
    }
    case 'Features': {
      const list = document.createElement('ul')
      list.className = 'project-popup-points'
      list.append(...project.features.map(text => {
        const li = document.createElement('li')
        li.append(paragraph(text))
        return li
      }))
      return [list]
    }
    case 'Numbers': {
      const grid = document.createElement('div')
      grid.className = 'project-popup-numbers'
      grid.append(...project.numbers.map(({ value, label: text }) => {
        const tile = document.createElement('div')
        tile.className = 'project-popup-number'
        tile.append(label(value, 'project-popup-number-value'), paragraph(text))
        return tile
      }))
      return [grid]
    }
    case 'Timeline': {
      const list = document.createElement('ol')
      list.className = 'project-popup-timeline'
      list.append(...project.milestones.map(({ when, text }) => {
        const li = document.createElement('li')
        li.append(label(when, 'project-popup-when'), paragraph(text))
        return li
      }))
      return [list]
    }
  }
}

/** One line of text in the text font (PixelLabel), optionally with a class. */
function label(text: string, className?: string): HTMLElement {
  const el = new PixelLabel(text).element
  if (className) el.classList.add(className)
  return el
}

/** Text that wraps to its container (PixelLabel), optionally with a class. */
function paragraph(text: string, className?: string): HTMLElement {
  const el = new PixelLabel(text, { wrap: true }).element
  if (className) el.classList.add(className)
  return el
}

/** A key cap, like [B] or [↵], for a button. */
function keyCap(key: string): HTMLElement {
  const b = document.createElement('b')
  b.append(label(key))
  return b
}
