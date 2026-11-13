import { startSubpage } from '../core/subpage'
import { CircleAnimation } from '../components/CircleAnimation'

const page = startSubpage('projects')

const circles = new CircleAnimation(7250)
page.innerHTML = circles.markup()
circles.start()
