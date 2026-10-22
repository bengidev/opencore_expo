import { Spacing } from '@/constants/theme';

/**
 * Screen-edge inset for the home module.
 *
 * The suggestion carousel bleeds past the column so cards can scroll off the
 * edge, but its first card and the composer both align on this inset — keep
 * the bleed (`-HOME_EDGE_INSET`) and the content padding tied to it.
 */
export const HOME_EDGE_INSET = Spacing.three;

/**
 * Vertical rhythm between the suggestion card row and the composer.
 *
 * The cards and the composer form one visual group, so this is the only
 * spacer between them — no per-component vertical margins on top of it.
 * Set it to `0` to seat the card row flush on the composer's top edge.
 */
export const HOME_COMPOSER_GAP = Spacing.two;
