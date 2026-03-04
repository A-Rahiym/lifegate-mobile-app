import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
}

export const SearchBar = ({
  placeholder = 'Search...',
  value,
  onChangeText,
  onClear,
}: SearchBarProps) => {
  return (
    <View className="mx-6 my-4 flex-row items-center bg-gray-100 rounded-full px-4 py-3 border border-gray-200">
      <Ionicons name="search" size={20} color="#98A2B3" />
      
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#98A2B3"
        value={value}
        onChangeText={onChangeText}
        className="flex-1 ml-3 text-gray-800 text-base"
      />
      
      {value.length > 0 && (
        <Pressable onPress={onClear} className="p-1">
          <Ionicons name="close" size={20} color="#98A2B3" />
        </Pressable>
      )}
    </View>
  );
};
