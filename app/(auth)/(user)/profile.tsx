import React from 'react';
import { View } from 'react-native';
import { PrimaryButton } from 'components/Button';
import { LabeledInput } from 'components/LabeledInput';
import { Dropdown } from 'components/DropDown';
import { GENDER_OPTIONS, LANGUAGE_OPTIONS } from 'constants/constants';
import { useAuthStore } from 'stores/auth-store';
import { router } from 'expo-router';
import { DOBInput } from 'components/DobPicker';

export default function UserProfileStep() {
  const { userDraft, setUserField } = useAuthStore();

  return (
    <View className="px-6">
      <LabeledInput
        label="Phone Number"
        required
        placeholder="Enter phone number"
        keyboardType="phone-pad"
        value={userDraft.phone}
        onChangeText={(v) => setUserField('phone', v)}
      />

      <DOBInput
        label="Enter Date of Birth"
        value={userDraft.dob ? new Date(userDraft.dob) : null}
        onChange={(date: Date) => {
          const new_date = date.toISOString().split('T')[0];
          setUserField('dob', new_date);
          console.log('New Date set:', new_date);
        }}
      />

      <Dropdown
        label="Gender"
        value={userDraft.gender || ''}
        onChange={(value: string) => setUserField('gender', value)}
        options={GENDER_OPTIONS}
        placeholder="Select gender"
      />

      <LabeledInput
        label="Health History"
        required
        placeholder="Tell a brief story about your health history"
        onChangeText={(value: string) => setUserField('healthHistory', value)}
      />

      <Dropdown
        label="Preferred Language"
        value={userDraft.language || ''}
        onChange={(value: string) => setUserField('language', value)}
        options={LANGUAGE_OPTIONS}
        placeholder="Select preferred language"
      />

      <View className="mt-8">
        <PrimaryButton
          title="Next"
          type="secondary"
          onPress={() => router.push('/(auth)/(user)/review')}
        />
      </View>
    </View>
  );
}
