import test from 'node:test';
import assert from 'node:assert/strict';

import { toHomeModel } from './chat-models.ts';

test('maps a provider model onto the sheet vocabulary', () => {
  const model = toHomeModel({
    id: 'z/model:free',
    label: 'Zeta',
    description: 'Z',
    contextLength: 8192,
    capabilities: ['text', 'image', 'reasoning'],
    thinkingLevels: ['low', 'high'],
  });
  assert.deepEqual(model, {
    id: 'z/model:free',
    name: 'Zeta',
    description: 'Z',
    iosSymbol: 'photo',
    androidIcon: 'image',
    // The brief names the SF Symbol; Material Icons calls the same glyph
    // `auto-awesome`, and `fallbackIcon` is keyed by MaterialIcons.glyphMap.
    fallbackIcon: 'auto-awesome',
    capabilities: ['text', 'image', 'reasoning'],
    thinkingLevels: ['low', 'high'],
    keywords: ['zeta', 'z/model:free'],
  });
});

test('falls back to a neutral symbol for text-only models', () => {
  const model = toHomeModel({
    id: 'openrouter/free',
    label: 'OpenRouter Free',
    description: '',
    contextLength: 200000,
    capabilities: ['text'],
    thinkingLevels: [],
  });
  assert.equal(model.iosSymbol, 'bubble.left');
  assert.deepEqual(model.keywords, ['openrouter free', 'openrouter/free']);
});
