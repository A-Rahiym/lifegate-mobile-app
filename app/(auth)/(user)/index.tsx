import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Alert } from 'react-native';
import { PrimaryButton } from 'components/Button';
import { LabeledInput } from 'components/LabeledInput';
import { ErrorMessage } from 'components/ErrorMessage';
import { useRegistrationStore } from 'stores/auth-store';
import { router } from 'expo-router';
import { validateSingleField } from 'utils/validation';
import { SafeAreaView } from 'react-native-safe-area-context';

const VALID_FIELDS = {
  name: true,
  email: true,
  password: true,
  confirmPassword: true,
  phone: true,
  dob: true,
  gender: true,
  language: true,
  healthHistory: true,
} as const;

type ValidFieldName = keyof typeof VALID_FIELDS;

const isValidField = (fieldName: string): fieldName is ValidFieldName => {
  return fieldName in VALID_FIELDS;
};

export default function UserAccountStep() {
  const { userDraft, setUserField, resetForm } = useRegistrationStore();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    resetForm();
  }, []);

const handleFieldChange = (field: ValidFieldName, value: string) => {
  setUserField(field, value);

  let additionalData;

  if (field === 'confirmPassword') {
    additionalData = { password: userDraft.password };
  }

  if (field === 'password') {
    additionalData = { password: value };
  }

  const error = validateSingleField(field, value, false, additionalData);

  setFieldErrors((prev) => ({
    ...prev,
    [field]: error || '',
  }));

  // Revalidate confirm password when password changes
  if (field === 'password' && userDraft.confirmPassword) {
    const confirmError = validateSingleField(
      'confirmPassword',
      userDraft.confirmPassword,
      false,
      { password: value }
    );

    setFieldErrors((prev) => ({
      ...prev,
      confirmPassword: confirmError || '',
    }));
  }
};



  // Check if user can navigate to next page
  const STEP_FIELDS: ValidFieldName[] = ['name', 'email', 'password', 'confirmPassword'];

const canNavigateToNextPage = (): boolean => {
  for (const field of STEP_FIELDS) {
    const value = userDraft[field];

    if (!value || value.trim() === '') {
      return false;
    }

    const error = fieldErrors[field];

    if (error && error.trim() !== '') {
      return false;
    }
  }

  return true;
};
  // Handle navigation with validation
  const handleNavigateNext = () => {
    if (!canNavigateToNextPage()) {
      Alert.alert('Validation Error', 'Please fill all fields correctly before proceeding.', [
        { text: 'OK' },
      ]);
      return;
    }
    router.push('/(auth)/(user)/profile');
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1 bg-gray-50">
        <View className="px-6 py-6">
          {/* ACCOUNT INFORMATION SECTION */}
          <Text className="mb-4 text-lg font-bold text-gray-900">Account Information</Text>
          <ErrorMessage fieldName="name" fieldErrors={fieldErrors} />
          <LabeledInput
            label="Full Name"
            required
            placeholder="Enter your full name"
            value={userDraft.name}
            onChangeText={(v) => handleFieldChange('name', v)}
          />

          <ErrorMessage fieldName="email" fieldErrors={fieldErrors} />
          <LabeledInput
            label="Email Address"
            required
            placeholder="Enter your email"
            value={userDraft.email}
            onChangeText={(v) => handleFieldChange('email', v)}
          />

          <ErrorMessage fieldName="password" fieldErrors={fieldErrors} />
          <LabeledInput
            label="Password"
            required
            placeholder="Password"
            secureToggle
            value={userDraft.password}
            onChangeText={(v) => handleFieldChange('password', v)}
          />

          <ErrorMessage fieldName="confirmPassword" fieldErrors={fieldErrors} />
          <LabeledInput
            label="Confirm Password"
            required
            placeholder="Confirm Password"
            secureToggle
            value={userDraft.confirmPassword}
            onChangeText={(v) => handleFieldChange('confirmPassword', v)}
          />

          <View className="mb-8 mt-8">
            <PrimaryButton
              type="secondary"
              title="Next →"
              onPress={handleNavigateNext}
              disabled={!canNavigateToNextPage()}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
