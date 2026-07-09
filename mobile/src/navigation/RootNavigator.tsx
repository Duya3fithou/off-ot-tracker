import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { AdminScreen } from '../screens/admin/AdminScreen';
import { UserOtScreen } from '../screens/admin/UserOtScreen';
import type { UserRef } from '../types';

export type RootStackParamList = {
  // `focusRequestId` is set when opened from a review notification (highlights that OT).
  Home: { focusRequestId?: string } | undefined;
  Admin: undefined;
  UserOt: { user: UserRef; month?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'OT Tracker' }} />
      <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Admin' }} />
      <Stack.Screen
        name="UserOt"
        component={UserOtScreen}
        options={{ title: 'User OT' }}
      />
    </Stack.Navigator>
  );
}
