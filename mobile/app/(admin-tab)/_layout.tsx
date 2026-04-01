import { Stack } from 'expo-router';

export default function AdminTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f8fafc' } }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="physicians" />
      <Stack.Screen name="physician-detail" />
    </Stack>
  );
}
