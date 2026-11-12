import test from 'node:test';
import assert from 'node:assert/strict';

import {
  THINKING_ORB_COPY,
  THINKING_ORB_STYLES,
  isThinkingOrbPreference,
  isThinkingOrbStyle,
  resolveThinkingOrbStyle,
  thinkingOrbPreferenceLabel,
} from './orb-style.ts';

test('lists the six orb styles in display order', () => {
  assert.deepEqual(THINKING_ORB_STYLES, [
    'working',
    'searching',
    'solving',
    'listening',
    'composing',
    'shaping',
  ]);
});

test('every style has a label and a distinct detail', () => {
  const details = THINKING_ORB_STYLES.map((style) => {
    const copy = THINKING_ORB_COPY[style];
    assert.ok(copy.label.length > 0, `${style} has no label`);
    assert.ok(copy.detail.length > 0, `${style} has no detail`);
    return copy.detail;
  });

  assert.equal(new Set(details).size, details.length);
});

test('accepts the six styles and nothing else', () => {
  for (const style of THINKING_ORB_STYLES) {
    assert.equal(isThinkingOrbStyle(style), true);
  }

  assert.equal(isThinkingOrbStyle('auto'), false);
  assert.equal(isThinkingOrbStyle('Working'), false);
  assert.equal(isThinkingOrbStyle(''), false);
  assert.equal(isThinkingOrbStyle(null), false);
  assert.equal(isThinkingOrbStyle(undefined), false);
});

test('accepts auto as a preference but never as a style', () => {
  assert.equal(isThinkingOrbPreference('auto'), true);
  assert.equal(isThinkingOrbPreference('searching'), true);
  assert.equal(isThinkingOrbPreference('browsing'), false);
  assert.equal(isThinkingOrbPreference(42), false);
});

test('auto follows what the run is doing', () => {
  assert.equal(resolveThinkingOrbStyle('auto', 'search'), 'searching');
  assert.equal(resolveThinkingOrbStyle('auto', 'tool'), 'working');
  assert.equal(resolveThinkingOrbStyle('auto', 'text'), 'composing');
  assert.equal(resolveThinkingOrbStyle('auto', 'step'), 'solving');
  assert.equal(resolveThinkingOrbStyle('auto', 'trace'), 'solving');
  assert.equal(resolveThinkingOrbStyle('auto', 'mixed'), 'working');
});

test('a pinned style ignores the activity', () => {
  for (const style of THINKING_ORB_STYLES) {
    assert.equal(resolveThinkingOrbStyle(style, 'search'), style);
    assert.equal(resolveThinkingOrbStyle(style, 'text'), style);
  }
});

test('labels the Settings row by choice', () => {
  assert.equal(thinkingOrbPreferenceLabel('auto'), 'Auto');
  assert.equal(thinkingOrbPreferenceLabel('working'), 'Working');
  assert.equal(thinkingOrbPreferenceLabel('shaping'), 'Shaping');
});
