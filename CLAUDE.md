# Ahmed's portfolio site

Vite + vanilla TypeScript multi-page site styled like a game menu (not React, despite
the folder name). Landscape phones are a primary target: **mobile performance and
"don't break anything" are the priorities.**

## Commands

- `npm run dev`: dev server with `--host` (phones on the same Wi-Fi can open the Network URL)
- `npm run typecheck`: TypeScript check only
- `npm run build`: typecheck + production build to `dist/`; `npm run preview` serves it

This folder is **not a git repo**. Copy files somewhere before large changes.

## Layout

```
index.html, projects.html, …   one HTML file per page (vite.config.ts finds them all
                               and injects the shared <head> tags)
src/
  config.ts          COLORS + SUBPAGES (the list that drives the main menu)
  pages/<name>.ts    entry module for <name>.html
  core/
    page.ts          startPage(): every page starts here (CSS, guard, --vh, service worker)
    subpage.ts       startSubpage(id): sub-page shell (wipe in, music, HUD, BACK → menu)
    Scene.ts         Scene base class + transitionTo() (blue fade between scenes)
    pageTransition.ts  navigateTo() / pageReveal() / MENU_URL (slanted panels between pages)
    screenGuard.ts   blocking overlay: rotate phone / screen too small / maximise window
    inputLock.ts     lockInput(): swallow key/click input during transitions
  scenes/            TitleScreen → Menu (screens inside index.html)
  components/        Hud (corner HUD) + HudButton (one badge), ButtonMenu, NowPlaying,
                     CircleAnimation, TvOverlay
  utils/             audio.ts (sound effects + mute flag), music.ts (background music),
                     alphaMask.ts (pixel-perfect hit tests)
  styles/base.css    global CSS (reset, #app, .page, colour variables)
  assets/            organised by page/screen: shared/ (sounds, BACK badge), title/, menu/,
                     projects/, about/, socials/, gallery/, bg_music/
```

Component/scene CSS sits next to its `.ts` file and is imported by it.

## Conventions

- **Pages**: the home page imports `core/page` first (so `base.css` is first in the
  cascade); sub-pages call `startSubpage(id)` from `core/subpage`, which does that.
- **HUD** (`components/Hud.ts`, layout in `HudButton.css`): on every page, [B] BACK
  with [M] MUTE under it top-left, and [↵] CONFIRM top-right. Sizes come from
  `--hud-size/-top/-side/-gap` (smaller-but-same-proportion phone values in the media
  query); on touch screens each badge gets a bigger invisible tap area.
  - BACK / B / Escape: sub-page → main menu (`navigateTo(MENU_URL, { replace: true })`;
    index.html sees `#menu`, starts covered and opens straight on the menu); menu → title
    screen (same as Exit). It plays the confirm sound.
  - CONFIRM: on the menu = Enter (`ButtonMenu.confirmSelection()`); on sub-pages it does
    whatever `startSubpage(id, { onConfirm })` passes (nothing yet), and Enter does too.
  - MUTE / M: works the same everywhere (see Mute below).
  - "Now Playing" sits under CONFIRM; on the menu it drops below the logo (Menu.css).
- **Scenes**: implement `render()` + `onMount()`. Register listeners with
  `{ signal: this.signal }`; it aborts when the scene is replaced, so nothing leaks.
- **Navigation**: `navigateTo('/x.html')` between pages, `transitionTo(scene, in, out)`
  between scenes. Both lock input while animating.
- **Hit testing** on images with transparent padding: `isOpaqueAt()` from
  `utils/alphaMask.ts` (cached pixels). Never call `getImageData` per pixel or per frame.
- **Sound effects** (`utils/audio.ts`): `playSfx(sfx.x)` plays through the Web Audio
  API, which gives instant playback and real volume control on iOS. `SFX_VOLUME` is 0.8,
  so effects sit under the music. The context is created on the first tap or key press
  and suspends itself after 5s of silence. Never throws.
- **Background music** (`utils/music.ts`: `startMusic` / `pauseMusic` / `stopMusic`):
  the main menu and every sub-page play a random track from `assets/bg_music/` (never
  the same one twice in a row), looping, at full volume, with fades. Each shows the
  "Now Playing" pop-up (`components/NowPlaying.ts`).
  - Menu: the music starts inside the title screen's key press (iOS only allows audio
    from a user gesture), and the pop-up appears about 1s after the menu shows. It fades
    out when you pick a page or Exit.
  - Sub-pages: the music starts on load, and the pop-up appears after the reveal. If the
    browser blocks autoplay (Safari/Firefox, direct visits), it starts on the first tap
    or key press.
  - Titles come from the file name: "Y2Mate.is - " and "(128 kbps)" are stripped and
    "_ " becomes ": ".
  - The build strips ID3 tags and cover art from MP3s (`stripMp3Tags` in
    vite.config.ts), so the user can drop YouTube downloads in as they are.
  - Adding or changing files in `bg_music` makes the dev server reload the page, which
    breaks browser tests that are mid-run.
  - Fades: animation frames drive them, with a timer backup so they still finish in
    hidden tabs. A `wanted` set records the latest play/pause request, so a fade-out
    can't pause music the visitor has just unmuted.
- **Mute** (the [M] badge, every page, remembered in localStorage) silences the
  background music only, live, never the sound effects. Unmuting resumes the track
  and shows the pop-up again.
- **Colours**: `COLORS` in `config.ts`; `--yellow`/`--blue` in `base.css` must match.
- **Art**: use the user's own pixel-art images for labels, not CSS text. The user
  often exports on a 1920×1080 transparent canvas, so crop before use (losslessly:
  check the total alpha before and after). A full canvas costs ~8 MB of memory on a phone.
  - Menu button labels: `menu/<name>_txt.png`, cropped to content + 2px. Set per page
    via `labelImage` in `config.ts` (required; there's no text fallback). Layout is in
    `.menu-btn-label-img` (ButtonMenu.css).
  - Corner badges (HudButton): icon cropped to key cap + bar (`mute.png`, `confirm.png`,
    `shared/back_btn.png`); label padded to 215px tall with letters starting 34px in from
    the left and 35px from the top (`mute_btn.png`, `unmute_btn.png`, `confirm_btn.png`,
    `shared/back_txt.png`), so one CSS rule sizes every label. Each badge's `labelLeft`
    in Hud.ts is where its icon's bar starts (% of width).
- **Performance**: animate `transform`/`opacity` only; don't run per-frame loops that
  aren't needed.
  - Images: every imported PNG is served as WebP by `vite-imagetools` (vite.config.ts):
    lossless for UI art, near-lossless for `menu_logo`/`projects`. Source PNGs stay as
    they are. Use images through JS imports, not CSS `url()` (that would ship a second
    PNG copy). Masks take the URL from a CSS variable set in TS (`--btn-mask`, `--tv-mask`).
  - Video/audio aren't converted automatically. `menu/static.mp4` is H.264 CRF 26 with
    no audio track; `MenuAccept` is MP3. Short UI blips stay WAV (MP3 adds start latency).
    Encode new media the same way.
  - Loading order on the home page: title image (fetchpriority high) → sounds
    (`loadSounds()`) → menu images (`Menu.preload()`, which must list every menu image)
    → video. Keep big downloads out of the title screen's first paint.
  - Rings (`CircleAnimation`): drawn by a WebGL fragment shader (one draw call per
    frame, aliased edges like `crispEdges`), with the original SVG as an automatic fallback
    (no WebGL, software GL, or context loss). Shape constants are shared by both.
  - Each HTML file inlines its background colour, and pages arrived at by a wipe ship
    with the transition panels already covering the screen (injected by vite.config.ts;
    on index.html only shown for `#menu`, via a tiny inline script) so the first paint
    never flashes. `pageReveal()` reuses those panels.
- **Menu button jump** (ButtonMenu.css): the label hops first and the bar follows
  `--bar-delay` later. The label goes a touch higher (`--label-hop`) and stays up a
  touch longer (`--label-airtime`). The user wants the difference *extremely
  marginal* (currently ≤0.41vw apart at any moment, peak 1.9vw vs the bar's 1.6vw). Measure it with a frame-by-frame
  trace rather than guessing. The bar's jump starts and ends exactly at its resting
  spot (no snaps). The classes are removed on `animationend`, so tune it in CSS only.
- **Confirm flash** (ButtonMenu.ts `flashLabel()`): on confirm, the label blinks
  off/on (`FLASH_PHASE_MS` 25, `FLASH_BLINKS` 14, about 0.7s, ends visible). Web
  Animations API on opacity, so it never conflicts with the CSS jump animations.
- **Confirming**: Enter/Z, clicking the highlighted button again, or clicking the
  [↵] CONFIRM badge all call `ButtonMenu.confirmSelection()`. HudButton clicks only
  count on opaque pixels, and not while the badge is hidden by `hideWhenCovered`.
- **Screen guard**: mouse devices must be maximised/full screen; touch devices must be
  landscape and at least 480px wide. When testing in headless/emulated browsers, emulate
  touch or use a full-size window, or the guard blocks all input.
- **Windows**: the file system ignores case, so to change a file name's case rename it
  via a temp name (`a.ts → tmp → A.ts`). Imports must match the real case or Linux
  builds break.

## Adding a sub-page

1. Add `{ id, label, background }` to `SUBPAGES` in `src/config.ts`. The menu button
   appears automatically.
2. Copy `about.html` to `<id>.html` and change the title, script path and inline
   background colour.
3. Create `src/pages/<id>.ts` with `const page = startSubpage('<id>')`, then fill `page`.
   The HUD (BACK / MUTE / CONFIRM), music and transitions come with it.

`public/favicon.svg` is still the Vite template logo; replace it when there's site art.
