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
    // Reasoning outranks the image modality when both apply.
    iosSymbol: 'brain',
    androidIcon: 'psychology',
    // The brief names the SF Symbol; Material Icons calls the same glyph
    // `auto-awesome`, and `fallbackIcon` is keyed by MaterialIcons.glyphMap.
    fallbackIcon: 'auto-awesome',
    capabilities: ['text', 'image', 'reasoning'],
    thinkingLevels: ['low', 'high'],
    keywords: ['zeta', 'z/model:free'],
  });
});

test('fall back to the sparkle symbol for text-only models', () => {
  const model = toHomeModel({
    id: 'openrouter/free',
    label: 'OpenRouter Free',
    description: '',
    contextLength: 200000,
    capabilities: ['text'],
    thinkingLevels: [],
  });
  assert.equal(model.iosSymbol, 'sparkles');
  assert.equal(model.androidIcon, 'auto_awesome_mosaic');
  assert.deepEqual(model.keywords, ['openrouter free', 'openrouter/free']);
});

test('orders visuals reasoning, image, documents, code, web, audio, video', () => {
  const visual = (capabilities) =>
    toHomeModel({
      id: 'acme/model',
      label: 'Acme',
      description: '',
      contextLength: 0,
      capabilities,
      thinkingLevels: [],
    }).iosSymbol;

  assert.equal(visual(['text', 'image', 'reasoning']), 'brain');
  assert.equal(visual(['text', 'video', 'image']), 'photo');
  assert.equal(visual(['text', 'audio', 'documents']), 'doc.text');
  assert.equal(visual(['text', 'web', 'code']), 'chevron.left.forwardslash.chevron.right');
  assert.equal(visual(['text', 'audio', 'web']), 'globe');
  assert.equal(visual(['text', 'video', 'audio']), 'waveform');
});
