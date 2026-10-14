const EDGE_INSET = 8;
const TAIL_WIDTH = 18;
const TAIL_INSET = 14;

export type SpeechBubblePlacementInput = {
  stageWidth: number;
  heroX: number;
  heroWidth: number;
  bubbleWidth: number;
  anchorFraction: number;
};

export type SpeechBubblePlacement = {
  left: number;
  tailLeft: number;
};

export type SpeechBubbleMotionInput = {
  heroSize: number;
  anchorFraction: number;
  pose: { x: number; y: number; sx: number; sy: number; pitch: number; roll: number };
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function speechBubbleMotion({ heroSize, anchorFraction, pose }: SpeechBubbleMotionInput) {
  'worklet';

  if (heroSize <= 0) return { x: 0, y: 0 };

  // ponytail: ghost outline bounds plus a depth margin; resample the Skia path if the hero shape changes.
  const rx = 33 * Math.abs(pose.sx);
  const ry = 38.25 * Math.abs(pose.sy);
  const roll = pose.roll;
  const outlineTop =
    pose.y +
    5.25 * pose.sy -
    Math.hypot(rx * Math.sin(roll), ry * Math.cos(roll)) -
    (rx + 10) * Math.abs(Math.sin(pose.pitch));

  return {
    x: ((pose.x + (anchorFraction - 0.5) * 100 * (pose.sx - 1)) * heroSize) / 100,
    y: ((50 + outlineTop) * heroSize) / 100 + 4,
  };
}

export function speechBubblePlacement({
  stageWidth,
  heroX,
  heroWidth,
  bubbleWidth,
  anchorFraction,
}: SpeechBubblePlacementInput): SpeechBubblePlacement {
  if (stageWidth <= 0 || heroWidth <= 0 || bubbleWidth <= 0) {
    return { left: 0, tailLeft: TAIL_INSET };
  }

  const width = Math.min(bubbleWidth, stageWidth - EDGE_INSET * 2);
  const anchorX = heroWidth * clamp(anchorFraction, 0.2, 0.8);
  const minLeft = EDGE_INSET - heroX;
  const maxLeft = stageWidth - EDGE_INSET - heroX - width;
  const left = clamp(anchorX - width / 2, minLeft, maxLeft);
  const anchorInBubble = heroX + anchorX - (heroX + left);
  const maxTailLeft = Math.max(TAIL_INSET, width - TAIL_INSET - TAIL_WIDTH);
  const tailLeft = clamp(anchorInBubble - TAIL_WIDTH / 2, TAIL_INSET, maxTailLeft);

  return { left, tailLeft };
}
