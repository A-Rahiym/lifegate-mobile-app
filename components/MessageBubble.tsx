import React, { useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MessageBubbleProps {
  message: string;
  type: 'sent' | 'received';
  timestamp?: string;
  status?: 'SENDING' | 'SENT' | 'FAILED';
  delay?: number;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  type,
  timestamp,
  status,
  delay = 0,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
      ]),
    ]).start();
  }, []);

  const isSent = type === 'sent';

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
      className={`flex-row mb-2 px-4 ${isSent ? 'justify-end' : 'justify-start'}`}
    >
      <View
        className={`
          max-w-[72%] px-4 py-3
          ${isSent
            ? 'bg-teal-700 rounded-3xl rounded-br-md'
            : 'bg-teal-50 border border-teal-100 rounded-3xl rounded-bl-md'
          }
        `}
        style={
          isSent
            ? {
                shadowColor: '#0d4a40',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.18,
                shadowRadius: 6,
                elevation: 3,
              }
            : {
                shadowColor: '#3a8f82',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 1,
              }
        }
      >
        <Text
          className={`text-sm leading-5 ${
            isSent ? 'text-white font-medium' : 'text-teal-900 font-normal'
          }`}
        >
          {message}
        </Text>

        {timestamp && (
          <Text
            className={`text-xs mt-1 ${
              isSent ? 'text-teal-200 text-right' : 'text-teal-500 text-left'
            }`}
          >
            {timestamp}
          </Text>
        )}

        {/* Status indicator for sent messages */}
        {isSent && status && (
          <View className="mt-1 flex-row items-center justify-end gap-1">
            {status === 'SENDING' && (
              <>
                <Ionicons name="ellipsis-horizontal" size={12} color="#a7e8dc" />
                <Text className="text-xs text-teal-200">Sending...</Text>
              </>
            )}
            {status === 'FAILED' && (
              <>
                <Ionicons name="alert-circle" size={12} color="#ef4444" />
                <Text className="text-xs text-red-400">Failed</Text>
              </>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
};
