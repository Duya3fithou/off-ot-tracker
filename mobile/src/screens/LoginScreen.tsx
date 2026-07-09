import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Banner, Button, Card, Text } from 'react-native-paper';
import { useAuth } from '../auth/AuthContext';

export function LoginScreen() {
  const { signIn, signingIn, error } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content style={styles.content}>
            <Text variant="headlineMedium" style={styles.emoji}>
              ⏱️
            </Text>
            <Text variant="headlineSmall" style={styles.title}>
              OT Tracker
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Sign in with your company Google account{'\n'}
              (offspringdigital / artisan-labs)
            </Text>

            {error && (
              <Banner visible actions={[]} style={styles.banner}>
                {error}
              </Banner>
            )}

            <Button
              mode="contained"
              icon="google"
              loading={signingIn}
              disabled={signingIn}
              onPress={signIn}
              style={styles.button}
            >
              {signingIn ? 'Signing in…' : 'Sign in with Google'}
            </Button>
          </Card.Content>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f6f8' },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { maxWidth: 420, width: '100%', alignSelf: 'center' },
  content: { alignItems: 'center', padding: 12 },
  emoji: { fontSize: 44 },
  title: { fontWeight: '700', marginTop: 8 },
  subtitle: { textAlign: 'center', color: '#666', marginTop: 8 },
  banner: { marginTop: 16, width: '100%' },
  button: { marginTop: 24, width: '100%' },
});
