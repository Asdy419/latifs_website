import type { Project } from './components/ProjectCard'
import placeholder from './assets/projects/cards/placeholder.png'

/**
 * The boxes on the Projects page, left to right. To add one:
 *  1. Put the project's picture in src/assets/projects/cards/. It's shown in an
 *     86 × 93 panel (fitted, not cropped), so e.g. 344 × 372 fills it exactly.
 *  2. Import it below, and add a line to the list.
 *
 * Names use the pixel font: A–Z, 0–9 and . , : ' ! ? - + / ( ) (lowercase is
 * drawn as capitals). Up to about 4 letters show at full size; longer names
 * shrink to fit the band.
 */
export const PROJECTS: Project[] = [
  { name: 'Project 1', image: placeholder },
  { name: 'Project 2', image: placeholder },
  { name: 'Project 3', image: placeholder },
  { name: 'Project 4', image: placeholder },
  { name: 'Project 5', image: placeholder },
  { name: 'Project 6', image: placeholder },
]
