import React, { useState } from 'react';
import { View, Text, Modal, Pressable, Alert, ScrollView } from 'react-native';
import { PrimaryButton } from 'components/Button';
import { useAuthStore } from 'stores/auth-store';
import { router } from 'expo-router';
import { validateRegistration } from 'utils/validation';
import { InfoRow } from 'components/infoRow';

export default function UserReviewStep() {
  const { userDraft, register, error: backendError } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [agreed, setAgreed] = useState(false);

  const handleFinalSubmit = async () => {
    if (!agreed) {
      Alert.alert('Agreement Required', 'Please agree to the Privacy Policy.');
      return;
    }

    setLoading(true);
    setValidationErrors([]);

    // Pre-validation before submission
    const errors = validateRegistration(userDraft, 'user');
    if (errors.length > 0) {
      setValidationErrors(errors);
      const errorMessages = errors.map((err) => err.message).join('\n');
      Alert.alert('Validation Error', errorMessages);
      setLoading(false);
      return;
    }

    try {
      await register('user');
      setModalVisible(true);
    } catch (error) {
      console.error('Registration failed', error);
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleModalConfirm = () => {
    setModalVisible(false);
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView className="flex-1 px-6">
      <Text className="mb-6 mt-4 text-center text-lg font-semibold">
        Review your information before submitting.
      </Text>

      {backendError && (
        <View className="mb-6 rounded-lg border border-red-400 bg-red-100 p-4">
          <Text className="text-center text-red-700">{backendError}</Text>
        </View>
      )}

      {validationErrors.length > 0 && (
        <View className="mb-6 rounded-lg border border-red-300 bg-red-100 p-4">
          <Text className="mb-2 font-semibold text-red-700">Validation Errors:</Text>
          {validationErrors.map((err, idx) => (
            <Text key={idx} className="text-sm text-red-600">
              • {err.message}
            </Text>
          ))}
        </View>
      )}

      <View className="mb-16 rounded-lg bg-gray-200 p-4">
        <InfoRow label="Full Name" value={userDraft.name} />
        <InfoRow label="Email" value={userDraft.email} />
        <InfoRow label="Phone Number" value={userDraft.phone} />
        <InfoRow label="Gender" value={userDraft.gender} />
        <InfoRow label="Language" value={userDraft.language} />
        <InfoRow label="Health History" value={userDraft.healthHistory} />
        <InfoRow label="Date of Birth" value={userDraft.dob} />
      </View>
      <Text className="mb-6 text-center font-light">
        I have the information is accurate and I consent to the lifeGate Privacy and policy
      </Text>

      <View className="mt-20 flex-row justify-center">
        <Pressable onPress={() => setAgreed(!agreed)} className="mb-8 flex-row items-center">
          <View
            className={`mr-3 h-5 w-5 rounded border ${
              agreed ? 'border-teal-600 bg-teal-600' : 'border-gray-400'
            }`}
          />
          <Text className="font-bold text-gray-700">
            I have read the <Text className="font-semibold text-teal-600">Privacy Policy</Text> and
            I agree.
          </Text>
        </Pressable>
      </View>
      
      <PrimaryButton
        title={loading ? 'Submitting...' : 'Submit Application'}
        onPress={handleFinalSubmit}
      />
      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="w-80 items-center rounded-lg bg-white p-6">
            <Text className="mb-4 text-center text-lg font-bold">Application Submitted</Text>
            <Text className="mb-6 text-center">
              We’ve received your application. We’ll get back to you soon!
            </Text>
            <Pressable onPress={handleModalConfirm} className="rounded bg-[#0EA5A4] px-6 py-2">
              <Text className="text-center font-semibold text-white">OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
