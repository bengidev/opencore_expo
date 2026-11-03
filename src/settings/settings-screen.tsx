import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AppIcon } from '@/components/app-icon';
import { NativeSurface } from '@/components/native-surface';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SOURCE_URL = 'https://github.com/bengidev/opencore_expo';

export function SettingsScreen() {
  const reducedMotion = useReducedMotion();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const sdkVersion = Constants.expoConfig?.sdkVersion ?? '58';

  const openSource = () => {
    void Haptics.selectionAsync().catch(() => {});
    void WebBrowser.openBrowserAsync(SOURCE_URL).catch(() => {});
  };

  const replayOnboarding = () => {
    void Haptics.selectionAsync().catch(() => {});
    router.replace('/');
  };

  return (
    <TabScreen eyebrow="OpenCore" title="Settings">
      <View style={styles.sections}>
        <SettingsSection label="Appearance">
          <SettingsRow label="Theme" value="System" divider />
          <SettingsRow label="Motion" value={reducedMotion ? 'Reduced' : 'Full'} divider={false} />
        </SettingsSection>

        <SettingsSection label="About">
          <SettingsRow label="Version" value={version} divider />
          <SettingsRow label="Expo SDK" value={sdkVersion} divider />
          <SettingsRow label="Source code" onPress={openSource} divider={false} />
        </SettingsSection>

        <SettingsSection label="Developer">
          <SettingsRow label="Replay onboarding" onPress={replayOnboarding} divider={false} />
        </SettingsSection>
      </View>

      <View style={styles.footer}>
        <ThemedText variant="caption" themeColor="textDisabled" face="mono">
          OPENCORE · MADE FOR MOBILE
        </ThemedText>
      </View>
    </TabScreen>
  );
}

function SettingsSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText variant="label" themeColor="textSecondary">
        {label}
      </ThemedText>
      <NativeSurface tone="glass" radius={Radius.card}>
        {children}
      </NativeSurface>
    </View>
  );
}

function SettingsRow({
  label,
  value,
  onPress,
  divider = true,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  divider?: boolean;
}) {
  const theme = useTheme();

  const content = (
    <>
      <ThemedText variant="body" themeColor="text">
        {label}
      </ThemedText>
      <View style={styles.rowTail}>
        {value ? (
          <ThemedText variant="bodySm" themeColor="textSecondary" face="mono">
            {value}
          </ThemedText>
        ) : null}
        {onPress ? (
          <AppIcon ios="chevron.right" android="chevron-right" size={11} color={theme.textDisabled} />
        ) : null}
      </View>
    </>
  );

  return (
    <View>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.55 }]}>
          {content}
        </Pressable>
      ) : (
        <View style={styles.row}>{content}</View>
      )}
      {divider ? (
        <View style={[styles.divider, { backgroundColor: theme.border, marginLeft: Spacing.three }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  row: {
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  rowTail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.five,
  },
});
