import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Card, Text, TouchableRipple } from 'react-native-paper';
import { MonthSelector } from '../../components/MonthSelector';
import { SelectMenu } from '../../components/SelectMenu';
import { useAdminSummary } from '../../hooks/useAdminSummary';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackScreenProps<RootStackParamList, 'Admin'>['navigation'];

export function AdminSummaryTab({ navigation }: { navigation: Nav }) {
  const {
    month,
    setMonth,
    projectId,
    setProjectId,
    userId,
    setUserId,
    rows,
    projects,
    users,
    loading,
    load,
  } = useAdminSummary();

  const projectOptions = [
    { value: '', label: 'All projects' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];
  const userOptions = [
    { value: '', label: 'All users' },
    ...users.map((u) => ({ value: u.id, label: u.name })),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <MonthSelector month={month} onChange={setMonth} />
        <View style={styles.row}>
          <View style={styles.flex}>
            <SelectMenu
              label="Project"
              value={projectId}
              options={projectOptions}
              onChange={setProjectId}
            />
          </View>
          <View style={styles.flex}>
            <SelectMenu
              label="User"
              value={userId}
              options={userOptions}
              onChange={setUserId}
            />
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.spinner} color="#2E7D32" />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.userId}
          contentContainerStyle={styles.list}
          onRefresh={load}
          refreshing={loading}
          renderItem={({ item }) => (
            <Card style={styles.card} mode="outlined">
              <TouchableRipple
                onPress={() =>
                  navigation.navigate('UserOt', {
                    user: { id: item.userId, name: item.name, email: item.email },
                    month,
                  })
                }
              >
                <Card.Content style={styles.cardContent}>
                  <View style={styles.flex}>
                    <Text variant="titleSmall">{item.name}</Text>
                    <Text variant="bodySmall" style={styles.muted}>
                      {item.email}
                    </Text>
                  </View>
                  <View style={styles.metrics}>
                    <Text style={styles.approved}>{item.approvedHours}h approved</Text>
                    <Text style={styles.pending}>{item.pendingHours}h pending</Text>
                    <Text style={styles.muted}>{item.totalRequests} req</Text>
                  </View>
                </Card.Content>
              </TouchableRipple>
            </Card>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No OT logged for this filter.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filters: { paddingHorizontal: 12, gap: 8 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  flex: { flex: 1 },
  list: { padding: 12, paddingTop: 4 },
  card: { marginBottom: 8 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  metrics: { alignItems: 'flex-end' },
  approved: { color: '#2E7D32', fontWeight: '600' },
  pending: { color: '#ED6C02', fontSize: 12 },
  muted: { color: '#666' },
  spinner: { marginTop: 32 },
  error: { color: '#C62828', paddingHorizontal: 16, marginVertical: 8 },
  empty: { textAlign: 'center', color: '#666', marginTop: 32 },
});
