import { Easing } from 'react-native-reanimated';

/**
 * The run log moves as one object: rows rise on arrival, the list re-flows,
 * and the header chevron swaps in place. Keeping the curve and both springs
 * here means every part of the log shares the same timing vocabulary instead
 * of drifting apart file by file.
 */
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

/** Re-flowing the log: heavy enough not to wobble, stiff enough to track the stream. */
export const SPRING_LAYOUT = { stiffness: 360, damping: 32, mass: 0.6 };

/** Small state swaps, such as the chevron turn: less mass, so it lands sooner. */
export const SPRING_SWAP = { stiffness: 460, damping: 30, mass: 0.55 };
