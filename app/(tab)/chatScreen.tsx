/**
 * Chat Screen (Tab View)
 * Connected to useChatStore for state management
 * Implements the full chat flow per specification:
 * - Shows welcome message initially
 * - Displays messages as user sends them (optimistic UI)
 * - Connects to Gemini AI via ChatService
 * - Persists conversation history to AsyncStorage
 */

import React, { useEffect, useState } from 'react';
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
  "Hi there! 👋 I'm HealthPilot, your AI health assistant. Tell me how you're feeling today, and I'll help guide you through understanding your symptoms.";

const ChatScreen: React.FC = () => {
  const { messages, sendMessage, isThinking, error, clearError, initializeChat } =
    useChatStore();
  const { user } = useAuthStore();
  const [hasShowWelcome, setHasShowWelcome] = useState(false);

  // Initialize chat on mount
  useEffect(() => {
    const initialize = async () => {
      await initializeChat(user?.id || 'default-user');
    };
    initialize();
  }, [user?.id, initializeChat]);

  // Show welcome message if conversation is empty
  useEffect(() => {
    if (messages.length === 0 && !hasShowWelcome) {
      setHasShowWelcome(true);
    }
  }, [messages.length, hasShowWelcome]);

  // Convert Message to ChatMessage type for display
  const displayMessages: ChatMessage[] = messages.map((msg) => ({
    id: msg.id,
    text: msg.text,
    type: msg.role === 'USER' ? 'sent' : 'received',
    timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    status: msg.status, // SENDING | SENT | FAILED
  }));

  const handleSend = (text: string) => {
    // Clear welcome state if user sends first message
    if (messages.length === 0) {
      setHasShowWelcome(false);
    }

    sendMessage(text);
  };

  // Show error alert
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        {
          text: 'OK',
          onPress: clearError,
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
            {/* Header with profile */}
            <Header
              onProfilePress={() => console.log('Profile pressed')}
              onMenuPress={() => console.log('Menu pressed')}
            />

            {/* Welcome message or message list */}
            {messages.length === 0 && hasShowWelcome ? (
              <View className="flex-1 justify-center items-center px-6">
                <Text className="text-lg text-gray-700 text-center leading-7">
                  {WELCOME_MESSAGE}
                </Text>
              </View>
            ) : (
              <MessageList messages={displayMessages} />
            )}

            {/* Typing indicator if AI is thinking */}
            {isThinking && (
              <View className="px-4 py-2 flex-row items-center gap-2">
                <Text className="text-gray-500 text-sm">HealthPilot is typing</Text>
                <View className="flex-row gap-1">
                  {[0, 1, 2].map((i) => (
                    <View
                      key={i}
                      className="w-2 h-2 rounded-full bg-teal-500"
                      style={{
                        opacity: 0.5 + (i * 0.2),
                      }}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Chat input */}
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
