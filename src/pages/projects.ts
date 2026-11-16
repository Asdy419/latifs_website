import { startSubpage } from '../core/subpage'
import { CircleAnimation } from '../components/CircleAnimation'
import { ProjectCarousel } from '../components/ProjectCarousel'
import { ProjectPopup } from '../components/ProjectPopup'
import { PROJECTS } from '../projects'
import { sfx, playSfx } from '../utils/audio'

const carousel = new ProjectCarousel(PROJECTS)
const popup = new ProjectPopup()
const circles = new CircleAnimation(7250)

// [↵] CONFIRM / Enter / tapping the selected box: show its details; again: open it on GitHub
const confirm = () => {
  if (popup.isOpen) popup.openLink()
  else {
    popup.open(carousel.selected.project)
    carousel.enabled = false // (the rings keep spinning round the pop-up: the user wants them moving)
  }
}
popup.onClose = () => {
  carousel.enabled = true
  playSfx(sfx.bleep)
}

const page = startSubpage('projects', {
  onConfirm: confirm, // plays the confirm sound itself
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
  playSfx(sfx.accept)
  confirm()
}
carousel.mount(page)
