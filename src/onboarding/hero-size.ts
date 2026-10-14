/** Shared hero dimensions for onboarding layout and motion. */
export const HERO_SIZE_MIN = 224;
export const HERO_SIZE_MAX = 288;

export function onboardingHeroSize(windowWidth: number, windowHeight: number): number {
  const byWidth = windowWidth * 0.64;
  const byHeight = windowHeight * 0.36;
  const target = Math.min(byWidth, byHeight, HERO_SIZE_MAX);
  return Math.round(Math.max(HERO_SIZE_MIN, target));
}
