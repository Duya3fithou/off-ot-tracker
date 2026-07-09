import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Dynamic Expo config.
 *
 * Runtime values used by the JS code are read via `process.env.EXPO_PUBLIC_*`
 * (see src/config.ts). The values below are only needed at BUILD time by the
 * native config plugins (OneSignal + Google Sign-In).
 *
 * Set these in your shell / EAS secrets before building:
 *   GOOGLE_IOS_URL_SCHEME   e.g. com.googleusercontent.apps.1234-abcd
 *   ONESIGNAL_MODE          development | production   (default: development)
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'OT Tracker',
  slug: 'ot-logger',
  scheme: 'otlogger',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
  ios: {
    bundleIdentifier: 'com.offspringdigital.otlogger',
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.offspringdigital.otlogger',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundImage: './assets/adaptive-icon-bg.png',
      monochromeImage: './assets/adaptive-icon.png',
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-secure-store',
    // Native splash screen (green background + centered OT Tracker logo).
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 300,
        resizeMode: 'contain',
        backgroundColor: '#256B2A',
      },
    ],
    // hot-updater config plugin — wires the native OTA code during prebuild.
    ['@hot-updater/react-native', { channel: process.env.HOT_UPDATER_CHANNEL ?? 'production' }],
    [
      'onesignal-expo-plugin',
      { mode: process.env.ONESIGNAL_MODE ?? 'development' },
    ],
    [
      '@react-native-google-signin/google-signin',
      // Reversed iOS client id. Required for Google Sign-In on iOS.
      { iosUrlScheme: process.env.GOOGLE_IOS_URL_SCHEME ?? 'com.googleusercontent.apps.PLACEHOLDER' },
    ],
  ],
  extra: {
    eas: {
      // projectId: 'set-after-eas-init',
    },
  },
});
