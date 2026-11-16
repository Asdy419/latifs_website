/**
 * The classic "selected!" flash when something is confirmed: the element
 * blinks off and on FLASH_BLINKS times, each phase FLASH_PHASE_MS (about 0.7s
 * in all), with hard cuts. It vanishes the instant you press and always ends
 * visible. Used by the main menu's labels (ButtonMenu) and the BACK prompt
 * when it leaves a page (core/subpage.ts).
 *
 * Web Animations API on opacity, so it runs alongside any CSS or transform
 * animations on the same element instead of replacing them.
 */
const FLASH_BLINKS = 14
const FLASH_PHASE_MS = 25 // ~1.5 frames at 60Hz (17 = one frame, the fastest a screen can show)

// Hidden for the first half of each blink, visible for the second (no fade).
const FLASH_KEYFRAMES: Keyframe[] = [
  { opacity: 0, offset: 0 },
  { opacity: 0, offset: 0.5 },
  { opacity: 1, offset: 0.5 },
  { opacity: 1, offset: 1 },
]

export function playConfirmFlash(el: Element): Animation {
  return el.animate(FLASH_KEYFRAMES, { duration: FLASH_PHASE_MS * 2, iterations: FLASH_BLINKS })
}
