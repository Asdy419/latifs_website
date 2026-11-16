/*
 * The title screen's backdrop, after the Sonic Mania title the user sent (reference/88ecef….gif):
 * an island in the sea seen from the sky, spinning. The art is original, drawn in code:
 *
 * - The island: a top-down map laid in the sea and drawn in perspective, Mode 7 style, turning
 *   about its middle (low in the middle of the screen) once every TURN_MS. Grass in broad
 *   light and dark patches with bushes, wide dirt paths from a clearing out to the beaches, a lake with
 *   a river that falls off a cliff into the sea; sandy beaches and stretches of brown cliff round
 *   the coast; shallows streaked with foam. Palm trees by the shore and tiered cone trees inland
 *   stand up on it (sprites scaled with distance, nearest first).
 * - The sea: a small tile of waves and glints repeated out to the horizon, sparkling as it turns.
 * - The sky: a strip of wispy and puffy clouds with far islands along the horizon, scrolling left
 *   as the island turns, but slower (as in the reference).
 *
 * A WebGL fragment shader draws it at one pixel per art pixel (like the menu's rings), scaled up
 * with hard edges, 30 frames a second, and not while the page is hidden or the screen guard is
 * up. Without (fast) WebGL it's one still frame drawn in JS; with reduced motion, one still frame.
 */

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

/** The page's colour behind the backdrop (the sea's): the iOS bottom-bar gap, and the first paint (index.html has it too). */
export const TITLE_BACKGROUND = '#1f5fd6'

/**
 * Where the horizon is, as a fraction of the height: just under the medal's red plate, behind its
 * tails (the medal itself is placed by TitleScreen.css), as in the reference.
 */
export const HORIZON = 0.637

const TURN_MS = 18000 // one full turn of the island
const SKY_SPEED = 0.012 // px per ms the sky scrolls left
const SKY_WIDTH = 1600 // the sky strip's length, round the horizon (it wraps)
const FRAME_MS = 1000 / 30
/**
 * Where the island's middle sits (fraction of the height), and the focal length (fraction of a
 * 16:9 screen's width: a wider screen sees more sea round the island, not a bigger island).
 * Together with TEXELS they fit the whole island (the user wanted to see all of it, a bit bigger)
 * into the band under the medal's tails, "press any button" over it: its far shore just below
 * the tails, its near shore just inside the bottom of the screen (on 16:9, rows ~190 to ~238 of 240).
 */
const PIVOT = 0.852, FOCAL = 0.62
/** Island map texels per world unit (its coast ~0.39 units out); the camera circles its middle 1 unit away. */
const TEXELS = 520
/** The trees' sprite cells (24 × 36 each: a palm, a cone tree), and how tall a cell stands, in world units. */
const CELL = { w: 24, h: 36 }
const TREE_HEIGHT = 0.06
const MAX_TREES = 24

// ── Colours (0xrrggbb) ───────────────────────────────────────────────────────

const SKY = [0x0b4fd6, 0x1a62e6, 0x3179ee, 0x5296f4, 0x7db3f8] // from the top down to the horizon
const CLOUD = 0xffffff, CLOUD_SHADE = 0xc4dcfd, CLOUD_DEEP = 0x96bff8
const FAR_HILL = 0x3f71cf, FAR_HILL_LIGHT = 0x5b8ad9
const FAR_GRASS = 0x2f9e44, FAR_GRASS_DARK = 0x1f7a3a, FAR_CLIFF = 0x8e5a30
const HAZE = 0xa9d4ff, HAZE_FAR = 0x5c9cf2
const SEA = 0x1f5fd6, SEA_WAVE = 0x3f84ee, SEA_GLINT = 0xe9f6ff
const SHALLOW = 0x3fb6ea, SHALLOW_NEAR = 0x79d6f5, FOAM = 0xf2fbff
const SAND = 0xf0cf86, SAND_WET = 0xd9ae62
const ROCK = 0xa8642e, ROCK_STRIPE = 0x864a20, ROCK_DARK = 0x5e3416, ROCK_LIGHT = 0xcf8a4c
const GRASS = 0x3cbc45, GRASS_DARK = 0x2a9a3a, GRASS_LIGHT = 0x67d35a
const PATH = 0xc98a4a, PATH_EDGE = 0x9d5a22
const WATER = 0x2f8fe8
const BUSH = 0x1f8a35, BUSH_LIGHT = 0x5ccf5a
const TRUNK = 0xc27d3a, TRUNK_DARK = 0x8a531f, LEAF = 0x3cbc3c, LEAF_DARK = 0x228238, LEAF_EDGE = 0x173a22, COCONUT = 0x6b3c17
const CONE = 0xd07a2c, CONE_LIGHT = 0xf0a04a, CONE_DARK = 0xa3561c, CONE_EDGE = 0x4a2410, CONE_TRUNK = 0x6b3c17

/** A frame's view: the canvas size, the horizon row, the focal length, the camera's height × focal. */
interface View { w: number; h: number; horizon: number; focal: number; lift: number }
/** A tree on the island: where (texels from its middle), and which sprite (0 palm, 1 cone tree). */
type Tree = [number, number, 0 | 1]

/** The island and where its trees stand, the sea tile, the trees' sprites (made once); the sky strip is made per height. */
interface Maps { island: ImageData; trees: Tree[]; ocean: ImageData; sprites: ImageData }
let maps: Maps | null = null

export class TitleBackground {
  readonly canvas = document.createElement('canvas')

  constructor() {
    this.canvas.className = 'title-bg'
    this.canvas.setAttribute('aria-hidden', 'true')
  }

  /** Puts the backdrop at the back of `host` (filling it) and runs it until `signal` aborts. */
  mount(host: HTMLElement, signal: AbortSignal): void {
    host.prepend(this.canvas)
    maps ??= { ...makeIsland(), ocean: makeOcean(), sprites: makeSprites() }
    const m = maps
    const started = performance.now()
    let view = viewFor(host)
    let sky = makeSky(view.horizon)
    this.canvas.width = view.w
    this.canvas.height = view.h
    const gl = startGl(this.canvas, m)
    const still = reducedMotion.matches || !gl
    const draw = (now: number) => {
      const t = still ? 0 : now - started
      const heading = ((t % TURN_MS) / TURN_MS) * Math.PI * 2
      const trees = placeTrees(m.trees, view, heading)
      const skyShift = (t * SKY_SPEED) % SKY_WIDTH
      if (gl) gl.draw(view, heading, skyShift, trees)
      else drawSoftware(this.canvas, m, sky, view, heading, skyShift, trees)
    }
    gl?.setSky(sky)
    draw(started)

    let resizing = 0, frame = 0, timer = 0
    const fit = () => {
      const next = viewFor(host)
      if (next.w === view.w && next.h === view.h) return
      if (next.horizon !== view.horizon) { sky = makeSky(next.horizon); gl?.setSky(sky) }
      view = next
      this.canvas.width = view.w
      this.canvas.height = view.h
      draw(performance.now())
    }
    window.addEventListener('resize', () => { cancelAnimationFrame(resizing); resizing = requestAnimationFrame(fit) }, { signal })
    signal.addEventListener('abort', () => { cancelAnimationFrame(resizing); cancelAnimationFrame(frame); clearTimeout(timer); gl?.dispose() })
    if (still) return
    // Wakes only for the frames it draws (asking for every display frame and skipping most still
    // costs the page a frame each), and draws nothing while the page is hidden or the screen guard
    // ("rotate your device") covers it.
    const tick = (now: number) => {
      if (!document.hidden && !document.documentElement.classList.contains('screen-blocked')) draw(now)
      timer = window.setTimeout(() => { frame = requestAnimationFrame(tick) }, FRAME_MS - 8)
    }
    frame = requestAnimationFrame(tick)
  }
}

/** The view for `host`'s size, in art px (at least 424 × 240, like --art-px). */
function viewFor(host: HTMLElement): View {
  const cssW = host.clientWidth || innerWidth, cssH = host.clientHeight || innerHeight
  const perCss = Math.max(424 / cssW, 240 / cssH)
  const w = Math.max(424, Math.round(cssW * perCss)), h = Math.max(240, Math.round(cssH * perCss))
  const horizon = Math.round(h * HORIZON)
  return { w, h, horizon, focal: Math.min(w, (h * 424) / 240) * FOCAL, lift: h * PIVOT - horizon }
}

/** The camera at `heading`: which way it looks, its right, and where it is (world units from the island's middle). */
function camera(heading: number) {
  const fwd = [Math.sin(heading), -Math.cos(heading)], right = [Math.cos(heading), Math.sin(heading)]
  return { fwd, right, at: [-fwd[0], -fwd[1]] }
}

/**
 * The trees in view, nearest first, packed 4 floats each for the shader: their foot on screen
 * (x, y), screen px per sprite pixel (0 ends the list), which sprite. Trees wholly below the
 * screen (the nearest) are left out.
 */
function placeTrees(trees: Tree[], v: View, heading: number): Float32Array {
  const { fwd, right, at } = camera(heading)
  const seen: [number, number, number, number, number][] = []
  for (const [tx, ty, kind] of trees) {
    const rx = tx / TEXELS - at[0], ry = ty / TEXELS - at[1]
    const d = rx * fwd[0] + ry * fwd[1]
    if (d < 0.05) continue
    const scale = (TREE_HEIGHT * v.focal) / (d * CELL.h)
    const x = v.w / 2 + ((rx * right[0] + ry * right[1]) * v.focal) / d, y = v.horizon + v.lift / d
    if (y - CELL.h * scale > v.h || x + CELL.w * scale < 0 || x - CELL.w * scale > v.w) continue
    seen.push([x, y, scale, kind, d])
  }
  seen.sort((a, b) => a[4] - b[4])
  const out = new Float32Array(MAX_TREES * 4)
  seen.slice(0, MAX_TREES).forEach(([x, y, scale, kind], i) => out.set([x, y, scale, kind], i * 4))
  return out
}

// ── WebGL ────────────────────────────────────────────────────────────────────

interface Gl { draw(v: View, heading: number, skyShift: number, trees: Float32Array): void; setSky(sky: ImageData): void; dispose(): void }

function startGl(canvas: HTMLCanvasElement, m: Maps): Gl | null {
  const gl = canvas.getContext('webgl', {
    alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false,
    powerPreference: 'low-power', failIfMajorPerformanceCaveat: true, // no software GL: the still frame is better then
  })
  const program = gl && createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER)
  if (!gl || !program) return null
  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(program, 'aPos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
  const u = (name: string) => gl.getUniformLocation(program, name)
  const textures: WebGLTexture[] = []
  const texture = (unit: number, name: string, image: ImageData) => {
    gl.activeTexture(gl.TEXTURE0 + unit)
    if (textures[unit]) gl.deleteTexture(textures[unit]) // (the sky's is replaced when the horizon moves)
    textures[unit] = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, textures[unit])
    for (const p of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, p, gl.NEAREST)
    for (const p of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    gl.uniform1i(u(name), unit)
    gl.uniform2f(u(name + 'Size'), image.width, image.height)
  }
  texture(0, 'uIsland', m.island)
  texture(1, 'uOcean', m.ocean)
  texture(3, 'uSprites', m.sprites)
  const rgb = (c: number) => [(c >> 16) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255] as const
  gl.uniform3f(u('uSkyTop'), ...rgb(SKY[0]))
  gl.uniform3f(u('uHaze'), ...rgb(HAZE))
  gl.uniform3f(u('uHazeFar'), ...rgb(HAZE_FAR))
  gl.uniform1f(u('uTexels'), TEXELS)
  const uView = u('uView'), uCam = u('uCam'), uTrees = u('uTrees')
  let lost = false
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true }, { once: true })
  return {
    setSky: sky => texture(2, 'uSky', sky),
    draw(v, heading, skyShift, trees) {
      if (lost) return
      gl.viewport(0, 0, v.w, v.h)
      gl.uniform4f(uView, v.w, v.h, v.horizon, v.focal)
      gl.uniform4f(uCam, v.lift, heading, skyShift, 0)
      gl.uniform4fv(uTrees, trees)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    dispose: () => gl.getExtension('WEBGL_lose_context')?.loseContext(),
  }
}

const VERTEX_SHADER = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

// Per art pixel: a tree (nearest first), else the sky strip above the horizon, else the ground in
// perspective: the island map where it covers, else the sea tile. Same maths as drawSoftware().
const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec4 uView;   // canvas width, height, horizon row, focal length (art px)
uniform vec4 uCam;    // camera height x focal, heading (rad), sky scroll (px), -
uniform vec4 uTrees[${MAX_TREES}]; // per tree: its foot on screen (x, y), px per sprite pixel (0 ends the list), its sprite
uniform sampler2D uIsland, uOcean, uSky, uSprites;
uniform vec2 uIslandSize, uOceanSize, uSkySize, uSpritesSize;
uniform vec3 uSkyTop, uHaze, uHazeFar;
uniform float uTexels;

vec4 texel(sampler2D t, vec2 size, vec2 at) { return texture2D(t, (floor(at) + 0.5) / size); }

void main() {
  vec2 p = vec2(gl_FragCoord.x, uView.y - gl_FragCoord.y);
  for (int i = 0; i < ${MAX_TREES}; i++) {
    vec4 t = uTrees[i];
    if (t.z <= 0.0) break;
    vec2 local = (p - t.xy) / t.z + vec2(${CELL.w / 2}.0, ${CELL.h}.0);
    if (local.x >= 0.0 && local.y >= 0.0 && local.x < ${CELL.w}.0 && local.y < ${CELL.h}.0) {
      vec4 c = texel(uSprites, uSpritesSize, vec2(local.x + t.w * ${CELL.w}.0, local.y));
      if (c.a > 0.5) { gl_FragColor = vec4(c.rgb, 1.0); return; }
    }
  }
  float row = p.y - uView.z;
  if (row < 0.0) {
    float v = p.y - (uView.z - uSkySize.y);
    gl_FragColor = v < 0.0 ? vec4(uSkyTop, 1.0) : vec4(texel(uSky, uSkySize, vec2(mod(p.x + uCam.z, uSkySize.x), v)).rgb, 1.0);
    return;
  }
  if (row < 2.0) { gl_FragColor = vec4(uHaze, 1.0); return; }
  if (row < 6.0) { gl_FragColor = vec4(uHazeFar, 1.0); return; }
  float d = uCam.x / row;
  float side = (p.x - uView.x * 0.5) * d / uView.w;
  vec2 fwd = vec2(sin(uCam.y), -cos(uCam.y)), right = vec2(cos(uCam.y), sin(uCam.y));
  vec2 at = (fwd * (d - 1.0) + right * side) * uTexels;
  vec2 it = at + uIslandSize * 0.5;
  vec4 c = vec4(0.0);
  if (it.x >= 0.0 && it.y >= 0.0 && it.x < uIslandSize.x && it.y < uIslandSize.y) c = texel(uIsland, uIslandSize, it);
  if (c.a < 0.5) c = texel(uOcean, uOceanSize, mod(at, uOceanSize));
  gl_FragColor = vec4(c.rgb, 1.0);
}
`

function createProgram(gl: WebGLRenderingContext, vertexSrc: string, fragmentSrc: string): WebGLProgram | null {
  const compile = (type: number, src: string) => {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
  }
  const vs = compile(gl.VERTEX_SHADER, vertexSrc), fs = compile(gl.FRAGMENT_SHADER, fragmentSrc)
  const program = gl.createProgram()
  if (!vs || !fs || !program) return null
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null
}

// ── The still frame without WebGL: the shader's maths in JS ─────────────────

function drawSoftware(canvas: HTMLCanvasElement, m: Maps, sky: ImageData, v: View, heading: number, skyShift: number, trees: Float32Array): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const out = ctx.createImageData(v.w, v.h)
  const o = out.data
  const { fwd, right } = camera(heading)
  const copy = (i: number, from: Uint8ClampedArray, j: number) => { o[i] = from[j]; o[i + 1] = from[j + 1]; o[i + 2] = from[j + 2]; o[i + 3] = 255 }
  const fill = (i: number, c: number) => { o[i] = c >> 16; o[i + 1] = (c >> 8) & 255; o[i + 2] = c & 255; o[i + 3] = 255 }
  const mod = (n: number, k: number) => ((n % k) + k) % k
  const sp = m.sprites
  for (let y = 0; y < v.h; y++) for (let x = 0; x < v.w; x++) {
    const i = (y * v.w + x) * 4, px = x + 0.5, py = y + 0.5
    let tree = false
    for (let t = 0; t < MAX_TREES && trees[t * 4 + 2] > 0; t++) {
      const s = trees[t * 4 + 2]
      const lx = Math.floor((px - trees[t * 4]) / s + CELL.w / 2), ly = Math.floor((py - trees[t * 4 + 1]) / s + CELL.h)
      if (lx < 0 || ly < 0 || lx >= CELL.w || ly >= CELL.h) continue
      const j = (ly * sp.width + lx + trees[t * 4 + 3] * CELL.w) * 4
      if (sp.data[j + 3] > 127) { copy(i, sp.data, j); tree = true; break }
    }
    if (tree) continue
    const row = py - v.horizon
    if (row < 0) {
      const sv = Math.floor(py - (v.horizon - sky.height))
      if (sv < 0) fill(i, SKY[0])
      else copy(i, sky.data, (sv * sky.width + Math.floor(mod(px + skyShift, sky.width))) * 4)
      continue
    }
    if (row < 2) { fill(i, HAZE); continue }
    if (row < 6) { fill(i, HAZE_FAR); continue }
    const d = v.lift / row, side = ((px - v.w / 2) * d) / v.focal
    const ax = (fwd[0] * (d - 1) + right[0] * side) * TEXELS, ay = (fwd[1] * (d - 1) + right[1] * side) * TEXELS
    const ix = Math.floor(ax + m.island.width / 2), iy = Math.floor(ay + m.island.height / 2)
    if (ix >= 0 && iy >= 0 && ix < m.island.width && iy < m.island.height) {
      const j = (iy * m.island.width + ix) * 4
      if (m.island.data[j + 3] > 127) { copy(i, m.island.data, j); continue }
    }
    copy(i, m.ocean.data, (Math.floor(mod(ay, m.ocean.height)) * m.ocean.width + Math.floor(mod(ax, m.ocean.width))) * 4)
  }
  ctx.putImageData(out, 0, 0)
}

// ── The maps ─────────────────────────────────────────────────────────────────

/** A blank `w` × `h` map to paint pixels into. */
class Pixels {
  readonly image: ImageData
  readonly w: number
  readonly h: number
  constructor(w: number, h: number) {
    this.w = w
    this.h = h
    this.image = new ImageData(w, h)
  }
  set(x: number, y: number, c: number): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return
    const i = (y * this.w + x) * 4, d = this.image.data
    d[i] = c >> 16; d[i + 1] = (c >> 8) & 255; d[i + 2] = c & 255; d[i + 3] = 255
  }
  get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return -1
    const i = (y * this.w + x) * 4, d = this.image.data
    return d[i + 3] ? (d[i] << 16) | (d[i + 1] << 8) | d[i + 2] : -1
  }
  /** Paints the pixels whose middles are within `r` of (cx, cy), where `onto(their colour)` allows. */
  disc(cx: number, cy: number, r: number, c: number, onto: (c: number) => boolean = () => true): void {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r && onto(this.get(x, y))) this.set(x, y, c)
    }
  }
  /** Calls `at(x, y, t)` along the curve through `points` (Catmull-Rom), about a pixel apart; t runs 0 to 1. */
  along(points: [number, number][], at: (x: number, y: number, t: number) => void): void {
    const lengths = points.slice(1).map((p, i) => Math.ceil(Math.hypot(p[0] - points[i][0], p[1] - points[i][1])))
    const total = lengths.reduce((a, b) => a + b, 0)
    let done = 0
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)]
      for (let s = 0; s <= lengths[i]; s++) {
        const t = s / lengths[i], t2 = t * t, t3 = t2 * t
        const c = (k: 0 | 1) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)
        at(c(0), c(1), (done + s) / total)
      }
      done += lengths[i]
    }
  }
  /** Paints along the curve through `points`, `r` wide either side. */
  stroke(points: [number, number][], r: number, c: number, onto?: (c: number) => boolean): void {
    this.along(points, (x, y) => this.disc(x, y, r, c, onto))
  }
}

const ISLAND_SIZE = 512

/**
 * The island, seen from above. Its coast (a radius for each direction) wanders, with two bays and
 * a point; most of it is beach, three stretches are cliff. Round it, shallows with lines of foam
 * (the open sea is left see-through). Inland, grass in broad light and dark patches, a
 * clearing in the middle with dirt paths out to the beaches, a lake whose river runs out over a
 * cliff as a waterfall, and bushes. Also where its trees stand (texels from its middle): palms
 * near the shore, cone trees further in.
 */
function makeIsland(): { island: ImageData; trees: Tree[] } {
  const N = ISLAND_SIZE, C = N / 2
  const map = new Pixels(N, N)
  const A = 1024
  const coast = new Float32Array(A), cliffs = new Uint8Array(A)
  const gap = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b))
  const lobe = (a: number, at: number, width: number) => Math.exp(-((gap(a, at) / width) ** 2))
  const CLIFFS: [number, number][] = [[-1.9, -1.05], [0.25, 0.85], [2.55, 3.05]]
  for (let i = 0; i < A; i++) {
    const a = (i / A) * Math.PI * 2 - Math.PI
    coast[i] = Math.min(232, 192 + 18 * Math.sin(2 * a + 0.4) + 10 * Math.sin(3 * a + 1.7) + 6 * Math.sin(7 * a + 0.9) + 3 * Math.sin(13 * a + 2.2)
      + 30 * lobe(a, -0.6, 0.3) - 46 * lobe(a, 1.35, 0.22) - 36 * lobe(a, -2.45, 0.2) + 16 * lobe(a, 2.3, 0.3))
    cliffs[i] = CLIFFS.some(([from, to]) => a >= from && a <= to) ? 1 : 0
  }
  const coastAt = (x: number, y: number) => {
    const i = Math.floor(((Math.atan2(y + 0.5 - C, x + 0.5 - C) + Math.PI) / (Math.PI * 2)) * A) % A
    return { R: coast[i], cliff: cliffs[i] === 1, a: (i / A) * Math.PI * 2 - Math.PI }
  }
  const noise = valueNoise(N, 48, 7), fine = valueNoise(N, 9, 19)
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const r = Math.hypot(x + 0.5 - C, y + 0.5 - C)
    const { R, cliff, a } = coastAt(x, y)
    const out = r - R // beyond the coast (+) or inland (−)
    if (out > 18) continue
    if (out > 0) {
      // the shallows: foam at the shore, and broken lines of it further out
      const streak = (from: number, to: number, k: number) => out > from && out < to && Math.sin(a * k + fine(x, y) * 6) > 0.1
      map.set(x, y, out < 2 ? FOAM : streak(5, 6.5, 47) || streak(11.5, 12.5, 31) ? FOAM : out < 10 ? SHALLOW_NEAR : SHALLOW)
      continue
    }
    const inland = -out
    if (cliff && inland < 12) { // rock: dark at its foot, striped, a light lip at the top
      map.set(x, y, inland < 2 ? ROCK_DARK : inland < 10 ? (Math.floor(inland) % 3 === 2 ? ROCK_STRIPE : ROCK) : ROCK_LIGHT)
      continue
    }
    if (!cliff && inland < 11) { map.set(x, y, inland < 3 ? SAND_WET : SAND); continue }
    // grass in broad lighter and darker patches (fine detail only turns to speckle in perspective)
    const n = noise(x, y)
    map.set(x, y, n > 0.62 ? GRASS_DARK : n < 0.34 ? GRASS_LIGHT : GRASS)
  }
  const isGrass = (c: number) => c === GRASS || c === GRASS_DARK || c === GRASS_LIGHT
  const land = (c: number) => isGrass(c) || c === SAND || c === SAND_WET || c === ROCK || c === ROCK_STRIPE || c === ROCK_LIGHT || c === ROCK_DARK
  const toward = (a: number, r: number): [number, number] => [C + Math.cos(a) * r, C + Math.sin(a) * r]
  // the lake, and its river out over the middle cliff, falling as white water down the rock
  const lake: [number, number] = [C - 40, C + 46]
  const river: [number, number][] = [lake, [C + 6, C + 84], toward(0.62, 140), toward(0.56, 196)]
  map.disc(lake[0], lake[1], 28, SHALLOW_NEAR, land)
  map.stroke(river, 8, SHALLOW_NEAR, land)
  map.disc(lake[0], lake[1], 24, WATER)
  map.along(river, (x, y) => {
    const { R, cliff } = coastAt(Math.floor(x), Math.floor(y))
    const falls = cliff && Math.hypot(x - C, y - C) > R - 13
    map.disc(x, y, 5.5, falls ? (Math.floor(Math.hypot(x - C, y - C)) % 2 ? FOAM : SHALLOW_NEAR) : WATER, c => c !== -1)
  })
  // a clearing in the middle and dirt paths from it out to the beaches, wide, with darker edges
  const paths: [number, number][][] = [
    [[C + 10, C - 6], toward(-0.4, 80), toward(-0.62, 150), toward(-0.6, 214)],
    [[C + 10, C - 6], toward(-2.0, 60), toward(-2.25, 120), toward(-2.15, 170)],
    [[C + 10, C - 6], toward(2.0, 70), toward(2.3, 130), toward(2.3, 190)],
  ]
  map.disc(C + 10, C - 6, 20, PATH_EDGE, land)
  for (const p of paths) map.stroke(p, 7, PATH_EDGE, land)
  map.disc(C + 10, C - 6, 17, PATH, c => c === PATH_EDGE)
  for (const p of paths) map.stroke(p, 5, PATH, c => c === PATH_EDGE)
  // bushes, big enough to stay bushes in perspective
  for (let i = 0; i < 40; i++) {
    const [x, y] = toward(rand(i * 5 + 11) * Math.PI * 2, 24 + rand(i * 5 + 12) * 190)
    if (!isGrass(map.get(Math.floor(x), Math.floor(y)))) continue
    const r = 5 + rand(i * 5 + 13) * 3
    map.disc(x, y, r, BUSH, isGrass)
    map.disc(x - 1.5, y - 1.5, r * 0.5, BUSH_LIGHT, c => c === BUSH)
  }
  // the trees, scattered: on grass, clear of the paths and water and of each other; palms in the
  // outer part (up to 10), cone trees nearer the middle (up to 7)
  const trees: Tree[] = []
  const count = [0, 0]
  for (let i = 0; i < 1500 && trees.length < 17; i++) {
    const a = rand(i * 3 + 1) * Math.PI * 2, r = 20 + rand(i * 3 + 2) * 150
    const [x, y] = toward(a, r)
    const kind = r > 100 ? 0 : 1
    if (count[kind] >= [10, 7][kind]) continue
    const clear = [[0, 0], [7, 0], [-7, 0], [0, 7], [0, -7]].every(([dx, dy]) => isGrass(map.get(Math.floor(x + dx), Math.floor(y + dy))))
    if (!clear || trees.some(([tx, ty]) => Math.hypot(tx + C - x, ty + C - y) < 34)) continue
    trees.push([x - C, y - C, kind])
    count[kind]++
  }
  return { island: map.image, trees }
}

/** The sea tile (64 × 64, repeated): waves and a few glints. */
function makeOcean(): ImageData {
  const N = 64
  const map = new Pixels(N, N)
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) map.set(x, y, SEA)
  for (let i = 0; i < 18; i++) {
    const x = Math.floor(rand(i * 7 + 1) * N), y = Math.floor(rand(i * 7 + 2) * N), len = 3 + Math.floor(rand(i * 7 + 3) * 6)
    for (let k = 0; k < len; k++) map.set((x + k) % N, y, SEA_WAVE)
  }
  for (let i = 0; i < 6; i++) {
    const x = Math.floor(rand(i * 5 + 71) * N), y = Math.floor(rand(i * 5 + 72) * N)
    map.set(x, y, SEA_GLINT)
    if (i % 2) map.set((x + 1) % N, y, SEA_GLINT)
  }
  return map.image
}

/** The sky strip: as tall as the sky (`height`) and SKY_WIDTH round, wrapping: bands, clouds, far islands on the horizon. */
function makeSky(height: number): ImageData {
  const W = SKY_WIDTH, H = Math.max(1, height)
  const map = new Pixels(W, H)
  const bands = [0.38, 0.62, 0.8, 0.92, 1]
  for (let y = 0; y < H; y++) {
    const c = SKY[bands.findIndex(b => y < H * b)]
    for (let x = 0; x < W; x++) map.set(x, y, c)
  }
  const span = (x0: number, x1: number, y: number, c: number) => { for (let x = Math.floor(x0); x < x1; x++) map.set(((x % W) + W) % W, y, c) }
  // puffy clouds high up: puffs on a flat bottom, shaded along it
  for (let i = 0; i < 8; i++) {
    const cx = rand(i * 13 + 1) * W, base = Math.round(H * (0.14 + 0.3 * rand(i * 13 + 2))), size = 0.7 + rand(i * 13 + 3) * 0.6
    const puffs = [[-22, -5, 8], [-10, -10, 11], [4, -12, 12], [17, -8, 10], [27, -4, 7]].map(([dx, dy, r]) => [cx + dx * size, base + dy * size, r * size])
    for (let y = Math.floor(base - 26 * size); y < base; y++) {
      let x0 = Infinity, x1 = -Infinity
      for (const [px, py, r] of puffs) {
        const half = r * r - (y + 0.5 - py) ** 2
        if (half > 0) { x0 = Math.min(x0, px - Math.sqrt(half)); x1 = Math.max(x1, px + Math.sqrt(half)) }
      }
      if (x0 < x1) span(Math.round(x0), Math.round(x1), y, y >= base - 2 ? CLOUD_DEEP : y >= base - 5 ? CLOUD_SHADE : CLOUD)
    }
  }
  // wisps of cloud, bigger and more of them towards the horizon: a few slanting rows each, longest
  // in the middle, white with a shaded underside
  for (let i = 0; i < 44; i++) {
    const near = rand(i * 17 + 4) ** 0.6
    const cx = rand(i * 17 + 5) * W, y0 = Math.round(H * (0.22 + 0.68 * near))
    const len = (50 + rand(i * 17 + 6) * 110) * (0.6 + 0.8 * near)
    const rows = 3 + Math.round(near * (2 + 4 * rand(i * 17 + 7)))
    const slant = 3 + Math.round(rand(i * 17 + 8) * 4)
    for (let j = 0; j < rows; j++) {
      const l = len * Math.sin((Math.PI * (j + 0.5)) / rows) ** 0.7
      const x = cx - l / 2 - j * slant
      span(x, x + l, y0 + j, j === rows - 1 ? CLOUD_DEEP : j === rows - 2 ? CLOUD_SHADE : CLOUD)
    }
  }
  // far hills and islands along the horizon
  for (let i = 0; i < 3; i++) {
    const cx = rand(i * 19 + 7) * W, width = 90 + rand(i * 19 + 8) * 80, tall = 9 + rand(i * 19 + 9) * 6
    for (let x = Math.floor(cx - width / 2); x < cx + width / 2; x++) {
      const t = (x - cx) / (width / 2)
      const top = tall * (1 - t * t) * (0.75 + 0.25 * Math.sin(x * 0.21 + i))
      for (let y = Math.round(H - top); y < H; y++) map.set(((x % W) + W) % W, y, y < H - top + 2 ? FAR_HILL_LIGHT : FAR_HILL)
    }
  }
  for (let i = 0; i < 4; i++) {
    const cx = rand(i * 23 + 3) * W, width = 34 + rand(i * 23 + 4) * 40, tall = 4 + rand(i * 23 + 5) * 4
    for (let x = Math.floor(cx - width / 2); x < cx + width / 2; x++) {
      const t = (x - cx) / (width / 2)
      const top = Math.round(tall * Math.sqrt(Math.max(0, 1 - t ** 4)))
      for (let y = H - top; y < H; y++) map.set(((x % W) + W) % W, y, y === H - 1 ? FAR_CLIFF : y < H - top + 2 ? FAR_GRASS : FAR_GRASS_DARK)
    }
  }
  return map.image
}

/** The trees' sprites side by side, each in a CELL with its foot at the bottom middle: a palm, a cone tree. */
function makeSprites(): ImageData {
  const map = new Pixels(CELL.w * 2, CELL.h)
  const edge = (from: number, colour: (next: number[]) => number) => { // a dark edge round what's in the cell starting at `from` (not below its foot)
    const add: [number, number, number][] = []
    for (let y = 0; y < CELL.h - 1; y++) for (let x = from; x < from + CELL.w; x++) {
      if (map.get(x, y) >= 0) continue
      const next = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => (x + dx >= from && x + dx < from + CELL.w ? map.get(x + dx, y + dy) : -1)).filter(c => c >= 0)
      if (next.length) add.push([x, y, colour(next)])
    }
    for (const [x, y, c] of add) map.set(x, y, c)
  }
  // the palm: a ringed trunk leaning a little, fronds, coconuts
  const foot = CELL.h - 1, height = 24
  let cx = 12, cy = foot
  for (let i = 0; i <= height; i++) {
    cx = 11 + Math.round(3 * (i / height) ** 2)
    cy = foot - i
    for (let dx = -1; dx <= 0; dx++) map.set(cx + dx, cy, i % 3 === 0 ? TRUNK_DARK : TRUNK)
  }
  const fronds: [number, number, number][] = [[-165, 10, 4], [-15, 10, 4], [-125, 7, 1], [-55, 7, 1], [155, 8, 5], [25, 8, 5]]
  for (const [angle, length, droop] of fronds) {
    const a = (angle * Math.PI) / 180
    for (let k = 0, n = length * 2; k <= n; k++) {
      const t = k / n
      map.disc(cx + Math.cos(a) * length * t, cy + Math.sin(a) * length * t + droop * t * t, 1.6 * (1 - t) + 0.6, LEAF)
    }
    for (let k = 2, n = length * 2; k < n * 0.8; k++) {
      const t = k / n
      map.set(Math.floor(cx + Math.cos(a) * length * t), Math.floor(cy + Math.sin(a) * length * t + droop * t * t), LEAF_DARK)
    }
  }
  map.set(cx - 2, cy + 2, COCONUT); map.set(cx + 1, cy + 2, COCONUT)
  edge(0, next => (next.some(c => c === LEAF || c === LEAF_DARK) ? LEAF_EDGE : CONE_EDGE))
  // the cone tree: three tiers, each wider than the one above, lit on the left, on a stub of trunk
  const mid = CELL.w + CELL.w / 2
  for (let k = 0; k < 3; k++) {
    const top = 6 + k * 8
    for (let y = top; y < top + 11; y++) {
      const half = 1.5 + (y - top) * (0.48 + 0.1 * k)
      for (let x = Math.ceil(mid - half - 0.5); x < mid + half - 0.5; x++) {
        const across = (x + 0.5 - mid) / half
        map.set(x, y, y === top + 10 ? CONE_DARK : across < -0.35 ? CONE_LIGHT : across > 0.4 ? CONE_DARK : CONE)
      }
    }
  }
  for (let y = 31; y < CELL.h; y++) { map.set(mid - 1, y, CONE_TRUNK); map.set(mid, y, CONE_TRUNK) }
  edge(CELL.w, () => CONE_EDGE)
  return map.image
}

/** Smooth noise over an `n`-pixel square, `cell` px per lattice step: 0–1. */
function valueNoise(n: number, cell: number, seed: number): (x: number, y: number) => number {
  const g = Math.ceil(n / cell) + 2
  const lattice = Array.from({ length: g * g }, (_, i) => rand(i * 31 + seed))
  const smooth = (t: number) => t * t * (3 - 2 * t)
  return (x, y) => {
    const fx = x / cell, fy = y / cell, ix = Math.floor(fx), iy = Math.floor(fy)
    const tx = smooth(fx - ix), ty = smooth(fy - iy)
    const at = (i: number, j: number) => lattice[(iy + j) * g + ix + i]
    return (at(0, 0) * (1 - tx) + at(1, 0) * tx) * (1 - ty) + (at(0, 1) * (1 - tx) + at(1, 1) * tx) * ty
  }
}

/** A deterministic 0–1 number for `n`, so the scene's the same every time. */
function rand(n: number): number {
  let h = (n * 2654435761) >>> 0
  h ^= h >>> 15
  h = Math.imul(h, 2246822519) >>> 0
  h ^= h >>> 13
  return h / 4294967296
}
