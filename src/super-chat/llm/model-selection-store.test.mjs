import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getModelSelection,
  resolveSelectedModel,
  selectModelId,
  selectThinkingLevel,
  subscribeModelSelection,
} from './model-selection-store.ts';

const models = [
  { id: 'openrouter/free', label: 'OpenRouter Free', description: '', contextLength: 1, capabilities: ['text'], thinkingLevels: [] },
  { id: 'z/model:free', label: 'Zeta', description: '', contextLength: 1, capabilities: ['text'], thinkingLevels: [] },
];

test('starts on the provider default', () => {
  assert.equal(getModelSelection().providerId, 'openrouter');
  assert.equal(getModelSelection().modelId, 'openrouter/free');
  assert.deepEqual(getModelSelection().thinkingByModel, {});
});

test('notifies once per real change and stores thinking per model', () => {
  let notifications = 0;
  const unsubscribe = subscribeModelSelection(() => {
    notifications += 1;
  });

  selectModelId('z/model:free');
  assert.equal(getModelSelection().modelId, 'z/model:free');
  assert.equal(notifications, 1);

  selectModelId('z/model:free');
  assert.equal(notifications, 1);

  selectModelId('   ');
  assert.equal(getModelSelection().modelId, 'z/model:free');
  assert.equal(notifications, 1);

  assert.equal(getModelSelection().thinkingByModel['z/model:free'], undefined);
  selectThinkingLevel('z/model:free', 'high');
  assert.equal(getModelSelection().thinkingByModel['z/model:free'], 'high');
  assert.equal(notifications, 2);

  selectThinkingLevel('z/model:free', 'high');
  assert.equal(notifications, 2);

  selectThinkingLevel('openrouter/free', 'low');
  assert.equal(getModelSelection().thinkingByModel['openrouter/free'], 'low');
  assert.equal(getModelSelection().thinkingByModel['z/model:free'], 'high');
  assert.equal(notifications, 3);

  unsubscribe();
  selectModelId('openrouter/free');
  assert.equal(getModelSelection().modelId, 'openrouter/free');
  assert.equal(notifications, 3);
});

test('resolves a stored model against the loaded catalogue', () => {
  const snapshot = models.slice();
  assert.equal(resolveSelectedModel(models, 'z/model:free').id, 'z/model:free');
  assert.equal(resolveSelectedModel(models, 'gone/model:free').id, 'openrouter/free');
  assert.equal(resolveSelectedModel([], 'anything'), null);
  assert.deepEqual(models, snapshot);
});
