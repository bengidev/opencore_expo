import assert from 'node:assert/strict';
import test from 'node:test';

import { placeBubble } from './bubble-placement.ts';

const stage = {
  stageWidth: 390,
  stageHeight: 844,
  bubbleWidth: 200,
  bubbleHeight: 50,
  gap: 18,
  edgePad: 10,
};

test('sits above the head and points the tail at it', () => {
  const placement = placeBubble({ ...stage, headX: 200, headY: 400 });

  assert.equal(placement.left, 100);
  assert.equal(placement.top, 332);
  assert.equal(placement.tailX, 100);
  assert.equal(placement.placement, 'above');
  assert.equal(placement.visible, true);
});

test('clamps at the edge and flips below when there is no room above', () => {
  const edge = placeBubble({ ...stage, headX: 20, headY: 400 });
  const flipped = placeBubble({ ...stage, headX: 200, headY: 30 });

  assert.equal(edge.left, 10);
  assert.equal(flipped.placement, 'below');
  assert.equal(flipped.top, 48);
});

test('respects the safe top and bottom bounds', () => {
  const placement = placeBubble({
    ...stage,
    headX: 200,
    headY: 400,
    safeTop: 120,
    safeBottom: 700,
  });

  assert.ok(placement.top >= 120);
  assert.ok(placement.top + stage.bubbleHeight <= 700);
  assert.equal(placement.visible, true);
});

test('flips around an avoid zone or hides when neither side clears', () => {
  const flipped = placeBubble({
    ...stage,
    headX: 200,
    headY: 400,
    avoid: [{ left: 80, top: 300, right: 300, bottom: 390 }],
  });
  const hidden = placeBubble({
    ...stage,
    headX: 200,
    headY: 400,
    avoid: [{ left: 80, top: 300, right: 300, bottom: 500 }],
  });

  assert.equal(flipped.placement, 'below');
  assert.equal(flipped.visible, true);
  assert.equal(hidden.visible, false);
});

test('hides when the head leaves the stage', () => {
  const placement = placeBubble({ ...stage, headX: 1000, headY: 400 });
  assert.equal(placement.visible, false);
});
