import { clamp } from './math';

/**
 * One cell size for the simulation and its renderer. Both the stage (for the
 * glyph font) and the Skia renderer must lay out the same grid, so this lives
 * in one place instead of being derived twice.
 */
export function oceanGrid(width: number) {
  const cellWidth = clamp(Math.round(width / 96), 10, 14);
  const cellHeight = Math.max(6, Math.round(cellWidth * 1.15));
  const fontSize = Math.max(6, Math.round(cellHeight * 0.78));

  return { cellWidth, cellHeight, fontSize };
}
