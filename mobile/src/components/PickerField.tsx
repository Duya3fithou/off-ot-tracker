import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';

interface Props {
  label: string;
  mode: 'date' | 'time';
  value: Date | null;
  display: string; // formatted text to show
  icon: string;
  onChange: (value: Date) => void;
}

/**
 * A tappable field that opens a native date/time picker.
 * Android uses the imperative dialog; iOS shows a spinner in a bottom sheet.
 */
export function PickerField({ label, mode, value, display, icon, onChange }: Props) {
  const [iosOpen, setIosOpen] = useState(false);
  const [temp, setTemp] = useState<Date>(value ?? new Date());

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: value ?? new Date(),
        mode,
        is24Hour: true,
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(date);
        },
      });
    } else {
      setTemp(value ?? new Date());
      setIosOpen(true);
    }
  };

  return (
    <>
      <Pressable onPress={open}>
        <View pointerEvents="none">
          <TextInput
            label={label}
            mode="outlined"
            dense
            editable={false}
            value={display}
            right={<TextInput.Icon icon={icon} />}
          />
        </View>
      </Pressable>

      {Platform.OS === 'ios' && (
        <Modal visible={iosOpen} transparent animationType="fade">
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <DateTimePicker
                value={temp}
                mode={mode}
                display="spinner"
                is24Hour
                onChange={(_e, d) => d && setTemp(d)}
              />
              <View style={styles.sheetActions}>
                <Button onPress={() => setIosOpen(false)}>Cancel</Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    onChange(temp);
                    setIosOpen(false);
                  }}
                >
                  Done
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: { backgroundColor: '#fff', padding: 16 },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});
