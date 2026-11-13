import { textArt, TEXT_FONT_HEIGHT, type TextArt } from './textFont'

/**
 * The corner key prompts' text (BACK, MUTE, UNMUTE, CONFIRM), in the
 * references' small text font (textFont.ts): white with a dark shadow 1px
 * down and right (only diagonally), as measured from the main-menu clip's
 * button prompts.
 */

/** Height of the art: 10 rows of letters plus the shadow row. */
export const HUD_TEXT_HEIGHT = TEXT_FONT_HEIGHT + 1

export type HudTextArt = TextArt

/** `text` in the prompt font, with its shadow (so 1px wider and taller than the letters). */
export const hudTextArt = (text: string): HudTextArt =>
  textArt(text, { ink: '#efe9f3', shadow: '#271e27', shadowOffsets: [[1, 1]] })
