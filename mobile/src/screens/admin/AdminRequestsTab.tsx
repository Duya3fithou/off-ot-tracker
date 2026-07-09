import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { MonthSelector } from '../../components/MonthSelector';
import { OtRequestCard } from '../../components/OtRequestCard';
import { SelectMenu } from '../../components/SelectMenu';
import { useAdminRequests } from '../../hooks/useAdminRequests';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackScreenProps<RootStackParamList, 'Admin'>['navigation'];

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export function AdminRequestsTab({ navigation }: { navigation: Nav }) {
  const { month, setMonth, status, setStatus, requests, loading, busyId, load, review } =
    useAdminRequests();

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <MonthSelector month={month} onChange={setMonth} />
        <View style={styles.statusSelect}>
          <SelectMenu
            label="Status"
            value={status}
            options={STATUS_OPTIONS}
            onChange={setStatus}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.spinner} color="#2E7D32" />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          onRefresh={load}
          refreshing={loading}
          renderItem={({ item }) => (
            <OtRequestCard
              request={item}
              showUser
              onUserPress={() =>
                item.user &&
                navigation.navigate('UserOt', { user: item.user, month })
              }
              footer={
                <View style={styles.actions}>
                  <Button
                    compact
                    textColor="#2E7D32"
                    disabled={busyId === item.id || item.approvalStatus === 'APPROVED'}
                    onPress={() => review(item, 'APPROVED')}
                  >
                    Approve
                  </Button>
                  <Button
                    compact
                    textColor="#C62828"
                    disabled={busyId === item.id || item.approvalStatus === 'REJECTED'}
                    onPress={() => review(item, 'REJECTED')}
                  >
                    Reject
                  </Button>
                </View>
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No requests for this filter.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filters: { paddingHorizontal: 12, gap: 8 },
  statusSelect: { marginBottom: 8 },
  list: { padding: 12, paddingTop: 4 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  spinner: { marginTop: 32 },
  error: { color: '#C62828', paddingHorizontal: 16, marginVertical: 8 },
  empty: { textAlign: 'center', color: '#666', marginTop: 32 },
});
