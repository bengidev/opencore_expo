import assert from 'node:assert/strict';
import test from 'node:test';
import { ONBOARDING_FOOTNOTE } from './footer-copy.ts';

test('keeps the onboarding footnote useful and privacy-conscious', () => {
  assert.match(ONBOARDING_FOOTNOTE, /can make mistakes/i);
  assert.match(ONBOARDING_FOOTNOTE, /sensitive data/i);
  assert.ok(ONBOARDING_FOOTNOTE.length >= 100);
});
