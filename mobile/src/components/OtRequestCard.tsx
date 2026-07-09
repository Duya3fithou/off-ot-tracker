import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Card, Chip, Text, TouchableRipple } from 'react-native-paper';
import { ApprovalChip } from './ApprovalChip';
import { formatDateDisplay, formatHours } from '../utils/duration';
import type { OtRequest } from '../types';
import { taskStatusLabel } from '../utils/taskStatus';

interface Props {
  request: OtRequest;
  showUser?: boolean;
  onUserPress?: () => void;
  footer?: React.ReactNode;
  /** Emphasize this card (e.g. the OT a review notification deep-linked to). */
  highlighted?: boolean;
}

export function OtRequestCard({ request: r, showUser, onUserPress, footer, highlighted }: Props) {
  const urlMatch = r.taskLink.match(/https?:\/\/\S+/);

  return (
    <Card style={[styles.card, highlighted && styles.cardHighlight]} mode="outlined">
      <Card.Content>
        {showUser && r.user && (
          <TouchableRipple onPress={onUserPress}>
            <View style={styles.userRow}>
              <Text variant="titleSmall" style={styles.userName}>
                {r.user.name}
              </Text>
              <Text variant="bodySmall" style={styles.userEmail} numberOfLines={1}>
                {r.user.email}
              </Text>
            </View>
          </TouchableRipple>
        )}

        <View style={styles.headerRow}>
          <Text variant="titleSmall">{formatDateDisplay(r.workDate)}</Text>
          <Text style={styles.times}>
            {r.startTime} – {r.endTime}
          </Text>
          <Text variant="titleSmall" style={styles.hours}>
            {formatHours(r.durationHours)}h
          </Text>
        </View>

        <Text style={styles.project}>📁 {r.project?.name ?? '—'}</Text>

        {urlMatch ? (
          <Text style={styles.task}>
            {r.taskLink.split(urlMatch[0])[0]}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL(urlMatch[0])}
            >
              {urlMatch[0]}
            </Text>
            {r.taskLink.split(urlMatch[0])[1]}
          </Text>
        ) : (
          <Text style={styles.task}>{r.taskLink}</Text>
        )}

        <View style={styles.chips}>
          <Chip compact>{taskStatusLabel(r.taskStatus, r.hoursToComplete)}</Chip>
          <ApprovalChip status={r.approvalStatus} />
        </View>

        {footer}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  cardHighlight: { borderColor: '#2E7D32', borderWidth: 2, backgroundColor: '#F1F8E9' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  userName: { color: '#2E7D32', fontWeight: '700' },
  userEmail: { color: '#666', flexShrink: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  times: { color: '#666' },
  hours: { marginLeft: 'auto', fontWeight: '700' },
  project: { marginTop: 6, color: '#444' },
  task: { marginTop: 6, fontSize: 13 },
  link: { color: '#1565C0', textDecorationLine: 'underline' },
  chips: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' },
});
