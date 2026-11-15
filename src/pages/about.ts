import { startSubpage } from '../core/subpage'
import { CircleAnimation } from '../components/CircleAnimation'
import { GREEN_PAGE_RINGS } from '../config'

const page = startSubpage('about')

const circles = new CircleAnimation(3000, { colors: GREEN_PAGE_RINGS })
page.innerHTML = circles.markup()
circles.start()

// TODO: about me content
