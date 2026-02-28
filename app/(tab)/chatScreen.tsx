import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  View,
  Text,
  Alert,
} from 'react-native';

import { Background } from 'components/Background';
import { Header } from 'components/Header';
import { MessageList } from 'components/MessageList';
import type { Message as ChatMessage } from 'components/MessageList';
import { ChatInputBar } from 'components/ChatInputBar';
import { useChatStore } from 'stores/chat-store';
import { useAuthStore } from 'stores/auth-store';

const WELCOME_MESSAGE =
  "Hi there! 👋 I'm LifeGate, your AI health assistant. Tell me how you're feeling today, and I'll help guide you through understanding your symptoms.";

const ChatScreen: React.FC = () => {
  // ✅ Zustand selectors (optimized)
  const activeConversation = useChatStore((state) =>
    state.conversations.find((c) => c.id === state.activeConversationId)
  );

  const sendMessage = useChatStore((state) => state.sendMessage);
  const isThinking = useChatStore((state) => state.isThinking);
  const error = useChatStore((state) => state.error);
  const clearError = useChatStore((state) => state.clearError);
  const initializeChat = useChatStore((state) => state.initializeChat);

  const { user } = useAuthStore();

  const messages = activeConversation?.messages || [];

  const [showWelcome, setShowWelcome] = useState(true);
  const hasInitialized = useRef(false);

  // ✅ FIX 1: Initialize when user becomes available
  useEffect(() => {
    if (user?.id && !hasInitialized.current) {
      hasInitialized.current = true;
      initializeChat(user.id);
    }
  }, [user?.id, initializeChat]);

  // ✅ Welcome toggle
  useEffect(() => {
    setShowWelcome(messages.length === 0);
  }, [messages.length]);

  // ✅ FIX 2: Memoized message transformation
  const displayMessages: ChatMessage[] = useMemo(() => {
    return messages.map((msg) => ({
      id: msg.id,
      text: msg.text,
      type: msg.role === 'USER' ? 'sent' : 'received',
      timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: msg.status,
    }));
  }, [messages]);

  // ✅ FIX 3: Stable callback
  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      sendMessage(text);
    },
    [sendMessage]
  );

  // ✅ FIX 4: Safe error alert
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        {
          text: 'OK',
          onPress: () => {
            clearError();
          },
        },
      ]);
    }
  }, [error, clearError]);

  return (
    <>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <Background>
        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <Header
              onProfilePress={() => console.log('Profile pressed')}
              onMenuPress={() => console.log('Menu pressed')}
            />

            {showWelcome ? (
              <View className="flex-1 justify-center items-center px-6">
                <Text className="text-lg text-gray-700 text-center leading-7">
                  {WELCOME_MESSAGE}
                </Text>
              </View>
            ) : (
              <MessageList messages={displayMessages} />
            )}

            {isThinking && <TypingIndicator />}

            <ChatInputBar
              onSend={handleSend}
              disabled={isThinking}
              placeholder="Type your message..."
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Background>
    </>
  );
};

export default ChatScreen;

/* ============================= */
/* Typing Indicator Component    */
/* ============================= */

const TypingIndicator = () => {
  return (
    <View className="px-4 py-2 flex-row items-center gap-2">
      <Text className="text-gray-500 text-sm">LifeGate is typing</Text>
      <View className="flex-row gap-1">
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            className="w-2 h-2 rounded-full bg-teal-500"
            style={{ opacity: 0.4 + i * 0.2 }}
          />
        ))}
      </View>
    </View>
  );
};