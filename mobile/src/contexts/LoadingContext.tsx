import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Portal } from 'react-native-paper';

interface LoadingApi {
  /** True while any tracked async work is in flight. */
  isLoading: boolean;
  /** Run a promise under the global overlay (counter-based, safe to nest). */
  withLoading: <T>(work: Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingApi | null>(null);

/** Global loading overlay + `useLoading()` API. Wrap the app once in `App.tsx`. */
export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);

  const withLoading = useCallback(<T,>(work: Promise<T>): Promise<T> => {
    setCount((c) => c + 1);
    return work.finally(() => setCount((c) => Math.max(0, c - 1)));
  }, []);

  const value = useMemo<LoadingApi>(
    () => ({ isLoading: count > 0, withLoading }),
    [count, withLoading],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {count > 0 && (
        <Portal>
          <View style={styles.overlay} pointerEvents="auto">
            <ActivityIndicator size="large" color="#fff" />
          </View>
        </Portal>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading(): LoadingApi {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within <LoadingProvider>');
  return ctx;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
});
