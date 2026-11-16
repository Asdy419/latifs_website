import { startSubpage } from '../core/subpage'
import { CircleAnimation } from '../components/CircleAnimation'
import { SocialSelect } from '../components/SocialSelect'
import { GREEN_PAGE_RINGS } from '../config'
import { SOCIALS } from '../socials'
import { sfx, playSfx } from '../utils/audio'

// the user's accounts as a row of boxes, after their character-select clip (SocialSelect)
const socials = new SocialSelect(SOCIALS)

const page = startSubpage('socials', {
  onConfirm: () => socials.open(), // [↵] CONFIRM / Enter opens the selected account (and plays the confirm sound)
})

const circles = new CircleAnimation(11000, { colors: GREEN_PAGE_RINGS })
page.innerHTML = circles.markup()
circles.start()

// tapping the selected box opens it too
socials.onConfirm = () => {
  playSfx(sfx.accept)
  socials.open()
}
socials.mount(page)
