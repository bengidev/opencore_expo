import test from 'node:test';
import assert from 'node:assert/strict';

import { readSseData } from './sse.ts';

function streamOf(...chunks) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

async function collect(stream) {
  const out = [];
  for await (const payload of readSseData(stream)) out.push(payload);
  return out;
}

test('reads one payload per event', async () => {
  assert.deepEqual(await collect(streamOf('data: {"a":1}\n\ndata: [DONE]\n\n')), [
    '{"a":1}',
    '[DONE]',
  ]);
});

test('joins a frame split across chunks', async () => {
  assert.deepEqual(await collect(streamOf('data: {"a":', '1}\n\n')), ['{"a":1}']);
});

test('accepts CRLF and skips comments', async () => {
  assert.deepEqual(await collect(streamOf(': OPENROUTER PROCESSING\r\n\r\ndata: x\r\n\r\n')), ['x']);
});

test('joins multi-line data', async () => {
  assert.deepEqual(await collect(streamOf('data: a\ndata: b\n\n')), ['a\nb']);
});

test('flushes a trailing event with no final blank line', async () => {
  assert.deepEqual(await collect(streamOf('data: a\n\ndata: b')), ['a', 'b']);
});

test('skips event and id fields', async () => {
  assert.deepEqual(await collect(streamOf('event: message\nid: 7\ndata: {"a":1}\n\n')), [
    '{"a":1}',
  ]);
});

test('cancels the reader when the consumer stops early', async () => {
  const encoder = new TextEncoder();
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('data: one\n\n'));
    },
    cancel() {
      cancelled = true;
    },
  });

  for await (const payload of readSseData(stream)) {
    assert.equal(payload, 'one');
    break;
  }

  assert.equal(cancelled, true);
  assert.equal(stream.locked, false);
});
