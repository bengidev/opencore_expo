#!/usr/bin/env node
/**
 * border-beam-native 0.1.0 passes dependency arrays to Reanimated hooks.
 * Reanimated ignores them on native and warns once per call site in dev,
 * which raises a LogBox toast over the composer controls.
 *
 * Runs on every `npm install` via package.json postinstall. Re-run after
 * upgrading border-beam-native. Prefer repacking vendor/border-beam-native-0.1.0.tgz
 * when upstream ships a fix so this patch can be removed.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const pkg = join(root, 'node_modules/border-beam-native');
const files = [
  'lib/RotateBeam.js',
  'lib/LineBeam.js',
  'lib/PulseBeam.js',
  'src/RotateBeam.tsx',
  'src/LineBeam.tsx',
  'src/PulseBeam.tsx',
];

function stripSecondArgument(source, hook) {
  const edits = [];
  let index = 0;

  while ((index = source.indexOf(`${hook}(`, index)) !== -1) {
    const before = source[index - 1];
    if (before && /[\w$]/.test(before)) {
      index += hook.length + 1;
      continue;
    }

    const open = index + hook.length;
    let paren = 0;
    let brace = 0;
    let bracket = 0;
    let firstComma = -1;
    let close = -1;
    let quote = null;
    let lineComment = false;
    let blockComment = false;

    for (let i = open; i < source.length; i++) {
      const ch = source[i];
      const next = source[i + 1];

      if (lineComment) {
        if (ch === '\n') lineComment = false;
        continue;
      }
      if (blockComment) {
        if (ch === '*' && next === '/') {
          blockComment = false;
          i++;
        }
        continue;
      }
      if (quote) {
        if (ch === '\\') {
          i++;
          continue;
        }
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === '/' && next === '/') {
        lineComment = true;
        i++;
        continue;
      }
      if (ch === '/' && next === '*') {
        blockComment = true;
        i++;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === '`') {
        quote = ch;
        continue;
      }
      if (ch === '(') paren++;
      else if (ch === ')') {
        paren--;
        if (paren === 0) {
          close = i;
          break;
        }
      } else if (ch === '{') brace++;
      else if (ch === '}') brace--;
      else if (ch === '[') bracket++;
      else if (ch === ']') bracket--;
      else if (ch === ',' && paren === 1 && brace === 0 && bracket === 0 && firstComma === -1) {
        firstComma = i;
      }
    }

    if (close !== -1 && firstComma !== -1) edits.push([firstComma, close]);
    index = close !== -1 ? close + 1 : open + 1;
  }

  for (const [start, end] of edits.reverse()) {
    source = source.slice(0, start) + source.slice(end);
  }
  return { source, removed: edits.length };
}

if (!existsSync(pkg)) {
  process.exit(0);
}

for (const rel of files) {
  const file = join(pkg, rel);
  if (!existsSync(file)) continue;
  const source = readFileSync(file, 'utf8');
  const { source: patched, removed } = stripSecondArgument(source, 'useDerivedValue');
  if (removed === 0) continue;
  writeFileSync(file, patched);
  console.log(`[postinstall] removed ${removed} web-only Reanimated dependency arrays from border-beam-native/${rel}`);
}
