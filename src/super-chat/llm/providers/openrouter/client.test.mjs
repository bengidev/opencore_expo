import test from 'node:test';
import assert from 'node:assert/strict';

import {
  checkOpenRouterKey,
  listOpenRouterModels,
  streamOpenRouterChat,
} from './client.ts';

function sseResponse(frames, status = 200) {
  const body = frames.map((frame) => `data: ${frame}\n\n`).join('');
  return new Response(body, { status, headers: { 'content-type': 'text/event-stream' } });
}

const request = { modelId: 'openrouter/free', messages: [{ role: 'user', content: 'hi' }], thinking: null };

async function collect(gen) {
  const events = [];
  for await (const event of gen) events.push(event);
  return events;
}

test('streams reasoning, text, then done', async () => {
  const fakeFetch = async () =>
    sseResponse([
      '{"choices":[{"delta":{"reasoning":"hmm"}}]}',
      '{"choices":[{"delta":{"content":"Hi"}}]}',
      '{"choices":[{"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":1,"completion_tokens":1,"total_tokens":2}}',
      '[DONE]',
    ]);
  const events = await collect(
    streamOpenRouterChat(request, { apiKey: 'sk-or-test', fetch: fakeFetch }),
  );
  assert.deepEqual(events.map((event) => event.type), ['reasoning-delta', 'text-delta', 'done']);
});

test('missing key fails before touching the network', async () => {
  let calls = 0;
  const fakeFetch = async () => { calls += 1; return sseResponse(['[DONE]']); };
  const events = await collect(streamOpenRouterChat(request, { apiKey: null, fetch: fakeFetch }));
  assert.equal(calls, 0);
  assert.equal(events[0].code, 'missing-key');
  assert.equal(events[0].retryable, false);
});

test('a 429 response becomes a rate-limit event', async () => {
  const fakeFetch = async () =>
    new Response(JSON.stringify({ error: { message: 'slow down' } }), { status: 429 });
  const events = await collect(streamOpenRouterChat(request, { apiKey: 'sk-or-test', fetch: fakeFetch }));
  assert.equal(events.length, 1);
  assert.equal(events[0].code, 'rate-limit');
});

test('a failed catalogue fetch falls back to the callable row', async () => {
  const fakeFetch = async () => { throw new Error('offline'); };
  const models = await listOpenRouterModels({ fetch: fakeFetch });
  assert.deepEqual(models.map((model) => model.id), ['openrouter/free']);
});

test('checkKey reports invalid and valid', async () => {
  const invalid = await checkOpenRouterKey('sk-or-bad', {
    fetch: async () => new Response('{}', { status: 401 }),
  });
  assert.equal(invalid.state, 'invalid');
  const valid = await checkOpenRouterKey('sk-or-ok', {
    fetch: async () => new Response(JSON.stringify({ data: { label: 'work' } }), { status: 200 }),
  });
  assert.deepEqual(valid, { state: 'valid', label: 'work' });
});
