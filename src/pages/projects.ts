import { startSubpage } from '../core/subpage'
import { CircleAnimation } from '../components/CircleAnimation'
import { ProjectCarousel } from '../components/ProjectCarousel'
import { ProjectPopup } from '../components/ProjectPopup'
import { PROJECTS } from '../projects'
import { sfx, playSfx } from '../utils/audio'

const carousel = new ProjectCarousel(PROJECTS)
const popup = new ProjectPopup()
const circles = new CircleAnimation(7250)

// [↵] CONFIRM / Enter / tapping the selected box: show its details, with a woosh (the user's
// pick); again: open it on GitHub, with the confirm sound. Returns whether that sound is due.
const confirm = (): boolean => {
  if (popup.isOpen) {
    popup.openLink()
    return true
  }
  playSfx(sfx.woosh)
  popup.open(carousel.selected.project)
  carousel.enabled = false // (the rings keep spinning round the pop-up: the user wants them moving)
  return false
}
popup.onClose = () => {
  carousel.enabled = true
  playSfx(sfx.bleep)
}

const page = startSubpage('projects', {
  onConfirm: confirm, // (which plays the confirm sound when confirm says so)
  // [B] BACK / Escape closes the pop-up first
  onBack: () => {
    if (!popup.isOpen) return false
    popup.close()
    return true
  },
})

page.innerHTML = circles.markup()
circles.start()

carousel.onConfirm = () => {
  if (confirm()) playSfx(sfx.accept)
}
carousel.mount(page)
