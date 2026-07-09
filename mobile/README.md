# OT Logger — Mobile (Expo / React Native)

React Native app (Expo, TypeScript) with full parity to the web app, plus:

- **hot-updater** — over-the-air (OTA) JS/asset updates without rebuilding native code.
- **OneSignal** — push notifications.

It uses the **same backend** as `web/` (Google ID token → JWT).

> ⚠️ **Requires a dev/EAS build, not Expo Go.** Google Sign-In, OneSignal, and
> hot-updater are native modules with config plugins, so you must build a custom
> dev client (`expo run:*` or EAS). Expo Go will not work.

## Stack

- Expo SDK 57, React Native 0.86, React 19, TypeScript
- `react-native-paper` (Material Design UI)
- `@react-navigation/native-stack`
- `@react-native-google-signin/google-signin` (auth) + `expo-secure-store` (JWT)
- `@react-native-community/datetimepicker` (date/time pickers)
- `react-native-onesignal` + `onesignal-expo-plugin`
- `@hot-updater/react-native` (config plugin + `HotUpdater.wrap`) + `hot-updater` CLI

## Structure

```
App.tsx                    # HotUpdater.wrap(App) — OTA at root; inits OneSignal
index.ts                   # registerRootComponent
app.config.ts              # config plugins: hot-updater, OneSignal, Google Sign-In
babel.config.js            # babel-preset-expo
src/
├── config.ts              # EXPO_PUBLIC_* runtime config
├── api/client.ts          # axios + bearer token, all endpoints
├── auth/AuthContext.tsx    # Google Sign-In + JWT + OneSignal login
├── services/               # googleAuth, onesignal
├── navigation/RootNavigator.tsx
├── components/             # OtBlockCard, OtRequestCard, PickerField, SelectMenu, ...
└── screens/
    ├── LoginScreen, HomeScreen (Log OT / My history)
    └── admin/ (Requests, Summary w/ filters, Projects CRUD, UserOt)
```

## 1. Install

```bash
cd mobile
npm install
npx expo install --fix      # align native module versions to the SDK
cp .env.example .env         # fill in the values (see below)
```

## 2. Configure Google Sign-In

Create OAuth client ids in the **same** Google Cloud project as the web app
([Credentials](https://console.cloud.google.com/apis/credentials)):

| Client id type | Used as | Env var |
| --- | --- | --- |
| **Web application** | ID token audience (must equal backend `GOOGLE_CLIENT_ID`) | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` |
| **iOS** | iOS native sign-in | `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` + reversed → `GOOGLE_IOS_URL_SCHEME` |
| **Android** | Android native sign-in (needs package name + SHA-1) | configured via `google-services` / SHA-1 in the console |

The reversed iOS client id looks like `com.googleusercontent.apps.1234-abcd` and is
wired into `Info.plist` automatically by the Google Sign-In config plugin
(`GOOGLE_IOS_URL_SCHEME` in `app.config.ts`).

## 3. Configure OneSignal

1. Create an app at [OneSignal](https://onesignal.com) → copy the **App ID** into
   `EXPO_PUBLIC_ONESIGNAL_APP_ID`.
2. iOS also needs an APNs key uploaded to OneSignal; Android needs a Firebase
   (FCM v1) key.
3. `onesignal-expo-plugin` is already registered in `app.config.ts`
   (`ONESIGNAL_MODE=development|production`).

On sign-in the app calls `OneSignal.login(user.id)`, so the backend can target a
person by **external id = user id**.

> To actually push "your OT was approved" notifications, add a call in the backend
> (e.g. in the admin review handler) to the OneSignal REST API targeting that user's
> external id. That backend piece is not included here.

## 4. Configure hot-updater (OTA)

Already wired for you:
- `App.tsx` wraps the root with `HotUpdater.wrap({ baseURL, updateStrategy: 'appVersion', ... })`.
- `app.config.ts` includes the `@hot-updater/react-native` config plugin (generates the
  native OTA code on `expo prebuild`).

Initialise the provider/backend (pick **Expo** as the build system when prompted):

```bash
npx hot-updater init
```

This lets you choose a provider (Supabase, Cloudflare, AWS S3+Lambda, or self-hosted)
and scaffolds `hot-updater.config.ts`. Make sure it uses the Expo build:

```ts
import { expo } from '@hot-updater/expo';
import { defineConfig } from 'hot-updater';

export default defineConfig({
  build: expo(),
  // ...storage + database from `init`
});
```

Set `EXPO_PUBLIC_HOT_UPDATER_SOURCE` to your `.../api/check-update` endpoint (this is
the `baseURL` the app calls).

Ship an OTA update after changing JS/assets (no native rebuild):

```bash
npm run ota:deploy         # hot-updater deploy -p android && -p ios
```

## 5. Build & run (dev client)

```bash
npx expo prebuild                 # generates android/ + ios/ from app.config.ts
npx expo run:android              # or: npx expo run:ios
```

Or with EAS:

```bash
npm i -g eas-cli && eas login
eas build --profile development --platform android   # (and ios)
```

API base URL by target (`EXPO_PUBLIC_API_BASE_URL`):

- Android emulator → `http://10.0.2.2:4000`
- iOS simulator → `http://localhost:4000`
- Physical device → `http://<your-lan-ip>:4000`

## What OTA can and cannot update

- ✅ JS logic, screens, styles, most assets → push instantly with hot-updater.
- ❌ Adding/removing native modules, changing config plugins, app icon, permissions
  → requires a new native build (`expo run` / EAS).
