# Portfolio

An interactive portfolio website styled like a retro console game menu. You navigate it
the way you would a game: arrow keys, Enter and B, or just mouse and touch. It's built
with Vite and plain TypeScript (no framework), with performance on phones as a priority.

![The main menu](docs/screenshots/menu-desktop.webp)

| Moving the selection | On a phone |
| --- | --- |
| ![Main menu with Photo Gallery selected](docs/screenshots/menu-desktop-gallery.webp) | ![Main menu on a phone in landscape](docs/screenshots/menu-phone.webp) |

> **Status:** the title screen and main menu are finished. The Projects, About Me,
> Socials and Photo Gallery pages are still being built.

## Features

- **Game-style main menu**: slanted pixel-art buttons that bounce when you select them.
  The label hops a touch ahead of its button and flashes when you confirm.
- **Key prompts in the corners**: [B] BACK, [M] MUTE and [↵] CONFIRM on every page. They
  work with the keyboard or a click/tap.
- **Background music**: a random track plays on each screen, with a "Now Playing"
  pop-up. Mute only affects the music and is remembered between visits.
- **Transitions**: a three-panel slanted wipe between pages, and a fade between the
  title screen and the menu.
- **Animated backdrop**: two spinning, pulsing rings drawn with a WebGL shader (with an
  SVG fallback), and TV static playing inside the TV frame.
- **Landscape first**: phones are asked to rotate, and desktop browsers to go full screen
  or maximise the window.

## Controls

| Action         | Keyboard   | Mouse / touch                               |
| -------------- | ---------- | ------------------------------------------- |
| Move selection | ↑ / ↓      | Click a button                              |
| Confirm        | Enter or Z | Click the selected button, or **CONFIRM**   |
| Back           | B or Esc   | **BACK**                                    |
| Mute music     | M          | **MUTE**                                    |

## Performance

The site was tuned for mid-range phones:

- The rings are drawn by a fragment shader in a single draw call per frame, instead of
  re-laying-out and repainting two full-screen SVGs. That roughly halves the main-thread
  work while the menu is open.
- Images are converted to WebP at build time (lossless for the pixel art). The video and
  sound effects are re-encoded, and audio-file metadata and cover art are stripped from
  the build.
- Assets load in order of need: the title image first, then sound effects, then the menu
  graphics, then video. Nothing large competes with the first screen.
- Sound effects play through the Web Audio API for instant playback (including on iOS).
- Each page shows its background colour and transition panels on the very first paint,
  so nothing flashes while the scripts load.

## Running it locally

You need [Node.js](https://nodejs.org/) 20.19+ or 22.12+.

```bash
npm install
npm run dev       # dev server, also reachable from a phone on the same Wi-Fi
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build
```

## Project structure

```
index.html, projects.html, …   one HTML file per page
src/
  pages/        entry script for each page
  scenes/       title screen and main menu
  components/   menu buttons, corner HUD, rings, TV, "Now Playing" pop-up
  core/         page setup, page transitions, screen guard, input lock
  utils/        sound effects, background music, pixel-perfect hit testing
  assets/       art, sounds and music, grouped by page
```

## Built with

- [Vite](https://vite.dev/) and TypeScript
- [vite-imagetools](https://github.com/JonasKruckenberg/imagetools) / sharp for the image pipeline
- WebGL, the Web Audio API and the Web Animations API

## Credits

- Pixel art and UI graphics: made by me. The visual style is inspired by the menus of
  *Sonic Mania*.
- Music: tracks from the *Sonic Mania* soundtrack (© SEGA; music by Tee Lopes and the
  game's other composers). They're used in this non-commercial personal project, and all
  rights belong to their owners.
