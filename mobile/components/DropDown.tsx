import { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  required?: boolean;
  hasError?: boolean;
}

export const Dropdown = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  required,
  hasError,
}: DropdownProps) => {
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label || placeholder;

  return (
    <View className="mb-3">
      {/* Label — matches LabeledInput */}
      <Text className="mb-1.5 font-medium text-gray-700">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>

      {/* Trigger — same height and shape as LabeledInput */}
      <Pressable
        onPress={() => setOpen(true)}
        className={`h-12 flex-row items-center rounded-xl px-3 ${
          hasError ? 'border border-red-300 bg-red-50' : 'bg-[#F2F4F7]'
        }`}>
        <Text className={`flex-1 ${ value ? 'text-gray-900' : 'text-gray-400' }`}>
          {selectedLabel}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#0EA5A4" />
      </Pressable>

      <Modal transparent visible={open} animationType="fade">
        <Pressable
          className="flex-1 justify-center bg-black/30 px-6"
          onPress={() => setOpen(false)}>
          <View className="rounded-2xl bg-white p-4">
            {options.map((option: DropdownOption) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className="py-3">
                <Text className={`text-base ${ option.value === value ? 'font-semibold text-[#0EA5A4]' : 'text-gray-800' }`}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};
