import type { SharkKind } from "./world";

export const SHARK_KINDS: readonly SharkKind[] = [
  "classic",
  "hammerhead",
  "tiger",
  "zebra",
  "greathammer",
  "mako",
  "thresher",
  "nurse",
];

export const MIN_HEROES = 3;
export const MAX_HEROES = 5;

export type SharkHero = {
  id: number;
  kind: SharkKind;
  size: number;
};

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    [copy[index], copy[swapWith]] = [copy[swapWith], copy[index]];
  }
  return copy;
}

export function createSharkRoster(random: () => number = Math.random): SharkHero[] {
  const count = MIN_HEROES + Math.floor(random() * (MAX_HEROES - MIN_HEROES + 1));
  const kinds = shuffled(SHARK_KINDS, random);

  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    kind: kinds[index % kinds.length],
    size: 1 - (index / (count - 1)) * 0.42,
  }));
}
