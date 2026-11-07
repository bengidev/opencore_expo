import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildChatRequest,
  createChatChunkParser,
  errorFromResponse,
} from './protocol.ts';

test('body omits reasoning when no level is chosen', () => {
  const base = { modelId: 'openrouter/free', messages: [{ role: 'user', content: 'hi' }] };
  assert.deepEqual(buildChatRequest({ ...base, thinking: null }), {
    model: 'openrouter/free',
    messages: [{ role: 'user', content: 'hi' }],
    stream: true,
  });
  assert.deepEqual(buildChatRequest({ ...base, thinking: 'high' }).reasoning, { effort: 'high' });
});

test('parses text, reasoning details, usage, and done', () => {
  const parser = createChatChunkParser();
  assert.deepEqual(parser.push('{"choices":[{"delta":{"reasoning":"think"}}]}'), [
    { type: 'reasoning-delta', text: 'think' },
  ]);
  assert.deepEqual(
    parser.push('{"choices":[{"delta":{"reasoning_details":[{"type":"reasoning.text","text":"x"}]}}]}'),
    [{ type: 'reasoning-delta', text: 'x' }],
  );
  assert.deepEqual(parser.push('{"choices":[{"delta":{"content":"Hi"}}]}'), [
    { type: 'text-delta', text: 'Hi' },
  ]);
  assert.deepEqual(
    parser.push('{"choices":[{"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":3,"completion_tokens":2,"total_tokens":5}}'),
    [{ type: 'done', finishReason: 'stop', usage: { promptTokens: 3, completionTokens: 2, totalTokens: 5 } }],
  );
  assert.deepEqual(parser.push('[DONE]'), []);
  assert.deepEqual(parser.finish(), []);
});

test('an EOF without DONE is a retryable network error', () => {
  const parser = createChatChunkParser();
  parser.push('{"choices":[{"delta":{"content":"Hi"}}]}');
  const events = parser.finish();
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'error');
  assert.equal(events[0].code, 'network');
  assert.equal(events[0].retryable, true);
  assert.equal(events[0].message.length > 0, true);
});

test('maps HTTP status to a code and retryability', () => {
  assert.deepEqual(errorFromResponse(401, {}).code, 'invalid-key');
  assert.equal(errorFromResponse(401, {}).retryable, false);
  assert.equal(errorFromResponse(402, {}).code, 'credits');
  assert.equal(errorFromResponse(429, {}).code, 'rate-limit');
  assert.equal(errorFromResponse(429, {}).retryable, true);
  assert.equal(errorFromResponse(503, {}).code, 'provider');
  assert.equal(errorFromResponse(503, {}).retryable, true);
  assert.equal(errorFromResponse(400, {}).code, 'unknown');
  assert.match(errorFromResponse(429, { error: { message: 'slow down' } }).message, /slow down/);
});
