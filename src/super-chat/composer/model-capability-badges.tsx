import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  MODEL_CAPABILITIES,
  type HomeModel,
} from '@/super-chat/composer/chat-models';
import {
  CAPABILITY_BADGE_GAP,
  CAPABILITY_BADGE_SIZE,
} from '@/super-chat/composer/model-sheet-metrics';

type ModelCapabilityBadgesProps = {
  model: HomeModel;
};

/**
 * The model's capabilities as bordered icon badges on the line under its name.
 * They are a label, not a control: the row's accessibility hint names them, so
 * the badges stay out of the accessibility tree.
 */
export function ModelCapabilityBadges({ model }: ModelCapabilityBadgesProps) {
  const theme = useTheme();

  return (
    <View
      style={styles.badgeRow}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {model.capabilities.map((capabilityId) => {
        const capability = MODEL_CAPABILITIES[capabilityId];
        return (
          <View
            key={capabilityId}
            testID={`model-capability-${model.id}-${capabilityId}`}
            style={[styles.badge, { borderColor: theme.borderVisible }]}>
            <AppIcon
              ios={capability.iosSymbol}
              android={capability.fallbackIcon}
              size={13}
              color={theme.textSecondary}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CAPABILITY_BADGE_GAP,
  },
  badge: {
    width: CAPABILITY_BADGE_SIZE,
    height: CAPABILITY_BADGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.compact,
    borderCurve: 'continuous',
  },
});
