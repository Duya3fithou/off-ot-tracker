import dayjs from 'dayjs';
import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, IconButton, Text, TextInput } from 'react-native-paper';
import { PickerField } from './PickerField';
import { SelectMenu } from './SelectMenu';
import { useTeamworkAutofill } from '../hooks/useTeamworkAutofill';
import { computeDurationHours, formatHours, toHHMM } from '../utils/duration';
import { extractTeamworkTaskUrl } from '../utils/teamwork';
import type { OtBlockDraft, Project, TaskStatus } from '../types';
import { TASK_STATUS_OPTIONS } from '../utils/taskStatus';

interface Props {
  index: number;
  block: OtBlockDraft;
  projects: Project[];
  canRemove: boolean;
  onChange: (key: string, patch: Partial<OtBlockDraft>) => void;
  onRemove: (key: string) => void;
  /** Overrides the default "OT request #n" heading (e.g. in the edit modal). */
  label?: string;
}

const STATUS_OPTIONS = TASK_STATUS_OPTIONS;

export function OtBlockCard({
  index,
  block,
  projects,
  canRemove,
  onChange,
  onRemove,
  label,
}: Props) {
  const computed = computeDurationHours(block.startTime, block.endTime);
  // Show computed duration once times are entered; until then show the Teamwork
  // estimate (if any) as a hint. Start/end are left empty for the user.
  const isEstimate = computed == null && block.estimatedHours != null;
  const duration = computed ?? block.estimatedHours ?? null;
  const { autofill } = useTeamworkAutofill();
  const lastFetched = useRef<string | null>(null);

  // When the task field holds a Teamwork task link, fetch + auto-fill on blur.
  // We fill task text + project + the duration estimate, but NOT start/end times.
  const handleTaskLinkBlur = async () => {
    const url = extractTeamworkTaskUrl(block.taskLink);
    if (!url || url === lastFetched.current) return;
    lastFetched.current = url;
    const patch = await autofill(url);
    if (patch) onChange(block.key, patch);
  };

  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium">{label ?? `OT request #${index + 1}`}</Text>
          {canRemove && (
            <IconButton
              icon="delete-outline"
              iconColor="#C62828"
              size={20}
              onPress={() => onRemove(block.key)}
            />
          )}
        </View>

        <TextInput
          label="Task link or title"
          mode="outlined"
          dense
          multiline
          style={styles.field}
          placeholder="Paste a Teamwork task link to auto-fill, or type a title"
          value={block.taskLink}
          onChangeText={(v) => onChange(block.key, { taskLink: v })}
          onBlur={handleTaskLinkBlur}
        />
        <Text variant="bodySmall" style={styles.hint}>
          Paste a Teamwork task link → project & task fill in automatically.
        </Text>

        <PickerField
          label="Start date"
          mode="date"
          value={block.workDate}
          icon="calendar"
          display={block.workDate ? dayjs(block.workDate).format('DD/MM/YYYY') : ''}
          onChange={(d) => onChange(block.key, { workDate: d })}
        />

        <View style={styles.row}>
          <View style={styles.flex}>
            <PickerField
              label="Start time"
              mode="time"
              value={block.startTime}
              icon="clock-outline"
              display={block.startTime ? toHHMM(block.startTime) : ''}
              onChange={(d) => onChange(block.key, { startTime: d })}
            />
          </View>
          <View style={styles.flex}>
            <PickerField
              label="End time"
              mode="time"
              value={block.endTime}
              icon="clock-outline"
              display={block.endTime ? toHHMM(block.endTime) : ''}
              onChange={(d) => onChange(block.key, { endTime: d })}
            />
          </View>
        </View>

        <Chip style={styles.durationChip} icon="timer-outline">
          {duration == null
            ? 'Duration: —'
            : `Duration: ${formatHours(duration)}h${isEstimate ? ' (est.)' : ''}`}
        </Chip>

        <View style={styles.field}>
          <SelectMenu
            label="Project"
            value={block.projectId}
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
            onChange={(v) => onChange(block.key, { projectId: v })}
          />
        </View>

        <View style={styles.field}>
          <SelectMenu
            label="Task's status"
            value={block.taskStatus}
            options={STATUS_OPTIONS}
            onChange={(v) => onChange(block.key, { taskStatus: v as TaskStatus })}
          />
        </View>

        {block.taskStatus === 'IN_PROGRESS' && (
          <TextInput
            label="Hours needed to finish"
            mode="outlined"
            dense
            keyboardType="number-pad"
            style={styles.field}
            value={block.hoursToComplete}
            onChangeText={(v) => onChange(block.key, { hoursToComplete: v })}
          />
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', gap: 12, marginTop: 12 },
  flex: { flex: 1 },
  durationChip: { alignSelf: 'flex-start', marginTop: 12 },
  field: { marginTop: 12 },
  hint: { color: '#666', marginTop: 4 },
});
