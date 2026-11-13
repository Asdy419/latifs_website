import type { Project } from './components/ProjectCard'
import c from './assets/projects/langs/c.png'
import python from './assets/projects/langs/python.png'
import cpp from './assets/projects/langs/cpp.png'
import jupyter from './assets/projects/langs/jupyter.png'
import typescript from './assets/projects/langs/typescript.png'
import css from './assets/projects/langs/css.png'
import csharp from './assets/projects/langs/csharp.png'

/**
 * The boxes on the Projects page, left to right: the pinned repos on
 * github.com/Asdy419. To add one, add an entry (copy one below):
 *  - name: on the box, in the pixel font (A–Z, 0–9, . , : ' ! ? - + / ( )).
 *    Up to about 4 letters show at full size; longer names shrink to fit.
 *  - title / tagline / highlights: the details pop-up (Enter / CONFIRM).
 *  - languages: from GitHub (% of the code), biggest first; shown in the pop-up.
 *  - logos: small pixel-art language icons in the box's bottom-right corner
 *    (assets/projects/langs/, 16×16, made from Devicon's logos).
 *  - image (optional): the project's own logo/picture, in the middle of the box
 *    (fitted into 78×70, not cropped). Put the PNG in assets/projects/, import
 *    it at the top like the logos, and add `image: myPicture,` to the entry.
 */
export const PROJECTS: Project[] = [
  {
    name: 'Mars Alloc',
    title: 'Mars Allocator',
    year: 2026,
    tagline: 'A crash-proof malloc for Mars rovers. Cosmic rays? Not a problem.',
    highlights: [
      'CRC16 checksums on every block catch radiation bit-flips',
      'Mirrored headers and a quarantine zone recover corrupted memory',
      'Up to 8 thread-safe arenas with O(1) size-class free lists',
      'Survives simulated radiation storms and brownouts',
    ],
    languages: [{ name: 'C', share: 99.4, color: '#555555' }, { name: 'Makefile', share: 0.6, color: '#427819' }],
    logos: [c],
    url: 'https://github.com/Asdy419/Mars-Allocator',
  },
  {
    name: 'Mystic',
    title: 'Mystic Messaging',
    year: 2025,
    tagline: 'A command-line chat room with a few magic words.',
    highlights: [
      'Multi-user, multi-threaded server over TCP',
      'Global chat, private messages and groups',
      'Download shared files over TCP or UDP',
      'Type "mystic help" to see every spell',
    ],
    languages: [{ name: 'Python', share: 100, color: '#3572A5' }],
    logos: [python],
    url: 'https://github.com/Asdy419/Mystic-Messaging-App',
  },
  {
    name: 'Physics',
    title: 'Kinemechanics',
    year: 2026,
    tagline: 'Physics homework that actually moves.',
    highlights: [
      'Projectile motion, solved step by step with the kinematic equations',
      'Elastic and inelastic collision simulator',
      'Save and load simulations to text files',
      'One CMake command fetches and builds SFML for you',
    ],
    languages: [{ name: 'C++', share: 98.9, color: '#f34b7d' }, { name: 'CMake', share: 1.1, color: '#DA3434' }],
    logos: [cpp],
    url: 'https://github.com/Asdy419/SFMLPhysicsProject',
  },
  {
    name: 'Brain AI',
    title: 'Zero-Shot EEG',
    year: 2025,
    tagline: 'Guessing what someone saw, from their brainwaves alone.',
    highlights: [
      'Maps EEG signals into CLIP text and CORnet-S image embeddings',
      'Recognises classes it never trained on (zero-shot)',
      'Ridge regression with rolling z-score normalisation',
      '29% top-5 accuracy on unseen classes (11% top-1)',
    ],
    languages: [{ name: 'Jupyter Notebook', share: 100, color: '#DA5B0B' }],
    logos: [jupyter, python],
    url: 'https://github.com/Asdy419/Zero-Shot-Brain-Stimuli-Classification',
  },
  {
    name: 'Portfolio',
    title: 'Portfolio Site',
    year: 2026,
    tagline: "The retro game menu you're scrolling right now.",
    highlights: [
      'Plain TypeScript and Vite, no framework',
      'Pixel fonts rebuilt frame by frame from a reference clip',
      'WebGL shader rings with an SVG fallback',
      'Tuned for landscape phones',
    ],
    languages: [
      { name: 'TypeScript', share: 74.3, color: '#3178c6' }, { name: 'CSS', share: 21.3, color: '#663399' },
      { name: 'HTML', share: 2.5, color: '#e34c26' }, { name: 'JavaScript', share: 1.8, color: '#f1e05a' },
    ],
    logos: [typescript, css],
    url: 'https://github.com/Asdy419/latifs_website',
  },
  {
    name: 'Clash',
    title: 'Unity Clash',
    year: 2022,
    tagline: 'An arena platformer, still in the workshop.',
    highlights: [
      'Arena platformer built in Unity',
      'Unfinished, but the latest devlog shows where it got to',
    ],
    languages: [{ name: 'C#', share: 99.8, color: '#7355dd' }, { name: 'Other', share: 0.2, color: '#cccccc' }],
    logos: [csharp],
    url: 'https://github.com/Asdy419/Unity-Clash',
    links: [{ label: 'Devlog', url: 'https://youtu.be/3bcJZl15AQw' }],
  },
]
