import type { Project } from './components/ProjectCard'
import c from './assets/projects/langs/c.png'
import python from './assets/projects/langs/python.png'
import cpp from './assets/projects/langs/cpp.png'
import jupyter from './assets/projects/langs/jupyter.png'
import typescript from './assets/projects/langs/typescript.png'
import javascript from './assets/projects/langs/javascript.png'
import css from './assets/projects/langs/css.png'
import csharp from './assets/projects/langs/csharp.png'
// Mars Allocator: the top of allocator.c in an editor, a real run of its test driver (runme),
// then Table 2 and Fig. 9 of its report (allocator_report.pdf in the repo):
import marsCode from './assets/projects/shots/mars_code.png'
import marsRecovery from './assets/projects/shots/mars_recovery.png'
import marsStormTable from './assets/projects/shots/mars_storm_table.png'
import marsSpeedSketch from './assets/projects/shots/mars_speed_sketch.png'
// Figures from the Zero-Shot EEG report (reference/expanded_imgs/), at the TV screen's shape:
import zeroShotEegCycle from './assets/projects/shots/zero_shot_eeg_cycle.png'
import zeroShotEegCca from './assets/projects/shots/zero_shot_eeg_cca.png'
import zeroShotEegResults from './assets/projects/shots/zero_shot_eeg_results.png'
import zeroShotEegErrors from './assets/projects/shots/zero_shot_eeg_errors.png'
// The Mystic Messaging app's real output (run from its repo), drawn as Windows Terminal windows:
import mysticChat from './assets/projects/shots/mystic_chat.png'
import mysticHelp from './assets/projects/shots/mystic_help.png'
import mysticFiles from './assets/projects/shots/mystic_files.png'
import mysticGroups from './assets/projects/shots/mystic_groups.png'
// Slides from the Bias in AI presentation (reference/expanded_imgs/), at the TV screen's shape:
import toxicityOverview from './assets/projects/shots/toxicity_overview.png'
import toxicityRepresentation from './assets/projects/shots/toxicity_representation.png'
import toxicityMean from './assets/projects/shots/toxicity_mean.png'
import toxicityVsd from './assets/projects/shots/toxicity_vsd.png'
// Horses From Noise (Y3 deep learning, lab 5): 325 of its generated horses, then its code and
// results file in an editor (real line numbers):
import horsesSamples from './assets/projects/shots/horses_samples.png'
import horsesModel from './assets/projects/shots/horses_model.png'
import horsesResults from './assets/projects/shots/horses_results.png'
import horsesAbstract from './assets/projects/shots/horses_abstract.png'
// Kinemechanics: its menu, collisions and projectile screens (title bar off, shaped to the TV
// without cutting anything), then a SUVAT diagram from Wikimedia Commons:
import physicsMenu from './assets/projects/shots/physics_menu.png'
import physicsCollisions from './assets/projects/shots/physics_collisions.png'
import physicsProjectile from './assets/projects/shots/physics_projectile.png'
import physicsSuvat from './assets/projects/shots/physics_suvat.png'
// Unity Clash: its title screen, menu and stage (the last two in the Unity editor), each widened
// or heightened with its own edge colours, then PlayerMovement.cs's jump logic in an editor:
import clashTitle from './assets/projects/shots/clash_title.png'
import clashMenu from './assets/projects/shots/clash_menu.png'
import clashStage from './assets/projects/shots/clash_stage.png'
import clashCode from './assets/projects/shots/clash_code.png'
// Figures from the X-ray restoration report (reference/expanded_imgs/), in pairs at the TV screen's shape:
import xrayRestored from './assets/projects/shots/xray_restored.png'
import xrayGeometry from './assets/projects/shots/xray_geometry.png'
import xraySnr from './assets/projects/shots/xray_snr.png'
import xrayInpaint from './assets/projects/shots/xray_inpaint.png'
// Slides from the CompanionAI product presentation (reference/expanded_imgs/), whole, at the TV screen's shape:
import companionCheckin from './assets/projects/shots/companion_checkin.png'
import companionInteractions from './assets/projects/shots/companion_interactions.png'
import companionResults from './assets/projects/shots/companion_results.png'
import companionHandover from './assets/projects/shots/companion_handover.png'
// Pictures from Wikimedia Commons at the TV screen's shape (credits and licences in README.md):
import tspSolvedTours from './assets/projects/shots/tsp_solved_tours.png'
import tspGaDiagram from './assets/projects/shots/tsp_ga_diagram.png'
import tspPsoSwarm from './assets/projects/shots/tsp_pso_swarm.png'
import tspBranchBound from './assets/projects/shots/tsp_branch_bound.png'
import bitcoinBlockChain from './assets/projects/shots/bitcoin_block_chain.png'
import bitcoinVoronoi from './assets/projects/shots/bitcoin_voronoi.png'
import bitcoinHashTree from './assets/projects/shots/bitcoin_hash_tree.png'
import bitcoinPaymentChannel from './assets/projects/shots/bitcoin_payment_channel.png'
import marsAllocatorImage from './assets/projects/container_imgs/mars_allocator.png'
import companionAiImage from './assets/projects/container_imgs/companion_ai.png'
import bitcoinClassifierImage from './assets/projects/container_imgs/bitcoin_classifier.png'
import zeroShotEegImage from './assets/projects/container_imgs/zero_shot_eeg.png'
import mysticMessagingImage from './assets/projects/container_imgs/mystic_messaging.png'
import xrayRestorationImage from './assets/projects/container_imgs/xray_restoration.png'
import tspImage from './assets/projects/container_imgs/tsp_solvers.png'
import toxicityBiasAuditImage from './assets/projects/container_imgs/toxicity_bias_audit.png'
import horsesFromNoiseImage from './assets/projects/container_imgs/horses_from_noise.png'
import kinemechanicsImage from './assets/projects/container_imgs/kinemechanics.png'
import portfolioImage from './assets/projects/container_imgs/portfolio_site.png'
// The Portfolio: the site's own screens (title, main menu, Socials, Photo Gallery), shot headless
// at the TV screen's shape (scratchpad/site-shots.cjs; retake them after visual changes):
import portfolioTitle from './assets/projects/shots/portfolio_title.png'
import portfolioMenu from './assets/projects/shots/portfolio_menu.png'
import portfolioSocials from './assets/projects/shots/portfolio_socials.png'
import portfolioGallery from './assets/projects/shots/portfolio_gallery.png'
import unityClashImage from './assets/projects/container_imgs/unity_clash.png'

/**
 * The boxes on the Projects page, left to right (the first is selected when the
 * page opens), and what their details pop-up says. The facts come from the
 * user's write-up, "The Project Files" (its gist, key features, numbers,
 * milestones and fun fact for each project). To add one, copy an entry:
 *  - name: on the box, in the pixel font (A–Z, 0–9, . , : ' ! ? - + / ( )).
 *    Up to about 4 letters show at full size; longer names shrink to fit.
 *  - title: the pop-up's heading, in large text-font letters along its top.
 *  - tagline, kind, when, tech, gist, funFact, features, numbers, milestones:
 *    the pop-up's text, in the small text font, which has no ~ ° & * < > [ ]
 *    (they'd show as "?"): write "about", "degrees", "and"…
 *  - languages: from GitHub (% of the code), biggest first. With no repo to
 *    measure, leave out `share`; with no languages known, use [].
 *  - logos: small pixel-art language icons in the box's bottom-right corner
 *    (assets/projects/langs/, 16×16, made from Devicon's logos).
 *  - url: the public GitHub repo (leave it out for private or no repo: the
 *    pop-up then has no GitHub button).
 *  - image (optional): the project's own logo/picture, in the middle of the box
 *    and beside the pop-up's title. Put the PNG in assets/projects/container_imgs/,
 *    import it at the top like the logos, and add `image: myPicture,` to the
 *    entry. Any canvas size or margin is fine: the build crops it to its
 *    visible pixels and every box draws its picture with the same area.
 *  - shots (optional): the pictures inside the expanded pop-up only, shown on
 *    the screen of the same pixel-art TV on every project, one per tab
 *    (Overview, Features, Numbers, Timeline; they wrap round if there are
 *    fewer). Switching tabs plays a little static, then the next picture. Store
 *    them in assets/projects/shots/ and import them above; with none, the TV
 *    shows static. These never set the box's image.
 *    The screen is 150:78 (about 1.92:1, e.g. 960 × 499 px) and each picture
 *    fills it, trimmed equally from both sides if it's another shape, so a
 *    picture of that shape shows whole. Curated crops live in
 *    assets/projects/shots/crops.ts and are applied by Vite without changing
 *    the original PNGs. Photos go in LOSSY_SHOTS in vite.config.ts.
 */

const PYTHON = { name: 'Python', color: '#3572A5' }
const JUPYTER = { name: 'Jupyter Notebook', color: '#DA5B0B' }

export const PROJECTS: Project[] = [
  {
    name: 'Mars Alloc',
    title: 'Mars Allocator',
    image: marsAllocatorImage,
    imageCentre: 0.6, // the rover's box (rows 112 to 200 of the 260 the build keeps: cardArt trims the empty ones), not its mast
    shots: [marsCode, marsRecovery, marsStormTable, marsSpeedSketch],
    year: 2025,
    tagline: 'A crash-proof memory allocator for Mars rovers. Cosmic rays? Not a problem.',
    kind: 'Systems programming',
    when: 'Dec 2025, coursework',
    tech: ['C', 'Make'],
    gist: "A reinforced version of C's malloc and free, written for embedded systems in high-radiation environments like a Mars rover, where cosmic rays flip bits and power brown outs mid-write. Every block carries checksums and mirrored metadata, so corruption is detected, repaired where possible and quarantined where not. The heap can also be split into up to eight thread-safe arenas for parallel work.",
    funFact: "The header's magic number is 0xC0FE and the footer's is 0xBEEF. Coffee on top, beef underneath.",
    features: [
      'CRC16 on every block. Two bytes of metadata catch about 99.998% of errors.',
      'Mirrored header and footer. Either copy can rebuild the other; if both are damaged, the region is quarantined (up to 16 tracked).',
      'Fast allocation. Nine segregated size classes give O(1) class selection with best-fit placement, and free neighbours coalesce.',
      'Up to 8 arenas, each with its own lock and assigned per thread, with cross-arena pointer checks.',
      'Built to recover. Brownout tolerance, bounds-checked mm_read and mm_write, and mm_heal() to scan and repair the whole heap.',
      'Full API. malloc, calloc, realloc and a double-free-safe free, plus validation and heap diagnostics.',
    ],
    numbers: [
      { value: '49,900', label: 'bit flips thrown at it in the storm test' },
      { value: '4.93x', label: 'faster with 8 arenas running in parallel' },
      { value: '65%', label: 'of memory still usable after the storm' },
      { value: '90.5%', label: 'the top mark in the cohort' },
    ],
    milestones: [
      { when: 'Start', text: 'Single-heap allocator with CRC validation and header/footer recovery.' },
      { when: 'Upgrade', text: 'Rebuilt as a multi-arena, thread-safe allocator.' },
      { when: 'Dec 2025', text: 'Storm test: 5 million operations through 49,900 bit flips and 99 brownouts: 5,044 corruptions caught, 1,270 blocks healed.' },
      { when: 'Marked', text: '90.5%, the top mark in the cohort.' },
      { when: 'Jan 2026', text: 'Open-sourced on GitHub; README added in March.' },
    ],
    languages: [{ name: 'C', share: 99.4, color: '#555555' }, { name: 'Makefile', share: 0.6, color: '#427819' }],
    logos: [c],
    url: 'https://github.com/Asdy419/Mars-Allocator',
  },
  {
    name: 'Portfolio',
    title: 'Portfolio Site',
    image: portfolioImage,
    shots: [portfolioTitle, portfolioMenu, portfolioSocials, portfolioGallery],
    year: 2026,
    tagline: "The retro game menu you're scrolling right now.",
    kind: 'Web, front end',
    when: 'Nov 2026, personal',
    tech: ['TypeScript', 'Vite', 'Canvas', 'WebGL', 'Web Audio', 'REST'],
    gist: "A portfolio website that behaves like the menu of a retro console game: navigate with the arrow keys, Enter and B, or just mouse and touch. Vite and plain TypeScript, no framework, with smooth performance on mid-range phones as the first priority. The pixel art is drawn in code or my own; the photos come from Cloudinary over its REST API, and the language stats on these cards from GitHub's.",
    funFact: 'The menus are inspired by Sonic Mania, and so is the soundtrack.',
    features: [
      'Game-style menu. Slanted pixel-art buttons that bounce, and a TV previewing each page with its own little show.',
      "REST APIs. Photos listed from Cloudinary's JSON endpoint and fetched at fixed sizes via URL transforms; language shares from GitHub's repository API.",
      'Build pipeline. Vite and imagetools make WebP from every PNG, FFmpeg normalises the soundtrack, and a service worker caches the hashed assets.',
      'Rendering. Canvas pixel art at one pixel per art pixel; a Mode 7 island and the rings in WebGL shaders, with plain fallbacks.',
      'Tested headless. Playwright drives Chrome at phone and desktop sizes: screenshots, round trips, and main-thread cost on a throttled phone.',
      'Built for phones. Assets in order of need, transform-only animations, Web Audio effects, and mute remembered between visits.',
    ],
    numbers: [
      { value: '0', label: 'frameworks' },
      { value: '2', label: 'REST APIs (Cloudinary, GitHub)' },
      { value: '20 ms', label: 'of main-thread work a second for the spinning island on a slow phone' },
      { value: '12', label: 'project cards so far' },
    ],
    milestones: [
      { when: 'Nov 13, 2026', text: 'Title screen and main menu.' },
      { when: 'Same day', text: 'Projects carousel, pixel font and page banners; the menu, prompts and page wipe matched to the reference clip.' },
      { when: 'Nov 14', text: 'The Photo Gallery pinned up over Cloudinary; README screenshots refreshed.' },
      { when: 'Nov 15 to 16', text: "Project pop-ups as game dialogs with a TV of pictures each; the Socials page as a character select; a show per menu button; the title screen rebuilt around the reference's medal over a spinning island." },
      { when: 'Next', text: 'About Me page.' },
    ],
    languages: [
      { name: 'TypeScript', share: 77.5, color: '#3178c6' }, { name: 'CSS', share: 21.3, color: '#663399' },
      { name: 'HTML', share: 0.7, color: '#e34c26' }, { name: 'JavaScript', share: 0.5, color: '#f1e05a' },
    ],
    logos: [typescript, css],
    url: 'https://github.com/Asdy419/latifs_website',
  },
  {
    name: 'Brain AI',
    title: 'Zero-Shot EEG',
    image: zeroShotEegImage,
    shots: [zeroShotEegCycle, zeroShotEegCca, zeroShotEegResults, zeroShotEegErrors],
    year: 2025,
    tagline: 'Guessing what someone saw, from their brainwaves alone.',
    kind: 'Machine learning, brain decoding',
    when: 'Oct to Dec 2025, coursework',
    tech: ['Python', 'Jupyter', 'NumPy', 'scikit-learn'],
    gist: 'Can a model tell what image someone was looking at from 17 channels of EEG, even for objects it never trained on? Working on the ThingsEEG-Text dataset (10 subjects), this project maps brain signals into two "meaning spaces", CLIP text embeddings and CORnet-S image embeddings, using ridge regression. A new trial is classified by finding the closest class prototype, so the model recognises 200 unseen classes without a single labelled EEG example of them.',
    funFact: "Its mistakes aren't random. The model mostly confuses classes whose prototypes sit close together, with a correlation of about 0.35 between prototype similarity and confusion frequency.",
    features: [
      'Analysis before modelling. PCA, covariance spectra and CCA showed ill-conditioned EEG features and a stronger link to image embeddings than to text.',
      'Ridge regression to tame the ill-conditioning, with alpha tuned on a leakage-free, class-wise 90/10 split.',
      'Visual-heavy fusion. Text and image scores are blended 0.1 to 0.9, a weighting picked on validation and backed by the CCA result.',
      'Prototype matching. Cosine similarity against the 200 unseen class prototypes.',
      'No leakage. All exploration and tuning used the seen classes only; the unseen EEG was touched once, at test time.',
      'Evaluation beyond accuracy. Ablations, macro precision, recall and F1, precision-recall curves, confusion matrices and t-SNE error analysis.',
    ],
    numbers: [
      { value: '200', label: 'classes it never trained on' },
      { value: '160,000', label: 'unseen test trials' },
      { value: '10.65%', label: 'top-1 accuracy, about 21 times chance' },
      { value: '8.94%', label: 'macro F1 with the fusion, up from 5.52%' },
    ],
    milestones: [
      { when: 'Start', text: 'Explored the data: each trial, 17 channels by 100 samples of 70 to 400 ms after the image, flattened into a 1,700-dimensional vector.' },
      { when: 'Baseline', text: 'Plain least squares with equal fusion (model A).' },
      { when: 'Upgrades', text: 'Ridge (model B), then the 0.1 / 0.9 fusion (model C).' },
      { when: 'Dec 2025', text: 'Evaluated on all 10 subjects and written up as a report.' },
      { when: 'Aug 2026', text: 'README polished on GitHub.' },
    ],
    languages: [{ ...JUPYTER, share: 100 }],
    logos: [jupyter, python],
    url: 'https://github.com/Asdy419/Zero-Shot-Brain-Stimuli-Classification',
  },
  {
    name: 'Mystic',
    title: 'Mystic Messaging',
    image: mysticMessagingImage,
    imageScale: 1.3, // (tall and narrow: it fills little of the header's slot)
    shots: [mysticChat, mysticHelp, mysticFiles, mysticGroups],
    year: 2025,
    tagline: 'A command-line chat room with a few magic words.',
    kind: 'Networking',
    when: 'Dec 2025, coursework',
    tech: ['Python', 'sockets', 'threading'],
    gist: 'A multi-user chat app that lives entirely in the terminal. Thread based architecture. One server thread routes messages between clients across a global chat, private messages and groups, and serves shared files that clients can download over TCP or UDP. Every command starts with the command word "mystic", and "mystic help" lists all of the commands.',
    funFact: 'The last two commits are titled "Final" and "Final final". A classic, I know.',
    features: [
      'Threads everywhere. One server thread per client; each client runs separate send and receive threads, plus a temporary thread for UDP downloads.',
      'Four ways to talk. Global chat, private messages, broadcasts and named groups. Join a group and the global chat goes quiet.',
      'Tagged protocol. Every message carries a tag like SERVER or PM, so the client knows how to show it.',
      'Two-protocol file transfer. TCP uses start and end markers with size checks; UDP uses a temporary socket, a UDP_READY handshake and 4-byte sequence numbers to put packets back in order.',
      'Split-proof buffering. Bytes are stitched together across recv() calls, so a half-arrived file marker never leaks into the chat.',
      'Graceful edges. Unexpected disconnects are handled and duplicate usernames are turned away.',
    ],
    numbers: [
      { value: '11', label: 'mystic commands' },
      { value: '4', label: 'message channels' },
      { value: '2', label: 'file transfer protocols' },
      { value: '100%', label: 'marks for the assignment' },
    ],
    milestones: [
      { when: 'Start', text: 'Socket server broadcasting between clients.' },
      { when: 'Commands', text: 'The mystic command parser, later rewritten with match-case.' },
      { when: 'Groups', text: 'Create, join and leave; a group deletes itself when its last member leaves.' },
      { when: 'Files', text: 'Downloads over TCP, then UDP with sequencing.' },
      { when: 'Dec 2025', text: "Final version pushed on New Year's Eve. Full marks." },
    ],
    languages: [{ ...PYTHON, share: 100 }],
    logos: [python],
    url: 'https://github.com/Asdy419/Mystic-Messaging-App',
  },
  {
    name: 'X-Ray',
    title: 'X-Ray Restoration',
    image: xrayRestorationImage,
    shots: [xrayRestored, xrayGeometry, xraySnr, xrayInpaint],
    year: 2026,
    tagline: 'Ten steps of classic image processing to recover wrecked X-rays.',
    kind: 'Computer vision, classical image processing',
    when: 'Feb 2026, coursework',
    tech: ['Python', 'OpenCV', 'NumPy'],
    gist: 'A set of 256 x 256 chest X-rays of both patients with and without pneumonia arrived damaged: tilted, warped, speckled with salt noise and colour noise, punched with dark circular holes and low on contrast. The images feed a pneumonia classifier, so the job was to restore them without throwing away the detail a classifier relies on. The answer was a ten-stage pipeline built entirely from classical signal processing, no deep learning, that cleans a whole folder of images in one command.',
    funFact: 'The rotation fix borrows a trick from document scanners: in the frequency domain, a rib cage looks like a tilted cross.',
    features: [
      'Rotation fixed in Fourier space. Ribs and spine show up as a cross in the frequency spectrum, so the pipeline scans radial lines every 0.1 degrees and averages the rib and spine deviations to find the tilt.',
      'Selective de-salting. Only pixels that are both extreme and far from their local median get replaced, so fine anatomy survives.',
      'Perspective correction. The largest four-cornered contour is found and warped back to a clean square.',
      'Colour denoising with CBM3D, a state-of-the-art technique. An adapted, self-contained CBM3D implementation with its own DCT routines denoises in the OPP colour space.',
      'Hole repair. Dark circular artefacts are detected and filled in with Navier-Stokes inpainting.',
      'Finishing pass. Chroma low-pass in YCrCb, non-local means, CLAHE on the lightness channel and an unsharp mask on luminance only.',
    ],
    numbers: [
      { value: '10', label: 'stages in the pipeline' },
      { value: '90%+', label: 'classifier scores' },
      { value: '10%', label: 'gain in signal-to-noise ratio, roughly' },
      { value: '0', label: 'neural networks used' },
    ],
    milestones: [
      { when: 'Feb 2026', text: 'Got BM3D running, after learning the hard way that it wants one channel, not three.' },
      { when: 'Pivot', text: 'Dropped the Anscombe transform: the noise was impulse (salt) noise, not Poisson, so it did more harm than good.' },
      { when: 'Geometry', text: 'Built the Fourier rotation fix and the contour-based perspective warp.' },
      { when: 'Holes', text: "Masked the dark circles so they couldn't skew contrast enhancement, then inpainted them." },
      { when: 'Shipped', text: 'Ten-stage pipeline, written report and README, with signal-to-noise up by around 10%.' },
    ],
    languages: [PYTHON], // no repo to measure
    logos: [python],
  },
  {
    name: 'Horses',
    title: 'Horses From Noise',
    image: horsesFromNoiseImage,
    imageScale: 1.3, // (wide and short: it fills little of the header's slot)
    shots: [horsesSamples, horsesModel, horsesResults, horsesAbstract],
    year: 2026,
    tagline: 'A generator and a discriminator in an arms race over 32 × 32 horses.',
    kind: 'Generative models, deep learning coursework',
    when: 'Oct to Nov 2026, coursework',
    tech: ['Python', 'PyTorch', 'torch-fidelity'],
    gist: 'Two assessed deep learning practicals, the idea being to train from scratch a generative adversarial network on 4000 CIFAR-10 horse photos, whilst staying under a million parameters, and generating my own set of 1000 new 32x32 horses. These horses would then be scored by kernel inception distance (KID, the lower the score the better). First a DCGAN, where a generator and a discriminator train against each other; then the same horses with flow matching.',
    funFact: 'The flow model deliberately asks a weakened copy of itself what it would draw, then steers the other way.',
    features: [
      'Wider, smoother DCGAN. 96- and 128-channel networks (925,734 parameters and buffers), with a normalised 8 x 8 projection and nearest-neighbour upsampling in place of transposed convolutions.',
      'A harder critic to fool. Half the real horses are mirrored, and everything the discriminator sees is shifted by up to 4 pixels, differentiably, so gradients still reach the generator.',
      'Adaptive augmentation (ADA). Geometric and colour transforms fire with probability p, which rises whenever the discriminator gets too sure of itself on real horses (target 0.3).',
      'The sequel: a small U-Net for flow matching. Residual blocks with self-attention at 16 x 16 (922,803 parameters), logit-normal training times and averaged (EMA) weights.',
      'Autoguidance. Sampling steers away from a deliberately weakened copy of the same network, so guidance costs no extra parameters.',
    ],
    numbers: [
      { value: '203.5', label: 'KID x1000, the unmodified starter GAN (lower is better)' },
      { value: '35.2', label: 'KID x1000, my GAN, mean of runs (best 29.3)' },
      { value: '2.7', label: 'KID x1000, the flow model, best of two seeds' },
    ],
    milestones: [
      { when: 'Oct 2026', text: 'Starter GAN as a baseline: KID x1000 of 203.5.' },
      { when: 'GAN', text: 'Wider nets, mirroring and shifts: 39.0. With ADA added: a mean of 35.2.' },
      { when: 'Nov 2026', text: 'Flow matching; autoguidance cut KID x1000 from about 18 to about 5.' },
      { when: 'Best', text: '16 x 16 attention and shifted training times: 2.7 and 3.1 over two seeds.' },
    ],
    languages: [PYTHON],
    logos: [python],
  },
  {
    name: 'Physics',
    title: 'Kinemechanics',
    image: kinemechanicsImage,
    imageScale: 1.25, // (a sparse drawing: bigger next to the title, and on its box)
    cardImageScale: 1.2,
    imageCentre: 0.6, // (its weight is low, the ball and the arrows' feet: centre of mass 0.63)
    shots: [physicsMenu, physicsCollisions, physicsProjectile, physicsSuvat],
    year: 2023,
    tagline: 'Physics homework that actually moves.',
    kind: 'Simulation, desktop app',
    when: 'Built around 2023, on GitHub Mar 2026',
    tech: ['C++', 'SFML', 'CMake'],
    gist: 'My A-level computer science NEA coursework designed for A-level style mechanics, written in C++ with SFML. One mode animates projectile motion and works through the kinematic (SUVAT) equations step by step; the other sends two objects into each other for elastic and inelastic collisions. Any simulation can be saved to a text file and loaded back later.',
    funFact: 'Every projectile weighs exactly 22.5 kg. It says so, right there on the screen.',
    features: [
      'SUVAT solver. Enter what you know about displacement, velocity, acceleration and time, and it works out the rest through the rearranged equations.',
      'Live vectors. Horizontal, vertical and resultant velocity arrows, plus acceleration and force arrows, toggled with checkboxes.',
      'Collision lab. Set two masses and velocities, then slide the elasticity between inelastic and elastic.',
      'Save and import. Simulations export to .txt files and load back in.',
      'Hand-built UI. Custom button and checkbox components, with a state manager switching between the menu, projectile and collision screens.',
      'One-command build. CMake fetches and compiles SFML automatically.',
    ],
    numbers: [
      { value: '3', label: 'screens: menu, projectiles, collisions' },
      { value: '5', label: 'SUVAT variables' },
      { value: '2,500', label: 'lines of C++, roughly' },
      { value: '100%', label: 'marks scored by examiners' },
    ],
    milestones: [
      { when: 'Around 2023', text: 'Originally written. The clean-up commit later called it "3 year old code".' },
      { when: 'Mar 2026', text: 'Uploaded to GitHub, cleaned up, given a CMake build that fetches SFML, and screenshotted.' },
      { when: 'Nov 2026', text: 'Joined the portfolio as the Physics card.' },
    ],
    languages: [{ name: 'C++', share: 98.9, color: '#f34b7d' }, { name: 'CMake', share: 1.1, color: '#DA3434' }],
    logos: [cpp],
    url: 'https://github.com/Asdy419/SFMLPhysicsProject',
  },
  {
    name: 'TSP',
    title: 'TSP Solvers',
    image: tspImage,
    imageScale: 1.2, // (bigger next to the title and on its box: the user's call)
    cardImageScale: 1.15,
    shots: [tspSolvedTours, tspGaDiagram, tspPsoSwarm, tspBranchBound],
    year: 2026,
    tagline: 'Evolution versus a swarm, racing to find the shortest round trip.',
    kind: 'Optimisation, metaheuristics',
    when: 'Jan to Feb 2026, coursework',
    tech: ['Python standard library only'],
    gist: "The Travelling Salesman Problem asks for the shortest route that visits every city once and returns home; the number of routes explodes factorially, so brute force is hopeless. This project built two nature-inspired solvers, a Genetic Algorithm and a discrete Particle Swarm Optimiser, and pushed both well beyond their lecture versions with custom operators and local search, under time limits, on Python's standard library alone.",
    funFact: 'Particle swarms were made for smooth, continuous spaces; the travelling salesman is discrete. Here the particles "fly" through permutations, so a velocity is really a to-do list of city swaps.',
    features: [
      'Breeding. OX4 crossover and tournament selection make good tours from good parents.',
      'Two-phase mutation. Improving 2-opt moves paired with inverted displacement.',
      'A head start. Nearest-neighbour tours seed about 5% of the first generation, enough to help without killing diversity, and elitism keeps the best tours alive.',
      'Velocity, redefined. For permutations a velocity is a list of city swaps, built with custom ODOT, SUB, ADD_VEL and MULT_VEL operators.',
      'Follow the leader. The social pull targets the global best, with iterative 2-opt refinement on top.',
      'Two moods. Attractor and depressor modes switch on swarm diversity to escape local optima.',
    ],
    numbers: [
      { value: '2', label: 'algorithms, one problem' },
      { value: '7', label: "city files with the cohort's best tour" },
      { value: '0', label: 'third-party libraries' },
      { value: '5%', label: 'of generation one seeded by nearest neighbour' },
    ],
    milestones: [
      { when: 'Jan 2026', text: 'Genetic algorithm built inside the skeleton, with nearest-neighbour seeding.' },
      { when: 'Feb 2026', text: 'Particle swarm rebuilt around discrete velocity operators and 2-opt.' },
      { when: 'Debug', text: 'Found why the mode switch never fired: with 20 particles, diversity tops out near 0.44, below the 0.7 trigger. Thresholds retuned.' },
      { when: 'Result', text: 'Best tours in the cohort on 7 of the city files.' },
    ],
    languages: [PYTHON], // no repo to measure
    logos: [python],
  },
  {
    name: 'Companion',
    title: 'CompanionAI',
    image: companionAiImage,
    shots: [companionCheckin, companionInteractions, companionResults, companionHandover],
    year: 2026,
    tagline: 'A wellness virtual pet with a mind of its own, built for an IBM brief.',
    kind: 'Game dev, team project for an IBM client',
    when: 'Nov 2025 to Apr 2026, team of five',
    tech: ['JavaScript', 'Phaser 3', 'Supabase'],
    gist: "A five-person university team took on a live brief from IBM: a wellness app built around an interactive virtual pet. As the only developer on the team with game-framework experience, I built the pet's core interaction layer in Phaser 3, then reorganised the architecture so the pet's behaviour logic and its rendering could change independently. The finished build was presented to five IBM stakeholders.",
    funFact: "The pet doesn't follow a script. A Markov chain rolls the dice on its next move, so no two sessions play out quite the same.",
    features: [
      'Behaviour on a Markov chain. A state machine with probabilistic transitions decides what the pet does next, so it never just loops through a script.',
      'Core interactions. Feeding, patting and animated movement.',
      'Clean architecture. State, Factory and Observer patterns decouple behaviour logic from rendering.',
      'LLM integration, with its constraints documented for the client.',
      'Plain-English design docs. Framework-agnostic diagrams let non-technical teammates and IBM sign off architectural decisions.',
      'Team rhythm. Weekly meetings, organised by me, kept five people building one app.',
    ],
    numbers: [
      { value: '5', label: 'people on the team' },
      { value: '5', label: 'IBM stakeholders at the final presentation' },
      { value: '3', label: 'design patterns in the refactor' },
      { value: '6', label: 'months from brief to delivery' },
    ],
    milestones: [
      { when: 'Nov 2025', text: 'Live brief from IBM; team of five formed.' },
      { when: 'Build', text: 'Picked up Phaser 3 and built the interaction layer: Markov behaviour, movement, feeding and patting.' },
      { when: 'Mar 2026', text: 'Pet class wired to the full state machine, so any pet can be spawned and behave correctly.' },
      { when: 'Refactor', text: 'State, Factory and Observer patterns split behaviour from rendering.' },
      { when: 'Apr 2026', text: 'Delivered and presented to five IBM stakeholders.' },
    ],
    languages: [{ name: 'JavaScript', color: '#f1e05a' }],
    logos: [javascript],
  },
  {
    name: 'Bias Audit',
    title: 'Toxicity Bias Audit',
    image: toxicityBiasAuditImage,
    shots: [toxicityOverview, toxicityRepresentation, toxicityMean, toxicityVsd],
    year: 2026,
    tagline: 'Does a moderation dataset teach models that mentioning certain identities is "toxic"?',
    kind: 'Responsible AI, data audit',
    when: 'Mar 2026, coursework',
    tech: ['Python', 'pandas', 'seaborn', 'Jupyter'],
    gist: 'Framed as an audit for the Trust and Safety team of a fictional platform, CivicSphere, this project took apart the Jigsaw Unintended Bias dataset, the kind of data used to train comment-moderation models. The core question: are comments that simply mention certain identity groups labelled toxic more often? Value Sensitive Design framed the ethics, a stakeholder analysis mapped who gets hurt, and a hands-on data audit supplied the evidence, all squeezed into an eight-minute presentation.',
    funFact: 'Every label in the dataset was made by a human, which is exactly why the missing annotator demographics matter so much.',
    features: [
      'Class balance check. The 10,000-row sample is split 50/50, while the full dataset runs about 11:1 non-toxic to toxic, which changes how every result should be read.',
      'Annotation coverage. 76% of comments carry no identity labels at all, so bias can only be measured on about a quarter of the data.',
      'Subgroup sizes. Some groups have as few as 13 labelled examples, far too few for confident conclusions.',
      'Label skew. Toxic rates swing from 32% to 85% across identity subgroups against a 50% baseline, with marginalised groups sitting well above it.',
      'Documentation critique. No annotator demographics, a dropped "Hard to Say" option and loosely defined subtype labels.',
      'Two recommendations. A bias-monitoring dashboard in the spirit of Model Cards, and counterfactual data augmentation, each with its limitations spelled out.',
    ],
    numbers: [
      { value: '24', label: 'identity groups audited' },
      { value: '76%', label: 'of comments with no identity labels' },
      { value: '32-85%', label: 'toxic rate across subgroups' },
      { value: '13', label: 'examples in the smallest groups' },
    ],
    milestones: [
      { when: 'Mar 2026', text: 'Explored the data and checked the class balance: an artificially even 50/50 split.' },
      { when: 'Coverage', text: 'Mapped which comments carry any identity labels at all (about 24%).' },
      { when: 'Core finding', text: 'Measured the toxic rate per identity group, the "quiet error" the brief was hunting for.' },
      { when: 'The story', text: 'Built the stakeholder analysis, audit table and recommendations, backed by the literature (Friedman, Dixon, Mitchell, Borkan and colleagues).' },
      { when: 'Presented', text: 'Eight minutes, one fictional client, two recommendations.' },
    ],
    languages: [{ ...JUPYTER, share: 100 }],
    logos: [jupyter, python],
  },
  {
    name: 'Clash',
    title: 'Unity Clash',
    image: unityClashImage,
    shots: [clashTitle, clashMenu, clashStage, clashCode],
    year: 2022,
    tagline: 'An arena platformer, still in the workshop.',
    kind: 'Game dev',
    when: '2022, personal',
    tech: ['C#', 'Unity 2020.3'],
    gist: "A two-player arena platformer built in Unity, after Super Smash Bros: two fighters share one keyboard on a floating stage ringed by blast zones, reached through a title screen, a main menu and a character select. It's unfinished, but the last devlog shows how far it got.",
    funFact: 'The main scene file is called "current project unity smash". The inspiration was not subtle.',
    features: [
      'Local versus. Player one moves with WASD, player two with the arrow keys.',
      'Smash-style menus. A title screen, a main menu of slanted tiles (Smash, Games+, Options, Vault, Changelog) and a two-player character select.',
      'Platformer physics. Rigidbody2D jumps with configurable extra jumps, refilled whenever a small circle at the fighter\'s feet touches the ground.',
      'Blast zones. Fall off the stage and you respawn at a random spot above the arena.',
      'Placeholder fighters. Both players are squares for now, marked blue for player one and red for player two.',
    ],
    numbers: [
      { value: '2', label: 'players, one keyboard' },
      { value: '3', label: 'C# scripts' },
      { value: '5', label: 'tiles on the main menu' },
      { value: '16', label: 'spots a fighter can respawn at' },
    ],
    milestones: [
      { when: 'May 2022', text: 'Pushed to GitHub.' },
      { when: 'Devlog', text: 'Progress recorded on YouTube.' },
      { when: 'Aug 2026', text: 'README updated with the devlog.' },
      { when: 'Nov 2026', text: 'On the portfolio as the work-in-progress card.' },
    ],
    languages: [{ name: 'C#', share: 99.8, color: '#7355dd' }, { name: 'Other', share: 0.2, color: '#cccccc' }],
    logos: [csharp],
    url: 'https://github.com/Asdy419/Unity-Clash',
    links: [{ label: 'Devlog', url: 'https://youtu.be/3bcJZl15AQw' }],
  },
  {
    name: 'Bitcoin',
    title: 'Bitcoin Classifier',
    image: bitcoinClassifierImage,
    shots: [bitcoinBlockChain, bitcoinVoronoi, bitcoinHashTree, bitcoinPaymentChannel],
    year: 2026,
    tagline: 'One deadline, four people, one prize.',
    kind: 'Side quest, hackathon',
    when: '2026, hackathon team lead',
    gist: "At ETH Hack Oxford 2026 I led a team of four through scoping, splitting the work and delivering a classifier that flags likely rug pulls, the crypto scam where a project's creators cash out and vanish with investors' money. It uses k-nearest neighbours, and other team members built a website to deploy it. It took home the Best Trust and Safety Tool prize.",
    funFact: "k-nearest neighbours never trains. It keeps every labelled example, and each new case is decided by a vote among the ones it sits closest to.",
    features: [
      'Rug-pull detection. A k-nearest-neighbours classifier labels each new case, rug pull or not, by a vote of the k most similar known cases.',
      'Easy to explain. A flag comes down to which known cases a new one looks most like.',
      'Deployed on the web. Other team members built a website to deploy the classifier.',
      'Scoped to ship. An idea sized for four people and one deadline.',
      'Split by strength. Work delegated across the team so everything landed in time.',
      'Built for trust and safety, the category it went on to win.',
    ],
    numbers: [
      { value: '4', label: 'people, me leading' },
      { value: '2', label: 'parts: the classifier and the website deploying it' },
      { value: '1', label: 'prize: Best Trust and Safety Tool' },
    ],
    milestones: [
      { when: 'Team', text: 'Four people, me leading.' },
      { when: 'Scope', text: 'Settled on rug-pull detection and split the work.' },
      { when: 'Build', text: 'k-nearest-neighbours classifier delivered on deadline.' },
      { when: 'Deploy', text: 'Teammates built a website to deploy it.' },
      { when: 'Prize', text: 'Best Trust and Safety Tool.' },
    ],
    languages: [JUPYTER], // no repo to measure
    logos: [jupyter],
  },
]
