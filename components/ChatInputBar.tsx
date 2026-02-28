import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatInputBarProps {
  onSend?: (message: string) => void;
  onMicPress?: () => void;
  placeholder?: string;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSend,
  onMicPress,
  placeholder = 'How are you feeling....',
}) => {
  const [text, setText] = useState('');
  const [isMicActive, setIsMicActive] = useState(false);
  const sendScaleAnim = useRef(new Animated.Value(1)).current;

  const handleSend = () => {
    if (!text.trim()) return;

    Animated.sequence([
      Animated.timing(sendScaleAnim, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(sendScaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 6 }),
    ]).start();

    onSend?.(text.trim());
    setText('');
  };

  const handleMicPress = () => {
    setIsMicActive((prev) => !prev);
    onMicPress?.();
  };

  const hasText = text.trim().length > 0;

  return (
    <View className={`px-4 ${Platform.OS === 'ios' ? 'pb-8' : 'pb-4'} pt-3`}>
      <View
        className="flex-row items-center bg-white/85 rounded-full pl-5 pr-1.5 py-1.5 border border-teal-600/15"
        style={{
          shadowColor: '#1a6b5e',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 6,
        }}
      >
        {/* Text input */}
        <TextInput
          className="flex-1 text-sm text-teal-900 py-2.5"
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="#8bbdb7"
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          selectionColor="#1a6b5e"
        />

        {/* Mic button */}
        <TouchableOpacity className="p-2 mr-0.5" onPress={handleMicPress} activeOpacity={0.7}>
          <Ionicons
            name={isMicActive ? 'mic' : 'mic-outline'}
            size={22}
            color={isMicActive ? '#0d4a40' : '#5a9e94'}
          />
        </TouchableOpacity>

        {/* Send button */}
        <Animated.View style={{ transform: [{ scale: sendScaleAnim }] }}>
          <TouchableOpacity
            onPress={handleSend}
            activeOpacity={0.85}
            className={`w-11 h-11 rounded-full justify-center items-center ${hasText ? 'bg-teal-900' : 'bg-teal-600'}`}
            style={{
              shadowColor: '#0d4a40',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: hasText ? 0.3 : 0.1,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Ionicons name="arrow-up" size={22} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};
