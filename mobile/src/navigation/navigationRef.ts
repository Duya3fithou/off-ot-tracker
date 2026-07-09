import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './RootNavigator';

/**
 * Navigation ref so non-React code (e.g. the OneSignal notification-tap handler)
 * can navigate. Attached to the `<NavigationContainer>` in `App.tsx`.
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

let pending: (() => void) | null = null;

/**
 * Navigate from outside React. If the container isn't mounted yet (a tap that
 * cold-starts the app), the request is queued and flushed on container `onReady`.
 */
export function navigateWhenReady<Name extends keyof RootStackParamList>(
  name: Name,
  params?: RootStackParamList[Name],
): void {
  const run = () => {
    try {
      // navigate()'s params tuple is name-dependent; cast to a plain signature for dynamic use.
      (navigationRef.navigate as (screen: string, params?: object) => void)(name, params);
    } catch {
      // Target route may not exist yet (e.g. signed out) — safe to ignore.
    }
  };
  if (navigationRef.isReady()) run();
  else pending = run;
}

/** Flush a navigation that was queued before the container became ready. */
export function flushPendingNavigation(): void {
  const run = pending;
  pending = null;
  if (run && navigationRef.isReady()) run();
}
