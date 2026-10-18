import { Host } from '@expo/ui';
import { useColorScheme, type StyleProp, type ViewStyle } from 'react-native';

type ExpoUiHostProps = {
  children: React.ReactNode;
  matchContents?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ExpoUiHost({ children, matchContents = true, style }: ExpoUiHostProps) {
  const scheme = useColorScheme();

  return (
    <Host
      colorScheme={scheme === 'dark' ? 'dark' : 'light'}
      matchContents={matchContents}
      style={style}>
      {children}
    </Host>
  );
}
