/**
 * Runtime configuration, sourced from EXPO_PUBLIC_* env vars (see .env.example).
 * These are inlined at build time by Expo.
 */
export const config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:4000',
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  oneSignalAppId: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID ?? '',
  hotUpdaterSource: process.env.EXPO_PUBLIC_HOT_UPDATER_SOURCE ?? '',
};

export const apiRoot = `${config.apiBaseUrl}/api`;
