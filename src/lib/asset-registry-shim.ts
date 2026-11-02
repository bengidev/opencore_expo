/**
 * Gives `expo-asset` back the `AssetRegistry` it expects from `react-native`.
 *
 * `expo-asset@58` reads the registry off the main React Native export
 * (`Asset.js` and `resolveAssetSource.js` both do
 * `import { AssetRegistry } from 'react-native'`), but `react-native@0.88` no
 * longer exposes it there. The result is that every `Asset.fromModule()` call
 * throws `Cannot read property 'getAssetByID' of undefined`, which silently
 * breaks `expo-font` (every custom font falls back to the system font),
 * `@expo/vector-icons` (glyph sets render empty) and anything else that
 * `require()`s an asset.
 *
 * Metro still registers this app's assets through the documented
 * `react-native/asset-registry` entry point (Expo sets
 * `transformer.assetRegistryPath` to it), so bridging that module back onto the
 * main export restores the contract `expo-asset` relies on.
 *
 * Remove this module — and its side-effect import in `src/app/_layout.tsx` —
 * once `expo-asset` imports `react-native/asset-registry` itself.
 */
type AssetRegistry = {
  getAssetByID: (assetId: number) => unknown;
  registerAsset: (asset: unknown) => number;
};

// The public export is missing, so reach for the module object itself instead of
// an ES import: `import * as` hands back an interop copy whose properties cannot
// be added.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const reactNative = require('react-native') as {
  AssetRegistry?: AssetRegistry;
  Platform: { OS: string };
};

// `react-native/asset-registry` is a React Native subpath; react-native-web has
// no equivalent and does not need one.
if (!reactNative.AssetRegistry && reactNative.Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const registry = require('react-native/asset-registry') as AssetRegistry;

  Object.defineProperty(reactNative, 'AssetRegistry', {
    value: registry,
    configurable: true,
    enumerable: true,
    writable: true,
  });
}

export {};
