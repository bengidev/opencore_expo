import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { useSyncExternalStore, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { SharkOceanStageProps } from './stage-types';

export { SharkGlass } from './glass-zone';

function subscribe() {
  return () => {};
}

function StaticStage({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.content} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

export function SharkOceanStage(props: SharkOceanStageProps) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!hydrated || typeof window === 'undefined') {
    return <StaticStage>{props.children}</StaticStage>;
  }

  return (
    <WithSkiaWeb
      getComponent={() => import('./shark-ocean-stage-live')}
      componentProps={props}
      fallback={<StaticStage>{props.children}</StaticStage>}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
});
