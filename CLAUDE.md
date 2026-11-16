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
  scenes/            TitleScreen (the titleEmblem medal over TitleBackground's spinning island) → Menu (screens inside index.html)
  components/        Hud (corner HUD) + HudButton (one badge), ButtonMenu, NowPlaying,
                     CircleAnimation, TvOverlay + its shows (GithubHop, SocialDrift, CameraFlash,
                     LightsOut: the menu TV), pfpArt (the user's pfp sprite),
                     TitleBackground + titleEmblem + titleArt + pressArt (the title screen),
                     PixelCanvas + PixelText,
                     ProjectCarousel + ProjectCard,
                     ProjectPopup, PhotoGrid + Polaroid (the Photo Gallery),
                     SocialSelect + socialArt (the Socials page; its data in src/socials.ts)
  utils/             audio.ts (sound effects + mute flag), music.ts (background music),
                     cloudinary.ts (the gallery's photo list + image URLs),
                     alphaMask.ts (pixel-perfect hit tests), pixelArt.ts (drawing pixel art),
                     menuFont.ts (menu buttons), textFont.ts (ordinary text + corner
                     prompts), hudArt.ts (corner prompts' text, via textFont),
                     pixelFont.ts (project boxes),
                     selectJump.ts (the menu's select jump, shared with the project
                     boxes), confirmFlash.ts (the confirm flash)
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
  - Keeping it going: the sound effects' AudioContext (audio.ts) never suspends itself while a
    track plays (suspending it can interrupt the music on iOS, whose audio session is shared), and
    a track paused by anything but the site itself (iOS interrupting it for a sound effect) plays
    straight on again (the pause listener in music.ts; the site's own pauses come at the end of
    a fade, once the track is unwanted). The user heard the music cut out a few seconds in.
    Testing the music: scratchpad/music-check.cjs (its states second by second, who paused it).
    Don't launch Chrome with --mute-audio for that: the flag itself pauses media about 3 s after
    play() and looks exactly like the bug; the script mutes the elements instead.
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
    stale copies (it keys on directives + source bytes). `horses_from_noise.png` (the
    neural network) had its balls' white glints toned down to 30% of their whiteness, each
    to its own ball's colour (the user found them too shiny; edited as raw RGBA through
    ffmpeg, as a canvas round trip would shift the semi-transparent glow; the original is
    in git history). `kinemechanics.png` (the physics logo) was flattened the same way (the
    user's call: no shading, no black borders): flat bright red arrows, the diagonal one
    the original's darker red (#af000b, the user's call), a flat purple ball, the outline
    filled with the colour of the shape it bordered (shapes keep their size), the grey
    hatching and stray specks gone; the trajectory's black dashes stay (a path, not a
    border). `tsp_solvers.png` lost most of its nodes' shading and gleam (the user's call:
    each red keeps 25% of its difference from the base red, the glints and their pale edges
    15%; outlines, lines and ring untouched). Per-picture fixes are data, not new art:
    `Project.imageCentre` (where the subject sits), `imageScale` (bigger in the pop-up's
    header: Horses, Mystic, Kinemechanics, TSP) and `cardImageScale` (bigger on its box:
    Kinemechanics, TSP).
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
    strip), then `PlayerMovement.cs`'s jump logic (from the repo) in an editor view. The
    title screen is shown whole, the globe strip under PLAY included (the user's call: "the
    full menu"): its 1 px border columns trimmed, then each row widened with its own edge
    colour. (A character-select capture, `reference/image (13).png`, is unused so far.)
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
  - The Portfolio's are the site's own screens (title, main menu, Socials, Photo Gallery),
    shot headless by `scratchpad/site-shots.cjs` at a 960 x 499 viewport (the TV's shape) with
    touch emulation (so the screen guard lets the page in) at 2x, downscaled; the gallery one
    is lossy (photos). Retake them after visual changes. The card's language shares come from
    `gh api repos/Asdy419/latifs_website/languages`.
  - `CircleAnimation.paused`: the rings stop drawing (no frames at all) while something
    opaque covers the whole page. The project pop-up deliberately doesn't use it: the
    user wants the rings moving round it (it only pauses the selected box's pulse).
    `PixelLabel` skips redrawing a picture it already shows (a wrapped label is
    always measured twice). Use images through JS imports, not CSS `url()` (that
    would ship a second PNG copy). Masks take the URL from a CSS variable set in TS.
  - Audio isn't converted automatically: `MenuAccept` is MP3, and short UI blips stay WAV
    (MP3 adds start latency). Encode new sounds the same way. `MenuWoosh` (WAV) plays when a
    project's details open, in place of the confirm sound (the user's pick: copied from
    `reference/` with its silent last 0.23 s trimmed); Enter again (GitHub) still confirms.
    Opening a gallery photo big plays it too (the user wanted it the same as a project).
  - TV static is drawn in code, not a video (`TvStatic.ts`): the same static on every TV
    (the menu's and the Projects pop-up's, as the user asked), one speckle per art pixel,
    drawn once into a 4-frame canvas strip and rolled at 30fps by a CSS transform (on the
    compositor: no repaints). Against the old 392 KB video, A/B on one page on a
    4x-throttled phone: the same main-thread cost, minus the download and the decoding.
    Drawing the menu's strip takes ~25-30ms there, so `Menu.preload()` works it out in
    idle time on the title screen (`prepareStatic`) and the menu only copies it (~1ms).
    Compare perf runs only within one session/page: dev-server restarts shift the
    baseline by tens of ms/s.
  - The menu TV is drawn in code (`TvOverlay.ts`; the old `tv_overlay.png` frame is no
    longer used). Its black frame and its screen are stepped clip-paths: straight along
    the top, bottom and left, and a pixel a row down the 45° right edge, like the
    buttons (the user's call: the image sloped smoothly). `#tv-wrap` sits on whole art
    pixels, (−37, 54) at 336 × 180 (Menu.css). The screen is its top-left 330 × 180, one
    pixel per art pixel exactly (it used to be the image's 98%, ~1.0005 art px). It
    shows rows 11–168 and, on row y, columns to 337 − y; the frame is 2 px wider round
    it (3 across the slant), rows 63–224 on the page.
  - The menu TV previews the highlighted button, as the game's does (`TvOverlay.tune`,
    from Menu.ts via `ButtonMenu.onChange`). Changing buttons rolls static for `TUNE_MS`,
    or `OPEN_TUNE_MS` as the menu opens; both are shared with the Projects pop-up's TV,
    in TvStatic.ts. Then the button's show plays from the top; a button with no show
    stays on static (About me, for now), and the static stops rolling under a show.
  - The shows' backgrounds differ on purpose. The user wanted scenes, not the hop's grey
    everywhere: the hop keeps its grey; Socials gets a pale abstract screen, Photo Gallery a
    starry night, and Exit a bedroom whose lights go down. Each
    show reads `performance.now()` in its frame loop, not the frame's timestamp
    (Playwright's fake clock gives the two different origins).
  - Projects' show is the GitHub hop (`GithubHop.ts`, the user's pick, from the video
    they approved: `reference/github-hop.mp4`). Their pfp, in a circle as GitHub shows
    it, hops along GitHub's contribution squares. It only moves up and down while the
    squares scroll; it lands on grey, pauses, and the square fades up through GitHub's
    greens (the user's corrections). The screen is `#afb8c1`: the first light grey was too
    pale to make out the squares (the user's call). The pfp is a Metal Sonic sprite, its
    29 × 40 pixels recovered from the blown-up JPEG they gave
    (`reference/m338fedwl2c51.jpg`) and kept in GithubHop.ts. It's drawn in code at one pixel per art
    pixel on the TV's 330 × 180 screen, and redrawn only when something moves. Only rows
    11–168 show, from column 37 (the window's edge) to the slant (column 337 − row),
    measured at five sizes. Its cost on a 4x-throttled phone is within noise of static.
  - Photo Gallery's show is the camera flash (`CameraFlash.ts`, the user's pick, from the
    video they approved: `reference/camera-flash.mp4`). A pixel-art Fujifilm X100VI after
    the user's photo charges up at its AF-assist lamp, the small round lamp they circled.
    The lamp steps from amber to white and golden sparks stream in while the camera shakes
    harder and faster (1→4 px). At the climax a burst from the lamp whites out the screen,
    which fades back; 3.3 s a loop.
  - It's drawn flat (three silvers, flat black leather, flat glow rings): the user found a
    shaded take too busy. No brand name, only marks. Behind it, a starry night sky and nothing
    else, as if looking straight up (the user's calls; a lake with the moon's path on it and a
    treeline came first, then a banded sky): one deep blue, 230 stars scattered evenly by the R2
    sequence (hashed positions bunched up top left), most twinkling
    between white and a dim blue on their own periods, every ninth flaring into a little cross,
    a third of them faint. With reduced motion it
    holds the camera at rest: no shake, no flash. Its cost on a 4x-throttled phone is within a
    few ms/s of static.
  - Socials' show is the logo drift (`SocialDrift.ts`, the user's idea, in place of a phone
    scrolling a video feed with a floating thumb in a cosy bedroom, which is gone): the Socials
    page's four box pictures (socialArt.ts) and Instagram's glyph (`instagramArt`, a flat
    magenta tile with the frame, lens and dot in white; the user asked for it) drift about the
    screen like a DVD screensaver, each turning slowly, bouncing off the screen's edges (the
    slanted right edge is the line x + y = 337) and off each other (an elastic bounce of equal
    weights, as discs the sprites' half-size). The same start every time, no randomness; 30 fps
    draws, with the step clamped to 50 ms so a hidden tab doesn't fling them.
  - Behind them, something plain and abstract (the user's call): a pale blue-grey screen with
    three big, slightly darker flat discs drifting slowly, wandering a little past the sides.
    With reduced motion: the first frame, still.
  - Exit's show is lights out (`LightsOut.ts`; the user's calls, in turn: a sleepy cat, then
    Zs floating up through the dark, then "remove the zs, just keep the background turning dark
    and that's it"). A cosy pixel-art bedroom drawn once, flat, its edges tones of their own
    colours rather than black outlines (the user found the outlined take "stroke heavy"), laid out for
    what shows of the screen (wide at the top, narrow at the floor): a lavender wall with a string
    of fairy lights twinkling along its top (drawn live; a pink LED strip above them was
    removed: the user's call), a bed with its
    plump pale blue pillow at the left end (a wooden rounded headboard and frame, the mattress one
    light blue all over, its top lower than the blanket's with the pillow sitting on it, and the blanket, blue, laid over the far part of
    the bed only, from past the pillow to a little beyond the foot, where the user drew it: lit
    along its top, the top corner of its end rounded and its bottom cut off square), a
    bedside table with a lamp, two posters and a clock, a window on the
    night sky and the moon between pink curtains up on the right, a wooden floor and a round pink
    rug. After 1.3 s the lights go down over 2.6 s (a near-black overlay, 94%, over everything
    but the window pane, which stays moonlit under a 35% one: the user wanted it "more darker"), and that's it, but for the ten stars in the window
    twinkling on their own periods (the user's call; once it's dark the picture is redrawn only
    every 100 ms, for them). The room lights up again only when the TV tunes back to Exit. With
    reduced motion: the dark room from the start, still.
  - Loading order on the home page: "press any button" image (fetchpriority high; the logo
    and backdrop are drawn in code) → sounds (`loadSounds()`) → menu images
    (`Menu.preload()`, which must list every menu image). Keep big downloads out of the
    title screen's first paint.
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
- **Title screen** (TitleScreen.ts/.css): laid out after the Sonic Mania title the user
  sent (`reference/88ecef….gif`: a 424×240 screen scaled 1.1745×, 42 frames at 70 ms, and
  quantised afresh every frame, so one frame's colours jitter; measure it by sampling at
  art-pixel centres and taking each pixel's most frequent colour over frames 2–42, frame 1
  having a poorer global palette). The user asked for its banner and medal (not the wings)
  "1-to-1", so they are the GIF's own pixels, lifted by `scratchpad/islandref/lift.cjs`
  into `src/components/medalPixels.ts` (generated by `gen-ts.cjs` there: a palette of 79
  colours and run-length rows, unpacked by `decodeRuns` in utils/pixelArt.ts; rerun both
  after changing the lift). The GIF's SONIC, MANIA, Sonic and wings are left out: the
  user's own things go there.
  - The medal (`titleEmblem.ts`, 410 × 200 cells, 1 cell = 1 art px; the reference's cells
    less (7, 12), its ring's middle at `CX, CY` = (205, 97)):
    - Wings: the user's own, kept exactly as they like them (sharp, upturned feather tips,
      lavender undersides); designed in 1.35 px cells and rendered through a scale transform.
    - The ring (flat gold, blue bands, studs and gems), the red plate and the black lower
      tier with its navy end-blocks: lifted. The ring where Sonic covers it in most frames
      comes from frame 2 (he arrives in frame 3). The ribbon tails hanging from the plate's
      ends wave in the GIF (8 distinct poses that never repeat cleanly within its 42 frames,
      a game sprite loop sampled at 14 fps); the user wanted them frozen, so they are frame
      1's pose, drawn under the still parts (the plate's ends and the tier go over their
      tops). The user's tidying: the plate's navy end panels and their white stars are gone
      (plate red there), and one white band (rows 138–152 of the reference: 15 of the
      plate's 44 rows, "around a third", in its middle) runs the plate's full width behind
      the lettering, like the tails' stripes; the lower tier is a bowl, not
      a rectangle (rows 168–183 of the reference, flat across the middle, its bottom curving
      up into the outer edges over the end-blocks: "make the bottom curve inwards"), its
      end-blocks flat navy (no dots or stripes) and nothing lifted under it; the fold where
      each tail turns back behind the tier is two tones (dark red and red); the tails' edges
      lose 1-px specks and notches; stray specks are smoothed away; where the ribbon turns
      down from the plate's ends, the pale edge highlights the lift left see-through are
      plate red ("fix the empty pixels side to side"), and the white runs on from the band's
      ends down that turn into the tails' stripes, whose shaded rise is plain white ("connect
      the white a bit better"): the band's top corner rounds off into a 4 px white line
      (`turnX(y)` in lift.cjs) that leans outward on its way down, with the plate's red only
      inside it and nothing outside it ("make the connection curved not rectangular", "not
      completely straight", "remove the red line"); 1–2 px see-through slits inside the ribbon
      are closed. All of that is the user wanting "the
      unneeded pixels around the bottom of the logo" gone. Last, the whole plate with its band
      and the tier bows upward: each column's cells move up by 4 px in the middle, tapering to
      nothing at the plate's ends (`bow(x)` in lift.cjs; "the entire flag actually should be
      slightly curved upwards"), so the pfp is cut 4 px shorter and LATIF'S sits 2 rows and
      PORTFOLIO 3 rows higher than before.
    - The user's pfp (`pfpArt.ts`, the Metal Sonic sprite, 4× by Scale2x twice) bursts out of
      the ring's top, over the ring; his waist sits at the plate's top so only head and torso
      show, his chest's middle (sprite column 16) on the ring's middle (the user's call).
    - LATIF'S (`titleGrid` in titleArt.ts) sits where SONIC was (its outline's top on row 123
      of the reference, 2 above SONIC's as the plate bows up; 125 px wide): 26 px letters in the "SONIC" style,
      square corners, lit top/left and deeper bottom/right, in a 4 px bevelled blue outline
      (dark line, blue, a lighter rim along the top but navy below, dark edge) that runs on
      between the letters; letters spaced by their shapes (3 px average edge gap, never under
      2; rows a glyph is empty in, as under the apostrophe, don't count). SONIC's two rows of
      darker red shadow are drawn under each column. The apostrophe and S are the site's own
      designs to the same rules.
    - PORTFOLIO (`spikyGrid`, 15 px tall) is centred on the lower tier between its blocks
      (x 165–258 of the reference): angular red letters with flared, pointed feet and pointed
      bar ends, edged gold with a dark rim. The reference has "MANIA" there, far bigger; this
      is the site's name and my call: drop it if the user doesn't want a second line.
  - The plate's middle (row 131 of the medal) sits 55% down the screen; the sea's horizon
    (63.7%) passes just under the plate, behind the tails, as in the reference.
  - "Press any button" (`pressArt.ts`) is rebuilt from the reference's pixels: capitals 6 px
    tall and 6 wide with 2 px stems, 8 px apart (12 at a space), banded orange / gold / cream /
    cream / gold / deep gold, in a 1 px dark brown outline that fills their holes, with a
    darker shadow row. The user's `title/press_any_button.png` is kept but unused. It flashes,
    and sits halfway between the bottom of the tails and the bottom of the screen (the user's
    call), over the island.
  - The old logo (`title/801d7d18-….png`) and the user's earlier tries in `title/` are kept
    but unused.
  - Backdrop (`TitleBackground.ts`): an island in the sea seen from the sky, turning once every
    18 s. It's drawn Mode 7 style by a WebGL fragment shader at 1 px per art px.
    - The whole island shows (the user didn't want it cropped by the bottom of the screen) and
      is as big as fits (they asked for it bigger). It fills the band under the medal's tails
      (`HORIZON`, `PIVOT`, `TEXELS`): its far shore just below the tails, its near shore just
      inside the bottom (rows ~190 to ~238 of 240).
    - The island is a 512² top-down map. Its coast has bays, beaches, cliffs and foam-streaked
      shallows; inland are grass patches, bushes, dirt paths from a central clearing, and a
      lake whose river falls off a cliff.
    - Billboard palms and cone trees stand on it, scaled with distance.
    - The sea is a 64² wave-and-glint tile.
    - The sky is a 1600 px wrapping strip (bands, puffy and wispy clouds, far islands) that
      scrolls left slower than the island turns, as in the reference.
    - Fine texture detail turns to speckle in perspective: keep the island's features broad.
    - It runs at 30 fps, waking only for frames it draws (about 20–30 ms of main-thread work
      per second on a 4×-throttled phone). It skips frames while hidden or under the screen
      guard.
    - Without fast WebGL it's one still frame drawn in JS (the same maths). Reduced motion
      gives one still frame too.
    - The maps are made once (~180 ms on a 4×-throttled phone, at the title's first mount).
    - The page colour is the sea's (`TITLE_BACKGROUND`), also inlined in index.html for the
      first paint.
  - Testing it: `scratchpad/title-spin.cjs` (GPU flags on, 4 shots 1.5 s apart),
    `title-measure.cjs` (the press text's position against the tails and the bottom),
    `press-shot.cjs` (a close-up while the text shows), `title-rafcost.cjs` (cost),
    `title-nogl.cjs` (the stills), `title-roundtrip.cjs`. The reference GIF's frames
    (`f0001.png`…), the lift (`extract.cjs` samples the frames into `frames.bin`, `lift.cjs`
    lifts the medal and writes `medal.json` plus check pictures, `gen-ts.cjs` writes
    medalPixels.ts), the tails' pose analysis (`tails.cjs`) and the measuring scripts
    (`asciimap.cjs`, `analyse.cjs`, `pressmask2.cjs`) are in `scratchpad/islandref/`.
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
    taller; `Project.imageCentre` says where a picture's subject is, so Mars Allocator's
    rover is centred on its box, not its mast: the user's call), the title (large text-font text, 2.6em) over a smaller subtitle line lined up
    with it (0.7em, 6 px at least; the kind of project; no date, as the Timeline tab has the
    dates: the user's call; `when` stays in the data, unused). The title is centred over the
    TV's antennas (`centreNameOnTV`: it moves the picture and both lines right together,
    never past the panel's edge, so the longest names stop short of centred: at 2.6em the
    five longest by up to ~11 pp on a desktop, most of them on the narrowest phones; the
    panel's padding can't take the picture, as the face's corner cut runs through it;
    twice, as a rewrapped subtitle can shrink the TV). At
    the right, the language logos, their middle level with the bar's (the user's call), and
    the language bar, a pixel-art meter (in pp: black frame with
    notched corners, each segment with a lit top row and a shaded bottom row, 1 pp black
    dividers, a 2 pp minimum so a 0.6% share still shows) with its legend under it (flat
    square keys, no stroke). Every bar is the same length, the Portfolio's (its four
    languages' legend on one line: 158 pp; 164 on phones; 108 on the narrower phones,
    which have no height for a wrapped subtitle). No year in the header (the user's call:
    no repeats): it heads the Timeline tab, big, on a pixel-art pennant (`yearFlag`, drawn
    in the digits' own font pixels; its pole stands on the timeline's line; `flex: none`, as a
    long timeline used to squash the flag while its digits stayed put, leaving the year poking
    out of the cloth on phones).
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
    Filled `backwards`, not `both`, so the animations let go once they're over. Held
    forwards, the band, the face and the panel's parts stayed GPU layers for good. The
    user saw the band and face flicker over each other when switching tabs fast; I
    couldn't reproduce it, even on their GPU, so this removes the likeliest cause.
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
  - The pin board (`pinboardArt.ts`, the user's idea after a picture of a framed board): a
    deep red felt in a pixel-art light-oak frame behind the photos, sized round them by
    `PhotoGrid.placeBoard` whenever the grid's size changes, so it grows with the photos. The
    frame is a 9-slice drawn in code (outline, lit edge, oak with two grain lines, inner edge,
    mitred corners) for CSS border-image, its slice the border width in art px, so it stays one
    pixel per art pixel at any size; the felt shows 8 art px past the columns, 10 above the
    pins and 12 below the last row, with a darker felt line inside the frame's top and left and
    a drop shadow like the polaroids'. The grid's padding leaves room for it and a little page
    round it.
  - `PhotoGrid`: a CSS grid of 68 × 78 art px `Polaroid`s (5 across at 16:9, more on
    phones) in a scroller that starts under the banner. Selection: arrows (2D, scrolls
    into view), mouse hover, tap. Each polaroid hangs at a slight tilt (hashed from
    its ID, `--tilt`); selected, it gets the menu's highlight and a quick little wobble
    on its pin as it straightens (`WOBBLE`/`WOBBLE_MS` in Polaroid.ts: the user had the
    old 500ms swing toned right down). No select jump: the user didn't want the frame
    and its highlight parting and rejoining on every move. Its edges always step like
    pixel art, even the selected one's and mid-turn (the user's call). Polaroid.ts turns
    it a frame at a time (an inline rotate, not a CSS transition). At every angle it cuts
    the visible pieces to the screen's art pixels: the frame and its drop shadow (its own
    element, `.polaroid-shadow`), or, selected, the lifted frame and the highlight. The
    cut is `staircase()`, a clip-path of the art pixels whose middles the turned box
    covers, untilted into the box's own coordinates. The pin is 9 × 9 pixel art (one
    data URL per colour), beside the frame so its clip can't cut it.
- **Socials**: four boxes (`SocialSelect`, data in src/socials.ts) after the user's clip
  of a character-select screen (`reference/Desktop 2026.11.16 - 05.41.25.04.mp4`),
  measured frame by frame (4 screen px per art px): 96 × 96 art px boxes (16 apart in
  the clip; 8 here, as four don't fit the 424 px screen otherwise), tops 92 down; a
  3px frame round a see-through panel (white at 43%: the rings show through), a 3px
  see-through dark shadow inside along the top and left, a drop shadow outside only
  where it sticks out (the panel is see-through), the picture over the top 68 rows,
  then a black 16-row name strip (the small text font, white with a #4a486b shadow).
  Selected: the frame pulses red #c20f00 ↔ pink #eab9e7 in the clip's 8 steps
  (`steps(7, jump-none)` on the border's own colour: a layer over a border rounded to
  whole screen pixels left a sliver), red/steel/blue bands grow out of the corners in
  117 ms, and the picture lifts 2px up-left over a #153e65 shadow of itself. The panel
  sits inside the frame's border, not beside it (the same rounding showed the page
  between them). ← → / tap selects; tapping the selected one, Enter or CONFIRM opens it
  in a new tab. Pictures are drawn in code, flat (`socialArt.ts`): GitHub's mark, the
  user's own account (a plain bust and their name: "LATIF"), a camera for "Latif's Lens"
  (photography), TikTok's note. The user kept the bust: their GitHub pfp was tried there
  and they asked for the bust back. Screen-reader names say "Latif", never handles.
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
