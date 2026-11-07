import type { ConfigContext, ExpoConfig } from 'expo/config';

import base from './app.json';

const baseExpo = base.expo as ExpoConfig & { extra?: Record<string, unknown> };

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...baseExpo,
  ...config,
  extra: {
    ...baseExpo.extra,
    ...config.extra,
    openRouterApiKey: process.env.OPENROUTER_API_KEY ?? '',
  },
});
