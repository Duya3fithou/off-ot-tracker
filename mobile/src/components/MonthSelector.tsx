import dayjs from 'dayjs';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton, Text } from 'react-native-paper';

interface Props {
  month: string; // YYYY-MM
  onChange: (month: string) => void;
}

export function MonthSelector({ month, onChange }: Props) {
  const d = dayjs(`${month}-01`);
  const shift = (n: number) => onChange(d.add(n, 'month').format('YYYY-MM'));

  return (
    <View style={styles.row}>
      <IconButton icon="chevron-left" onPress={() => shift(-1)} />
      <Text variant="titleMedium" style={styles.label}>
        {d.format('MMMM YYYY')}
      </Text>
      <IconButton icon="chevron-right" onPress={() => shift(1)} />
    </View>
  );
}

export function currentMonth(): string {
  return dayjs().format('YYYY-MM');
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { minWidth: 130, textAlign: 'center', fontWeight: '600' },
});
