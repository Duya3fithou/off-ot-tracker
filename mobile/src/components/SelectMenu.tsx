import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Menu, TextInput } from 'react-native-paper';

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  value: string | null;
  options: SelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/** A dropdown built on Paper's Menu (Paper has no built-in Select). */
export function SelectMenu({
  label,
  value,
  options,
  placeholder = 'Select',
  onChange,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Menu
      visible={open}
      onDismiss={() => setOpen(false)}
      anchor={
        <Pressable onPress={() => !disabled && setOpen(true)}>
          <View pointerEvents="none">
            <TextInput
              label={label}
              mode="outlined"
              dense
              editable={false}
              value={selected?.label ?? ''}
              placeholder={placeholder}
              right={<TextInput.Icon icon="menu-down" />}
            />
          </View>
        </Pressable>
      }
    >
      {options.map((o) => (
        <Menu.Item
          key={o.value}
          title={o.label}
          onPress={() => {
            onChange(o.value);
            setOpen(false);
          }}
        />
      ))}
    </Menu>
  );
}
