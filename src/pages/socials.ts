import { startSubpage } from '../core/subpage'
import { CircleAnimation } from '../components/CircleAnimation'
import { GREEN_PAGE_RINGS } from '../config'

const page = startSubpage('socials')

const circles = new CircleAnimation(11000, { colors: GREEN_PAGE_RINGS })
page.innerHTML = circles.markup()
circles.start()

// TODO: socials content
