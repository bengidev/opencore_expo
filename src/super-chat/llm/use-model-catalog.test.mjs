import test from 'node:test';
import assert from 'node:assert/strict';

import { getProvider } from './providers/index.ts';
import {
  CATALOGUE_FAILED_MESSAGE,
  isFallbackList,
  loadModelCatalog,
} from './use-model-catalog.ts';

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
  assert.equal(result.error, CATALOGUE_FAILED_MESSAGE);
  assert.deepEqual(
    result.models.map((model) => model.id),
    base.fallbackModels.map((model) => model.id),
  );
});

test('a failed OpenRouter catalogue settles into fallback', async () => {
  const base = getProvider('openrouter');

  // The shipped provider rejects on a non-ok response, so the hook's catch -
  // not its payload check - is what turns this into 'fallback'.
  const result = await loadModelCatalog(base, {
    fetch: async () => new Response('{}', { status: 503 }),
  });

  assert.equal(result.kind, 'fallback');
  assert.equal(result.error, CATALOGUE_FAILED_MESSAGE);
  assert.deepEqual(
    result.models.map((model) => model.id),
    base.fallbackModels.map((model) => model.id),
  );
});

test('a parser failure never leaks engine text into the caption', async () => {
  const base = getProvider('openrouter');
  const provider = {
    ...base,
    async listModels() {
      throw new SyntaxError('JSON Parse error: Unexpected token < in JSON');
    },
  };

  const result = await loadModelCatalog(provider, { fetch: async () => new Response('') });

  assert.equal(result.kind, 'fallback');
  assert.equal(result.error, CATALOGUE_FAILED_MESSAGE);
  assert.doesNotMatch(result.error, /JSON Parse/);
});

test('a live catalogue stays ready even when it repeats the fallback id', async () => {
  const base = getProvider('openrouter');
  const live = [
    ...base.fallbackModels,
    { ...base.fallbackModels[0], id: 'deepseek/deepseek-r1:free', label: 'DeepSeek R1' },
  ];
  const provider = { ...base, listModels: async () => live };

  const result = await loadModelCatalog(provider, { fetch: async () => new Response('') });

  // Status comes from settled success, never from comparing ids to the row.
  assert.equal(result.kind, 'ready');
  assert.equal(result.error, null);
  assert.deepEqual(result.models.map((model) => model.id), [
    'openrouter/free',
    'deepseek/deepseek-r1:free',
  ]);
});
