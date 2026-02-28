import React, { useState } from 'react';
import { SafeAreaView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { Background } from 'components/Background';
import { Header } from 'components/Header';
import { MessageList, Message } from 'components/MessageList';
import { ChatInputBar } from 'components/ChatInputBar';

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: "Hello! I'm here to help. How are you feeling today?",
    type: 'received',
    timestamp: '9:00 AM',
  },
  {
    id: '2',
    text: 'I have a headache and feel a bit fatigued.',
    type: 'sent',
    timestamp: '9:01 AM',
  },
  {
    id: '3',
    text: "I'm sorry to hear that. How long have you had the headache? Is it on one side or both?",
    type: 'received',
    timestamp: '9:01 AM',
  },
  {
    id: '4',
    text: 'Since this morning. Both sides.',
    type: 'sent',
    timestamp: '9:02 AM',
  },
  {
    id: '5',
    text: 'Understood. Have you had enough water today? Dehydration is a common cause of tension headaches.',
    type: 'received',
    timestamp: '9:02 AM',
  },
];

let nextId = 6;

const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  const now = () => {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
  };

  const handleSend = (text: string) => {
    const userMsg: Message = {
      id: String(nextId++),
      text,
      type: 'sent',
      timestamp: now(),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Simulate AI reply
    setTimeout(() => {
      const reply: Message = {
        id: String(nextId++),
        text: "Thanks for sharing that. I'll note it down and ask a few more questions to better understand your symptoms.",
        type: 'received',
        timestamp: now(),
      };
      setMessages((prev) => [...prev, reply]);
    }, 1000);
  };

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
            <Header />
            <MessageList messages={messages} />
            <ChatInputBar onSend={handleSend} />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Background>
    </>
  );
};

export default ChatScreen;
