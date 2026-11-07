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
  assert.deepEqual(models[1].capabilities, ['text', 'image', 'code', 'reasoning']);
  assert.deepEqual(models[1].thinkingLevels, ['low', 'high']);
  assert.equal(models[1].maxOutputTokens, 4096);
  assert.deepEqual(models[0].thinkingLevels, []);
});

test('rejects junk payloads and falls back to one callable row', () => {
  assert.deepEqual(toFreeProviderModels(null), []);
  assert.deepEqual(toFreeProviderModels({ data: [{ id: 'x', pricing: {} }] }), []);
  assert.deepEqual(openRouterFallbackModels().map((model) => model.id), ['openrouter/free']);
});
