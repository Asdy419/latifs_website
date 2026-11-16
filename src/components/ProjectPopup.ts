import './ProjectPopup.css'
import { PixelLabel } from './PixelText'
import { languageBar, languageLabel, type Project } from './ProjectCard'
import { staticCanvas } from './TvStatic'
import { sfx, playSfx } from '../utils/audio'
import { drawColorGrid } from '../utils/pixelArt'
import { measureText, TEXT_FONT_HEIGHT } from '../utils/textFont'

/** The pop-up's sections, as tabs (← → or a click switches). */
const SECTIONS = ['Overview', 'Features', 'Numbers', 'Timeline'] as const
type Section = (typeof SECTIONS)[number]

/** On <html> while a pop-up is open: the corner HUD and title banner hide, the page stays still (ProjectPopup.css). */
const OPEN_CLASS = 'project-popup-open'

/**
 * The user's experiment: the panel, its tabs and the buttons as parallelograms, after a
 * Sonic Mania dialog (ProjectPopup.css, "Experiment: parallelograms"):
 * a blue face with white text, and buttons with the site's pulsing red highlight. Set to
 * false to put everything back as it was.
 */
const SLANTED = true

/**
 * The details pop-up for a project (the Projects page opens it on Enter /
 * CONFIRM / tapping the selected box): a panel over most of the screen (the
 * page shows dimmed around it), which appears at once, with no animation. The
 * corner HUD hides meanwhile: the panel's own buttons do its jobs, and B /
 * Escape, Enter and M still work. Every project gets the same layout
 * (ProjectPopup.css):
 *  - along the top: the project's picture, its title and the year
 *  - on the left: the project's pictures (`shots`) on the screen of a
 *    pixel-art TV (tvArt, below), one per tab: switching tabs tunes it in
 *    (static, then the next picture; still static with none), what kind of
 *    project it is and when, and its languages
 *  - on the right: the write-up in sections (Overview, Features, Numbers,
 *    Timeline), switched with ← → or the tabs; ↑ ↓ scroll a long one
 *  - along the bottom: links and Close
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
  /** Counts TV tunings, so a slow picture can't replace a newer one (tuneTV). */
  private tuning = 0
  /** Called when it closes (by any means). */
  onClose: (() => void) | null = null

  get isOpen(): boolean {
    return this.el !== null
  }

  open(project: Project): void {
    if (this.el) this.remove()
    this.project = project
    const el = document.createElement('div') // the dimmed backdrop
    el.className = 'project-popup'
    el.classList.toggle('project-popup-slanted', SLANTED)
    el.innerHTML = `
      <div class="project-popup-panel" role="dialog" aria-modal="true" tabindex="-1">
        <header class="project-popup-header">
          <div class="project-popup-ident">
            <div class="project-popup-titles">
              <h2 class="project-popup-heading"></h2>
              <div class="project-popup-meta"></div>
            </div>
          </div>
          <div class="project-popup-langs">
            <div class="project-popup-logos"></div>
            <div class="project-popup-langs-bar">
              ${languageBar(project.languages, 'project-popup-bar-chart')}
              <div class="project-popup-legend"></div>
            </div>
          </div>
        </header>
        <div class="project-popup-body">
          <div class="project-popup-side">
            <div class="project-popup-shot">
              <div class="project-popup-screen">
                <img class="project-popup-picture" alt="" decoding="async" draggable="false" hidden />
                <div class="project-popup-static tv-static"></div>
              </div>
            </div>
          </div>
          <div class="project-popup-main">
            <div class="project-popup-tabs" role="tablist"></div>
            <div class="project-popup-section" role="tabpanel"></div>
          </div>
        </div>
        <footer class="project-popup-actions">
          <div class="project-popup-buttons">
            <a class="project-popup-btn primary" target="_blank" rel="noopener"></a>
            <button class="project-popup-btn" type="button" data-close></button>
          </div>
        </footer>
      </div>
    `
    // all text in the references' small text font (sizes and colours in ProjectPopup.css)
    const q = <T extends Element>(s: string) => el.querySelector<T>(s)!

    const panel = q<HTMLElement>('.project-popup-panel')
    panel.setAttribute('aria-label', project.title)

    // top: the title with the project's picture beside it, over the TV (centreNameOnTV; the year
    // heads the Timeline tab instead: the user's call, no repeats)
    if (project.image) q('.project-popup-ident').prepend(image(project.image, 'project-popup-icon'))
    q('.project-popup-heading').append(label(project.title))

    // left: the screenshot, on the pixel-art TV's screen (static when there isn't one)
    const tv = q<HTMLElement>('.project-popup-shot')
    tv.style.setProperty('--tv-art', `url("${tvArt()}")`)
    tv.style.aspectRatio = `${TV.width} / ${TV.height}`
    tv.style.setProperty('--tv-ratio', String(TV.width / TV.height)) // (ProjectPopup.css fits it in the middle's height)
    const screen = q<HTMLElement>('.project-popup-screen')
    // the screen one art pixel bigger all round than the TV's hole, under its bezel: its edges
    // then never land mid-pixel on the hole's, which let the panel show through as a light line
    const pct = (v: number, of: number) => `${(v / of) * 100}%`
    screen.style.left = pct(TV_SCREEN.x - 1, TV.width)
    screen.style.top = pct(TV_SCREEN.y - 1, TV.height)
    screen.style.width = pct(TV_SCREEN.width + 2, TV.width)
    screen.style.height = pct(TV_SCREEN.height + 2, TV.height)
    q('.project-popup-static').append(staticCanvas(TV_SCREEN.width, TV_SCREEN.height))
    q<HTMLImageElement>('.project-popup-picture').alt = `${project.title} project image`
    // under the title: what kind of project, and when
    q('.project-popup-meta').append(label(project.kind, 'project-popup-kind'), label(project.when))
    // top right, before the year: the language logos, then the languages' bar with its legend
    q('.project-popup-logos').append(...project.logos.map(src => image(src)))
    q('.project-popup-legend').append(...project.languages.map(l => {
      const span = document.createElement('span')
      span.style.setProperty('--dot', l.color)
      span.append(label(languageLabel(l)))
      return span
    }))
    if (!project.languages.length) q('.project-popup-langs-bar').remove()
    if (!project.logos.length) q('.project-popup-logos').remove()
    if (!project.languages.length && !project.logos.length) q('.project-popup-langs').remove()

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
      tab.addEventListener('click', () => {
        if (this.section !== name) playSfx(sfx.bleep)
        this.showSection(name)
      })
      tabs.append(tab)
    }

    // bottom, under the text: GitHub, other links, Close (with the keys that do the same)
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
    // the experiment's buttons: the pink layer of their pulsing red highlight (ProjectPopup.css)
    if (SLANTED) {
      for (const btn of el.querySelectorAll('.project-popup-btn')) {
        btn.prepend(Object.assign(document.createElement('span'), { className: 'project-popup-btn-pulse' }))
      }
    }
    // bottom, under the TV: what it was built with (tools as well as languages), on one line
    if (project.tech?.length) {
      const built = document.createElement('div')
      built.className = 'project-popup-builtwith'
      built.append(label('Built with', 'project-popup-builtwith-title'), label(project.tech.join(' / '), 'project-popup-tech'))
      q('.project-popup-actions').prepend(built)
    }
    // Close, or a click on the dimmed page around the panel, closes it
    close.addEventListener('click', () => this.close())
    el.addEventListener('click', e => { if (e.target === el) this.close() })

    // ← → switch sections, ↑ ↓ scroll the section (BACK and CONFIRM are the HUD's keys)
    this.listeners = new AbortController()
    document.addEventListener('keydown', e => this.handleKey(e), { signal: this.listeners.signal })

    // over everything on the page (the corner HUD hides meanwhile)
    ;(document.getElementById('app') ?? document.body).append(el)
    document.documentElement.classList.add(OPEN_CLASS)
    this.el = el
    this.section = 'Overview'
    // switches on like a TV: static, then the first picture (after the opening has landed)
    this.tuneTV(0, { minimum: (SLANTED ? OPENING_MS : 0) + OPEN_TUNE_MS })
    this.showSection('Overview') // (and lines its text up with the TV: centreOnTV)
    window.addEventListener('resize', () => this.centreOnTV(), { signal: this.listeners.signal })
    panel.focus({ preventScroll: true })
  }

  /** Opens the project's GitHub page in a new tab (if it has a public one). */
  openLink(): void {
    if (this.project?.url) window.open(this.project.url, '_blank', 'noopener')
  }

  /** Closes it at once (it has no closing animation either). */
  close(): void {
    if (!this.el) return
    this.remove()
    this.onClose?.()
  }

  private remove(): void {
    this.listeners?.abort()
    this.listeners = null
    this.el?.remove()
    this.el = null
    this.project = null
    document.documentElement.classList.remove(OPEN_CLASS)
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

  /**
   * Puts picture `index` (of the project's `shots`, wrapping round) on the TV.
   * Unless `instant`, the TV tunes in like a real set: static rolls over the
   * screen for at least TUNE_MS, and until the new picture has decoded, so it
   * never shows a blank screen. With no pictures, it shows still static.
   */
  private tuneTV(index: number, { instant = false, minimum = TUNE_MS } = {}): void {
    const shots = this.project?.shots ?? []
    const screen = this.el?.querySelector<HTMLElement>('.project-popup-screen')
    const picture = screen?.querySelector<HTMLImageElement>('.project-popup-picture')
    const noise = screen?.querySelector<HTMLElement>('.tv-static')
    if (!screen || !picture || !noise) return
    const token = ++this.tuning
    const src = shots.length ? shots[index % shots.length] : null
    const show = () => {
      if (token !== this.tuning || !this.el) return // a newer tab took over, or it closed
      screen.classList.remove('tuning')
      noise.classList.remove('rolling')
      screen.classList.toggle('no-signal', !src)
      picture.hidden = !src
      if (src && picture.getAttribute('src') !== src) picture.src = src
    }
    if (instant) return show()
    screen.classList.add('tuning')
    noise.classList.add('rolling')
    const decoded = src ? decodeImage(src) : Promise.resolve()
    const shortest = new Promise(resolve => setTimeout(resolve, minimum))
    Promise.all([decoded, shortest]).then(show)
  }

  /** Fills the right-hand side with one section of the write-up (and tunes the TV to its picture). */
  private showSection(name: Section): void {
    const project = this.project
    if (!this.el || !project) return
    if (name !== this.section) this.tuneTV(SECTIONS.indexOf(name))
    this.section = name
    for (const tab of this.el.querySelectorAll<HTMLElement>('.project-popup-tab')) {
      const on = tab.dataset.section === name
      if (tab.classList.contains('selected') === on) continue
      tab.classList.toggle('selected', on)
      tab.setAttribute('aria-selected', String(on))
      this.tabLabels.get(tab.dataset.section as Section)?.render() // its ink and shadow colours changed
    }
    const box = this.el.querySelector<HTMLElement>('.project-popup-section')!
    // the section's parts in one block, which the section centres on the TV (centreOnTV), with
    // room between them that closes up when the tab is short of space (ProjectPopup.css)
    const parts = document.createElement('div')
    parts.className = 'project-popup-section-parts'
    sectionContent(project, name).forEach((part, i) => {
      if (i) parts.append(Object.assign(document.createElement('div'), { className: 'project-popup-parts-space' }))
      parts.append(part)
    })
    box.replaceChildren(parts)
    box.dataset.section = name // (the Overview's text sits right under the tabs: ProjectPopup.css)
    box.scrollTop = 0
    // the Overview's fun fact: under the section, at the bottom of the column, right above the
    // footer's rule (the user's call); the section, shorter for it, centres the rest on the TV
    this.el.querySelector('.project-popup-main > .project-popup-fact')?.remove()
    if (name === 'Overview' && project.funFact) box.after(funFact(project.funFact))
    this.centreOnTV()
  }

  /**
   * Lines the section's text up with the TV: its middle level with the TV's middle (the
   * user's call), as far as the room in the section allows. The section centres its block
   * between a space at its top and one at its bottom (ProjectPopup.css), one of them as tall
   * as twice the distance between the TV's middle and the section's: so measured from the
   * boxes alone, not the text (which only settles once its labels have wrapped). Long text
   * squeezes the space away first. Again on every tab: the fun fact makes the section shorter.
   * (The Overview's text ignores it, right under the tabs: ProjectPopup.css.)
   */
  private centreOnTV(): void {
    const box = this.el?.querySelector<HTMLElement>('.project-popup-section')
    const tv = this.el?.querySelector<HTMLElement>('.project-popup-shot')
    const main = this.el?.querySelector<HTMLElement>('.project-popup-main')
    if (!box || !tv || !main) return
    this.centreNameOnTV(tv) // (first: a longer line under the title can make the middle shorter)
    const t = tv.getBoundingClientRect()
    // the fun fact's bottom level with the TV's (the user's call): up off the column's bottom
    // by the room under the TV (ProjectPopup.css); set first, as it makes the section shorter
    main.style.setProperty('--tv-under', `${Math.max(0, main.getBoundingClientRect().bottom - t.bottom)}px`)
    const s = box.getBoundingClientRect()
    const drop = (s.top + s.bottom) / 2 - (t.top + t.bottom) / 2
    box.style.setProperty('--tv-centre', `${Math.max(0, 2 * drop)}px`)
    box.style.setProperty('--tv-raise', `${Math.max(0, -2 * drop)}px`)
  }

  /**
   * Centres the project's name over the TV's antennas (the user's call), with its picture
   * beside it and the line under it: they move right together as far as that takes, never
   * left of the panel's edge (a long name, or a narrow phone's TV). Twice: moving them can wrap
   * the line under the title, making the middle, and so the TV, a little smaller.
   */
  private centreNameOnTV(tv: HTMLElement): void {
    const ident = this.el?.querySelector<HTMLElement>('.project-popup-ident')
    const name = this.el?.querySelector<HTMLElement>('.project-popup-heading')
    if (!ident || !name) return
    for (let pass = 0; pass < 2; pass++) {
      const n = name.getBoundingClientRect(), t = tv.getBoundingClientRect()
      const shift = (t.left + t.right) / 2 - (n.left + n.right) / 2
      ident.style.marginLeft = `${Math.max(0, (parseFloat(ident.style.marginLeft) || 0) + shift)}px`
    }
  }
}

/** The Overview's fun fact, in its box (ProjectPopup.css). */
function funFact(text: string): HTMLElement {
  const fact = document.createElement('div')
  fact.className = 'project-popup-fact'
  fact.append(label('Fun fact!!', 'project-popup-fact-title'), paragraph(text, 'project-popup-text'))
  return fact
}

function sectionContent(project: Project, name: Section): HTMLElement[] {
  switch (name) {
    case 'Overview':
      return [paragraph(project.tagline, 'project-popup-tagline'), paragraph(project.gist, 'project-popup-text')]
    case 'Features': {
      const list = document.createElement('ul')
      list.className = 'project-popup-points'
      project.features.forEach((text, i) => {
        // between bullets, room that gives way when the tab is short of space (ProjectPopup.css)
        if (i) list.append(spacer('project-popup-points-space'))
        const li = document.createElement('li')
        li.append(paragraph(text, 'project-popup-text'))
        list.append(li)
      })
      return [list]
    }
    case 'Numbers': {
      const grid = document.createElement('div')
      grid.className = 'project-popup-numbers'
      grid.append(...project.numbers.map(({ value, label: text }) => {
        const tile = document.createElement('div')
        tile.className = 'project-popup-number'
        tile.append(label(value, 'project-popup-number-value'), paragraph(text, 'project-popup-text'))
        return tile
      }))
      return [grid]
    }
    case 'Timeline': {
      // the project's year on a pixel-art pennant, flying from the top of the timeline's line
      const block = document.createElement('div')
      block.className = 'project-popup-timeline-block'
      const year = yearFlag(project.year)
      const list = document.createElement('ol')
      list.className = 'project-popup-timeline'
      project.milestones.forEach(({ when, text }, i) => {
        if (i) list.append(spacer('project-popup-timeline-space')) // room that gives way when it's short (ProjectPopup.css)
        const li = document.createElement('li')
        li.append(label(when, 'project-popup-when'), paragraph(text, 'project-popup-text'))
        list.append(li)
      })
      block.append(year, list)
      return [block]
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

/** An empty list item that only spaces the items either side of it (hidden from screen readers). */
function spacer(className: string): HTMLElement {
  return Object.assign(document.createElement('li'), { className, ariaHidden: 'true' })
}

/** A key, like [B] or [↵], drawn as a small outlined key cap inside a button. */
function keyCap(key: string): HTMLElement {
  const b = document.createElement('b')
  b.append(label(key))
  return b
}

/** A decorative <img> (alt text set by the caller where it matters). */
function image(src: string, className?: string): HTMLImageElement {
  const img = document.createElement('img')
  img.src = src
  img.alt = ''
  img.decoding = 'async'
  img.draggable = false
  if (className) img.className = className
  return img
}

// ── The TV around the screenshot ──────────────────────────────────────────
// Pixel art drawn once in code, shaped after the user's reference (a grey CRT set with its
// controls along the bottom), with rabbit-ear antennas on top: a rounded grey plastic
// casing lit along its top, a thick dark bezel round the rounded screen, a badge band
// (LATIF), a dark control strip (power button and light, AV sockets, buttons, a grille,
// knobs) and a darker base. (A closer copy, with a curved bottom and cables, was tried and
// turned down: the user prefers this one.) It's laid over the picture (ProjectPopup.css),
// which shows through the screen (TV_SCREEN, set on the screen element by open()). Static
// (between pictures, or with none) is the site's TV static (TvStatic.ts), one speckle per
// art pixel of the screen.

/**
 * The rabbit ears: how many rows they rise above the casing, and how far each tip leans out
 * from the middle. With the TV at the top of its column, the tips are level with the tabs.
 */
const ANTENNA = { height: 13, reach: 20 }
/** Beside the screen: the outline, the grey casing (3) and the dark bezel (3). */
const TV_SIDE = 7
/** Above the screen: the outline, the lit lip, grey (2) and the bezel (3). */
const TV_TOP = 7
/** Under the screen: the bezel (3), the badge band (7), the control strip (11), the base (2), the outline. */
const TV_BOTTOM = 24
const TV_CASING = { x: 0, y: ANTENNA.height, width: 150 + 2 * TV_SIDE, height: TV_TOP + 78 + TV_BOTTOM }
const TV = { width: TV_CASING.width, height: TV_CASING.y + TV_CASING.height }
/** The screen: the pictures' shape (960 x 499 = 150:78). */
const TV_SCREEN = { x: TV_CASING.x + TV_SIDE, y: TV_CASING.y + TV_TOP, width: 150, height: 78 }
const TV_COLORS = {
  outline: '#2b2d33',
  lip: '#e4e6ea',
  casing: '#b4b8bf',
  casingShade: '#9a9ea7',
  base: '#80848d',
  bezelEdge: '#5d616a',
  bezel: '#24262c',
  antenna: '#2b2b35',
  antennaBase: '#9a9ea7',
  badgeInk: '#5d616a',
  panel: '#3a3c43',
  panelLight: '#53565f',
  hole: '#15161a',
  jackYellow: '#efc400',
  jackWhite: '#e8e6ee',
  jackRed: '#d0302f',
  led: '#ff4545',
  ledDark: '#8c1c1c',
  button: '#c4c7ce',
  buttonLight: '#eceef2',
  knob: '#c9cad8',
  knobLight: '#f4f4fa',
  knobDark: '#6e6f85',
}
/** LATIF in a 3 x 5 pixel font, for the badge band. */
const TV_BADGE = [
  ['X..', 'X..', 'X..', 'X..', 'XXX'],
  ['.X.', 'X.X', 'XXX', 'X.X', 'X.X'],
  ['XXX', '.X.', '.X.', '.X.', '.X.'],
  ['XXX', '.X.', '.X.', '.X.', 'XXX'],
  ['XXX', 'X..', 'XX.', 'X..', 'X..'],
]

let tvUrl: string | null = null

function tvArt(): string {
  if (tvUrl !== null) return tvUrl
  const { width: W, height: H } = TV
  const grid: (string | null)[][] = Array.from({ length: H }, () => Array<string | null>(W).fill(null))
  const set = (x: number, y: number, color: string | null) => { if (x >= 0 && y >= 0 && x < W && y < H) grid[y][x] = color }
  const fill = (x0: number, y0: number, w: number, h: number, color: string | null) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, color)
  }
  /** Whether (x, y) is inside a w × h box at (x0, y0) with its corners cut in steps (`cuts[row]` px). */
  const inRounded = (x: number, y: number, x0: number, y0: number, w: number, h: number, cuts: number[]) => {
    if (x < x0 || y < y0 || x >= x0 + w || y >= y0 + h) return false
    const cut = cuts[Math.min(y - y0, y0 + h - 1 - y)] ?? 0
    return x >= x0 + cut && x < x0 + w - cut
  }
  const line = (x0: number, y0: number, x1: number, y1: number, color: string) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))
    for (let i = 0; i <= steps; i++) set(Math.round(x0 + (x1 - x0) * i / steps), Math.round(y0 + (y1 - y0) * i / steps), color)
  }

  // rabbit-ear antennas on a little base, on top of the set
  const mid = W / 2
  line(Math.round(mid) - 2, TV_CASING.y - 1, Math.round(mid) - ANTENNA.reach, 0, TV_COLORS.antenna)
  line(Math.round(mid) + 2, TV_CASING.y - 1, Math.round(mid) + ANTENNA.reach, 0, TV_COLORS.antenna)
  fill(Math.round(mid) - 7, TV_CASING.y - 2, 14, 3, TV_COLORS.outline)
  fill(Math.round(mid) - 6, TV_CASING.y - 2, 12, 2, TV_COLORS.antennaBase)

  // the grey plastic casing: round corners, a lit lip along the top, the right side in shade,
  // a darker base along the bottom
  const C = TV_COLORS
  const c = TV_CASING
  const inCasing = (x: number, y: number) => inRounded(x, y, c.x, c.y, c.width, c.height, [4, 2, 1, 1])
  for (let y = c.y; y < c.y + c.height; y++) {
    for (let x = c.x; x < c.x + c.width; x++) {
      if (!inCasing(x, y)) continue
      const edge = !inCasing(x - 1, y) || !inCasing(x + 1, y) || !inCasing(x, y - 1) || !inCasing(x, y + 1)
      const row = y - c.y
      set(x, y, edge ? C.outline : row === 1 ? C.lip : row >= c.height - 3 ? C.base : x >= c.x + c.width - 3 ? C.casingShade : C.casing)
    }
  }

  // a thick dark bezel round the screen (its outer ring a step down from the casing), then
  // the screen itself cut out with rounded (CRT) corners
  const s = TV_SCREEN
  const b = 3
  for (let y = s.y - b; y < s.y + s.height + b; y++) {
    for (let x = s.x - b; x < s.x + s.width + b; x++) {
      if (!inRounded(x, y, s.x - b, s.y - b, s.width + 2 * b, s.height + 2 * b, [3, 1, 1])) continue
      const ring = Math.min(x - (s.x - b), y - (s.y - b), s.x + s.width + b - 1 - x, s.y + s.height + b - 1 - y)
      set(x, y, ring === 0 ? C.bezelEdge : C.bezel)
    }
  }
  for (let y = s.y; y < s.y + s.height; y++) {
    for (let x = s.x; x < s.x + s.width; x++) if (inRounded(x, y, s.x, s.y, s.width, s.height, [3, 1, 1])) set(x, y, null)
  }

  // the badge band under the screen: LATIF, centred
  const bandY = s.y + s.height + b
  const badgeW = TV_BADGE.length * 4 - 1
  TV_BADGE.forEach((glyph, i) => glyph.forEach((rowBits, gy) => [...rowBits].forEach((bit, gx) => {
    if (bit === 'X') set(Math.round((W - badgeW) / 2) + i * 4 + gx, bandY + 1 + gy, C.badgeInk)
  })))

  // the control strip: a dark inset panel, lit along its top, holding (left to right) a power
  // button and its light, AV sockets (yellow, white, red, as in the reference), four buttons,
  // a speaker grille and two knobs
  const p = { x: TV_SIDE + 1, y: bandY + 7, width: W - 2 * (TV_SIDE + 1), height: 11 }
  for (let y = p.y; y < p.y + p.height; y++) {
    for (let x = p.x; x < p.x + p.width; x++) {
      if (!inRounded(x, y, p.x, p.y, p.width, p.height, [1])) continue
      const edge = !inRounded(x - 1, y, p.x, p.y, p.width, p.height, [1]) || !inRounded(x + 1, y, p.x, p.y, p.width, p.height, [1])
        || y === p.y || y === p.y + p.height - 1
      set(x, y, edge ? C.outline : y === p.y + 1 ? C.panelLight : C.panel)
    }
  }
  const cy = p.y + 5 // the strip's middle row
  const round = (cx: number, r2: number, body: string, light: string, dark: string) => {
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const d = dx * dx + dy * dy
        if (d > r2) continue
        set(cx + dx, cy + dy, d > r2 - 4 ? C.outline : dx + dy < -1 ? light : dx + dy > 2 ? dark : body)
      }
    }
  }
  round(p.x + 5, 6, C.button, C.buttonLight, C.knobDark) // power button
  fill(p.x + 10, cy - 1, 2, 1, C.led); fill(p.x + 10, cy, 2, 1, C.ledDark) // its light
  for (const [i, color] of [C.jackYellow, C.jackWhite, C.jackRed].entries()) { // sockets: a ring round a hole
    const jx = p.x + 17 + i * 5
    fill(jx - 1, cy - 1, 3, 3, color)
    set(jx, cy, C.hole)
  }
  for (let i = 0; i < 4; i++) { // push buttons
    const bx = p.x + 35 + i * 9
    fill(bx, cy - 1, 6, 3, C.button)
    fill(bx, cy - 1, 6, 1, C.buttonLight)
    fill(bx, cy + 2, 6, 1, C.hole)
  }
  for (let x = p.x + 75; x < p.x + p.width - 24; x += 2) fill(x, cy - 3, 1, 7, C.hole) // grille
  for (const kx of [p.x + p.width - 17, p.x + p.width - 7]) { // knobs, with a pointer
    round(kx, 12, C.knob, C.knobLight, C.knobDark)
    set(kx, cy, C.outline); set(kx + 1, cy - 1, C.outline)
  }

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return (tvUrl = '')
  drawColorGrid(ctx, grid, 1)
  return (tvUrl = canvas.toDataURL())
}

// ── The year's flag, at the head of the Timeline ───────────────────────────
// A pixel-art pennant drawn in font pixels (one per 0.1em), the same grid as the digits laid
// over it: a gold knob, a pole (it stands on the timeline's line), and a red swallowtail
// cloth with a lit top row, a shaded bottom row and a dark outline.

const FLAG = { padX: 4, padY: 1, notch: 5, tail: 2 }
const FLAG_COLORS = {
  knob: '#efc400', knobLight: '#fff2a8', knobDark: '#8a7000',
  pole: '#000', poleLight: '#4a496b',
  outline: '#3d0002', cloth: '#b00206', clothLight: '#e8365d', clothDark: '#7a0104',
}
const flagUrls = new Map<string, string>()

/** The year on its pennant (ProjectPopup.css: .project-popup-flag). */
function yearFlag(year: number): HTMLElement {
  const text = String(year)
  const size = measureText(text) // font px, with the 1 px shadow
  const knobRows = 3, clothX = 3 // the knob is 4 px wide over the 2 px pole (columns 1-2); the cloth starts beside it
  const clothW = FLAG.padX + size.width + FLAG.padX + FLAG.notch
  const clothH = 1 + FLAG.padY + size.height + FLAG.padY + 1 // outline, padding, the digits, padding, outline
  const cols = clothX + clothW, rows = knobRows + clothH + FLAG.tail
  let url = flagUrls.get(text)
  if (url === undefined) {
    const grid: (string | null)[][] = Array.from({ length: rows }, () => Array<string | null>(cols).fill(null))
    const C = FLAG_COLORS
    // the knob, round-ish, lit from the top left
    grid[0][1] = C.knobLight; grid[0][2] = C.knob
    grid[1][0] = C.knob; grid[1][1] = C.knobLight; grid[1][2] = C.knob; grid[1][3] = C.knobDark
    grid[2][1] = C.knobDark; grid[2][2] = C.knobDark
    // the pole, down to the bottom (where the timeline's line carries on)
    for (let y = knobRows; y < rows; y++) { grid[y][1] = C.poleLight; grid[y][2] = C.pole }
    // the cloth, its right end cut into a swallowtail
    const mid = (clothH - 1) / 2
    for (let r = 0; r < clothH; r++) {
      const right = clothX + clothW - 1 - FLAG.notch + Math.round(FLAG.notch * Math.abs(r - mid) / mid)
      const fill = r === 0 || r === clothH - 1 ? C.outline : r === 1 ? C.clothLight : r === clothH - 2 ? C.clothDark : C.cloth
      for (let x = clothX; x < right; x++) grid[knobRows + r][x] = fill
      grid[knobRows + r][right] = C.outline
    }
    const canvas = document.createElement('canvas')
    canvas.width = cols
    canvas.height = rows
    const ctx = canvas.getContext('2d')
    if (ctx) drawColorGrid(ctx, grid, 1)
    url = ctx ? canvas.toDataURL() : ''
    flagUrls.set(text, url)
  }
  const em = (px: number) => `${px / TEXT_FONT_HEIGHT}em`
  const flag = document.createElement('div')
  flag.className = 'project-popup-flag'
  flag.style.width = em(cols)
  flag.style.height = em(rows)
  flag.style.setProperty('--flag-art', `url("${url}")`)
  const digits = label(text, 'project-popup-flag-year')
  digits.style.left = em(clothX + FLAG.padX)
  digits.style.top = em(knobRows + 1 + FLAG.padY)
  flag.append(digits)
  return flag
}

/** How long the TV shows static, at least, when it tunes to another tab's picture (ProjectPopup.tuneTV). */
const TUNE_MS = 260
/** The same when the pop-up opens: a little longer, like a set warming up. */
const OPEN_TUNE_MS = 420

/**
 * The experiment's opening (ProjectPopup.css, "The opening"): the band opens (250 ms), then the
 * panel slides in (183 ms) and has landed. Keep this in step with the CSS.
 */
const OPENING_MS = 433

/** Resolves once the image at `src` is loaded and decoded (or failed to), so showing it is instant. */
function decodeImage(src: string): Promise<void> {
  const img = new Image()
  img.src = src
  return img.decode().catch(() => {})
}
