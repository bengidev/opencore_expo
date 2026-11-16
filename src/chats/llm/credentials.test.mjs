import test from 'node:test';
import assert from 'node:assert/strict';

import { isValidKeyFormat, maskKey, normalizeKey, resolveKey } from './credentials.ts';

function storageWith(value) {
  return {
    read: async () => value,
    write: async () => {},
    remove: async () => {},
  };
}

test('normalizes pasted keys', () => {
  assert.equal(normalizeKey('  sk-or-v1-abc\n'), 'sk-or-v1-abc');
  assert.equal(normalizeKey('"sk-or-v1-abc"'), 'sk-or-v1-abc');
  assert.equal(normalizeKey('   '), null);
  assert.equal(normalizeKey(undefined), null);
  assert.equal(normalizeKey("'sk-or-v1-abc'"), "'sk-or-v1-abc'");
  assert.equal(normalizeKey('""'), null);
});

test('rejects the unversioned OpenRouter prefix', () => {
  assert.equal(isValidKeyFormat('sk-or-v1-abc'), true);
  assert.equal(isValidKeyFormat('sk-or-abc'), false);
});

test('override wins, then bundled, then missing', async () => {
  assert.deepEqual(await resolveKey(storageWith(' sk-or-override '), 'sk-or-bundled'), {
    key: 'sk-or-override',
    source: 'override',
  });
  assert.deepEqual(await resolveKey(storageWith(null), 'sk-or-bundled'), {
    key: 'sk-or-bundled',
    source: 'default',
  });
  assert.deepEqual(await resolveKey(storageWith(''), ''), { key: null, source: 'missing' });
  assert.deepEqual(await resolveKey(storageWith('   '), 'sk-or-bundled'), {
    key: 'sk-or-bundled',
    source: 'default',
  });
  assert.deepEqual(await resolveKey(storageWith('""'), 'sk-or-bundled'), {
    key: 'sk-or-bundled',
    source: 'default',
  });
});

test('a failing storage read degrades to the bundled key', async () => {
  const storage = { read: async () => { throw new Error('keychain'); }, write: async () => {}, remove: async () => {} };
  assert.deepEqual(await resolveKey(storage, 'sk-or-bundled'), {
    key: 'sk-or-bundled',
    source: 'default',
  });
});

test('masks all but the last four characters', () => {
  assert.equal(maskKey('sk-or-v1-abcdef1234'), '•••• 1234');
  assert.equal(maskKey(null), 'Not set');
  assert.equal(maskKey(''), 'Not set');
  assert.equal(maskKey('ab'), '•••• ab');
});
