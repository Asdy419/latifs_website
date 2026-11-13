import { startPage } from '../core/page'
import { COLORS } from '../config'
import { TitleScreen } from '../scenes/TitleScreen'
import { Menu } from '../scenes/Menu'

// Home page: title screen → main menu (scenes swap inside this one page).
// BACK on a sub-page comes here as /#menu and lands straight on the menu,
// continuing the page wipe (index.html starts covered when it sees the hash).
if (location.hash === '#menu') {
  history.replaceState(null, '', location.pathname) // a reload shows the title screen again
  startPage({ background: COLORS.yellow, reveal: true })
  new Menu().show()
} else {
  startPage({ background: COLORS.blue, reveal: false })
  new TitleScreen().show()
}
