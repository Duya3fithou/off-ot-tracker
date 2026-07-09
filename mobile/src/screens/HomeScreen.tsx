import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  IconButton,
  SegmentedButtons,
  Text,
} from 'react-native-paper';
import { useAuth } from '../auth/AuthContext';
import { EditOtModal } from '../components/EditOtModal';
import { OtBlockCard } from '../components/OtBlockCard';
import { OtRequestCard } from '../components/OtRequestCard';
import { useOtLog } from '../hooks/useOtLog';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { OtRequest } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation, route }: Props) {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<'log' | 'history'>('log');
  const [editing, setEditing] = useState<OtRequest | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const {
    projects,
    blocks,
    submitting,
    history,
    historyLoading,
    loadHistory,
    updateBlock,
    addBlock,
    removeBlock,
    submit,
  } = useOtLog();

  // Opened from a review notification: show history, refresh it, highlight the OT.
  const focusRequestId = route.params?.focusRequestId;
  useEffect(() => {
    if (!focusRequestId) return;
    setTab('history');
    setFocusId(focusRequestId);
    loadHistory();
  }, [focusRequestId, loadHistory]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          {user?.isAdmin && (
            <IconButton
              icon="shield-account"
              iconColor="#fff"
              onPress={() => navigation.navigate('Admin')}
            />
          )}
          <IconButton icon="logout" iconColor="#fff" onPress={signOut} />
        </View>
      ),
    });
  }, [navigation, user, signOut]);

  const onSubmit = async () => {
    if (await submit()) setTab('history');
  };

  return (
    <View style={styles.screen}>
      <SegmentedButtons
        value={tab}
        onValueChange={(v) => setTab(v as 'log' | 'history')}
        style={styles.segment}
        buttons={[
          { value: 'log', label: 'Log OT', icon: 'plus' },
          { value: 'history', label: 'My history', icon: 'history' },
        ]}
      />

      {tab === 'log' ? (
        <FlatList
          data={blocks}
          keyExtractor={(b) => b.key}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <OtBlockCard
              index={index}
              block={item}
              projects={projects}
              canRemove={blocks.length > 1}
              onChange={updateBlock}
              onRemove={removeBlock}
            />
          )}
          ListFooterComponent={
            <View style={styles.footer}>
              <Button mode="outlined" icon="plus" onPress={addBlock}>
                Add another request
              </Button>
              <Button
                mode="contained"
                icon="send"
                loading={submitting}
                disabled={submitting}
                onPress={onSubmit}
                style={styles.submit}
              >
                Submit {blocks.length} request(s)
              </Button>
            </View>
          }
        />
      ) : historyLoading ? (
        <ActivityIndicator style={styles.spinner} color="#2E7D32" />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          onRefresh={loadHistory}
          refreshing={historyLoading}
          renderItem={({ item }) => (
            <OtRequestCard
              request={item}
              highlighted={item.id === focusId}
              footer={
                item.approvalStatus === 'PENDING' ? (
                  <View style={styles.itemFooter}>
                    <Button compact mode="outlined" onPress={() => setEditing(item)}>
                      Edit
                    </Button>
                  </View>
                ) : undefined
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No OT requests yet.</Text>
          }
        />
      )}

      <EditOtModal
        request={editing}
        projects={projects}
        visible={!!editing}
        onClose={() => setEditing(null)}
        onSaved={loadHistory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f6f8' },
  headerActions: { flexDirection: 'row' },
  segment: { margin: 12 },
  list: { padding: 12, paddingTop: 0 },
  footer: { gap: 12, marginTop: 4, marginBottom: 32 },
  submit: {},
  spinner: { marginTop: 32 },
  empty: { textAlign: 'center', color: '#666', marginTop: 32 },
  itemFooter: { flexDirection: 'row', justifyContent: 'flex-end' },
});
