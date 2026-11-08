import test from 'node:test';
import assert from 'node:assert/strict';

import { createChatRunner } from './chat-runner.ts';
import { createStreamingFlag } from './streaming-flag.ts';

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
  assert.equal(events.filter((event) => event.type === 'done').length, 1);
  assert.equal(events.at(-1).type, 'done');
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

test('abort delivers the buffered delta once and emits no terminal event', async () => {
  const gate = deferred();
  const provider = providerYielding(async function* () {
    yield { type: 'text-delta', text: 'partial' };
    await gate.promise;
    yield { type: 'done', finishReason: 'stop' };
  });
  // Long enough that nothing flushes on its own: the abort must deliver it.
  const runner = createChatRunner({ provider, getKey: async () => 'sk-or-test', flushMs: 60_000 });
  const events = [];
  const run = runner.run(request, (event) => events.push(event));
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(events.length, 0);

  runner.abort();
  assert.deepEqual(events, [{ type: 'text-delta', text: 'partial' }]);

  gate.resolve();
  await run;
  assert.equal(events.length, 1);
  assert.equal(runner.isRunning(), false);
});

test('a provider throw keeps the streamed deltas, ends with one retryable error, and logs the cause', async () => {
  const provider = providerYielding(async function* () {
    yield { type: 'text-delta', text: 'part' };
    throw new TypeError('fetch exploded');
  });
  const logs = [];
  const runner = createChatRunner({
    provider,
    getKey: async () => 'sk-or-test',
    flushMs: 5,
    log: (message, reason) => logs.push({ message, reason }),
  });
  const events = [];

  assert.equal(runner.isRunning(), false);
  const run = runner.run(request, (event) => events.push(event));
  assert.equal(runner.isRunning(), true);
  await run;
  assert.equal(runner.isRunning(), false);

  assert.deepEqual(events[0], { type: 'text-delta', text: 'part' });
  assert.equal(events.length, 2);
  assert.equal(events[1].type, 'error');
  assert.equal(events[1].code, 'network');
  assert.equal(events[1].message, 'The connection dropped before the reply finished.');
  assert.equal(events[1].retryable, true);
  assert.equal('debugMessage' in events[1], false);
  // The raw cause is for the developer, through the injected logger.
  assert.equal(logs.length, 1);
  assert.equal(logs[0].message, '[chat-runner]');
  assert.equal(logs[0].reason.message, 'fetch exploded');
});

test('abort stops a paused stream and clears the streaming flag without an error', async () => {
  const gate = deferred();
  const provider = providerYielding(async function* () {
    yield { type: 'text-delta', text: 'partial' };
    await gate.promise;
    yield { type: 'done', finishReason: 'stop' };
  });
  const runner = createChatRunner({ provider, getKey: async () => 'sk-or-test', flushMs: 5 });
  const updates = [];
  const flag = createStreamingFlag((streaming) => updates.push(streaming), 0);
  const events = [];

  flag.begin();
  const run = runner.run(request, (event) => events.push(event));
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(flag.streaming, true);

  // What the hook's abort does: stop the run, then retire its flag token.
  runner.abort();
  flag.cancel();
  gate.resolve();
  await run;

  assert.equal(flag.streaming, false);
  assert.equal(updates.at(-1), false);
  assert.equal(runner.isRunning(), false);
  assert.equal(events.some((event) => event.type === 'error'), false);
});

test('a consumer throw rejects the run instead of re-entering the consumer', async () => {
  const provider = providerYielding(async function* () {
    yield { type: 'text-delta', text: 'a' };
    yield { type: 'done', finishReason: 'stop' };
  });
  const runner = createChatRunner({ provider, getKey: async () => 'sk-or-test', flushMs: 5 });
  let calls = 0;

  await assert.rejects(
    runner.run(request, () => {
      calls += 1;
      throw new Error('consumer exploded');
    }),
    /consumer exploded/,
  );
  assert.equal(calls, 1);
  assert.equal(runner.isRunning(), false);
});
