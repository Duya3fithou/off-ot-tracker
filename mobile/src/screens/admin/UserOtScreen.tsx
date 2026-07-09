import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useLayoutEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { OtRequestCard } from '../../components/OtRequestCard';
import { useUserOt } from '../../hooks/useUserOt';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { formatHours } from '../../utils/duration';

type Props = NativeStackScreenProps<RootStackParamList, 'UserOt'>;

export function UserOtScreen({ route, navigation }: Props) {
  const { user, month } = route.params;
  const { requests, loading, error, total } = useUserOt(user.id, month);

  useLayoutEffect(() => {
    navigation.setOptions({ title: user.name });
  }, [navigation, user.name]);

  if (loading) {
    return <ActivityIndicator style={styles.spinner} color="#2E7D32" />;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text variant="bodyMedium">{user.email}</Text>
        <Text variant="titleSmall">
          {month ? `${month} · ` : ''}
          {requests.length} request(s) · {formatHours(total)}h total
        </Text>
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <OtRequestCard request={item} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No OT requests for this filter.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f6f8' },
  header: { padding: 12, backgroundColor: '#E8F5E9' },
  list: { padding: 12 },
  spinner: { marginTop: 32 },
  error: { color: '#C62828', padding: 16 },
  empty: { textAlign: 'center', color: '#666', marginTop: 32 },
});
