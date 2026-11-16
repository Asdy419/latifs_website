import { startSubpage } from '../core/subpage'
import { CircleAnimation } from '../components/CircleAnimation'
import { PhotoGrid } from '../components/PhotoGrid'
import { PhotoViewer } from '../components/PhotoViewer'
import { PixelLabel } from '../components/PixelText'
import { fetchPhotos } from '../utils/cloudinary'
import { sfx, playSfx } from '../utils/audio'

// Photo Gallery: every photo tagged for the gallery in Cloudinary (GALLERY in
// config.ts), pinned up as polaroids over the rings. Confirming one opens it big.

let grid: PhotoGrid | null = null
const viewer = new PhotoViewer()
viewer.onClose = () => { if (grid) grid.enabled = true }
viewer.onDismiss = () => playSfx(sfx.bleep) // closed by a click/tap

// [↵] CONFIRM / Enter / clicking the selected photo: open it big, with a woosh (the same as opening
// a project's box: the user's call); again: close it, silently. Returns whether the confirm sound is
// due (false: startSubpage skips it).
const confirm = (): boolean => {
  if (viewer.isOpen) {
    viewer.close()
    return false
  }
  const item = grid?.selected
  if (!grid || !item) return true
  playSfx(sfx.woosh)
  grid.enabled = false
  viewer.open(item.photo, item.element, item.src)
  return false
}

const page = startSubpage('gallery', {
  onConfirm: confirm, // (which plays the confirm sound when confirm says so)
  // [B] BACK / Escape closes the big view first
  onBack: () => {
    if (!viewer.isOpen) return false
    playSfx(sfx.bleep)
    viewer.close()
    return true
  },
})

const circles = new CircleAnimation(5000)
page.innerHTML = circles.markup()
circles.start()

const status = new PixelLabel('Loading photos...')
status.element.classList.add('gallery-status')
page.append(status.element)

fetchPhotos()
  .then(photos => {
    if (!photos.length) {
      status.setText('No photos yet.')
      return
    }
    status.element.remove()
    grid = new PhotoGrid(photos)
    grid.onConfirm = () => {
      if (confirm()) playSfx(sfx.accept)
    }
    grid.mount(page)
  })
  .catch(err => {
    console.warn('Photo Gallery:', err)
    status.setText("Couldn't load the photos. Try again later.")
  })
