import test from 'node:test';
import assert from 'node:assert/strict';
import { countMarkdownWords, isAllowedLink, parseMarkdown } from './chat-markdown.ts';

test('parses headings, paragraphs, and inline runs', () => {
  const blocks = parseMarkdown('## Arah\n\nMulai dari **hal** kecil dan *pelan-pelan*.');
  assert.equal(blocks[0].type, 'heading');
  assert.equal(blocks[0].level, 2);
  assert.deepEqual(blocks[0].inlines, [{ text: 'Arah' }]);

  assert.equal(blocks[1].type, 'paragraph');
  assert.deepEqual(blocks[1].inlines, [
    { text: 'Mulai dari ' },
    { text: 'hal', bold: true },
    { text: ' kecil dan ' },
    { text: 'pelan-pelan', italic: true },
    { text: '.' },
  ]);
});

test('parses ordered and unordered lists with stable markers', () => {
  const ordered = parseMarkdown('1. satu\n2. dua');
  assert.deepEqual(ordered, [
    {
      type: 'list',
      ordered: true,
      items: [
        { marker: '1.', inlines: [{ text: 'satu' }] },
        { marker: '2.', inlines: [{ text: 'dua' }] },
      ],
    },
  ]);

  const unordered = parseMarkdown('- satu\n- dua');
  assert.equal(unordered[0].type, 'list');
  assert.equal(unordered[0].ordered, false);
  assert.deepEqual(
    unordered[0].items.map(({ marker }) => marker),
    ['•', '•'],
  );
});

test('parses quotes, fences, and rules', () => {
  assert.deepEqual(parseMarkdown('> kutipan'), [
    { type: 'quote', inlines: [{ text: 'kutipan' }] },
  ]);

  assert.deepEqual(parseMarkdown('```ts\nconst x = 1;\n```'), [
    { type: 'code', language: 'ts', code: 'const x = 1;' },
  ]);

  assert.deepEqual(parseMarkdown('---'), [{ type: 'rule' }]);
});

test('parses links, code spans, and strike runs', () => {
  const blocks = parseMarkdown(
    '**tebal** dan ~~coret~~ dan `kode` dan [tautan](https://example.com).',
  );
  const inlines = blocks[0].inlines;

  assert.ok(inlines.some(({ bold }) => bold));
  assert.ok(inlines.some(({ strike }) => strike));
  assert.ok(inlines.some(({ code }) => code));
  assert.ok(
    inlines.some(
      ({ href, text }) => href === 'https://example.com' && text === 'tautan',
    ),
  );
});

test('finishes an unterminated tail only while streaming', () => {
  assert.deepEqual(parseMarkdown('**bo', { streaming: true }), [
    { type: 'paragraph', inlines: [{ text: 'bo', bold: true }] },
  ]);
  assert.deepEqual(parseMarkdown('**bo'), [
    { type: 'paragraph', inlines: [{ text: '**bo' }] },
  ]);

  const openFence = parseMarkdown('```ts\nconst x = 1;', { streaming: true });
  assert.deepEqual(openFence, [
    { type: 'code', language: 'ts', code: 'const x = 1;' },
  ]);

  const halfLink = parseMarkdown('[label](https://example.com', { streaming: true });
  assert.deepEqual(halfLink, [
    { type: 'paragraph', inlines: [{ text: 'label' }] },
  ]);
});

test('counts words without counting Markdown punctuation', () => {
  const blocks = parseMarkdown(
    '## Arah\n\n**dua** kata `tiga`\n\n1. satu\n2. dua\n\n```ts\nconst x = 1;\n```',
  );
  assert.equal(countMarkdownWords(blocks), 10);
});

test('only safe link schemes are pressable', () => {
  assert.equal(isAllowedLink('https://example.com'), true);
  assert.equal(isAllowedLink('http://example.com'), true);
  assert.equal(isAllowedLink('mailto:hi@example.com'), true);
  assert.equal(isAllowedLink('tel:+62000'), true);
  assert.equal(isAllowedLink('javascript:alert(1)'), false);
  assert.equal(isAllowedLink('file:///etc/passwd'), false);
});
