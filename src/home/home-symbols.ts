import { Icon } from '@expo/ui';

export const HOME_SYMBOLS = {
  back: Icon.select({
    ios: 'chevron.left',
    android: require('@expo/material-symbols/icons/chevron_left.xml'),
  }),
  menu: Icon.select({
    ios: 'line.3.horizontal',
    android: require('@expo/material-symbols/icons/menu.xml'),
  }),
  add: Icon.select({
    ios: 'plus',
    android: require('@expo/material-symbols/icons/add.xml'),
  }),
  mic: Icon.select({
    ios: 'mic',
    android: require('@expo/material-symbols/icons/mic.xml'),
  }),
  send: Icon.select({
    ios: 'waveform',
    android: require('@expo/material-symbols/icons/graphic_eq.xml'),
  }),
} as const;
