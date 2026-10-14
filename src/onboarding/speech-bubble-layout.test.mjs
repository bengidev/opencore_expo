import assert from 'node:assert/strict';
import test from 'node:test';
import { speechBubbleMotion, speechBubblePlacement } from './speech-bubble-layout.ts';

test('keeps a measured bubble inside the stage and points its tail at the hero', () => {
  const stageWidth = 360;
  const heroX = 60;
  const heroWidth = 240;
  const bubbleWidth = 200;
  const anchorFraction = 0.5;
  const placement = speechBubblePlacement({
    stageWidth,
    heroX,
    heroWidth,
    bubbleWidth,
    anchorFraction,
  });

  assert.ok(heroX + placement.left >= 8);
  assert.ok(heroX + placement.left + bubbleWidth <= stageWidth - 8);
  assert.ok(Math.abs(placement.left + placement.tailLeft + 9 - heroWidth * anchorFraction) < 1);
});

test('tracks the avatar pose outside its changing top envelope', () => {
  const resting = speechBubbleMotion({
    heroSize: 240,
    anchorFraction: 0.5,
    pose: { x: 0, y: 0, sx: 1, sy: 1, pitch: 0, roll: 0 },
  });
  const jumping = speechBubbleMotion({
    heroSize: 240,
    anchorFraction: 0.5,
    pose: { x: 4, y: -26, sx: 1.05, sy: 1.15, pitch: 0, roll: 0 }
  });

  assert.equal(resting.x, 0);
  assert.ok(Math.abs(resting.y - 44.8) < 1e-9);
  assert.equal(jumping.x, 9.6);
  assert.ok(jumping.y < resting.y);
  const tilted = speechBubbleMotion({
    heroSize: 240,
    anchorFraction: 0.5,
    pose: { x: 4, y: -26, sx: 1.05, sy: 1.15, pitch: 0, roll: 1.2 },
  });
  assert.ok(tilted.y > jumping.y);
});

test('clamps the bubble to either stage edge as its text changes width', () => {
  const input = { stageWidth: 320, heroX: 40, heroWidth: 240, bubbleWidth: 260 };
  const left = speechBubblePlacement({ ...input, anchorFraction: 0.2 });
  const right = speechBubblePlacement({ ...input, anchorFraction: 0.8 });

  assert.ok(input.heroX + left.left >= 8);
  assert.ok(input.heroX + left.left + 260 <= input.stageWidth - 8);
  assert.ok(input.heroX + right.left >= 8);
  assert.ok(input.heroX + right.left + 260 <= input.stageWidth - 8);
});
