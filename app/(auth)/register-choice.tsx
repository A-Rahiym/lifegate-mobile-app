import React from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PrimaryButton } from 'components/Button';
import { useRegistrationStore } from 'stores/auth/registration-store';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterChoiceScreen() {
  const { setUserField, userDraft } = useRegistrationStore();

  const handleRegisterAsUser = () => {
    setUserField('role', 'user' as string);
    console.log('User role set to user', userDraft.role);
    router.push('/(auth)/(user)');
  };

  const handleRegisterAsHealthProfessional = () => {
    setUserField('role', 'professional' as string);
    console.log('User role set to professional', userDraft.role);
    // router.push('/(auth)/(health-professional)');
    router.push('/(prof-tab)/review');
  };


  return (
    <SafeAreaView className='flex-1'>
    <LinearGradient
      colors={['#0AADA5', '#043B3C']}
      className="flex-grow"
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.4 }}
      style={{ flex: 1 }}>

      <View className="h-40" />
      <View className="flex-1 rounded-t-[36px] bg-gray-100 px-12 pt-7">
        <Text className="mb-12 text-center text-2xl font-bold text-[#0EA5A4]">Create Your Account</Text>

        <Text className="mb-8 text-center text-gray-600">
          Please select the type of account you like to create:
        </Text>

        <View className="mb-6">
          <PrimaryButton
            title="Register as User"
            onPress={handleRegisterAsUser}
          />
        </View>
        <View className="mb-8">
          <PrimaryButton
            title="Register as Medical Professional"
            onPress={handleRegisterAsHealthProfessional}
          />
        </View>

        {/* Login Link */}
        <View className="mt-6 flex-row justify-center">
          <Text className="text-gray-500">Already have an account? </Text>
          <Text
            onPress={() => router.push('/(prof-tab)/review')}
            className="font-semibold text-[#0EA5A4]">
            Login
          </Text>
        </View>
      </View>
    </LinearGradient>
  </SafeAreaView>
  );
}
