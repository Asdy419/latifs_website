import { subpage, type SubpageId } from '../config'
import { startPage } from './page'
import { navigateTo, pageReveal, MENU_URL } from './pageTransition'
import { Hud } from '../components/Hud'
import { showNowPlaying } from '../components/NowPlaying'
import { sfx, playSfx, loadSounds } from '../utils/audio'
import { startMusic, stopMusic } from '../utils/music'

interface SubpageOptions {
  /** What [↵] CONFIRM / Enter does on this page (nothing by default). */
  onConfirm?: () => void
}

/**
 * Sets up a menu sub-page and returns its (empty) full-screen container:
 *  - the wipe in from the menu
 *  - background music, with "Now Playing" once the page is revealed
 *  - the corner HUD: [B] BACK (or B / Escape) returns to the main menu,
 *    [M] MUTE, and [↵] CONFIRM (see `onConfirm`)
 */
export function startSubpage(id: SubpageId, { onConfirm }: SubpageOptions = {}): HTMLDivElement {
  const app = startPage({ background: subpage(id).background, reveal: false })
  const hud = new Hud()
  app.innerHTML = `<div id="${id}" class="page"></div>${hud.markup()}`

  const revealed = pageReveal()
  startMusic().then(title => { if (title) revealed.then(() => showNowPlaying(title)) })
  revealed.then(() => loadSounds()) // for the HUD's sounds

  hud.mount({
    onBack: () => {
      playSfx(sfx.accept)
      stopMusic() // fades out under the wipe
      navigateTo(MENU_URL, { replace: true })
    },
    onConfirm: onConfirm && (() => { playSfx(sfx.accept); onConfirm() }),
    enterConfirms: true,
  })

  return app.querySelector<HTMLDivElement>('.page')!
}
