import React, { useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';

interface MessageBubbleProps {
  message: string;
  type: 'sent' | 'received';
  timestamp?: string;
  delay?: number;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  type,
  timestamp,
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
      </View>
    </Animated.View>
  );
};
