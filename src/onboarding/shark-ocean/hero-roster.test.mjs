import assert from 'node:assert/strict';
import test from 'node:test';

import { createSharkRoster, MAX_HEROES, MIN_HEROES, SHARK_KINDS } from './hero-roster.ts';

test('keeps the roster between three and five heroes', () => {
  assert.equal(createSharkRoster(() => 0).length, MIN_HEROES);
  assert.equal(createSharkRoster(() => 0.999).length, MAX_HEROES);

  for (const value of [0.1, 0.25, 0.5, 0.75, 0.9]) {
    const roster = createSharkRoster(() => value);
    assert.ok(roster.length >= MIN_HEROES && roster.length <= MAX_HEROES);
  }
});

test('assigns stable ids and descending sizes', () => {
  const roster = createSharkRoster(() => 0.5);
  assert.deepEqual(roster.map((hero) => hero.id), roster.map((_, index) => index + 1));

  for (let index = 1; index < roster.length; index += 1) {
    assert.ok(roster[index].size < roster[index - 1].size);
  }
});

test('gives every hero a different kind until the species list runs out', () => {
  const roster = createSharkRoster(() => 0.999);
  const kinds = roster.map((hero) => hero.kind);
  const uniqueCount = Math.min(MAX_HEROES, SHARK_KINDS.length);

  assert.equal(kinds.length, MAX_HEROES);
  assert.ok(kinds.every((kind) => SHARK_KINDS.includes(kind)));
  assert.equal(new Set(kinds).size, uniqueCount);
});
