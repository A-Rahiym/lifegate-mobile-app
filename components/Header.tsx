import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  onProfilePress?: () => void;
  onMenuPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onProfilePress, onMenuPress }) => {
  return (
    <View className="flex-row justify-between items-center px-5 pt-4 pb-2">
      {/* Avatar */}
      <TouchableOpacity onPress={onProfilePress} activeOpacity={0.7} className="p-1">
        <View className="w-11 h-11 rounded-full border-2 border-teal-700 bg-white/30 justify-center items-center">
          <Ionicons name="person-outline" size={22} color="#1a6b5e" />
        </View>
      </TouchableOpacity>

      {/* Hamburger Menu */}
      <TouchableOpacity onPress={onMenuPress} activeOpacity={0.7} className="p-1 gap-y-1.5">
        <View className="w-7 h-0.5 rounded-full bg-teal-800" />
        <View className="w-5 h-0.5 rounded-full bg-teal-800 self-end" />
        <View className="w-7 h-0.5 rounded-full bg-teal-800" />
      </TouchableOpacity>
    </View>
  );
};
