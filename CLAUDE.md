# Latif's portfolio site

Vite + vanilla TypeScript multi-page site styled like a game menu (not React, despite
the folder name). Landscape phones are a primary target: **mobile performance and
"don't break anything" are the priorities.**

## Commands

- `npm run dev`: dev server with `--host` (phones on the same Wi-Fi can open the Network URL)
- `npm run typecheck`: TypeScript check only
- `npm run build`: typecheck + production build to `dist/`; `npm run preview` serves it

Git repo, pushed to https://github.com/Asdy419/latifs_website (public, branch `main`). Commit before large changes.

## Layout

```
index.html, projects.html, …   one HTML file per page (vite.config.ts finds them all
                               and injects the shared <head> tags)
src/
  config.ts          COLORS + SUBPAGES (the list that drives the main menu)
  projects.ts        PROJECTS: the Projects page (pinned GitHub repos: box + pop-up details)
  pages/<name>.ts    entry module for <name>.html
  core/
    page.ts          startPage(): every page starts here (CSS, guard, --vh, service worker)
    subpage.ts       startSubpage(id): sub-page shell (wipe in, music, HUD, BACK → menu)
    Scene.ts         Scene base class + transitionTo() (the reference's palette fade between scenes)
    pageTransition.ts  navigateTo() / pageReveal() / MENU_URL (three-band wipe between pages)
    screenGuard.ts   blocking overlay: rotate phone / screen too small / maximise window
    inputLock.ts     lockInput(): swallow key/click input during transitions
  scenes/            TitleScreen → Menu (screens inside index.html)
  components/        Hud (corner HUD) + HudButton (one badge), ButtonMenu, NowPlaying,
                     CircleAnimation, TvOverlay, PixelCanvas + PixelText, ProjectCarousel + ProjectCard,
                     ProjectPopup
  utils/             audio.ts (sound effects + mute flag), music.ts (background music),
                     alphaMask.ts (pixel-perfect hit tests), pixelArt.ts (drawing pixel art),
                     menuFont.ts (menu buttons), hudArt.ts (corner prompts' text),
                     pixelFont.ts (project boxes),
                     selectJump.ts (the menu's select jump, shared with the project boxes)
  styles/base.css    global CSS (reset, #app, .page, colours, --art-px, .page-banner)
  assets/            organised by page/screen: shared/ (sounds, BACK badge, site_icon.png),
                     title/, menu/, projects/, about/, socials/, gallery/, bg_music/
public/icons/        tab / home-screen icons, generated from assets/shared/site_icon.png
```

Component/scene CSS sits next to its `.ts` file and is imported by it.

## Conventions

- **Pages**: the home page imports `core/page` first (so `base.css` is first in the
  cascade); sub-pages call `startSubpage(id)` from `core/subpage`, which does that.
- **HUD** (`components/Hud.ts`, layout in `HudButton.css`): on every page, [B] BACK
  with [M] MUTE under it top-left, and [↵] CONFIRM top-right. Sizes come from
  `--hud-size/-top/-side/-gap` (smaller-but-same-proportion phone values in the media
  query); on touch screens each badge gets a bigger invisible tap area. Each badge is
  the user's icon image (key cap + bar) with its action drawn on the bar in the
  reference clip's prompt font (`utils/hudArt.ts`), where the old label images' letters
  were. The user wants the key caps and bars kept as they are: when restyling, change
  only the text.
  - BACK / B / Escape: sub-page → main menu (`navigateTo(MENU_URL, { replace: true })`;
    index.html sees `#menu`, starts covered and opens straight on the menu); menu → title
    screen (same as Exit). It plays the confirm sound.
  - CONFIRM: on the menu = Enter (`ButtonMenu.confirmSelection()`); on sub-pages it does
    whatever `startSubpage(id, { onConfirm })` passes (nothing yet), and Enter does too.
  - MUTE / M: works the same everywhere (see Mute below).
  - "Now Playing" sits under CONFIRM, or just below the title banner on pages that
    have one (all of them, currently; rule in base.css).
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
- **Art**: use the user's own pixel-art images, not CSS text. Game-style text is
  drawn in code in pixel fonts rebuilt from the user's references (menu buttons,
  corner prompts, project boxes), never in CSS fonts. The user often exports on a
  1920×1080 transparent canvas, so crop before use (losslessly: check the total alpha
  before and after). A full canvas costs ~8 MB of memory on a phone.
  - Corner badges (HudButton): icon cropped to key cap + bar (`mute.png`, `confirm.png`,
    `shared/back_btn.png`). Each badge's `labelLeft` in Hud.ts is where its icon's bar
    starts (% of width); the text goes 0.184 × the badge height past that.
  - Title banners (`menu/menu_logo.png`, `<page>/<name>_banner.png`): kept on their
    full 2172×724 canvas (not cropped) with the blue bar centred at (1086, 400), so the
    one `.page-banner` rule in base.css puts every banner where the menu's logo is.
    The user's exports don't always land there: move the art by whole pixels to match
    (measure the bar; never resample), rather than adding per-page CSS offsets.
    Background removal can leave faint stray specks: erase blobs separate from the
    banner, checking the banner's own pixels are unchanged. Set per page via `banner`
    in config.ts. The user sometimes drops new exports into `dist/`, which the build
    wipes: move them into `src/assets/<page>/`.
- **Performance**: animate `transform`/`opacity` only; don't run per-frame loops that
  aren't needed.
  - Images: every imported PNG is served as WebP by `vite-imagetools` (vite.config.ts):
    lossless for UI art, near-lossless for `menu_logo`, and lossy quality 92 (exact
    alpha) for `*_banner.png`, whose soft edges cost ~360 KB each losslessly vs ~75 KB.
    Source PNGs stay as they are. Use images through JS imports, not CSS `url()` (that
    would ship a second PNG copy). Masks take the URL from a CSS variable set in TS
    (`--tv-mask`).
  - Video/audio aren't converted automatically. `menu/static.mp4` is H.264 CRF 26 with
    no audio track; `MenuAccept` is MP3. Short UI blips stay WAV (MP3 adds start latency).
    Encode new media the same way.
  - Loading order on the home page: title image (fetchpriority high) → sounds
    (`loadSounds()`) → menu images (`Menu.preload()`, which must list every menu image)
    → video. Keep big downloads out of the title screen's first paint.
  - Rings (`CircleAnimation`): drawn by a WebGL fragment shader (one draw call per
    frame, aliased edges like `crispEdges`), with the original SVG as an automatic fallback
    (no WebGL, software GL, or context loss). Shape constants are shared by both.
  - Page wipe (`pageTransition.css`): copied frame by frame from the reference clip at
    0:26: three fixed bands with stair-stepped 45° seams, uncovered by edges sweeping 60
    art px per 1/30s (cover 267ms, reveal 200ms). The CSS is **not imported**:
    vite.config.ts inlines it into every page's `<head>` so the cover is styled in the
    first paint (on the dev server, CSS otherwise arrives via JS and the bare background
    flashed first). So it can't use base.css: `--wipe-px` repeats `--art-px`. Keep the
    bands no bigger than the screen they cover (each is a masked GPU layer; the old
    4-screens-wide bands flickered on phones).
  - Adaptive reveal (`pageSettled()` in pageTransition.ts): on arrival the cover waits
    until the page's images have decoded and 3 frames in a row took ≤ 40ms, then
    reveals at full speed (fast devices: a few frames; struggling phones hold, max 1.5s).
  - Each HTML file inlines its background colour, and pages arrived at by a wipe ship
    with the transition panels already covering the screen (injected by vite.config.ts;
    on index.html only shown for `#menu`, via a tiny inline script) so the first paint
    never flashes. `pageReveal()` reuses those panels.
- **Art pixels** (`--art-px` in base.css): one pixel of a 424×240 game screen, scaled
  to fit the window. The main menu (buttons, TV, logo/banners) and the Projects page
  are laid out in art px, copied from the user's reference clips, so they keep the
  reference's proportions on every screen (on phones, wider than 16:9, they scale with
  the height). The menu's numbers were measured from `reference/Sonic Mania Plus - main
  menu.mp4` by resampling frames back onto the 424×240 grid; re-measure that way rather
  than eyeballing.
- **Main menu buttons** (ButtonMenu.ts/.css): drawn in code, matching the reference clip
  to within about 1 art px at every frame.
  - Bars: stepped 45° parallelograms (clip-path), 25×175, with a 36px diagonal pitch.
    The selected slot is pinned 219px from the right and 50px from the bottom.
  - Labels: `utils/menuFont.ts`. Its A C D E I K M N O P R S T X were measured from the
    clip (99.5% pixel match); the rest are drawn to the same rules.
  - Long labels get longer bars.
  - The jump on selection, the highlight's dip and pulse, and the list's easing
    (`cubic-bezier(0.16, 0.94, 0.38, 1)` over 0.34s = the game's 25%-per-tick lerp)
    are the reference's per-frame positions. Tune them in CSS only: the classes are
    removed on `animationend`.
  - The label hops first and lands last, as the user originally asked.
- **Confirm flash** (ButtonMenu.ts `flashLabel()`): on confirm, the label blinks
  off/on (`FLASH_PHASE_MS` 25, `FLASH_BLINKS` 14, about 0.7s, ends visible). Web
  Animations API on opacity, so it never conflicts with the CSS jump animations.
- **Confirming**: Enter/Z, clicking the highlighted button again, or clicking the
  [↵] CONFIRM badge all call `ButtonMenu.confirmSelection()`. HudButton clicks only
  count on opaque pixels, and not while the badge is hidden by `hideWhenCovered`.
- **Pixel font** (`utils/pixelFont.ts`): the user's "NEW" reference text, rebuilt as a
  12px-tall bitmap font. N, E and W match the reference pixel for pixel (E's middle bar
  pokes 1px left: that's in the reference); the other glyphs follow its rules (see the
  file header). Show text with `new PixelText(text)` (`components/PixelText.ts`): a
  canvas that fills its parent, fits the text inside, and redraws at the real screen
  resolution whenever its size changes (one shared ResizeObserver), so it's always sharp.
  Use it for in-game-style text instead of CSS fonts. When editing glyphs, check them
  with a rendered sheet; every row of a glyph must be the same length.
- **Projects page**: `ProjectCarousel` (the row) holds one `ProjectCard` per entry in
  `src/projects.ts` (the pinned repos on github.com/Asdy419; that file's header says how
  to add one). Each box: the name in the pixel font, an optional `image` (the project's
  own logo, fitted in 78 × 70), and its languages as overlapping 16 × 16 pixel-art logos
  in the bottom-right corner (`assets/projects/langs/`, made from Devicon, MIT). Layout is in art pixels
  (`--px` = one pixel of a 424 × 240 screen, in ProjectCarousel.css), copied from the
  user's save-select reference: 96 × 164 boxes, 108 apart, selected one centred.
  - Input: ← / →, swipe (follows the finger, rubber-bands at the ends), mouse wheel,
    or tap/click a box. Taps are handled on `pointerup`, not `click` (Chrome can swallow
    the click after a quick swipe).
  - Selected box: the main menu's highlight (red copy behind, pulsing red ↔ pink, box
    lifted up-left, the same split bounce), at the menu's offsets converted to art px.
  - CONFIRM / Enter / tapping the selected box opens `ProjectPopup` (tagline, highlights,
    language bar, links; heading drawn as a selected menu bar). It's appended inside
    `#app` so the banner and HUD stay above it. Enter again opens the repo in a new tab;
    BACK / Escape closes it (`startSubpage`'s `onBack` returns true when it handled it).
- **Screen guard**: mouse devices must be maximised/full screen; touch devices must be
  landscape and at least 480px wide. When testing in headless/emulated browsers, emulate
  touch or use a full-size window, or the guard blocks all input.
- **Windows**: the file system ignores case, so to change a file name's case rename it
  via a temp name (`a.ts → tmp → A.ts`). Imports must match the real case or Linux
  builds break.

## Adding a sub-page

1. Add `{ id, label, banner, background }` to `SUBPAGES` in `src/config.ts`. The menu
   button (its label drawn in the menu font) and the page's title banner appear
   automatically.
2. Copy `about.html` to `<id>.html` and change the title, script path and inline
   background colour.
3. Create `src/pages/<id>.ts` with `const page = startSubpage('<id>')`, then fill `page`.
   The HUD (BACK / MUTE / CONFIRM), music and transitions come with it.

The site is "Latif's Portfolio" (page titles, manifest). Tab and home-screen icons
live in `public/icons/`, generated from `src/assets/shared/site_icon.png`; regenerate
all sizes if it changes.

## Reference material

The user drops reference videos and screenshots into `reference/` (git-ignored: the repo
is public and these are often game footage, so never move them into `src/` or commit them).
Videos: extract frames with ffmpeg and read them as images or contact sheets. ffmpeg
isn't installed system-wide: `npm install ffmpeg-static` in the session scratchpad
gives a working `node_modules/ffmpeg-static/ffmpeg.exe` (keep it out of the project). Ask what to match (timing, layout or
colours): for timing, take every frame around the moment and count frames.
