import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getModelSelection,
  resolveSelectedModel,
  selectModelId,
  selectThinkingLevel,
  subscribeModelSelection,
} from './model-selection-store.ts';

const models = Object.freeze([
  Object.freeze({ id: 'openrouter/free', label: 'OpenRouter Free', description: '', contextLength: 1, capabilities: Object.freeze(['text']), thinkingLevels: Object.freeze([]) }),
  Object.freeze({ id: 'z/model:free', label: 'Zeta', description: '', contextLength: 1, capabilities: Object.freeze(['text']), thinkingLevels: Object.freeze([]) }),
]);

test('starts on the provider default', () => {
  const selection = getModelSelection();
  assert.equal(selection.providerId, 'openrouter');
  assert.equal(selection.modelId, 'openrouter/free');
  assert.deepEqual(selection.thinkingByModel, {});
  assert.equal(selection, getModelSelection());
});

test('notifies once per real change and keeps thinking per model', (t) => {
  let notifications = 0;
  const unsubscribe = subscribeModelSelection(() => {
    notifications += 1;
  });
  t.after(() => {
    unsubscribe();
    selectModelId('openrouter/free');
    const selection = getModelSelection();
    for (const modelId of Object.keys(selection.thinkingByModel)) {
      delete selection.thinkingByModel[modelId];
    }
  });

  selectModelId('z/model:free');
  assert.equal(getModelSelection().modelId, 'z/model:free');
  assert.equal(notifications, 1);

  selectModelId('z/model:free');
  assert.equal(notifications, 1);

  selectModelId(42);
  assert.equal(getModelSelection().modelId, 'z/model:free');
  assert.equal(notifications, 1);

  selectModelId('   ');
  assert.equal(getModelSelection().modelId, 'z/model:free');
  assert.equal(notifications, 1);

  const before = getModelSelection();
  assert.equal(before.thinkingByModel['z/model:free'], undefined);

  selectThinkingLevel('z/model:free', 'high');
  const after = getModelSelection();
  assert.equal(after.thinkingByModel['z/model:free'], 'high');
  assert.equal(before.thinkingByModel['z/model:free'], undefined);
  assert.notEqual(before.thinkingByModel, after.thinkingByModel);
  assert.notEqual(before, after);
  assert.equal(after.modelId, 'z/model:free');
  assert.equal(notifications, 2);

  selectThinkingLevel('z/model:free', 'high');
  assert.equal(notifications, 2);

  selectThinkingLevel('   ', 'low');
  selectThinkingLevel(42, 'low');
  assert.equal(notifications, 2);

  selectThinkingLevel('  openrouter/free  ', 'low');
  assert.equal(getModelSelection().thinkingByModel['openrouter/free'], 'low');
  assert.equal(getModelSelection().thinkingByModel['z/model:free'], 'high');
  assert.equal(getModelSelection().modelId, 'z/model:free');
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
