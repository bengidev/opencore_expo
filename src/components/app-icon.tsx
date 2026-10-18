import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';

type AppIconProps = {
  ios: SymbolViewProps['name'];
  android: keyof typeof MaterialIcons.glyphMap;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
};

export function AppIcon({ ios, android, size = 22, color, style }: AppIconProps) {
  if (Platform.OS === 'ios') {
    return <SymbolView name={ios} tintColor={color} size={size} style={style} />;
  }

  return <MaterialIcons name={android} size={size} color={color} />;
}
