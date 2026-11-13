import './TvOverlay.css'
import tvOverlay from '../assets/menu/tv_overlay.png'

/**
 * TV-shaped frame with an optional looping video playing inside the screen.
 * Position it from the scene's CSS via #tv-wrap.
 */
export class TvOverlay {
  private readonly videoSrc: string | null

  constructor(videoSrc: string | null = null) {
    this.videoSrc = videoSrc
  }

  markup(): string {
    const video = this.videoSrc
      ? `<video id="tv-video" src="${this.videoSrc}" autoplay loop muted playsinline></video>`
      : ''

    return `
      <div id="tv-wrap" style="--tv-mask: url('${tvOverlay}')">
        <img id="tv-frame" src="${tvOverlay}" decoding="async" />
        <div id="tv-white">${video}</div>
      </div>
    `
  }
}
