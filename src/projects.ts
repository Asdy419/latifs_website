import type { Project } from './components/ProjectCard'
import c from './assets/projects/langs/c.png'
import python from './assets/projects/langs/python.png'
import cpp from './assets/projects/langs/cpp.png'
import jupyter from './assets/projects/langs/jupyter.png'
import typescript from './assets/projects/langs/typescript.png'
import javascript from './assets/projects/langs/javascript.png'
import css from './assets/projects/langs/css.png'
import csharp from './assets/projects/langs/csharp.png'
import marsAllocatorShot from './assets/projects/shots/mars_allocator_code.png'
import bitcoinClassifierShot from './assets/projects/shots/bitcoin_classifier_distribution.png'
import zeroShotEegShot from './assets/projects/shots/zero_shot_eeg_analysis.png'
import mysticMessagingShot from './assets/projects/shots/mystic_messaging_terminal.png'
import tspShot from './assets/projects/shots/tsp_genetic_algorithm.png'
import toxicityBiasAuditShot from './assets/projects/shots/toxicity_bias_audit.png'
import horsesFromNoiseShot from './assets/projects/shots/horses_from_noise_samples.png'
import kinemechanicsShot from './assets/projects/shots/kinemechanics_projectile_motion.png'
import unityClashShot from './assets/projects/shots/unity_clash_menu.png'
import xrayRestorationShot from './assets/projects/shots/xray_restoration.png'
import companionAiShot from './assets/projects/shots/companion_ai_daily_check_in.png'

/**
 * The boxes on the Projects page, left to right (the first is selected when the
 * page opens), and what their details pop-up says. The facts come from the
 * user's write-up, "The Project Files" (its gist, key features, numbers,
 * milestones and fun fact for each project). To add one, copy an entry:
 *  - name: on the box, in the pixel font (A–Z, 0–9, . , : ' ! ? - + / ( )).
 *    Up to about 4 letters show at full size; longer names shrink to fit.
 *  - title: the pop-up's heading, in the menu font. Keep it under about 19
 *    letters, or its bar runs out of the pop-up.
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
 *    (fitted into 78×70, not cropped). Put the PNG in assets/projects/, import
 *    it at the top like the logos, and add `image: myPicture,` to the entry.
 *  - shot (optional): the picture inside the expanded pop-up only, with a
 *    frame that follows its proportions. Store it in
 *    assets/projects/shots/ and import it above; until then the slot is blank.
 *    This never sets the box's image.
 *    Curated crops live in assets/projects/shots/crops.ts and are applied by
 *    Vite without changing the original PNGs.
 */

const PYTHON = { name: 'Python', color: '#3572A5' }
const JUPYTER = { name: 'Jupyter Notebook', color: '#DA5B0B' }

export const PROJECTS: Project[] = [
  {
    name: 'Mars Alloc',
    title: 'Mars Allocator',
    shot: marsAllocatorShot,
    detailsLayout: 'balanced',
    year: 2025,
    tagline: 'A crash-proof malloc for Mars rovers. Cosmic rays? Not a problem.',
    kind: 'Systems programming',
    when: 'Dec 2025, coursework',
    tech: ['C', 'Make'],
    gist: 'A hardened replacement for malloc and free, written for embedded systems in high-radiation environments like a Mars rover, where cosmic rays flip bits and the power can brown out mid-write. Every block carries checksums and mirrored metadata, so corruption is detected, repaired where possible and quarantined where not. The heap can also be split into up to eight thread-safe arenas for parallel work.',
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
      { value: '4.93x', label: 'faster with 8 arenas than 1' },
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
    name: 'Companion',
    title: 'CompanionAI',
    shot: companionAiShot,
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
    name: 'Bitcoin',
    title: 'Bitcoin Classifier',
    shot: bitcoinClassifierShot,
    year: 2026,
    tagline: 'One deadline, four people, one prize.',
    kind: 'Side quest, hackathon',
    when: '2026, hackathon team lead',
    gist: 'At ETH Hack Oxford 2026 I led a team of four through scoping, splitting the work and delivering a Bitcoin classification system before the event deadline. It took home the Best Trust and Safety Tool prize.',
    features: [
      'Scoped to ship. An idea sized for four people and one deadline.',
      'Split by strength. Work delegated across the team so everything landed in time.',
      'Built for trust and safety, the category it went on to win.',
    ],
    numbers: [
      { value: '4', label: 'people, me leading' },
      { value: '1', label: 'prize: Best Trust and Safety Tool' },
    ],
    milestones: [
      { when: 'Team', text: 'Four people, me leading.' },
      { when: 'Scope', text: 'Idea settled, work split.' },
      { when: 'Build', text: 'Classifier delivered on deadline.' },
      { when: 'Prize', text: 'Best Trust and Safety Tool.' },
    ],
    languages: [JUPYTER], // no repo to measure
    logos: [jupyter],
  },
  {
    name: 'Brain AI',
    title: 'Zero-Shot EEG',
    shot: zeroShotEegShot,
    year: 2025,
    tagline: 'Guessing what someone saw, from their brainwaves alone.',
    kind: 'Machine learning, brain decoding',
    when: 'Oct to Dec 2025, coursework',
    tech: ['Python', 'Jupyter', 'NumPy', 'scikit-learn'],
    gist: 'Can a model tell what image someone was looking at from 17 channels of EEG, even for objects it never trained on? This project maps brain signals into two "meaning spaces", CLIP text embeddings and CORnet-S image embeddings, using ridge regression. A new trial is classified by finding the closest class prototype, so the model recognises 200 unseen classes without a single labelled EEG example of them.',
    funFact: "Its mistakes aren't random. The model mostly confuses classes whose prototypes sit close together, with a correlation of about 0.35 between prototype similarity and confusion frequency.",
    features: [
      'Analysis before modelling. PCA, covariance spectra and CCA showed ill-conditioned EEG features and a stronger link to image embeddings than to text.',
      'Ridge regression to tame the ill-conditioning, with alpha tuned on a leakage-free, class-wise 90/10 split.',
      'Visual-heavy fusion. Text and image scores are blended 0.1 to 0.9, a weighting picked on validation and backed by the CCA result.',
      'Prototype matching. Cosine similarity against the 200 unseen class prototypes.',
      'Evaluation beyond accuracy. Ablations, macro precision, recall and F1, precision-recall curves, confusion matrices and t-SNE error analysis.',
    ],
    numbers: [
      { value: '200', label: 'classes it never trained on' },
      { value: '160,000', label: 'unseen test trials' },
      { value: '10.65%', label: 'top-1 accuracy, about 21 times chance' },
      { value: '8.94%', label: 'macro F1 with the fusion, up from 5.52%' },
    ],
    milestones: [
      { when: 'Start', text: 'Explored the data: each 17 x 100 trial flattened into a 1,700-dimensional vector.' },
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
    shot: mysticMessagingShot,
    shotFullWidth: true,
    detailsLayout: 'balanced',
    year: 2025,
    tagline: 'A command-line chat room with a few magic words.',
    kind: 'Networking',
    when: 'Dec 2025, coursework',
    tech: ['Python', 'sockets', 'threading'],
    gist: 'A multi-user chat app that lives entirely in the terminal. A threaded TCP server routes messages between clients across a global chat, private messages and groups, and serves shared files that clients can download over TCP or UDP. Every command starts with the magic word "mystic", and "mystic help" lists the lot.',
    funFact: 'The last two commits are titled "Final" and "Final final". A classic.',
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
    shot: xrayRestorationShot,
    year: 2026,
    tagline: 'Ten steps of classical image surgery to rescue wrecked X-rays.',
    kind: 'Computer vision, classical image processing',
    when: 'Feb 2026, coursework',
    tech: ['Python', 'OpenCV', 'NumPy'],
    gist: 'A set of 256 x 256 chest X-rays arrived badly damaged: tilted, warped, speckled with salt noise and colour noise, punched with dark circular holes and low on contrast. The images feed a pneumonia classifier, so the job was to restore them without throwing away the detail a classifier relies on. The answer was a ten-stage pipeline built entirely from classical signal processing, no deep learning, that cleans a whole folder of images in one command.',
    funFact: 'The rotation fix borrows a trick from document scanners: in the frequency domain, a rib cage looks like a tilted cross.',
    features: [
      'Rotation fixed in Fourier space. Ribs and spine show up as a cross in the frequency spectrum, so the pipeline scans radial lines every 0.1 degrees and averages the rib and spine deviations to find the tilt.',
      'Selective de-salting. Only pixels that are both extreme and far from their local median get replaced, so fine anatomy survives.',
      'Perspective correction. The largest four-cornered contour is found and warped back to a clean square.',
      'Colour denoising with CBM3D. An adapted, self-contained CBM3D implementation with its own DCT routines denoises in the OPP colour space.',
      'Hole repair. Dark circular artefacts are detected and filled in with Navier-Stokes inpainting.',
      'Finishing pass. Chroma low-pass in YCrCb, non-local means, CLAHE on the lightness channel and an unsharp mask on luminance only.',
    ],
    numbers: [
      { value: '10', label: 'stages in the pipeline' },
      { value: '0.1', label: 'degree rotation search step' },
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
    name: 'TSP',
    title: 'TSP Solvers',
    shot: tspShot,
    year: 2026,
    tagline: 'Evolution versus a swarm, racing to find the shortest round trip.',
    kind: 'Optimisation, metaheuristics',
    when: 'Jan to Feb 2026, coursework',
    tech: ['Python standard library only'],
    gist: "The Travelling Salesman Problem asks for the shortest route that visits every city once and returns home. The number of possible routes explodes factorially, so brute force is hopeless. This project built two nature-inspired solvers inside a strict coursework skeleton, a Genetic Algorithm and a discrete Particle Swarm Optimiser, then pushed both well beyond their lecture versions with custom operators and local search. Both run under time limits on nothing but Python's standard library.",
    funFact: 'Particle swarms were designed for smooth, continuous spaces. Here the particles "fly" through permutations, so a velocity is really a to-do list of city swaps.',
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
    name: 'Bias Audit',
    title: 'Toxicity Bias Audit',
    shot: toxicityBiasAuditShot,
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
    name: 'Horses',
    title: 'Horses From Noise',
    shot: horsesFromNoiseShot,
    year: 2026,
    tagline: 'A generator and a discriminator in an arms race over 32 × 32 horses.',
    kind: 'Generative models, deep learning coursework',
    when: 'Oct to Nov 2026, coursework',
    tech: ['Python', 'PyTorch', 'torch-fidelity'],
    gist: 'Two assessed Deep Learning practicals, one brief: train from scratch on 4,000 CIFAR-10 horse photos, stay under a million parameters, and generate 1,000 new 32 x 32 horses, scored by Kernel Inception Distance (KID, lower is better). First a DCGAN, where a generator and a discriminator train against each other; then the same horses with flow matching.',
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
    shot: kinemechanicsShot,
    year: 2023,
    tagline: 'Physics homework that actually moves.',
    kind: 'Simulation, desktop app',
    when: 'Built around 2023, on GitHub Mar 2026',
    tech: ['C++', 'SFML', 'CMake'],
    gist: 'A desktop physics simulator for A-level style mechanics, written in C++ with SFML. One mode animates projectile motion and works through the kinematic (SUVAT) equations step by step; the other sends two objects into each other for elastic and inelastic collisions. Any simulation can be saved to a text file and loaded back later.',
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
    name: 'Portfolio',
    title: 'Portfolio Site',
    year: 2026,
    tagline: "The retro game menu you're scrolling right now.",
    kind: 'Web, front end',
    when: 'Nov 2026, personal',
    tech: ['TypeScript', 'CSS', 'Vite', 'WebGL'],
    gist: "A portfolio website that behaves like the menu of a retro console game: navigate with the arrow keys, Enter and B, or just mouse and touch. It's built with Vite and plain TypeScript, no framework, with smooth performance on mid-range phones as a priority. All the pixel art and UI graphics are my own.",
    funFact: 'The menus are inspired by Sonic Mania, and so is the soundtrack.',
    features: [
      'Game-style menu. Slanted pixel-art buttons bounce when selected; the label hops a touch ahead of its button and flashes on confirm.',
      'Corner key prompts. Back, mute and confirm work by keyboard, click or tap.',
      'Soundtrack. A random track per screen with a "Now Playing" pop-up; mute is remembered between visits.',
      'Shader backdrop. Two pulsing rings drawn by a WebGL fragment shader in a single draw call, with an SVG fallback, roughly halving main-thread work.',
      'Projects carousel, with a details pop-up for every card, in pixel fonts rebuilt frame by frame from a reference clip.',
      'Built for phones. WebP images at build time, assets loaded in order of need, and Web Audio for instant sound effects.',
    ],
    numbers: [
      { value: '0', label: 'frameworks' },
      { value: '1', label: 'draw call per frame for the rings' },
      { value: '12', label: 'project cards so far' },
    ],
    milestones: [
      { when: 'Nov 13, 2026', text: 'Title screen and main menu.' },
      { when: 'Same day', text: 'Projects carousel, pixel font and page banners; the menu, prompts and page wipe matched to the reference clip.' },
      { when: 'Nov 14', text: 'README screenshots refreshed; the Photo Gallery pinned up.' },
      { when: 'Next', text: 'About Me and Socials pages.' },
    ],
    languages: [
      { name: 'TypeScript', share: 79.6, color: '#3178c6' }, { name: 'CSS', share: 18.4, color: '#663399' },
      { name: 'HTML', share: 1.1, color: '#e34c26' }, { name: 'JavaScript', share: 0.8, color: '#f1e05a' },
    ],
    logos: [typescript, css],
    url: 'https://github.com/Asdy419/latifs_website',
  },
  {
    name: 'Clash',
    title: 'Unity Clash',
    shot: unityClashShot,
    year: 2022,
    tagline: 'An arena platformer, still in the workshop.',
    kind: 'Game dev',
    when: '2022, personal',
    tech: ['C#', 'Unity 2020.3'],
    gist: "A two-player arena platformer built in Unity: two fighters share one keyboard on a stage ringed by blast zones. It's unfinished, but the last devlog shows how far it got.",
    funFact: 'The main scene file is called "current project unity smash". The inspiration is not subtle.',
    features: [
      'Local versus. Player one moves with WASD, player two with the arrow keys.',
      'Platformer physics. Rigidbody2D movement, ground checks and configurable extra jumps.',
      'Blast zones. Fall off the stage and you respawn at a random spot above the arena.',
    ],
    numbers: [
      { value: '2', label: 'players, one keyboard' },
      { value: '3', label: 'C# scripts' },
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
]
