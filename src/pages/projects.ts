import { startSubpage } from '../core/subpage'
import { CircleAnimation } from '../components/CircleAnimation'
import { ProjectCarousel } from '../components/ProjectCarousel'
import { PROJECTS } from '../projects'

const page = startSubpage('projects')

const circles = new CircleAnimation(7250)
page.innerHTML = circles.markup()
circles.start()

new ProjectCarousel(PROJECTS).mount(page)
