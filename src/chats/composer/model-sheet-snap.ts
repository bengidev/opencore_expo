/**
 * Resting heights of the model sheet, ordered from shortest to tallest.
 *
 * The shortest detent is 50% on purpose: the search field has to stay above
 * the keyboard, and a shorter sheet would hide it.
 *
 * iOS and web honour the percentages exactly. Android's Material bottom sheet
 * only has two resting states (partially expanded ≈ 50% and fully expanded), so
 * the two points collapse into one there.
 */
export const MODEL_SHEET_SNAP_POINTS = ['50%', '100%'] as const;

/** Snap point the sheet opens at, and the one it falls back to. */
export const MODEL_SHEET_DEFAULT_SNAP_INDEX = 0;
