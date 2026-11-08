import test from 'node:test';
import assert from 'node:assert/strict';

import { openRouterFallbackModels, toFreeProviderModels } from './catalog.ts';

const payload = {
  data: [
    { id: 'paid/model', name: 'Paid', pricing: { prompt: '0.5', completion: '0.5' } },
    {
      id: 'z/model:free',
      name: 'Zeta',
      description: 'Z',
      context_length: 8192,
      top_provider: { max_completion_tokens: 4096 },
      pricing: { prompt: '0', completion: '0' },
      architecture: { input_modalities: ['text', 'image'] },
      supported_parameters: ['tools', 'reasoning'],
      reasoning: { supported_efforts: ['high', 'low'] },
    },
    {
      id: 'openrouter/free',
      name: 'OpenRouter Free',
      pricing: { prompt: '0', completion: '0' },
      architecture: { input_modalities: ['text'] },
    },
  ],
};

test('keeps free models, default first, capabilities and levels mapped', () => {
  const models = toFreeProviderModels(payload);
  assert.deepEqual(models.map((model) => model.id), ['openrouter/free', 'z/model:free']);
  // `tools` is a parameter, not a statement that the model writes code.
  assert.deepEqual(models[1].capabilities, ['text', 'image', 'reasoning']);
  assert.deepEqual(models[1].thinkingLevels, ['low', 'high']);
  assert.equal(models[1].maxOutputTokens, 4096);
  assert.deepEqual(models[0].thinkingLevels, []);
});

test('rejects junk payloads and falls back to one callable row', () => {
  assert.deepEqual(toFreeProviderModels(null), []);
  assert.deepEqual(toFreeProviderModels({ data: [{ id: 'x', pricing: {} }] }), []);
  assert.deepEqual(openRouterFallbackModels().map((model) => model.id), ['openrouter/free']);
});

function freeModel(overrides) {
  return {
    pricing: { prompt: '0', completion: '0' },
    architecture: { input_modalities: ['text'] },
    ...overrides,
  };
}

test('tool use alone does not make a model a code model', () => {
  const [model] = toFreeProviderModels({
    data: [
      freeModel({
        id: 'acme/tools',
        name: 'Acme Tools',
        supported_parameters: ['tools'],
      }),
    ],
  });

  assert.deepEqual(model.capabilities, ['text']);
});

test('reads code from the id or the name', () => {
  const models = toFreeProviderModels({
    data: [
      freeModel({ id: 'acme/coder', name: 'Acme' }),
      freeModel({ id: 'acme/one', name: 'Code Assistant' }),
    ],
  });

  assert.deepEqual(models.map((model) => model.capabilities), [
    ['text', 'code'],
    ['text', 'code'],
  ]);
});

test('keeps a reasoning model that also takes images', () => {
  const [model] = toFreeProviderModels({
    data: [
      freeModel({
        id: 'acme/vision',
        name: 'Acme Vision',
        architecture: { input_modalities: ['text', 'image'] },
        reasoning: { supported_efforts: ['low'] },
      }),
    ],
  });

  assert.deepEqual(model.capabilities, ['text', 'image', 'reasoning']);
});

test('orders a larger context window first', () => {
  const models = toFreeProviderModels({
    data: [
      freeModel({ id: 'acme/small', name: 'Small', context_length: 256_000 }),
      freeModel({ id: 'acme/large', name: 'Large', context_length: 1_000_000 }),
    ],
  });

  assert.deepEqual(models.map((model) => model.contextLength), [1_000_000, 256_000]);
});

test('the fallback row wears the same label as the live one', () => {
  const [live] = toFreeProviderModels({
    data: [freeModel({ id: 'openrouter/free', name: 'Free Models Router' })],
  });

  assert.equal(live.label, openRouterFallbackModels()[0].label);
});
