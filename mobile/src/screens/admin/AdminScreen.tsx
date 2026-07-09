import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { AdminRequestsTab } from './AdminRequestsTab';
import { AdminSummaryTab } from './AdminSummaryTab';
import { AdminProjectsTab } from './AdminProjectsTab';

type Props = NativeStackScreenProps<RootStackParamList, 'Admin'>;

export function AdminScreen({ navigation }: Props) {
  const [tab, setTab] = useState('requests');

  return (
    <View style={styles.screen}>
      <SegmentedButtons
        value={tab}
        onValueChange={setTab}
        style={styles.segment}
        buttons={[
          { value: 'requests', label: 'Requests' },
          { value: 'summary', label: 'Summary' },
          { value: 'projects', label: 'Projects' },
        ]}
      />
      {tab === 'requests' && <AdminRequestsTab navigation={navigation} />}
      {tab === 'summary' && <AdminSummaryTab navigation={navigation} />}
      {tab === 'projects' && <AdminProjectsTab />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f6f8' },
  segment: { margin: 12 },
});
