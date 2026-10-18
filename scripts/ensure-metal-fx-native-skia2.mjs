#!/usr/bin/env node
/**
 * react-native-skia 2.x: SkPath from Path.Make() is immutable.
 * metal-fx-native 0.1.0 must use PathBuilder for drawing ops.
 *
 * Runs on every `npm install` via package.json postinstall. Re-run after upgrading
 * metal-fx-native or @shopify/react-native-skia. Prefer repacking vendor/*.tgz when
 * upstream ships a fix so this patch can be removed.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const pkg = join(root, 'node_modules/metal-fx-native');

function patchFile(rel, replacements) {
  const file = join(pkg, rel);
  if (!existsSync(file)) return;
  let src = readFileSync(file, 'utf8');
  let changed = false;
  for (const [from, to] of replacements) {
    if (src.includes(from)) {
      src = src.replaceAll(from, to);
      changed = true;
    }
  }
  if (changed) {
    writeFileSync(file, src);
    console.log(`[postinstall] patched metal-fx-native/${rel} for Skia 2 PathBuilder`);
  }
}

if (!existsSync(pkg)) {
  process.exit(0);
}

patchFile('lib/glow.js', [
  [
    `const path = Skia.Path.Make();
        path.moveTo(pad, pad);
        path.lineTo(pad + 2 * halfLen, pad);
        canvas.drawPath(path, paint);`,
    `const path = Skia.PathBuilder.Make();
        path.moveTo(pad, pad);
        path.lineTo(pad + 2 * halfLen, pad);
        canvas.drawPath(path.build(), paint);`,
  ],
]);

patchFile('lib/MetalFx.js', [
  [
    `const shifted = useDerivedValue(() => {
        const p = band.value.copy();
        p.offset(0, offsetY);
        return p;
    });`,
    `const shifted = useDerivedValue(() => {
        'worklet';
        const builder = Skia.PathBuilder.MakeFromPath(band.value);
        builder.offset(0, offsetY);
        return builder.build();
    });`,
  ],
]);

patchFile('lib/geometry.js', [
  ['const p = Skia.Path.Make();', 'const p = Skia.PathBuilder.Make();'],
  [
    `p.setFillType(FillType.EvenOdd);
    return p;`,
    `p.setFillType(FillType.EvenOdd);
    return p.build();`,
  ],
  [
    `addOutline(p, xy);
    return p;`,
    `addOutline(p, xy);
    return p.build();`,
  ],
]);
