import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { HotUpdater } from '@hot-updater/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from './src/auth/AuthContext';
import { LoadingProvider } from './src/contexts/LoadingContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef, flushPendingNavigation } from './src/navigation/navigationRef';
import { initOneSignal } from './src/services/onesignal';
import { config } from './src/config';
import { theme } from './src/theme';

function App() {
  useEffect(() => {
    initOneSignal();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <LoadingProvider>
          <AuthProvider>
            <NavigationContainer ref={navigationRef} onReady={flushPendingNavigation}>
              <StatusBar style="light" />
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
        </LoadingProvider>
      </PaperProvider>
      {/* Toast host — rendered last so toasts overlay everything. */}
      <Toast />
    </SafeAreaProvider>
  );
}

/**
 * Shown while a mandatory OTA bundle is being downloaded on cold start.
 * (hot-updater applies non-mandatory updates silently in the background.)
 */
function UpdateFallback({ progress }: { progress: number; status: string }) {
  return (
    <View style={styles.fallback}>
      <ActivityIndicator size="large" color="#2E7D32" />
      <Text style={styles.fallbackText}>
        Updating… {Math.round(progress * 100)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    gap: 12,
  },
  fallbackText: { color: '#444', fontSize: 16 },
});

export default HotUpdater.wrap({
  baseURL: config.hotUpdaterSource,
  updateStrategy: 'appVersion',
  fallbackComponent: UpdateFallback,
})(App);
