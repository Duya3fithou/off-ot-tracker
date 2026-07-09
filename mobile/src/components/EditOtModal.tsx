import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text } from 'react-native-paper';
import { apiErrorMessage, isConflictError, updateOtRequest } from '../api/client';
import { draftToPayload, requestToDraft } from '../hooks/otValidation';
import type { OtBlockDraft, OtRequest, Project } from '../types';
import { showError, showInfo, showSuccess } from '../utils/toast';
import { OtBlockCard } from './OtBlockCard';

interface Props {
  request: OtRequest | null;
  projects: Project[];
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

/** Edit a PENDING OT request the user owns (bottom-sheet style modal). */
export function EditOtModal({ request, projects, visible, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState<OtBlockDraft | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(request ? requestToDraft(request) : null);
  }, [request]);

  const updateDraft = (_key: string, patch: Partial<OtBlockDraft>) =>
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));

  const save = async () => {
    if (!request || !draft) return;
    const { payload, error } = draftToPayload(draft);
    if (error || !payload) {
      showError(error ?? 'Invalid input');
      return;
    }
    setSaving(true);
    try {
      await updateOtRequest(request.id, payload);
      showSuccess('Request updated.');
      onSaved();
      onClose();
    } catch (e) {
      if (isConflictError(e)) {
        showInfo(apiErrorMessage(e, 'This request can no longer be edited.'), 'Reloaded');
        onSaved();
        onClose();
      } else {
        showError(apiErrorMessage(e, 'Failed to update request'));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modal}
      >
        <Text variant="titleLarge" style={styles.title}>
          Edit OT request
        </Text>
        <ScrollView>
          {draft && (
            <OtBlockCard
              index={0}
              label="Edit request"
              block={draft}
              projects={projects}
              canRemove={false}
              onChange={updateDraft}
              onRemove={() => {}}
            />
          )}
        </ScrollView>
        <View style={styles.actions}>
          <Button onPress={onClose}>Cancel</Button>
          <Button mode="contained" onPress={save} loading={saving} disabled={saving}>
            Save changes
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    maxHeight: '85%',
  },
  title: { marginBottom: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
});
