import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

function subscribe() {
  return () => {};
}

/**
 * Static web rendering has no color scheme until the client hydrates.
 * The server snapshot stays light so the first paint matches the document.
 */
export function useColorScheme() {
  const colorScheme = useRNColorScheme();
  const hasHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
