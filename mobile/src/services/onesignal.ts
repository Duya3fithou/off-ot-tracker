import { OneSignal, LogLevel, type NotificationClickEvent } from 'react-native-onesignal';
import { config } from '../config';
import { navigateWhenReady } from '../navigation/navigationRef';

let initialized = false;

/** Route a tapped notification based on the `data` the backend attached. */
function handleNotificationOpen(data: { type?: string; otRequestId?: string }): void {
  switch (data.type) {
    case 'ot_reviewed':
      // Owner's OT was approved/rejected → open their history, focused on it.
      navigateWhenReady('Home', { focusRequestId: data.otRequestId });
      break;
    case 'ot_submitted':
      // Admin was notified of a new submission → open the review list.
      navigateWhenReady('Admin');
      break;
  }
}

/** Initialize OneSignal once. Safe to call multiple times. */
export function initOneSignal(): void {
  if (initialized || !config.oneSignalAppId) return;
  initialized = true;

  if (__DEV__) {
    OneSignal.Debug.setLogLevel(LogLevel.Warn);
  }
  OneSignal.initialize(config.oneSignalAppId);
  // Prompt for push permission (iOS shows the system dialog).
  OneSignal.Notifications.requestPermission(true);

  // Navigate when the user taps a notification (foreground, background, or cold start).
  OneSignal.Notifications.addEventListener('click', (event: NotificationClickEvent) => {
    handleNotificationOpen((event.notification.additionalData ?? {}) as {
      type?: string;
      otRequestId?: string;
    });
  });
}

/** Associate the OneSignal device with the signed-in user (external id). */
export function loginOneSignal(userId: string, email?: string): void {
  if (!config.oneSignalAppId) return;
  OneSignal.login(userId);
  if (email) OneSignal.User.addEmail(email);
}

export function logoutOneSignal(): void {
  if (!config.oneSignalAppId) return;
  OneSignal.logout();
}
