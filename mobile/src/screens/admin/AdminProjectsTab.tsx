import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Dialog,
  IconButton,
  List,
  Portal,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import { useAdminProjects } from '../../hooks/useAdminProjects';
import type { Project } from '../../types';

export function AdminProjectsTab() {
  const { projects, loading, busy, load, create, rename, toggleActive, remove } =
    useAdminProjects();
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState<Project | null>(null);
  const [renameText, setRenameText] = useState('');
  const [deleting, setDeleting] = useState<Project | null>(null);

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    if (await create(name)) setNewName('');
  };

  const saveRename = async () => {
    const p = renaming;
    const name = renameText.trim();
    if (!p || !name || name === p.name) {
      setRenaming(null);
      return;
    }
    if (await rename(p.id, name)) setRenaming(null);
  };

  const confirmDelete = async () => {
    const p = deleting;
    if (!p) return;
    if (await remove(p)) setDeleting(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.addRow}>
        <TextInput
          label="New project name"
          mode="outlined"
          dense
          style={styles.flex}
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={add}
        />
        <Button mode="contained" onPress={add} disabled={busy || !newName.trim()}>
          Add
        </Button>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.spinner} color="#2E7D32" />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(p) => p.id}
          onRefresh={load}
          refreshing={loading}
          renderItem={({ item: p }) => (
            <List.Item
              title={p.name}
              description={`${p.otRequestCount ?? 0} OT request(s)`}
              right={() => (
                <View style={styles.itemActions}>
                  <Switch
                    value={p.active}
                    disabled={busy}
                    onValueChange={() => {
                      toggleActive(p);
                    }}
                  />
                  <IconButton
                    icon="pencil"
                    size={20}
                    disabled={busy}
                    onPress={() => {
                      setRenaming(p);
                      setRenameText(p.name);
                    }}
                  />
                  <IconButton
                    icon="delete-outline"
                    iconColor="#C62828"
                    size={20}
                    disabled={busy}
                    onPress={() => setDeleting(p)}
                  />
                </View>
              )}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No projects yet.</Text>}
        />
      )}

      <Portal>
        {/* Rename */}
        <Dialog visible={!!renaming} onDismiss={() => setRenaming(null)}>
          <Dialog.Title>Rename project</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Project name"
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRenaming(null)}>Cancel</Button>
            <Button mode="contained" onPress={saveRename}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete confirmation */}
        <Dialog visible={!!deleting} onDismiss={() => setDeleting(null)}>
          <Dialog.Title>Delete project?</Dialog.Title>
          <Dialog.Content>
            <Text>
              Permanently delete <Text style={styles.bold}>{deleting?.name}</Text>.
            </Text>
            <View
              style={[
                styles.warn,
                {
                  backgroundColor:
                    (deleting?.otRequestCount ?? 0) > 0 ? '#FFF4E5' : '#E8F4FD',
                },
              ]}
            >
              <Text>
                {(deleting?.otRequestCount ?? 0) > 0
                  ? `This will also permanently delete ${deleting?.otRequestCount} OT request(s) linked to this project, across all users. This cannot be undone.`
                  : 'No OT requests are linked to this project.'}
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleting(null)}>Cancel</Button>
            <Button textColor="#C62828" onPress={confirmDelete}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  flex: { flex: 1 },
  itemActions: { flexDirection: 'row', alignItems: 'center' },
  spinner: { marginTop: 32 },
  empty: { textAlign: 'center', color: '#666', marginTop: 32 },
  bold: { fontWeight: '700' },
  warn: { padding: 12, borderRadius: 8, marginTop: 12 },
});
