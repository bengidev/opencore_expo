import test from 'node:test';
import assert from 'node:assert/strict';

import { clampThinkingLevel, defaultThinkingLevelFor, normalizeThinkingLevels } from './thinking.ts';

test('maps the minimal effort onto the low level', () => {
  assert.deepEqual(normalizeThinkingLevels(['minimal']), ['low']);
});

test('keeps only known levels in canonical order', () => {
  assert.deepEqual(normalizeThinkingLevels(['max', 'none', 'low', 'turbo']), ['low', 'max']);
  assert.deepEqual(normalizeThinkingLevels(undefined), []);
});

test('defaults to medium, else the middle level', () => {
  assert.equal(defaultThinkingLevelFor([]), null);
  assert.equal(defaultThinkingLevelFor(['low', 'medium', 'high']), 'medium');
  assert.equal(defaultThinkingLevelFor(['low', 'high']), 'low');
});

test('keeps a stored level the model still offers', () => {
  assert.equal(clampThinkingLevel(['low', 'high'], 'high'), 'high');
  assert.equal(clampThinkingLevel(['low', 'high'], 'low'), 'low');
});

test('clamps a stale level back to the model default', () => {
  assert.equal(clampThinkingLevel(['low', 'high'], 'max'), 'low');
  assert.equal(clampThinkingLevel(['low', 'medium', 'high'], undefined), 'medium');
});

test('clamps to null when the model has no levels', () => {
  assert.equal(clampThinkingLevel([], 'high'), null);
  assert.equal(clampThinkingLevel([], undefined), null);
});

test('returns an empty list for non-array input', () => {
  assert.deepEqual(normalizeThinkingLevels(null), []);
  assert.deepEqual(normalizeThinkingLevels('low'), []);
});

test('dedupes repeated levels', () => {
  assert.deepEqual(normalizeThinkingLevels(['high', 'low', 'high', 'low']), ['low', 'high']);
});
