import assert from 'node:assert/strict';
import { test } from 'node:test';

import { normalizeMarkdownHtml } from './markdown-normalize.ts';

test('turns <br> into a paragraph break', () => {
  assert.equal(normalizeMarkdownHtml('a<br>b'), 'a\n\nb');
  assert.equal(normalizeMarkdownHtml('a<BR/>b'), 'a\n\nb');
  assert.equal(normalizeMarkdownHtml('a<br />b'), 'a\n\nb');
});

test('converts break-separated bullets into a real list', () => {
  assert.equal(
    normalizeMarkdownHtml('• **One**<br>• **Two**<br>• **Three**'),
    '- **One**\n- **Two**\n- **Three**',
  );
});

test('maps bold and italic tags onto markdown markers', () => {
  assert.equal(normalizeMarkdownHtml('<b>bold</b> and <i>it</i>'), '**bold** and _it_');
  assert.equal(normalizeMarkdownHtml('<strong>x</strong>'), '**x**');
});

test('strips block wrappers and unknown tags', () => {
  assert.equal(normalizeMarkdownHtml('<p>hello</p>'), 'hello');
  assert.equal(normalizeMarkdownHtml('<span class="x">hi</span>'), 'hi');
  assert.equal(normalizeMarkdownHtml('a <div>b</div> c'), 'a b c');
});

test('decodes the entities a model writes into prose', () => {
  assert.equal(normalizeMarkdownHtml('a&nbsp;&amp;&nbsp;b'), 'a & b');
  assert.equal(normalizeMarkdownHtml('&lt;tag&gt; &quot;q&quot; &#39;s&#39;'), '<tag> "q" \'s\'');
});

test('leaves fenced and inline code untouched', () => {
  const fence = '```html\n<br>\n<b>x</b>\n```';
  assert.equal(normalizeMarkdownHtml(fence), fence);
  assert.equal(normalizeMarkdownHtml('use `<br>` here'), 'use `<br>` here');
  assert.equal(
    normalizeMarkdownHtml('a<br>```\n<br>\n```<br>b'),
    'a\n\n```\n<br>\n```\n\nb',
  );
});

test('collapses incidental blank-line runs but keeps paragraphs', () => {
  assert.equal(normalizeMarkdownHtml('a<br><br><br>b'), 'a\n\nb');
  assert.equal(normalizeMarkdownHtml('one\n\ntwo'), 'one\n\ntwo');
});

test('keeps partial streaming tags out of the way', () => {
  assert.equal(normalizeMarkdownHtml('a<'), 'a<');
  assert.equal(normalizeMarkdownHtml('a<br'), 'a');
  assert.equal(normalizeMarkdownHtml('a<stron'), 'a');
});
