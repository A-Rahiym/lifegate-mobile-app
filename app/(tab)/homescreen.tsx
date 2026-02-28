import React, { useState } from 'react';
import { SafeAreaView, KeyboardAvoidingView, View, Platform, StatusBar } from 'react-native';
import { Background } from 'components/Background';
import { Header } from 'components/Header';
import { GreetingSection } from 'components/GreetingSection';
import { SymptomGrid } from 'components/SymptomGrid';
import { ChatInputBar } from 'components/ChatInputBar';
import {router} from 'expo-router';

const HomeScreen: React.FC = () => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const handleSend = (message: string) => {
    console.log('Message sent:', message);
    console.log('Selected symptoms:', selectedSymptoms);
    
    // Navigate to chat screen with symptoms context
    // The drawer will handle smooth transition
    router.push('/(tab)/chatScreen');
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
            {/* Header */}
            <Header
              onProfilePress={() => console.log('Profile pressed')}
              onMenuPress={() => console.log('Menu pressed')}
            />

            {/* Main content — vertically centred */}
            <View className="flex-1 justify-center pb-5">
              <GreetingSection userName="Chioma" />
              <SymptomGrid onSymptomSelect={setSelectedSymptoms} />
            </View>

            {/* Sticky bottom input */}
            <ChatInputBar onSend={handleSend} />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Background>
    </>
  );
};

export default HomeScreen;