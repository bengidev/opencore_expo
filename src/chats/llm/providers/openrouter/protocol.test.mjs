import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildChatRequest,
  createChatChunkParser,
  errorFromChunk,
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

test('body building does not mutate the request', () => {
  const request = {
    modelId: 'openrouter/free',
    messages: [{ role: 'user', content: 'hi' }],
    thinking: 'high',
  };
  const snapshot = JSON.parse(JSON.stringify(request));
  buildChatRequest(request);
  assert.deepEqual(request, snapshot);
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
    parser.push('{"choices":[{"delta":{},"finish_reason":"stop"}]}'),
    [],
  );
  assert.deepEqual(
    parser.push('{"choices":[],"usage":{"prompt_tokens":3,"completion_tokens":2,"total_tokens":5}}'),
    [],
  );
  assert.deepEqual(parser.push('[DONE]'), [
    { type: 'done', finishReason: 'stop', usage: { promptTokens: 3, completionTokens: 2, totalTokens: 5 } },
  ]);
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

test('finish() emits done when a finish reason was seen without DONE', () => {
  const parser = createChatChunkParser();
  assert.deepEqual(parser.push('{"choices":[{"delta":{},"finish_reason":"length"}]}'), []);
  assert.deepEqual(parser.finish(), [{ type: 'done', finishReason: 'length' }]);
  assert.deepEqual(parser.push('{"choices":[{"delta":{"content":"late"}}]}'), []);
});

test('an empty finish reason is treated as absent', () => {
  const parser = createChatChunkParser();
  assert.deepEqual(parser.push('{"choices":[{"delta":{},"finish_reason":""}]}'), []);
  const events = parser.finish();
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'error');
  assert.equal(events[0].code, 'network');
});

test('DONE with no finish reason emits done with a null finish reason', () => {
  const parser = createChatChunkParser();
  assert.deepEqual(parser.push('[DONE]'), [{ type: 'done', finishReason: null }]);
  assert.deepEqual(parser.push('{"choices":[{"delta":{"content":"late"}}]}'), []);
});

test('usage without total_tokens computes the total', () => {
  const parser = createChatChunkParser();
  assert.deepEqual(
    parser.push('{"choices":[{"delta":{},"finish_reason":"stop"}]}'),
    [],
  );
  assert.deepEqual(parser.push('{"choices":[],"usage":{"prompt_tokens":3,"completion_tokens":2}}'), []);
  assert.deepEqual(parser.push('[DONE]'), [
    { type: 'done', finishReason: 'stop', usage: { promptTokens: 3, completionTokens: 2, totalTokens: 5 } },
  ]);
});

test('direct reasoning wins over reasoning details in the same chunk', () => {
  const parser = createChatChunkParser();
  assert.deepEqual(
    parser.push(
      '{"choices":[{"delta":{"reasoning":"direct","reasoning_details":[{"type":"reasoning.text","text":"detail"}]}}]}',
    ),
    [{ type: 'reasoning-delta', text: 'direct' }],
  );
});

test('reasoning summary details contribute their summary text', () => {
  const parser = createChatChunkParser();
  assert.deepEqual(
    parser.push(
      '{"choices":[{"delta":{"reasoning_details":[{"type":"reasoning.summary","summary":"summary"},{"type":"reasoning.text","text":"text"}]}}]}',
    ),
    [{ type: 'reasoning-delta', text: 'summarytext' }],
  );
});

test('malformed JSON is ignored', () => {
  const parser = createChatChunkParser();
  assert.deepEqual(parser.push('{not json'), []);
  assert.deepEqual(parser.push(''), []);
  assert.deepEqual(parser.push('null'), []);
});

test('a top-level error chunk emits one error and terminates', () => {
  const parser = createChatChunkParser();
  assert.deepEqual(parser.push('{"error":{"code":429,"message":"slow down"}}'), [
    {
      type: 'error',
      code: 'rate-limit',
      message: 'OpenRouter is rate-limiting free models. Try again shortly.',
      retryable: true,
    },
  ]);
  assert.deepEqual(parser.push('{"choices":[{"delta":{"content":"late"}}]}'), []);
  assert.deepEqual(parser.push('[DONE]'), []);
  assert.deepEqual(parser.finish(), []);
});

test('a stream error type without a numeric code is mapped', () => {
  const parser = createChatChunkParser();
  assert.deepEqual(parser.push('{"error":{"type":"rate_limit_exceeded","message":"slow down"}}'), [
    {
      type: 'error',
      code: 'rate-limit',
      message: 'OpenRouter is rate-limiting free models. Try again shortly.',
      retryable: true,
    },
  ]);
});

test('a non-object top-level error is ignored', () => {
  const parser = createChatChunkParser();
  assert.deepEqual(parser.push('{"error":"boom","choices":[{"delta":{"content":"ok"}}]}'), [
    { type: 'text-delta', text: 'ok' },
  ]);
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
  // The curated sentence leads; provider text is only kept for `provider`.
  assert.equal(
    errorFromResponse(429, { error: { message: 'slow down' } }).message,
    'OpenRouter is rate-limiting free models. Try again shortly.',
  );
});

test('maps a stream error type and code without inspecting the message', () => {
  assert.equal(errorFromChunk({ type: 'rate_limit_exceeded', message: 'slow' }).code, 'rate-limit');
  assert.equal(errorFromChunk({ code: '402', message: 'no funds' }).code, 'credits');
  assert.equal(errorFromChunk({ type: 'authentication_error' }).code, 'invalid-key');
  assert.equal(
    errorFromChunk({ type: 'server_error', message: 'oops' }).message,
    'OpenRouter could not answer. Try again. (oops)',
  );
  assert.equal(errorFromChunk({ type: 'server_error' }).retryable, true);
  assert.equal(errorFromChunk({ message: 'Failed to generate' }).code, 'provider');
});
