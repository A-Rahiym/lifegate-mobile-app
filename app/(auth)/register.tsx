import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from 'components/Button';
import { LabeledInput } from 'components/input';
import { useAuthStore } from 'stores/auth-store';

// ---------------- Register Screen ----------------
export default function RegisterScreen() {

  const { userDraft, setField, register } = useAuthStore();
  const onRegister = async () => {
    setField('name', userDraft.name);
    setField('email', userDraft.email);
    setField('password', userDraft.password);
    setField('confirm', userDraft.confirm);
    console.log('Registering with:', userDraft);
    router.replace('/(auth)/login');
    await register();
  };

  return (
    <View className="flex-1 bg-[#0EA5A4]">
      <View className="h-56" />

      <ScrollView className="flex-1 bg-gray-100 rounded-t-[36px] px-6 pt-7" contentContainerStyle={{ paddingBottom: 30 }}>
        <Text className="text-center text-[#0EA5A4] text-2xl font-bold mb-6">
          Create Account
        </Text>

        <LabeledInput
          label="Full Name"
          required
          placeholder="John Doe"
          value={userDraft.name}
          onChangeText={(value) => setField('name', value)}
        />

        <LabeledInput
          label="Email Address"
          required
          placeholder="xyz1@gmail.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={userDraft.email}
          onChangeText={(value) => setField('email', value)}
        />

        <LabeledInput
          label="Password"
          required
          placeholder="Password"
          secureToggle
          value={userDraft.password}
          onChangeText={(value) => setField('password', value)}
        />

        <LabeledInput
          label="Confirm Password"
          required
          placeholder="Re-enter password"
          secureToggle
          value={userDraft.confirm}
          onChangeText={(value) => setField('confirm', value)}
        />

        <View className="mt-3">
          <PrimaryButton title="Register" onPress={onRegister} />
        </View>
        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-500">Already have an account? </Text>
          <Pressable onPress={() => router.replace('/(auth)/login')}>
            <Text className="text-[#0EA5A4] font-semibold">Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
