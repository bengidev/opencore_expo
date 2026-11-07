import test from 'node:test';
import assert from 'node:assert/strict';

import { isFallbackList } from './use-model-catalog.ts';

const fallback = [{ id: 'openrouter/free' }];

test('detects the provider fallback row', () => {
  assert.equal(isFallbackList([{ id: 'openrouter/free' }], fallback), true);
  // Identity is by id, so a relabelled fallback row still counts.
  assert.equal(
    isFallbackList([{ id: 'openrouter/free', label: 'Anything' }], fallback),
    true,
  );
});

test('does not mistake a live catalogue for the fallback', () => {
  assert.equal(
    isFallbackList(
      [{ id: 'openrouter/free' }, { id: 'deepseek/deepseek-r1:free' }],
      fallback,
    ),
    false,
  );
  assert.equal(isFallbackList([], fallback), false);
});

test('compares ids row for row', () => {
  assert.equal(isFallbackList([{ id: 'other/free' }], fallback), false);
  assert.equal(
    isFallbackList([{ id: 'a' }, { id: 'b' }], [{ id: 'a' }, { id: 'b' }]),
    true,
  );
  assert.equal(
    isFallbackList([{ id: 'b' }, { id: 'a' }], [{ id: 'a' }, { id: 'b' }]),
    false,
  );
});
