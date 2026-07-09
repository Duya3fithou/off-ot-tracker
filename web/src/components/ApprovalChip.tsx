import Chip from '@mui/material/Chip';
import type { ApprovalStatus } from '../types';

const map: Record<ApprovalStatus, { label: string; color: 'default' | 'success' | 'warning' | 'error' }> = {
  PENDING: { label: 'Pending', color: 'warning' },
  APPROVED: { label: 'Approved', color: 'success' },
  REJECTED: { label: 'Rejected', color: 'error' },
};

export function ApprovalChip({ status }: { status: ApprovalStatus }) {
  const { label, color } = map[status];
  return <Chip size="small" color={color} label={label} />;
}
