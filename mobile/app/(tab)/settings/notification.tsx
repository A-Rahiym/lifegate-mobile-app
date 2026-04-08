import { View, Text, Pressable, AppState, AppStateStatus, Linking } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';

async function getPermissionStatus(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export default function NotificationScreen() {
  const [enabled, setEnabled] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Read the real OS permission state on mount and whenever the app comes back to
  // foreground (in case the user toggled it in system settings).
  useEffect(() => {
    getPermissionStatus().then(setEnabled);

    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        getPermissionStatus().then(setEnabled);
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  const handleToggle = async () => {
    if (enabled) {
      // Can't revoke programmatically — direct the user to system settings.
      await Linking.openSettings();
    } else {
      const { status } = await Notifications.requestPermissionsAsync();
      setEnabled(status === 'granted');
    }
  };

  const NotificationToggle = () => (
    <Pressable
      onPress={handleToggle}
      className="flex-row items-center justify-between py-4 px-4">
      <View className="flex-row items-center flex-1">
        <Text className="ml-4 text-base text-gray-900">Push Notification</Text>
      </View>
      <View
        className={`h-7 w-14 rounded-full flex-row items-center px-1 ${
          enabled ? 'bg-[#0EA5A4]' : 'bg-gray-300'
        }`}>
        <View
          className={`h-6 w-6 rounded-full bg-white ${enabled ? 'ml-auto' : ''}`}
        />
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-white justify-start">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-6">
        <Pressable onPress={() => router.back()} className="p-2">
          <Ionicons name="chevron-back" size={24} color="black" />
        </Pressable>
        <Text className="text-xl font-bold text-black">Notifications</Text>
        <View className="w-10" />
      </View>

      {/* Blank white content area */}
      <View className=" bg-white" />
      <NotificationToggle/>
    </View>
  );
}