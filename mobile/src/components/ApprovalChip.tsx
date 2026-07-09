import React from 'react';
import { Chip } from 'react-native-paper';
import { approvalColor, approvalLabel } from '../theme';
import type { ApprovalStatus } from '../types';

export function ApprovalChip({ status }: { status: ApprovalStatus }) {
  const color = approvalColor(status);
  return (
    <Chip
      compact
      style={{ backgroundColor: `${color}1F` }}
      textStyle={{ color, fontWeight: '600' }}
    >
      {approvalLabel(status)}
    </Chip>
  );
}
