/*
 * The user's pfp (their GitHub picture): a Metal Sonic sprite, pixel for pixel. Its 29 × 40 pixels
 * were recovered from the blown-up copy the user gave (reference/m338fedwl2c51.jpg, about 11.4 px to
 * each). The menu TV's GitHub hop (GithubHop.ts) shows it as GitHub does, on a checkerboard in a
 * circle; the title screen's medal (titleEmblem.ts) has it bursting out of its ring, at four times its size.
 */

const PFP = [
  '...............CC............',
  '..............CDDC...........',
  '.............DDEEDD..........',
  '.......DEC..CCEOOECC..CED....',
  '.......AQPCADDOOOODDACPQA....',
  '.......APRPCCEOOOOECCPRPA....',
  '.......AQRRPCEOIJOECPRRQA....',
  '.......AQPCDEEOJJOEEDCPQA....',
  '........ADDEEEOJIOEEEDDA.....',
  '........CCCDEEEOOEEEDCCC.....',
  '........DBACDEEEEEEDCABD.....',
  '........EBBACDEEEEDCABBE.....',
  '........EBBMAACDDCAAMBBE.....',
  '.......ADBBLBMAAAAMBLBADA....',
  'G.G..ACACABTBNMBBMNBTBDCACA..',
  '.GJH.AADACKMLMBKKBMLMKCADAA..',
  '..FIIJAAAFHIBFJFHJFBIHFAAA...',
  '..GFHQJAABGHJJIKKIJJHGBAA....',
  '.GIBIHPJABAGHIIIIIIHGABA.....',
  '.FGIHGRJFFKADGHOOHGDAF.......',
  '.HFBBAQJKHJHBFKKKKFBHJHF.....',
  '..HBCEAJHFHIGCMBBMCHIHF......',
  '....ACEAIHFFCQBBBBQCFFJH.....',
  '.....ACDHK.ADPNBBNPDA.GIH....',
  '......ACK..CEQRNNRQED.ACED...',
  '.......A...ACEQRRQDCAADEC....',
  '............ACDDDDCANBCA.....',
  '............FAACCAAQPNB......',
  '............KGB..BKNQPBG.....',
  '............GF...FGFKFGF.....',
  '............CA...AD.FKF......',
  '............DA...AD..........',
  '...........EA....AD..........',
  '..........FDA....ACF.........',
  '.........KKGS...BBKKK........',
  '.......NLLNBJM.BMKIBLLNN.....',
  '.....NLLPPLSHGMBKHHINNLLLN...',
  '...NLLPTLLLIGGMBFGHKNNNNLLLL.',
  '..IJJJJIIGGGIHMBGFFGGGGSSJJSH',
  '..MMMMMBBBBBBBBBBBBBBBBBBBBBB',
]
const PFP_COLOURS: Record<string, string> = {
  A: '#0e0e84', B: '#000000', C: '#3031bd', D: '#383ac6', E: '#6463d5', F: '#403b48', G: '#58728a',
  H: '#809aa5', I: '#b0ccce', J: '#ffffff', K: '#4c4e69', L: '#d21711', M: '#440b0a', N: '#8f0f0f',
  O: '#9694ee', P: '#e4ac17', Q: '#ab6918', R: '#e6e40c', S: '#d6e6e3', T: '#e79135',
}

/** The sprite as rows of colours (null: see-through), 29 × 40. */
export function pfpGrid(): (string | null)[][] {
  return PFP.map(row => [...row].map(c => PFP_COLOURS[c] ?? null))
}

/**
 * `g` doubled with Scale2x, the classic pixel-art scaler: each pixel becomes four, and where two
 * neighbours of the same colour meet at a corner that corner takes their colour, so diagonals come
 * out as finer steps rather than 2 × 2 blocks. Still only the sprite's own colours.
 */
function scale2x(g: (string | null)[][]): (string | null)[][] {
  const h = g.length, w = g[0].length
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? null : g[y][x])
  const out: (string | null)[][] = Array.from({ length: h * 2 }, () => Array<string | null>(w * 2).fill(null))
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = g[y][x], up = at(x, y - 1), right = at(x + 1, y), left = at(x - 1, y), down = at(x, y + 1)
    out[2 * y][2 * x] = left === up && left !== down && up !== right ? up : p
    out[2 * y][2 * x + 1] = up === right && up !== left && right !== down ? right : p
    out[2 * y + 1][2 * x] = down === left && down !== right && left !== up ? left : p
    out[2 * y + 1][2 * x + 1] = right === down && right !== up && down !== left ? down : p
  }
  return out
}

/** The sprite at four times its size (116 × 160): Scale2x twice. */
export function pfpGrid4x(): (string | null)[][] {
  return scale2x(scale2x(pfpGrid()))
}
