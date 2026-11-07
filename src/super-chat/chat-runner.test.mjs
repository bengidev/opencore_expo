import test from 'node:test';
import assert from 'node:assert/strict';

import { createChatRunner } from './chat-runner.ts';

function deferred() {
  let resolve;
  const promise = new Promise((settle) => { resolve = settle; });
  return { promise, resolve };
}

const request = { modelId: 'openrouter/free', messages: [{ role: 'user', content: 'hi' }], thinking: null };

function providerYielding(script) {
  return {
    id: 'openrouter',
    label: 'Test',
    requiresKey: true,
    defaultModelId: 'openrouter/free',
    fallbackModels: [],
    streamChat: script,
    listModels: async () => [],
    checkKey: async () => ({ state: 'valid', label: null }),
  };
}

test('a second run aborts the first, which emits nothing further', async () => {
  const gates = [deferred(), deferred()];
  const signals = [];
  let index = 0;
  const provider = providerYielding(async function* (_request, context) {
    const current = index++;
    signals.push(context.signal);
    yield { type: 'text-delta', text: `run${current}` };
    await gates[current].promise;
    yield { type: 'done', finishReason: 'stop' };
  });
  const runner = createChatRunner({ provider, getKey: async () => 'sk-or-test', flushMs: 5 });
  const events = [];
  const first = runner.run(request, (event) => events.push(event));
  await new Promise((resolve) => setTimeout(resolve, 10));
  const second = runner.run(request, (event) => events.push(event));
  assert.equal(signals[0].aborted, true);
  gates[0].resolve();
  gates[1].resolve();
  await Promise.all([first, second]);
  assert.deepEqual(events.filter((event) => event.type === 'done').length, 1);
  assert.deepEqual(events.at(-1).type, 'done');
});

test('coalesces deltas and reports a missing key without a request', async () => {
  const provider = providerYielding(async function* () {
    yield { type: 'text-delta', text: 'a' };
    yield { type: 'text-delta', text: 'b' };
    yield { type: 'text-delta', text: 'c' };
    yield { type: 'done', finishReason: 'stop' };
  });
  const runner = createChatRunner({ provider, getKey: async () => 'sk-or-test', flushMs: 10 });
  const events = [];
  await runner.run(request, (event) => events.push(event));
  assert.deepEqual(events.map((event) => event.type), ['text-delta', 'done']);
  assert.equal(events[0].text, 'abc');

  let called = 0;
  const missing = createChatRunner({
    provider: providerYielding(async function* () { called += 1; yield { type: 'done', finishReason: null }; }),
    getKey: async () => null,
  });
  const errors = [];
  await missing.run(request, (event) => errors.push(event));
  assert.equal(called, 0);
  assert.equal(errors[0].code, 'missing-key');
  assert.equal(errors[0].retryable, false);
});
