import test from 'node:test';
import assert from 'node:assert/strict';

import { getProvider } from './providers/index.ts';
import { isFallbackList, loadModelCatalog } from './use-model-catalog.ts';

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

test('a rejected catalogue request settles into fallback', async () => {
  const base = getProvider('openrouter');
  const provider = {
    ...base,
    async listModels() {
      throw new Error('offline');
    },
  };

  const result = await loadModelCatalog(provider, {
    apiKey: 'sk-or-test',
    fetch: async () => new Response('', { status: 500 }),
  });

  assert.equal(result.kind, 'fallback');
  assert.equal(result.error, 'offline');
  assert.deepEqual(
    result.models.map((model) => model.id),
    base.fallbackModels.map((model) => model.id),
  );
});

test('a provider that resolves its fallback row also settles into fallback', async () => {
  const base = getProvider('openrouter');
  const provider = {
    ...base,
    listModels: async () => [...base.fallbackModels],
  };

  const result = await loadModelCatalog(provider, {
    fetch: async () => new Response(''),
  });

  assert.equal(result.kind, 'fallback');
  assert.equal(result.error, null);
});
