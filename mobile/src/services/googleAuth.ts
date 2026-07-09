import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { config } from '../config';

let configured = false;

export function configureGoogleSignIn(): void {
  if (configured) return;
  configured = true;
  // TEMP diagnostic: confirm the webClientId actually baked into this build.
  // Must be the WEB client id (…vr8t…), NOT the Android client id.
  if (__DEV__) console.log('[google-signin] webClientId =', config.googleWebClientId);
  GoogleSignin.configure({
    // webClientId becomes the ID token audience -> must match backend GOOGLE_CLIENT_ID.
    webClientId: config.googleWebClientId,
    iosClientId: config.googleIosClientId || undefined,
    scopes: ['email', 'profile'],
  });
}

export class GoogleCancelledError extends Error {}

/** Runs the Google sign-in flow and returns the ID token. */
export async function signInGetIdToken(): Promise<string> {
  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  try {
    // Sign out first so the account chooser always appears.
    await GoogleSignin.signOut();
    const result = await GoogleSignin.signIn();
    // v13+ returns { type: 'success' | 'cancelled', data }; older returns the user.
    if ((result as { type?: string }).type === 'cancelled') {
      throw new GoogleCancelledError('cancelled');
    }
    const idToken =
      (result as { data?: { idToken?: string } }).data?.idToken ??
      (result as { idToken?: string }).idToken;
    if (!idToken) throw new Error('No ID token returned from Google');
    return idToken;
  } catch (err) {
    if (err instanceof GoogleCancelledError) throw err;
    // Older versions throw with a cancellation status code instead.
    const code = (err as { code?: string }).code;
    if (code === statusCodes.SIGN_IN_CANCELLED) {
      throw new GoogleCancelledError('cancelled');
    }
    // TEMP diagnostic: surface the native status code. `DEVELOPER_ERROR` (10) =
    // package/SHA-1/client-id/project mismatch in Google Cloud.
    const message = (err as { message?: string }).message ?? 'Unknown sign-in error';
    console.warn('[google-signin] failed', { code, message });
    throw new Error(`${message}${code ? ` [${code}]` : ''}`);
  }
}

export async function googleSignOut(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    /* ignore */
  }
}
