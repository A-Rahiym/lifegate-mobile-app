import React, { useState } from "react";
import { View, Text, ScrollView, TextInput } from "react-native";
import { PrimaryButton } from "components/Button";
import { LabeledInput } from "components/LabeledInput";
import { ErrorMessage } from "components/ErrorMessage";
import { useAuthStore } from "stores/auth-store";
import { router } from "expo-router";
import { validateSingleField } from "utils/validation";
import { Dropdown } from "components/DropDown";
import { DOBInput } from "components/DobPicker";
import { PhoneNumberInput } from "components/PhoneInput";
import { GENDER_OPTIONS, LANGUAGE_OPTIONS } from "constants/constants";

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
  const { userDraft, setUserField } = useAuthStore();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (fieldName: string, value: string) => {
    if (!isValidField(fieldName)) return;
    setUserField(fieldName, value);
    
    const additionalData = fieldName === 'confirmPassword' 
      ? { password: userDraft.password }
      : undefined;
    
    const error = validateSingleField(fieldName, value, false, additionalData);
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error || ''
    }));
  };

  const handleDateChange = (fieldName: string, date: Date) => {
    if (!isValidField(fieldName)) return;
    const new_date = date.toISOString().split('T')[0];
    setUserField(fieldName, new_date);
    const error = validateSingleField(fieldName, new_date, false);
    setFieldErrors((prev) => ({
      ...prev,
      [fieldName]: error || '',
    }));
  };

  const canProceed = () => {
    return (
      userDraft.name &&
      userDraft.email &&
      userDraft.password &&
      userDraft.confirmPassword &&
      userDraft.phone &&
      userDraft.dob &&
      userDraft.gender &&
      userDraft.language &&
      userDraft.healthHistory &&
      !fieldErrors.name &&
      !fieldErrors.email &&
      !fieldErrors.password &&
      !fieldErrors.confirmPassword &&
      !fieldErrors.phone &&
      !fieldErrors.dob &&
      !fieldErrors.gender &&
      !fieldErrors.language &&
      !fieldErrors.healthHistory
    );
  };



  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 py-6">
        {/* ACCOUNT INFORMATION SECTION */}
        <Text className="mb-4 text-lg font-bold text-gray-900">Account Information</Text>

        <LabeledInput
          label="Full Name"
          required
          placeholder="Enter your full name"
          value={userDraft.name}
          onChangeText={(v) => handleFieldChange("name", v)}
        />
        <ErrorMessage fieldName="name" fieldErrors={fieldErrors} />

        <LabeledInput
          label="Email Address"
          required
          placeholder="Enter your email"
          value={userDraft.email}
          onChangeText={(v) => handleFieldChange("email", v)}
        />
        <ErrorMessage fieldName="email" fieldErrors={fieldErrors} />

        <LabeledInput
          label="Password"
          required
          placeholder="Password"
          secureToggle
          value={userDraft.password}
          onChangeText={(v) => handleFieldChange("password", v)}
        />
        <ErrorMessage fieldName="password" fieldErrors={fieldErrors} />

        <LabeledInput
          label="Confirm Password"
          required
          placeholder="Confirm Password"
          secureToggle
          value={userDraft.confirmPassword}
          onChangeText={(v) => handleFieldChange("confirmPassword", v)}
        />
        <ErrorMessage fieldName="confirmPassword" fieldErrors={fieldErrors} />

        PROFILE INFORMATION SECTION
        <Text className="mb-4 mt-8 text-lg font-bold text-gray-900">Profile Information</Text>

        <PhoneNumberInput
          label="Phone Number"
          required
          value={userDraft.phone}
          onChangePhoneNumber={(value) => handleFieldChange('phone', value)}
          error={fieldErrors.phone}
        />

        <DOBInput
          label="Date of Birth"
          value={userDraft.dob ? new Date(userDraft.dob) : null}
          onChange={(date: Date) => handleDateChange('dob', date)}
        />
        <ErrorMessage fieldName="dob" fieldErrors={fieldErrors} />

        <Dropdown
          label="Gender"
          value={userDraft.gender || ''}
          onChange={(value: string) => handleFieldChange('gender', value)}
          options={GENDER_OPTIONS}
          placeholder="Select your gender"
        />
        <ErrorMessage fieldName="gender" fieldErrors={fieldErrors} />

        <Dropdown
          label="Preferred Language"
          value={userDraft.language || ''}
          onChange={(value: string) => handleFieldChange('language', value)}
          options={LANGUAGE_OPTIONS}
          placeholder="Select preferred language"
        />
        <ErrorMessage fieldName="language" fieldErrors={fieldErrors} />

        {/* HEALTH HISTORY SECTION */}
        <View className="mb-6 mt-6">
          <Text className="mb-2 font-semibold text-gray-700">
            Health History <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={userDraft.healthHistory}
            onChangeText={(value: string) => handleFieldChange('healthHistory', value)}
            placeholder="Tell a brief story about your health history"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="rounded-lg bg-[#F2F4F7] p-3 text-base text-gray-800"
            style={{ minHeight: 75, paddingVertical: 12 }}
          />
        </View>
        <ErrorMessage fieldName="healthHistory" fieldErrors={fieldErrors} />

        

        NEXT BUTTON - Navigate to Review
        <View className="mb-8 mt-8">
          <PrimaryButton
            title="Next ->"
            onPress={() => router.push('/(auth)/(user)/profile')}
            disabled={!canProceed()}
          />
        </View>
      </View>
    </ScrollView>
  );
}
