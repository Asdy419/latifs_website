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
  projects.ts        PROJECTS: the Projects page (box + pop-up details per project)
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
                     ProjectPopup, PhotoGrid + Polaroid (the Photo Gallery)
  utils/             audio.ts (sound effects + mute flag), music.ts (background music),
                     cloudinary.ts (the gallery's photo list + image URLs),
                     alphaMask.ts (pixel-perfect hit tests), pixelArt.ts (drawing pixel art),
                     menuFont.ts (menu buttons), textFont.ts (ordinary text + corner
                     prompts), hudArt.ts (corner prompts' text, via textFont),
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
  - "Now Playing" sits just under CONFIRM on every page (rule in HudButton.css). Long
    titles cover the title banner's right end; the user is fine with that overlap.
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
    out when you pick a page or Exit. The title screen removes a pop-up still on
    screen (`hideNowPlaying()`), so the blue screen is never covered by it.
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
  Page backgrounds: menu and Photo Gallery yellow, Projects teal, About Me and Socials
  green (`#4ad39c`, the user's pick). A page's colour is also inlined in its HTML file
  (`<style>` and `theme-color`): change both. Every sub-page has the rings; on the
  green pages the menu's green ring would vanish, so they pass `GREEN_PAGE_RINGS`.
- **Art**: use the user's own pixel-art images, not CSS text. Game-style text is
  drawn in code in pixel fonts rebuilt from the user's references, never in CSS
  fonts. Each place has the font the user picked: menu buttons and pop-up titles
  `menuFont`; project box names `pixelFont` ("NEW"); corner prompts and all other
  text (pop-up body, screen guard, "Now Playing") `textFont`. The user often exports on a
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
  - Rings (`CircleAnimation(timeOffset, { colors })`; colours are shader uniforms, set
    once): drawn by a WebGL fragment shader (one draw call per
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
  - BACK from a sub-page reopens the menu on the button you left from (sessionStorage
    `menu-selection`, already in place, no slide); from the title screen it always
    opens on the first button.
- **Confirm flash** (ButtonMenu.ts `flashLabel()`): on confirm, the label blinks
  off/on (`FLASH_PHASE_MS` 25, `FLASH_BLINKS` 14, about 0.7s, ends visible). Web
  Animations API on opacity, so it never conflicts with the CSS jump animations.
- **Confirming**: Enter/Z, clicking the highlighted button again, or clicking the
  [↵] CONFIRM badge all call `ButtonMenu.confirmSelection()`. HudButton clicks only
  count on opaque pixels, and not while the badge is hidden by `hideWhenCovered`.
  Confirming plays only the flash, except a mouse click on the highlighted button, which
  also jumps. Taps on touch screens just flash, as the user asked.
- **Pixel font** (`utils/pixelFont.ts`): the user's "NEW" reference text, rebuilt as a
  12px-tall bitmap font. N, E and W match the reference pixel for pixel (E's middle bar
  pokes 1px left: that's in the reference); the other glyphs follow its rules (see the
  file header). Show text with `new PixelText(text)` (`components/PixelText.ts`): a
  canvas that fills its parent, fits the text inside, and redraws at the real screen
  resolution whenever its size changes (one shared ResizeObserver), so it's always sharp.
  Use it for in-game-style text instead of CSS fonts. When editing glyphs, check them
  with a rendered sheet; every row of a glyph must be the same length.
- **Text font** (`utils/textFont.ts`): the game's small dialog/prompt font, from
  `reference/image.png` and the menu clip's prompts: 10-row capitals, 2px strokes,
  1px apart, 9px between words, 18px line pitch, with a dark shadow on the right and
  bottom edges. The game's shadows are hand-drawn, so each glyph stores its ink (`X`)
  and shadow (`s`) pixels; the letters in the reference are copied exactly (re-rendering
  its three sentences matches all 7,304 pixels), the rest are drawn to its rules. The
  corner prompts (hudArt.ts) use the same glyphs with their own 1px diagonal shadow.
  - Ordinary text: `new PixelLabel(text)` (one line) or `new PixelLabel(text, { wrap:
    true })` (wraps to its container), in `components/PixelText.ts`. It's styled from
    CSS: `font-size` = the capitals' height, `color` = ink, `--pixel-shadow` = shadow
    (pick a darker shade of the background; the default suits light text), `text-align`,
    and `--pixel-line-height` (default 1.8; the project pop-up uses 1.4).
  - Sizes: whole CSS px per font pixel where possible (the screen guard uses 20px/30px),
    or art px (the pop-up uses 6 art px capitals).
- **Projects page**: `ProjectCarousel` (the row) holds one `ProjectCard` per entry in
  `src/projects.ts` (that file's header says how to add one). The facts (taglines,
  highlights, years) come from the user's write-up `reference/The_Project_Files_Ahmed_Latif*.pdf`
  (the newest: re-exports get "(2)" etc.; extract its text with pypdf in the
  scratchpad, and diff against the site when it changes); language %s come from GitHub
  (`gh api repos/Asdy419/<repo>/languages`). Projects without a public repo leave out
  `url` (no GitHub button); no repo to measure means no `share` (no %). Pop-up titles
  must stay under ~19 menu-font letters or the bar runs out of the panel: check every
  pop-up for overflow on desktop and phone sizes. Each box: the name in the pixel font, an optional `image` (the project's
  own logo, fitted in 78 × 70), and its languages as overlapping 16 × 16 pixel-art logos
  in the bottom-right corner (`assets/projects/langs/`, made from Devicon, MIT). Layout is in art pixels
  (`--px` = one pixel of a 424 × 240 screen, in ProjectCarousel.css), copied from the
  user's save-select reference: 96 × 164 boxes, 108 apart, selected one centred.
  - Input: ← / →, swipe (follows the finger, rubber-bands at the ends), mouse wheel,
    or tap/click a box. Taps are handled on `pointerup`, not `click` (Chrome can swallow
    the click after a quick swipe).
  - Selected box: the main menu's highlight (red copy behind, pulsing red ↔ pink, box
    lifted up-left, the same split bounce), at the menu's offsets converted to art px.
  - CONFIRM / Enter / tapping the selected box opens `ProjectPopup`: nearly full screen
    (the user wanted it "damn near the entire screen"), from just under the corner HUD
    (its top is computed from the `--hud-*` variables) to 4 art px from the other edges.
    It's inserted before the `.hud` so it covers the banner (which fades out meanwhile)
    while the HUD stays on top. The title is large plain text-font text (the user had
    the menu-button bar with its highlight removed). Left: a blank 16:9 picture slot
    (`shot`, for a screenshot later: the user asked for an empty space), kind / when /
    tech, then the language logos with the bar beside them (centred on them, outlined
    with a border so the column's edge can't clip its right side) and the legend
    below. Right: tabs Overview (tagline, gist, fun fact) /
    Features / Numbers / Timeline (← → or click; ↑ ↓ scroll), from the Project Files'
    sections. Every section of every project fits without scrolling at 16:9 and on a
    844 × 390 phone: re-check that after adding text. A tab's colours change on select,
    so its PixelLabel is re-rendered then. Enter again opens the repo in a new tab;
    BACK / Escape closes it (`startSubpage`'s `onBack` returns true when it handled it).
  - `startSubpage`'s `onConfirm` may return false to skip the confirm sound (the
    gallery does when Enter closes a zoomed photo).
- **Photo Gallery**: the photos live on Cloudinary. `fetchPhotos()` (utils/cloudinary.ts)
  reads the public list of images tagged `GALLERY.tag` (`res.cloudinary.com/<cloud>/image/list/<tag>.json`,
  no API key; "Resource list" must be unticked in Cloudinary's Settings → Security;
  404 = nothing tagged). `GALLERY.cloudName` in config.ts (the user's: `jt1dcrqu`) is the only setting; never
  put the API key/secret in the repo (public). Each photo is requested as a square
  crop (`c_fill,g_auto,f_auto,q_auto`) at one of a few fixed sizes (`SIZES` in
  PhotoGrid.ts) so Cloudinary's cache and free-plan credits go further; resized copies
  carry no GPS data. The caption is the photo's `caption` context (Title in Cloudinary).
  - `PhotoGrid`: a CSS grid of 68 × 78 art px `Polaroid`s (5 across at 16:9, more on
    phones) in a scroller that starts under the banner. Selection: arrows (2D, scrolls
    into view), mouse hover, tap. Each polaroid hangs at a slight tilt (hashed from
    its ID, `--tilt`); selected, it gets the menu's highlight and swings on its pin
    (`SWING`/`SWING_MS` in Polaroid.ts, shortened to 500ms at the user's request)
    until it hangs straight. The pin is 9 × 9 pixel art (one data URL per colour).
  - `PhotoViewer` (CONFIRM / Enter / clicking the selected photo; Enter again, BACK or
    any click closes): the whole photo in a frame with an even white border (the user
    didn't want a polaroid here), growing out of the polaroid with an overshoot
    (FLIP, WAAPI in plain px) and shrinking back into it. Shows the small copy at once,
    then the full one (`c_limit`, width stepped to the screen). Inserted before the
    `.hud` so it covers the banner but the corner HUD stays on top.
  - To test without the real account: set `cloudName` to anything and answer
    `res.cloudinary.com` requests from Playwright (`page.route`) with a fake list and
    sharp-generated images; set it back afterwards.
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
