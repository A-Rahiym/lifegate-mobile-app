// File: app/_layout.tsx
import '../global.css' // Ensure global styles are applied to all screens
import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OfflineBanner } from '../components/OfflineBanner';
import { useAuthStore } from '../stores/auth-store';

export default function RootLayout() {
  const restoreSession = useAuthStore((s) => s.restoreSession);

  // Restore auth session on every cold start / web page refresh so that
  // the user is not lost when landing on any deep-linked route directly.
  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Splash first — no back gesture so auth can't be reached from authenticated area */}
          <Stack.Screen name="index" options={{ gestureEnabled: false }} />
          {/* Auth group — gestures disabled; replace() clears history on login success */}
          <Stack.Screen name="(auth)" options={{ gestureEnabled: false }} />
        </Stack>
        {/* Offline indicator — floats above all screens */}
        <OfflineBanner />
      </View>
    </ErrorBoundary>
  );
}