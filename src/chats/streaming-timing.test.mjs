import test from 'node:test';
import assert from 'node:assert/strict';

import { countStreamingWords, tokenizeStreamingText } from './streaming-timing.ts';

test('tokenizes words and preserves the whitespace between them', () => {
  const tokens = tokenizeStreamingText('  hello\nworld ');

  assert.deepEqual(
    tokens.map((token) => token.text),
    ['  ', 'hello', '\n', 'world', ' '],
  );
  assert.deepEqual(
    tokens.map((token) => token.wordIndex),
    [-1, 0, -1, 1, -1],
  );
  assert.equal(
    tokens.map((token) => token.text).join(''),
    '  hello\nworld ',
  );
  assert.equal(countStreamingWords('  hello\nworld '), 2);
});

test('an empty answer has nothing to tokenize', () => {
  assert.deepEqual(tokenizeStreamingText(''), []);
  assert.equal(countStreamingWords(''), 0);
});
