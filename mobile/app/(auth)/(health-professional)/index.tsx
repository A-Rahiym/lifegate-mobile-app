import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LabeledInput } from 'components/LabeledInput';
import { PrimaryButton } from 'components/Button';
import { ErrorMessage } from 'components/ErrorMessage';
import { useRegistrationStore } from 'stores/auth-store';
import { useState } from 'react';
import { validateSingleField, validateNewPasswordMatch } from 'utils/validation';

const VALID_FIELDS = {
  name: true,
  email: true,
  password: true,
  confirmPassword: true,
} as const;

type ValidFieldName = keyof typeof VALID_FIELDS;

const isValidField = (fieldName: string): fieldName is ValidFieldName => {
  return fieldName in VALID_FIELDS;
};

export default function AccountScreen() {
  const { userDraft, setUserField } = useRegistrationStore();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  let error: string | null = null;

  const handleFieldChange = (field: ValidFieldName, value: string) => {
    setUserField(field, value);
    // Handle password field
    if (field === 'password') {
      error = validateSingleField(field, value, false);

      // Revalidate confirm password when password changes
      if (userDraft.confirmPassword) {
        const confirmError = validateNewPasswordMatch(userDraft.confirmPassword, value);
        setFieldErrors((prev) => ({
          ...prev,
          confirmPassword: confirmError || '',
        }));
      }
    }
    // Handle confirm password field
    else if (field === 'confirmPassword') {
      error = validateNewPasswordMatch(value, userDraft.password);
    }
    // Handle other fields
    else {
      error = validateSingleField(field, value, false);
    }

    setFieldErrors((prev) => ({
      ...prev,
      [field]: error || '',
    }));
  };

  const handleDateChange = (fieldName: string, date: Date) => {
    if (!isValidField(fieldName)) return;
    const new_date = date.toISOString().split('T')[0];
    setUserField(fieldName, new_date);
    const error = validateSingleField(fieldName, new_date, true);
    setFieldErrors((prev) => ({
      ...prev,
      [fieldName]: error || '',
    }));
  };

  const canProceed = () => {
    // All required fields must be filled
    return (
      userDraft.name &&
      userDraft.email &&
      userDraft.password &&
      userDraft.confirmPassword &&

      !fieldErrors.name &&
      !fieldErrors.email &&
      !fieldErrors.password &&
      !fieldErrors.confirmPassword 
    );
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 justify-start p-6">
        {/* ===== ACCOUNT INFORMATION ===== */}
        <Text className="mb-4 text-lg font-bold text-gray-900">Account Information</Text>

        <LabeledInput
          label="Full Name"
          required
          placeholder="Enter your full name"
          value={userDraft.name}
          onChangeText={(v) => handleFieldChange('name', v)}
        />
        <ErrorMessage fieldName="name" fieldErrors={fieldErrors} />
        <LabeledInput
          label="Email"
          required
          placeholder="Enter your email address"
          type="email"
          value={userDraft.email}
          onChangeText={(v) => handleFieldChange('email', v)}
        />
        <ErrorMessage fieldName="email" fieldErrors={fieldErrors} />
        <LabeledInput
          label="Password"
          required
          placeholder="Password"
          secureToggle
          value={userDraft.password}
          onChangeText={(v) => handleFieldChange('password', v)}
        />
        <ErrorMessage fieldName="password" fieldErrors={fieldErrors} />
        <LabeledInput
          label="Confirm Password"
          required
          placeholder="Confirm Password"
          secureToggle
          value={userDraft.confirmPassword}
          onChangeText={(v) => handleFieldChange('confirmPassword', v)}
        />
        <ErrorMessage fieldName="confirmPassword" fieldErrors={fieldErrors} />
        {/* ===== NEXT BUTTON - Navigate to Review ===== */}
        <PrimaryButton
          title="Next ->"
          onPress={() => router.push('/(auth)/(health-professional)/professional')}
          type="secondary"
          disabled={!canProceed()}
        />
      </View>
    </ScrollView>
  );
}
