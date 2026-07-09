import { MD3LightTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

export const theme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2E7D32',
    secondary: '#1565C0',
  },
};

export function approvalColor(status: string): string {
  switch (status) {
    case 'APPROVED':
      return '#2E7D32';
    case 'REJECTED':
      return '#C62828';
    default:
      return '#ED6C02';
  }
}

export function approvalLabel(status: string): string {
  switch (status) {
    case 'APPROVED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    default:
      return 'Pending';
  }
}
