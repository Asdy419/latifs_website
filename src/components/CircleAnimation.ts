import './CircleAnimation.css'

/**
 * Two rotating, pulsing rings (blue + orange) drawn full-screen behind a page.
 *
 * Usage:
 *   const circles = new CircleAnimation()
 *   html += circles.markup()   // put the container in the DOM first
 *   circles.start()            // then start animating
 *
 * Rendering: a tiny WebGL fragment shader tests every pixel against the exact
 * ring shapes, so a frame costs a few uniforms and one draw call instead of
 * re-laying-out and re-painting two full-screen SVGs. The hard pixel test
 * gives the same aliased edges as the SVGs' shape-rendering="crispEdges".
 * Where WebGL is missing or would be software-rendered (slow), it falls back
 * to the SVG version. Either way the loop stops when the rings leave the page.
 * One instance per page.
 */

// ── Shapes, in SVG units (a 400×400 viewBox fitted to the screen) ───────────
const CX = 200
const CY = 200
const MIN_R = 91            // smallest ring radius
const STROKE = 13           // ring / outline thickness
const TOP_R = 42            // circle at the top of each ring
const BOT_R = 23            // dot at the bottom of each ring
const PERIOD_BLUE = 14500   // pulse period (ms)
const PERIOD_ORANGE = 10000
const SPIN_PERIOD = 6000    // one full turn (ms): blue clockwise, orange anticlockwise
const SVG_MIN_FRAME_MS = 10 // SVG fallback: cap geometry updates at ~60fps on 120Hz+ screens

export class CircleAnimation {
  private readonly timeOffset: number
  /** Largest ring radius — the ring edge just touches the screen's sides. */
  private maxR = 0

  /** @param timeOffset shifts the pulse phase (ms), so pages don't all start in sync */
  constructor(timeOffset: number = 0) {
    this.timeOffset = timeOffset
  }

  markup(): string {
    return `<div id="circles" class="circles"></div>`
  }

  start(): void {
    const host = document.getElementById('circles')!

    // Ring size depends on the screen shape — recompute on resize/rotate.
    const updateMaxR = () => { this.maxR = computeMaxR() }
    updateMaxR()
    window.addEventListener('resize', updateMaxR)
    const stop = () => window.removeEventListener('resize', updateMaxR)

    if (!this.startWebGL(host, stop)) this.startSvg(host, stop)
  }

  // ── Shared maths ──────────────────────────────────────────────────────────

  /** Smooth cosine pulse between MIN_R and maxR over the given period. */
  private pulse(time: number, period: number): number {
    const t = (1 - Math.cos(((time + this.timeOffset) / period) * Math.PI * 2)) / 2
    return MIN_R + (this.maxR - MIN_R) * t
  }

  // ── WebGL renderer ────────────────────────────────────────────────────────

  /** Returns false if WebGL can't be used (the caller falls back to SVG). */
  private startWebGL(host: HTMLElement, onStop: () => void): boolean {
    const canvas = document.createElement('canvas')
    canvas.className = 'circles-canvas'
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,               // hard edges, like crispEdges
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: 'low-power',
      failIfMajorPerformanceCaveat: true, // no software rendering — SVG is faster then
    })
    const program = gl && createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER)
    if (!gl || !program) return false
    host.append(canvas)

    // One triangle that covers the whole canvas
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
    gl.useProgram(program)
    const uView   = gl.getUniformLocation(program, 'uView')
    const uRadius = gl.getUniformLocation(program, 'uRadius')
    const uSpin   = gl.getUniformLocation(program, 'uSpin')
    const uGap    = gl.getUniformLocation(program, 'uGap')

    // Match the canvas to the screen in device pixels (only when the size changes)
    let needsResize = true
    const onResize = () => { needsResize = true }
    window.addEventListener('resize', onResize)
    const resize = () => {
      needsResize = false
      const dpr = window.devicePixelRatio || 1
      const w = Math.round(host.clientWidth * dpr)
      const h = Math.round(host.clientHeight * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, w, h)
      // centre (device px, y down), device px per SVG unit, canvas height (to flip y)
      gl.uniform4f(uView, w / 2, h / 2, (Math.min(host.clientWidth, host.clientHeight) / 400) * dpr, h)
    }

    const cleanup = () => {
      window.removeEventListener('resize', onResize)
      onStop()
      gl.getExtension('WEBGL_lose_context')?.loseContext() // free GPU memory now
    }

    // If the GPU drops the context (driver reset, memory pressure), carry on as SVG.
    let lost = false
    canvas.addEventListener('webglcontextlost', e => {
      e.preventDefault()
      lost = true
      window.removeEventListener('resize', onResize)
      canvas.remove()
      this.startSvg(host, onStop)
    }, { once: true })

    const spinStart = performance.now()
    const frame = (time: number) => {
      if (lost) return
      if (!canvas.isConnected) { cleanup(); return }
      requestAnimationFrame(frame)
      // Nothing to draw while the screen guard covers the page
      if (document.documentElement.classList.contains('screen-blocked')) return
      if (needsResize) resize()

      const rBlue = this.pulse(time, PERIOD_BLUE)
      const rOrange = this.pulse(time, PERIOD_ORANGE)
      const spin = ((time - spinStart) / SPIN_PERIOD) * Math.PI * 2
      const { aTop, hTop } = blueGap(rBlue)
      gl.uniform2f(uRadius, rBlue, rOrange)
      gl.uniform4f(uSpin, Math.cos(spin), Math.sin(spin), Math.cos(-spin), Math.sin(-spin))
      gl.uniform1f(uGap, Math.atan2(hTop, aTop))
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    requestAnimationFrame(frame)
    return true
  }

  // ── SVG fallback (the original renderer) ──────────────────────────────────

  private startSvg(host: HTMLElement, onStop: () => void): void {
    host.innerHTML = `
      <svg id="circle-svg-2" class="circle-layer" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <circle id="main-ring-2" cx="200" cy="200" fill="none" stroke="#f77129"/>
        <circle id="top-dot-2"   cx="200" fill="#f77129"/>
        <circle id="bot-dot-2"   cx="200" fill="#f77129"/>
      </svg>
      <svg id="circle-svg" class="circle-layer" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
        <path   id="main-arc"   fill="none" stroke="#52dba5"/>
        <circle id="top-circle" cx="200"   fill="none" stroke="#52dba5"/>
        <circle id="bot-dot"    cx="200"   fill="#52dba5"/>
      </svg>
    `
    const q = <T extends Element>(id: string) => host.querySelector<T>(`#${id}`)!
    const mainArc   = q<SVGPathElement>('main-arc')
    const topCircle = q<SVGCircleElement>('top-circle')
    const botDot    = q<SVGCircleElement>('bot-dot')
    const mainRing2 = q<SVGCircleElement>('main-ring-2')
    const topDot2   = q<SVGCircleElement>('top-dot-2')
    const botDot2   = q<SVGCircleElement>('bot-dot-2')

    // These never change, so set them once instead of every frame.
    mainArc.setAttribute('stroke-width',   String(STROKE))
    topCircle.setAttribute('r',            String(TOP_R))
    topCircle.setAttribute('stroke-width', String(STROKE))
    botDot.setAttribute('r',               String(BOT_R))
    mainRing2.setAttribute('stroke-width', String(STROKE))
    topDot2.setAttribute('r',              String(TOP_R))
    botDot2.setAttribute('r',              String(BOT_R))

    const draw = (time: number) => {
      const r = this.pulse(time, PERIOD_BLUE)
      const { aTop, hTop } = blueGap(r)
      mainArc.setAttribute('d', `M ${CX + hTop} ${CY - aTop} A ${r} ${r} 0 1 1 ${CX - hTop} ${CY - aTop}`)
      topCircle.setAttribute('cy', String(CY - r))
      botDot.setAttribute('cy',    String(CY + r))

      const r2 = this.pulse(time, PERIOD_ORANGE)
      mainRing2.setAttribute('r', String(r2))
      topDot2.setAttribute('cy',  String(CY - r2))
      botDot2.setAttribute('cy',  String(CY + r2))
    }

    // Each geometry change re-rasterises the full-screen SVGs, so on 120Hz+
    // screens redraw every other frame (~60fps). The CSS rotation still runs
    // at full refresh rate.
    let last = performance.now()
    draw(last)
    const loop = (time: number) => {
      if (!mainArc.isConnected) { onStop(); return }
      if (time - last >= SVG_MIN_FRAME_MS) {
        last = time
        draw(time)
      }
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function computeMaxR(): number {
  const w = window.innerWidth
  const h = window.innerHeight
  const svgScale = Math.min(w, h) / 400
  return w / (2 * svgScale)
}

/**
 * The blue ring stops where it meets its top circle, leaving a gap for it.
 * Returns where the arc ends: `aTop` up from the centre, `hTop` to either side.
 */
function blueGap(r: number): { aTop: number; hTop: number } {
  const aTop = r - (TOP_R * TOP_R) / (2 * r)
  const hTop = Math.sqrt(Math.max(0, r * r - aTop * aTop))
  return { aTop, hTop }
}

function createProgram(gl: WebGLRenderingContext, vertexSrc: string, fragmentSrc: string): WebGLProgram | null {
  const compile = (type: number, src: string) => {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
  }
  const vs = compile(gl.VERTEX_SHADER, vertexSrc)
  const fs = compile(gl.FRAGMENT_SHADER, fragmentSrc)
  const program = gl.createProgram()
  if (!vs || !fs || !program) return null
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null
}

const VERTEX_SHADER = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

// Same shapes as the SVG fallback. A pixel is coloured if its centre is
// inside a shape (= crispEdges). Blue is drawn over orange.
const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec4 uView;   // centre x, centre y (device px, y down), device px per SVG unit, canvas height
uniform vec2 uRadius; // ring radius: blue, orange (SVG units)
uniform vec4 uSpin;   // cos/sin of the blue spin, cos/sin of the orange spin
uniform float uGap;   // half-angle of the gap at the top of the blue ring

const float HALF_STROKE = ${(STROKE / 2).toFixed(1)};
const float TOP_R = ${TOP_R.toFixed(1)};
const float BOT_R = ${BOT_R.toFixed(1)};
const vec4 BLUE   = vec4(82.0, 219.0, 165.0, 255.0) / 255.0;  // #52dba5
const vec4 ORANGE = vec4(247.0, 113.0, 41.0, 255.0) / 255.0;  // #f77129

// Undo a clockwise on-screen rotation (y down) and convert to SVG units
vec2 unspin(vec2 d, vec2 cs) {
  return vec2(cs.x * d.x + cs.y * d.y, -cs.y * d.x + cs.x * d.y) / uView.z;
}

void main() {
  vec2 d = vec2(gl_FragCoord.x, uView.w - gl_FragCoord.y) - uView.xy;

  // Blue (on top): ring with a gap at the top, outlined circle in the gap, dot at the bottom
  vec2 b = unspin(d, uSpin.xy);
  float rb = uRadius.x;
  bool blue = (abs(length(b) - rb) <= HALF_STROKE && atan(abs(b.x), -b.y) >= uGap)
           || abs(length(b - vec2(0.0, -rb)) - TOP_R) <= HALF_STROKE
           || length(b - vec2(0.0, rb)) <= BOT_R;
  if (blue) { gl_FragColor = BLUE; return; }

  // Orange: full ring, big dot at the top, small dot at the bottom
  vec2 o = unspin(d, uSpin.zw);
  float ro = uRadius.y;
  bool orange = abs(length(o) - ro) <= HALF_STROKE
             || length(o - vec2(0.0, -ro)) <= TOP_R
             || length(o - vec2(0.0, ro)) <= BOT_R;
  gl_FragColor = orange ? ORANGE : vec4(0.0);
}
`
