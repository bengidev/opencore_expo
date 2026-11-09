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

const encoder = new TextEncoder();

function sseBody(frames, { errorAfter = false } = {}) {
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < frames.length) {
        controller.enqueue(encoder.encode(`data: ${frames[index]}\n\n`));
        index += 1;
        return;
      }
      if (errorAfter) controller.error(new Error('stream broke'));
    },
  });
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

test('posts the request with auth, content type, model, and signal', async () => {
  let seen = null;
  const controller = new AbortController();
  const fakeFetch = async (input, init) => {
    seen = { input, init };
    return sseResponse(['[DONE]']);
  };

  const events = await collect(
    streamOpenRouterChat(request, {
      apiKey: 'sk-or-test',
      fetch: fakeFetch,
      signal: controller.signal,
    }),
  );
  assert.equal(events.length, 1);

  assert.equal(seen.input, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(seen.init.method, 'POST');
  const headers = new Headers(seen.init.headers);
  assert.equal(headers.get('authorization'), 'Bearer sk-or-test');
  assert.equal(headers.get('content-type'), 'application/json');
  // OpenRouter uses these to attribute free-tier traffic.
  assert.equal(headers.get('http-referer'), 'https://opencore.app');
  assert.equal(headers.get('x-openrouter-title'), 'OpenCore');
  assert.equal(JSON.parse(seen.init.body).model, 'openrouter/free');
  assert.equal(seen.init.signal, controller.signal);
});

test('lists models with the saved key when one is present', async () => {
  let seen = null;
  const fakeFetch = async (input, init) => {
    seen = { input, init };
    return new Response(
      JSON.stringify({
        data: [
          {
            id: 'z/model:free',
            name: 'Zeta',
            pricing: { prompt: '0', completion: '0' },
            architecture: { input_modalities: ['text'] },
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  };

  const models = await listOpenRouterModels({ apiKey: 'sk-or-test', fetch: fakeFetch });
  assert.equal(seen.input, 'https://openrouter.ai/api/v1/models');
  assert.equal(new Headers(seen.init?.headers).get('authorization'), 'Bearer sk-or-test');
  assert.deepEqual(models.map((model) => model.id), ['z/model:free']);
});

test('missing key fails before touching the network', async () => {
  let calls = 0;
  const fakeFetch = async () => { calls += 1; return sseResponse(['[DONE]']); };
  const events = await collect(streamOpenRouterChat(request, { apiKey: null, fetch: fakeFetch }));
  assert.equal(calls, 0);
  assert.equal(events.length, 1);
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

test('a read error after a terminal event does not emit a second terminal', async () => {
  const fakeFetch = async () => new Response(sseBody(['[DONE]'], { errorAfter: true }), { status: 200 });
  const events = await collect(streamOpenRouterChat(request, { apiKey: 'sk-or-test', fetch: fakeFetch }));
  assert.deepEqual(events.map((event) => event.type), ['done']);
});

test('a read error after a chunk error does not emit a second error', async () => {
  const fakeFetch = async () =>
    new Response(sseBody(['{"error":{"message":"nope","code":500}}'], { errorAfter: true }), { status: 200 });
  const events = await collect(streamOpenRouterChat(request, { apiKey: 'sk-or-test', fetch: fakeFetch }));
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'error');
});

test('an error thrown in by the consumer propagates instead of becoming a network event', async () => {
  let controllerRef = null;
  const fakeFetch = async () =>
    new Response(
      new ReadableStream({
        start(controller) {
          controllerRef = controller;
          controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n'));
        },
      }),
      { status: 200 },
    );

  const gen = streamOpenRouterChat(request, { apiKey: 'sk-or-test', fetch: fakeFetch });
  const first = await gen.next();
  assert.equal(first.value.type, 'text-delta');

  await assert.rejects(gen.throw(new Error('consumer boom')), /consumer boom/);
  assert.notEqual(controllerRef, null);
});

test('a non-ok catalogue response rejects', async () => {
  await assert.rejects(
    listOpenRouterModels({ fetch: async () => new Response('{}', { status: 503 }) }),
    /503/,
  );
});

test('an empty catalogue rejects', async () => {
  await assert.rejects(
    listOpenRouterModels({
      fetch: async () => new Response(JSON.stringify({ data: [] }), { status: 200 }),
    }),
    /no free models/i,
  );
});

test('an unreadable catalogue rejects instead of resolving a stand-in', async () => {
  await assert.rejects(
    listOpenRouterModels({ fetch: async () => { throw new Error('offline'); } }),
    /offline/,
  );
  await assert.rejects(
    listOpenRouterModels({ fetch: async () => new Response('not json', { status: 200 }) }),
  );
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
