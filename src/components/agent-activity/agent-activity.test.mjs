import test from 'node:test';
import assert from 'node:assert/strict';

import { activeLabelFor, contentTypeOf, formatDuration, summaryFor } from './copy.ts';

/** Minimal item shapes: the helpers only read `type` and, for traces, `kind`. */
function items(...types) {
  return types.map((type, index) => ({ id: `${type}-${index}`, type }));
}

function traces(...kinds) {
  return kinds.map((kind, index) => ({
    id: `trace-${index}`,
    type: 'trace',
    kind,
    label: kind,
  }));
}

test('formats seconds under a minute', () => {
  assert.equal(formatDuration(0), '0s');
  assert.equal(formatDuration(4), '4s');
  assert.equal(formatDuration(59), '59s');
});

test('formats whole minutes and their remainder', () => {
  assert.equal(formatDuration(60), '1m');
  assert.equal(formatDuration(65), '1m 5s');
  assert.equal(formatDuration(125), '2m 5s');
  assert.equal(formatDuration(3600), '60m');
});

test('normalises fractional and negative seconds', () => {
  assert.equal(formatDuration(2.6), '3s');
  assert.equal(formatDuration(-4), '0s');
});

test('keeps a run of one item type', () => {
  assert.equal(contentTypeOf(items('search', 'search')), 'search');
  assert.equal(contentTypeOf(items('step')), 'step');
});

test('reports mixed when the run spans item types', () => {
  assert.equal(contentTypeOf(items('search', 'tool')), 'mixed');
  assert.equal(contentTypeOf(items()), 'mixed');
});

test('an explicit contentType wins over the items', () => {
  assert.equal(contentTypeOf(items('search', 'tool'), 'text'), 'text');
});

test('labels the working header by content type', () => {
  assert.equal(activeLabelFor('search'), 'Searching the web…');
  assert.equal(activeLabelFor('tool'), 'Running tools…');
  assert.equal(activeLabelFor('trace'), 'Working through the run…');
  assert.equal(activeLabelFor('mixed'), 'Working through it…');
  assert.equal(activeLabelFor('step'), 'Thinking…');
  assert.equal(activeLabelFor('text'), 'Thinking…');
});

test('summarises a thinking run with its duration', () => {
  assert.equal(summaryFor(items('text'), 'text', 4), 'Thought for 4s');
  assert.equal(summaryFor(items('step', 'step'), 'step', 65), 'Thought for 1m 5s');
});

test('summarises searches, tools, and mixed runs by count', () => {
  assert.equal(summaryFor(items('search'), 'search', 9), 'Searched the web');
  assert.equal(summaryFor(items('tool'), 'tool', 9), 'Ran 1 tool');
  assert.equal(summaryFor(items('tool', 'tool', 'tool'), 'tool', 9), 'Ran 3 tools');
  assert.equal(summaryFor(items('search', 'tool', 'text'), 'mixed', 9), 'Completed 3 steps');
});

test('summarises a one-step mixed run in the singular', () => {
  assert.equal(summaryFor(items('text'), 'mixed', 9), 'Completed 1 step');
});

test('counts tool calls and messages in a trace run', () => {
  const run = traces('read', 'run', 'write', 'message', 'message', 'message', 'message', 'message');
  assert.equal(summaryFor(run, 'trace', 9), '3 tool calls, 5 messages');
});

test('a thinking trace is neither a call nor a message', () => {
  assert.equal(summaryFor(traces('thinking', 'message'), 'trace', 9), '0 tool calls, 1 message');
});
