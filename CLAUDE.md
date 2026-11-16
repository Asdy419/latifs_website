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
                     selectJump.ts (the menu's select jump, shared with the project boxes
                     and the gallery's photos), confirmFlash.ts (the confirm flash)
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
  - "Now Playing" sits just under CONFIRM on every page (rule in NowPlaying.css, from
    the `--hud-*` variables). Long titles cover the title banner's right end; the user is
    fine with that overlap. It's a pixel-art banner (the user's call: pixelated like the
    rest of the site): `paintBanner` sizes it to whole art pixels and draws its background
    (a dark fill with a staircase end, nothing else: the user had its grey rim, black
    outline and yellow stripe removed in turn).
- **Scenes**: implement `render()` + `onMount()`. Register listeners with
  `{ signal: this.signal }`; it aborts when the scene is replaced, so nothing leaks.
- **Navigation**: `navigateTo('/x.html')` between pages, `transitionTo(scene, in, out)`
  between scenes. Both lock input while animating.
  - Page changes are timed like the reference clip (0:26, measured frame by frame): on
    confirm the label blinks for 10 frames (`WIPE_DELAY_MS` 333) while the confirm sound
    plays its loud start, then the wipe sweeps in and the browser navigates as soon as it
    covers the screen. Leaving a page stops its sounds, so the confirm sound's quiet tail
    is faded out over the end of the wipe (`fadeOutEffects`) instead of being cut. BACK
    blinks its prompt the same way (`HudButton.flash()`). The user found a longer hold
    (waiting for the whole sound under a static cover) less smooth than this.
- **Hit testing** on images with transparent padding: `isOpaqueAt()` from
  `utils/alphaMask.ts` (cached pixels). Never call `getImageData` per pixel or per frame.
- **Sound effects** (`utils/audio.ts`): `playSfx(sfx.x)` plays through the Web Audio
  API, which gives instant playback and real volume control on iOS. `SFX_VOLUME` is 0.45
  (the user found 0.8 too loud next to the music), so effects sit under the music. The context is created on the first tap or key press
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
  - Background tracks are normalised in dev and builds by `build/normalizeMusic.ts`:
    FFmpeg two-pass loudnorm at -18 LUFS, -2 dB true peak, LRA 50 to preserve dynamics,
    then stereo 44.1 kHz / 192 kbps MP3. Originals stay untouched; `.cache/music/`
    stores processed audio keyed by source contents and settings. Only `bg_music`
    imports go through this; sound effects keep their original levels.
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
    Source PNGs stay as they are.
  - The project boxes' pictures (`container_imgs/`, `cardArt` in vite.config.ts) are
    cropped to their visible pixels (alpha > 8: background-removal dust is cut) and
    scaled to at most 640 px (lossy q90 exact alpha when scaled, else lossless): they're
    drawn at most ~70 art px, and the exports reach 3000 x 3000. That took them from
    ~2.5 MB / ~67 MB decoded to ~0.5 MB / ~10 MB. The directive carries a version
    (`cardArt: 'v2'`): bump it whenever cardArt changes, or imagetools' cache serves
    stale copies (it keys on directives + source bytes).
  - Project pictures are lossless WebP, except photo-like ones listed in `LOSSY_SHOTS`
    (vite.config.ts: photos, shaded art, dense graphs), which get the banners' lossy q92
    with exact alpha (55-80% smaller); line diagrams stay lossless.
  - The pop-up's TV screen is 150:78 (about 1.92:1) and its picture fills it
    (`object-fit: cover`, trimmed equally from both sides). The user wants no black
    around a picture, and no mostly-black pictures: crop a web picture to that shape
    (960 x 499) in its source PNG, or give a screenshot a TV-shaped window in
    `shots/crops.ts` when nothing in it may be cut (applied at build; the coordinates
    are in the cache key).
  - Pictures taken from the web come from Wikimedia Commons with a free licence (public
    domain, CC0, CC BY, CC BY-SA), credited in README.md (author, licence, link,
    changes). Check a Flickr re-upload's description: one "CC BY" photo was someone
    else's, copied from another site. The TSP Solvers and Bitcoin Classifier pictures
    are these. The user wants academic/diagrammatic figures for both (not stock photos),
    and each must fill the TV well: pick figures already near 1.92:1 (trim their
    whitespace and measure), or ones on a flat background that padding blends into; never
    a square figure on wide white, and never a crop of a figure (the user rejected
    cropped maps and graphs as "obviously cropped"): show figures whole. TSP: two solved
    tours side by side, a GA diagram, a PSO swarm (an animation's frame), a
    branch-and-bound search. Bitcoin: Bitcoin Block Data, a Voronoi diagram (1-NN
    regions), a Merkle tree, a payment channel.
  - Horses From Noise's come from the user's Y3 deep learning folder (`asses_1`, its lab-05
    submission folder: the DCGAN the site describes; lab-06 is a different, flow model; the
    folder names hold the user's student number, so never write them into the repo, which
    is public): 325 generated samples tiled
    25 x 13 (whole 32 px samples: exactly 1.923:1, scaled 1.2x), then `lab-05-code.py`'s model
    classes, its results file and its abstract in a VS Code editor view (real line numbers;
    never its STUDENT_ID line or the AI-acknowledgement block).
  - Unity Clash's: the title screen and the user's two Unity-editor captures (menu, stage),
    each fitted with its own flat edge colours (per-row sides, or a band of the editor's top
    strip), then `PlayerMovement.cs`'s jump logic (from the repo) in an editor view.
  - Kinemechanics' are its own screens (`reference/expanded_imgs/menu.png`, `collisions.png`,
    and the original projectile shot) without the Windows title bar, brought to 1.92:1
    without cutting anything (the menu: a window of its empty black rows; the others: the
    left edge padded with the app's own flat colours, per row), then a SUVAT diagram.
  - Pictures from the user's own write-ups (`reference/expanded_imgs/`, e.g. the
    Zero-Shot EEG report): figures rendered from the PDF with PyMuPDF (in a scratchpad
    venv), each figure's bounds taken from the page's vector drawings and text so no
    neighbouring text creeps in, then centred on white at exactly 960 x 499 with a 16 px
    margin (the user wants them to fit the TV exactly, and interesting: plots and
    diagrams, one per tab). Raster figures get their frame line cut off. Leave out
    title pages: they carry the user's full name and email.
  - X-ray Restoration's are figures from its report (`reference/expanded_imgs/Report (3).pdf`),
    in pairs that fill the screen: two square X-rays at the full 499 px height, trimmed
    ~2% at the sides (from whichever side keeps annotations whole) with an 8 px white gap:
    wrecked input vs restored output, the Fourier rotation fit vs the perspective contour,
    the before/after SNR plots (fitted on white: plots' own background), hole found vs
    inpainted. The user wants these to fill the TV: avoid white bands round photos.
  - Slides from the user's decks (e.g. `BiasAI_Presentation.pptx`): PowerPoint (COM, on
    a read-only scratchpad copy; there's no LibreOffice) saves a PDF, and each picture is
    a slide's content area at full width (below its purple top bar, above its citation
    footer), padded at the bottom with the slide's own background to exactly 960 x 499.
    Skip the title slide (the user's name) and slides of brand logos.
  - CompanionAI's are whole slides of its product presentation (`Product presentation.pdf`,
    16:9) widened to 1.92:1 with the slide's own flat edge colour (sampled; #FFAB40 or
    #FFBA49), so nothing is cut. Skip slides with teammates', the client's or the user's
    names and university IDs (1, 2, 13).
  - Mystic Messaging's are the real app's output: its repo cloned to the scratchpad, the
    server and three scripted clients run on loopback (wrappers bind 127.0.0.1, so no
    firewall prompt), and one client's output replayed through a small terminal emulator
    and drawn as a Windows Terminal window (Cascadia Mono, Campbell colours: the code's
    ANSI colours; the user's own terminal theme shows them all red), 76 x 18 cells at
    960 x 499. Chat lines can't contain the word "mystic" (the server takes it as a command).
  - Mars Allocator's: two of code/output and two from its report, as the user asked
    (they want something from each report on the TV): the top of `allocator.c` drawn as
    a VS Code (Dark+) editor; an 18-row stretch of a real `runme --size 65536 --arenas 4
    --storm 2 --seed 2026` run (the 8 KB default heap makes the 4-arena threads log
    failures); then the report's (`allocator_report.pdf`, in the repo) Table 2, the storm
    test, and Fig. 9, a hand-drawn speed chart, each centred on white. There's no C compiler
    on this machine: it was built with Zig's (`pip install ziglang` in a scratchpad venv,
    `python -m ziglang cc -std=c11 -O2 -target x86_64-windows-gnu`) and a small C11
    `<threads.h>` shim over Win32 (MinGW has none), the repo's code unchanged.
  - `CircleAnimation.paused`: the rings stop drawing (no frames at all) while something
    opaque covers the whole page. The project pop-up deliberately doesn't use it: the
    user wants the rings moving round it (it only pauses the selected box's pulse).
    `PixelLabel` skips redrawing a picture it already shows (a wrapped label is
    always measured twice). Use images through JS imports, not CSS `url()` (that
    would ship a second PNG copy). Masks take the URL from a CSS variable set in TS
    (`--tv-mask`).
  - Audio isn't converted automatically: `MenuAccept` is MP3, and short UI blips stay WAV
    (MP3 adds start latency). Encode new sounds the same way. `MenuWoosh` (WAV) plays when a
    project's details open, in place of the confirm sound (the user's pick: copied from
    `reference/` with its silent last 0.23 s trimmed); Enter again (GitHub) still confirms.
  - TV static is drawn in code, not a video (`TvStatic.ts`): the same static on every TV
    (the menu's and the Projects pop-up's, as the user asked), one speckle per art pixel,
    drawn once into a 4-frame canvas strip and rolled at 30fps by a CSS transform (on the
    compositor: no repaints). Against the old 392 KB video, A/B on one page on a
    4x-throttled phone: the same main-thread cost, minus the download and the decoding.
    Drawing the menu's strip takes ~25-30ms there, so `Menu.preload()` works it out in
    idle time on the title screen (`prepareStatic`) and the menu only copies it (~1ms).
    Compare perf runs only within one session/page: dev-server restarts shift the
    baseline by tens of ms/s.
  - Loading order on the home page: title image (fetchpriority high) → sounds
    (`loadSounds()`) → menu images (`Menu.preload()`, which must list every menu image).
    Keep big downloads out of the title screen's first paint.
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
- **Confirm flash** (`utils/confirmFlash.ts`, used by ButtonMenu's `flashLabel()` and
  `HudButton.flash()`): on confirm, the label blinks off/on (`FLASH_PHASE_MS` 25,
  `FLASH_BLINKS` 14, about 0.7s, ends visible). Web Animations API on opacity, so it
  never conflicts with the CSS jump animations.
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
  `url` (no GitHub button); no repo to measure means no `share` (no %). Check every
  pop-up for overflow on desktop and phone sizes. Each box: the name in the pixel font, an optional `image` (the project's
  own logo, sized by area: see below), and its languages as overlapping 16 × 16 pixel-art logos
  in the bottom-right corner (`assets/projects/langs/`, made from Devicon, MIT). Layout is in art pixels
  (`--px` = one pixel of a 424 × 240 screen, in ProjectCarousel.css), copied from the
  user's save-select reference: 96 × 164 boxes, 108 apart, selected one centred.
  - Input: ← / →, swipe (follows the finger, rubber-bands at the ends), mouse wheel,
    or tap/click a box. Taps are handled on `pointerup`, not `click` (Chrome can swallow
    the click after a quick swipe).
  - Selected box: the main menu's highlight (red copy behind, pulsing red ↔ pink, box
    lifted up-left, the same split bounce), at the menu's offsets converted to art px.
  - Each box's picture: the build crops it to its visible pixels (see Performance), and
    `ProjectCard` draws every one with the same area (`ART`: 54 x 54 art px worth, fitted
    in 74 x 64, centred on the same point), so wide, tall and square pictures look the
    same size and sit the same way (the user asked for consistent sizing and spacing).
  - CONFIRM / Enter / tapping the selected box opens `ProjectPopup`: a panel 88% of the
    screen's height (94% on phones; 98% on phones narrower than 2:1, like 667 x 375) with
    the same margin at its sides as above and below, centred, with the page dimmed round
    it; it appears at once, with no animation (the user's call), and a click outside it
    closes it. The corner HUD and the title banner hide meanwhile (the panel has its own
    title and buttons; B / Enter / M still work); the background rings keep moving.
    Everything inside is measured in `--pp` (the panel's art pixel), and every gap is one
    of four steps (`--gap-xs/s/m/l`: 2, 4, 8, 12; 16 between the TV and the text), with one
    layout for every project (no per-project variants). Header: the project's picture
    (24 pp, centred beside both lines, reaching 2 pp past them without making the header
    taller), the title (large text-font text) over a subtitle line lined up with it (kind,
    when; it wraps to a second line when long, as CompanionAI's and Horses' do beside the
    bars). The title is centred over the TV's antennas (`centreNameOnTV`: it moves the
    picture and both lines right together, never past the panel's edge, so long names on
    the narrowest phones stop short; twice, as a rewrapped subtitle can shrink the TV). At
    the right, the language logos, their middle level with the bar's (the user's call), and
    the language bar, a pixel-art meter (in pp: black frame with
    notched corners, each segment with a lit top row and a shaded bottom row, 1 pp black
    dividers, a 2 pp minimum so a 0.6% share still shows) with its legend under it (flat
    square keys, no stroke). Every bar is the same length, the Portfolio's (its four
    languages' legend on one line: 158 pp; 164 on phones; 108 on the narrower phones,
    which have no height for a wrapped subtitle). No year in the header (the user's call:
    no repeats): it heads the Timeline tab, big, on a pixel-art pennant (`yearFlag`, drawn
    in the digits' own font pixels; its pole stands on the timeline's line).
    Footer, on the middle's two columns: "Built with" and the tools (`tech`) under the TV,
    the buttons at the right (white with a black outline and the red pixel shadow; GitHub
    yellow with a black shadow; keys ↵ and B in small black caps).
    Left column: a grey CRT TV after the user's reference, with rabbit-ear antennas
    (`tvArt()`, drawn in code: 164 x 122, a 150 x 78 screen inside a thick dark bezel, a
    LATIF badge band and a control strip under it: power button and light, AV sockets,
    buttons, a grille, knobs; a closer copy with a curved bottom and cables was turned
    down) showing the project's pictures (`shots`, one per tab, wrapping round). The
    screen element is one art pixel bigger than the TV's hole all round (under the bezel):
    flush, its edge landed mid-pixel and the panel showed through as a light line. The TV
    fills the middle's height: as wide as its column (`--tv-column`: 196 pp; 194 on phones;
    166 on the narrower phones, where the text needs the width) unless that would make it
    taller than the middle, then as tall (a container query), top-aligned, raised 4 pp
    above the tabs' top (the user's call; level with them on phones). The tabs are big
    (1.25em: the user wanted them to fill the room). The section's text is a touch smaller
    (4.4 pp, the 8px floor on phones; line pitch 1.3 on the narrower phones) and its block
    is centred on the TV's middle (`centreOnTV`: a top and a bottom spacer, which long text
    squeezes away first), except the Overview's, under the tabs (the user's call); every
    tab's text sits `--text-lower` (4 pp) lower than that (the user's call), through the
    same spacers, so it gives the room back when a tab is full.
    The Overview's tagline is big (1.7em; 1.4 on the narrower phones), wrapping; its fun
    fact is out of the section, a yellow box under it whose bottom is level with the TV's
    (`--tv-under`, set by `centreOnTV`; at the column's bottom on phones, which have no
    height to spare: the narrowest leave ~27 pp under the TV), its red title ("Fun fact!!")
    as big as the tagline (only the title: the user's call). The text column's blocks are
    4 pp apart.
    Opening tunes the TV in from static (`OPEN_TUNE_MS`, after the opening animation when
    there is one); switching tabs tunes it
    (`tuneTV`): rolling static for at least `TUNE_MS` and until the next picture has
    decoded, then the picture; no pictures means still static. The Overview's parts, the
    Features bullets and the Timeline's milestones are 8 pp apart, closing up (to 2, 4 and
    2 pp) where a tab needs the room (spacer items that shrink).
  - The parallelogram experiment (`SLANTED` in ProjectPopup.ts, on): the user is trying a
    Sonic Mania dialog look, and asked for it to be easy to revert (set `SLANTED` false;
    its CSS is one block at the end of ProjectPopup.css). The panel becomes a dark band
    across the screen's whole width but only as tall as the panel always was, the dimmed
    page showing above and below (the user's call: a version over the whole screen was
    rejected), with a blue parallelogram along it (#259cfb, the user's swatch), cutting off
    the band's top-left and bottom-right corners as far as the content allows (the content
    stays exactly where it is: the user's call), and white text on it (#f7f3f7 with
    PixelText's default shadow; text on its own box keeps its colours). The tabs and the
    buttons lean at the same angle (`--lean`, about 27 degrees: the user wanted one angle
    for every shape); the Fun fact was a parallelogram too, then went back to its yellow
    box. The buttons are big black bars with the words well inside (the user tried them
    standing out of the bar's top, like the reference's OK, and preferred them inside),
    a little apart and in from the right, their shadow the site's pulsing red highlight
    (red, with a pink `.project-popup-btn-pulse` layer fading in and out over it: the
    boxes' compositor-only pulse; not on the parallelogram itself, which the user turned
    down). A negative margin keeps the footer as tall as with the plain buttons, and they
    and "Built with" sit midway between the footer's rule and the band's bottom (the
    user's call: nudged down, as there's more room under them than over them); three
    buttons (Unity Clash's Devlog) sit closer together so they stay on one row at 16:9.
    A version that skewed the whole panel (its rows stepping along the lean) was replaced.
    Opening (every time a box opens): copied from the user's clip `reference/Desktop
    2026.11.16 - 02.41.16.02.DVR - Trim.mp4` (a Sonic Mania dialog), measured frame by
    frame: a line about one art pixel tall grows from the middle to the screen's sides
    (0-117 ms), opens into the band at a steady speed (to 250 ms), then the face slides in
    from the left with everything on it, easing out (to 433 ms: `OPENING_MS`). Transforms
    only, plain numbers in the keyframes (Safari and var() in transform keyframes); off for
    reduced motion. The clip's OK jumps as it lands; the user didn't want the buttons to.
    Right: tabs Overview (tagline, gist; the fun fact under them) / Features / Numbers /
    Timeline (left/right or click; up/down scroll), from the Project Files' sections.
    Footer: View on GitHub, other links, Close. Every section of every project fits
    without scrolling at 16:9 and on 844 x 390 and 667 x 375 phones: re-check that after
    adding text (a Playwright loop over every box and tab, comparing scrollHeight with
    clientHeight). A tab's colours change on select, so its PixelLabel is re-rendered
    then. Enter again opens the repo in a new tab; BACK / Escape closes it
    (`startSubpage`'s `onBack` returns true when it handled it).
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
    its ID, `--tilt`); selected, it gets the menu's highlight, does the menu's select
    jump and a quick little wobble on its pin as it straightens (`WOBBLE`/`WOBBLE_MS`
    in Polaroid.ts: the user had the old 500ms swing toned right down). The pin is
    9 × 9 pixel art (one data URL per colour).
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
