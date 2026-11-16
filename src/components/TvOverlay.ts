import './TvOverlay.css'
import tvOverlay from '../assets/menu/tv_overlay.png'
import { staticCanvas } from './TvStatic'

/**
 * TV-shaped frame with static rolling on its screen: the site's TV static
 * (TvStatic.ts, the same as the Projects pop-up's TV), one speckle per art pixel.
 * Position it from the scene's CSS via #tv-wrap.
 */
export class TvOverlay {
  /** The screen's size in art pixels, which is the static's resolution. */
  private readonly screen: { width: number; height: number }

  constructor(screen: { width: number; height: number }) {
    this.screen = screen
  }

  markup(): string {
    return `
      <div id="tv-wrap" style="--tv-mask: url('${tvOverlay}')">
        <img id="tv-frame" src="${tvOverlay}" decoding="async" />
        <div id="tv-white"><div class="tv-static rolling"></div></div>
      </div>
    `
  }

  /** Puts the static on the screen (once the markup is in the page). */
  mount(root: ParentNode): void {
    root.querySelector('#tv-white .tv-static')?.append(staticCanvas(this.screen.width, this.screen.height))
  }
}
