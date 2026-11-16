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
    el.innerHTML = `
      <div class="project-popup-panel" role="dialog" aria-modal="true" tabindex="-1">
        <header class="project-popup-header">
          <div class="project-popup-titles">
            <h2 class="project-popup-heading"></h2>
            <div class="project-popup-meta"></div>
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
          <a class="project-popup-btn primary" target="_blank" rel="noopener"></a>
          <button class="project-popup-btn" type="button" data-close></button>
        </footer>
      </div>
    `
    // all text in the references' small text font (sizes and colours in ProjectPopup.css)
    const q = <T extends Element>(s: string) => el.querySelector<T>(s)!

    const panel = q<HTMLElement>('.project-popup-panel')
    panel.setAttribute('aria-label', project.title)

    // top: picture and title (the year heads the Timeline tab instead: the user's call, no repeats)
    if (project.image) q('.project-popup-header').prepend(image(project.image, 'project-popup-icon'))
    q('.project-popup-heading').append(label(project.title))

    // left: the screenshot, on the pixel-art TV's screen (static when there isn't one)
    const tv = q<HTMLElement>('.project-popup-shot')
    tv.style.setProperty('--tv-art', `url("${tvArt()}")`)
    tv.style.aspectRatio = `${TV.width} / ${TV.height}`
    const screen = q<HTMLElement>('.project-popup-screen')
    const pct = (v: number, of: number) => `${(v / of) * 100}%`
    screen.style.left = pct(TV_SCREEN.x, TV.width)
    screen.style.top = pct(TV_SCREEN.y, TV.height)
    screen.style.width = pct(TV_SCREEN.width, TV.width)
    screen.style.height = pct(TV_SCREEN.height, TV.height)
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

    // bottom: GitHub, other links, Close
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
    // bottom right: what it was built with (tools as well as languages), on one line
    if (project.tech?.length) {
      const built = document.createElement('div')
      built.className = 'project-popup-builtwith'
      built.append(label('Built with', 'project-popup-builtwith-title'), label(project.tech.join(' / '), 'project-popup-tech'))
      q('.project-popup-actions').append(built)
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
    this.tuneTV(0, { minimum: OPEN_TUNE_MS }) // switches on like a TV: static, then the first picture
    this.showSection('Overview')
    this.centreOnTV()
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
    // the section's parts in one block, which the section centres on the TV (centreOnTV)
    const parts = document.createElement('div')
    parts.className = 'project-popup-section-parts'
    parts.append(...sectionContent(project, name))
    box.replaceChildren(parts)
    box.scrollTop = 0
  }

  /**
   * Lines the section's text up with the TV: its middle level with the TV's middle (the
   * user's call), as far as the room under the tabs allows. The section centres its block
   * over a space at its bottom (ProjectPopup.css), as tall as twice the drop from the TV's
   * middle to the section's: so measured from the boxes alone, not the text (which only
   * settles once its labels have wrapped). Long text squeezes the space away first.
   */
  private centreOnTV(): void {
    const box = this.el?.querySelector<HTMLElement>('.project-popup-section')
    const tv = this.el?.querySelector<HTMLElement>('.project-popup-shot')
    if (!box || !tv) return
    const s = box.getBoundingClientRect(), t = tv.getBoundingClientRect()
    const drop = (s.top + s.bottom) / 2 - (t.top + t.bottom) / 2
    box.style.setProperty('--tv-centre', `${Math.max(0, 2 * drop)}px`)
  }
}

function sectionContent(project: Project, name: Section): HTMLElement[] {
  switch (name) {
    case 'Overview': {
      const parts = [paragraph(project.tagline, 'project-popup-tagline'), paragraph(project.gist, 'project-popup-text')]
      if (project.funFact) {
        const fact = document.createElement('div')
        fact.className = 'project-popup-fact'
        fact.append(label('Fun fact', 'project-popup-fact-title'), paragraph(project.funFact, 'project-popup-text'))
        parts.push(fact)
      }
      return parts
    }
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

/** A key cap, like [B] or [↵], for a button. */
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
// Pixel art drawn once in code (160 × 96 art px) after the user's reference: a
// retro wooden set with rabbit-ear antennas, its frame kept thin so the
// screen is as big as it can be (the antennas and the frame are what matter).
// It's laid over the picture (ProjectPopup.css), which shows through the
// screen (TV_SCREEN, set on the screen element by open()). Static (between
// pictures, or with none) is the site's TV static (TvStatic.ts), one speckle
// per art pixel of the screen.

/**
 * The rabbit ears: how many rows they rise above the casing, and how far each tip leans out
 * from the middle. 12 rows is (at ~1.42 pp per row, the 228 pp TV) the tabs' height plus the
 * gap under them, so with the TV at the top of its column the tips line up with the tabs
 * and the casing with the first line of text.
 */
const ANTENNA = { height: 12, reach: 20 }
const TV_CASING = { x: 0, y: ANTENNA.height, width: 160, height: 88 }
const TV = { width: TV_CASING.width, height: TV_CASING.y + TV_CASING.height }
/** The frame round the screen: outline, wood, a grey face line and a dark bezel line. */
const TV_FRAME = 5
const TV_SCREEN = {
  x: TV_CASING.x + TV_FRAME,
  y: TV_CASING.y + TV_FRAME,
  width: TV_CASING.width - 2 * TV_FRAME,
  height: TV_CASING.height - 2 * TV_FRAME,
}
const TV_COLORS = {
  outline: '#21160f',
  woodLight: '#d0903f',
  wood: '#ad692b',
  woodDark: '#87501f',
  grain: '#9a5b25',
  face: '#8f90a8',
  bezel: '#262632',
  antenna: '#2b2b35',
  antennaBase: '#8f90a8',
}

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

  // the wooden casing: outline, a lighter top edge, a darker bottom, a little grain
  const c = TV_CASING
  const inCasing = (x: number, y: number) => inRounded(x, y, c.x, c.y, c.width, c.height, [3, 1])
  for (let y = c.y; y < c.y + c.height; y++) {
    for (let x = c.x; x < c.x + c.width; x++) {
      if (!inCasing(x, y)) continue
      const edge = !inCasing(x - 1, y) || !inCasing(x + 1, y) || !inCasing(x, y - 1) || !inCasing(x, y + 1)
      const row = y - c.y
      set(x, y, edge ? TV_COLORS.outline : row <= 1 ? TV_COLORS.woodLight : row >= c.height - 2 ? TV_COLORS.woodDark : TV_COLORS.wood)
    }
  }
  for (const [x, y, n] of [[10, c.y + 2, 18], [52, c.y + 2, 12], [100, c.y + 2, 20], [16, c.y + c.height - 3, 14], [70, c.y + c.height - 3, 22], [120, c.y + c.height - 3, 12]]) {
    fill(x, y, n, 1, TV_COLORS.grain)
  }
  for (const [y, n] of [[c.y + 18, 9], [c.y + 47, 12]]) { fill(c.x + 2, y, 1, n, TV_COLORS.grain); fill(c.x + c.width - 3, y + 6, 1, n, TV_COLORS.grain) }

  // a grey face line and a dark bezel line round the screen, then the screen
  // itself cut out with rounded (CRT) corners
  const s = TV_SCREEN
  for (let y = s.y - 2; y < s.y + s.height + 2; y++) {
    for (let x = s.x - 2; x < s.x + s.width + 2; x++) {
      if (!inRounded(x, y, s.x - 2, s.y - 2, s.width + 4, s.height + 4, [2, 1])) continue
      const ring = Math.min(x - (s.x - 2), y - (s.y - 2), s.x + s.width + 1 - x, s.y + s.height + 1 - y)
      set(x, y, ring === 0 ? TV_COLORS.face : TV_COLORS.bezel)
    }
  }
  for (let y = s.y; y < s.y + s.height; y++) {
    for (let x = s.x; x < s.x + s.width; x++) if (inRounded(x, y, s.x, s.y, s.width, s.height, [3, 1, 1])) set(x, y, null)
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

/** Resolves once the image at `src` is loaded and decoded (or failed to), so showing it is instant. */
function decodeImage(src: string): Promise<void> {
  const img = new Image()
  img.src = src
  return img.decode().catch(() => {})
}
