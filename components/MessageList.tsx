import React, { useRef, useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { MessageBubble } from './MessageBubble';
import { UI_SPACING } from 'constants/constants';

export interface Message {
  id: string;
  text: string;
  type: 'sent' | 'received';
  timestamp?: string;
  status?: 'SENDING' | 'SENT' | 'FAILED';
}

interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Auto-scroll to bottom on new message
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1"
      contentContainerClassName={UI_SPACING.MESSAGE_LIST_PADDING_VERTICAL}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {messages.map((msg, index) => (
        <MessageBubble
          key={msg.id}
          message={msg.text}
          type={msg.type}
          timestamp={msg.timestamp}
          status={msg.status}
          delay={index * 60}
        />
      ))}
      {/* Bottom spacing so last bubble clears the input bar */}
      <View className="h-4" />
    </ScrollView>
  );
};
