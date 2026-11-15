/** Expanded-view crops in source pixels. Original PNGs stay untouched. */
export const PROJECT_SHOT_CROPS: Record<string, { left: number; top: number; width: number; height: number }> = {
  // Frame the complete memory layout and feature list, with no partial code lines.
  'mars_allocator_code.png': { left: 30, top: 111, width: 480, height: 272 },
  // Focus on the app and check-in UI, leaving the presentation notes outside.
  'companion_ai_daily_check_in.png': { left: 94, top: 12, width: 463, height: 330 },
  // Keep the complete category chart and legend; omit the partial second plot.
  'bitcoin_classifier_distribution.png': { left: 0, top: 45, width: 740, height: 485 },
  'zero_shot_eeg_analysis.png': { left: 194, top: 70, width: 912, height: 676 },
  // Remove the shell command and unused terminal space around the conversation.
  'mystic_messaging_terminal.png': { left: 11, top: 36, width: 333, height: 107 },
  'xray_restoration.png': { left: 3, top: 2, width: 480, height: 482 },
  'tsp_genetic_algorithm.png': { left: 22, top: 7, width: 512, height: 538 },
  'toxicity_bias_audit.png': { left: 105, top: 151, width: 748, height: 512 },
  'horses_from_noise_samples.png': { left: 6, top: 8, width: 912, height: 912 },
  // Only remove the window chrome: the ball, vectors and full bottom stay visible.
  'kinemechanics_projectile_motion.png': { left: 0, top: 34, width: 987, height: 538 },
}
