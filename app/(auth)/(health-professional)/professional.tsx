import { View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from 'stores/auth-store';
import { LabeledInput } from 'components/LabeledInput';
import { Dropdown } from 'components/DropDown';
import { PrimaryButton } from 'components/Button';
import { GENDER_OPTIONS, SPECIALTY_OPTIONS, LANGUAGE_OPTIONS } from 'constants/constants';
import { DOBInput } from 'components/DobPicker';

export default function ProfessionalScreen() {
  const { userDraft, setUserField } = useAuthStore();

  const next = () => {
    if (
      !userDraft.phone ||
      !userDraft.gender ||
      !userDraft.specialization
    )
      return alert('Fill all required fields');
    router.push('/(auth)/(health-professional)/license');
  };

  return (
    <View className="flex-1 justify-start bg-white p-3">
      <LabeledInput
        label="Phone"
        value={userDraft.phone}
        onChangeText={(v) => setUserField('phone', v)}
      />

      <DOBInput
        label="Date of Birth"
        value={userDraft.dob ? new Date(userDraft.dob) : null}
        onChange={(date: Date) => {
          const new_date = date.toISOString().split('T')[0];
          setUserField('dob', new_date);
          console.log('New Date set:', new_date);
        }}
      />

      <Dropdown
        label="Gender"
        value={userDraft.gender}
        onChange={(v) => setUserField('gender', v)}
        placeholder="Select Gender"
        options={GENDER_OPTIONS}
      />

      <Dropdown
      label='Preferred Language'
        value={userDraft.language || ''}
        onChange={(v) => setUserField('language', v)}
        placeholder="Select Preferred Language"
        options={LANGUAGE_OPTIONS}
      />

      <LabeledInput
        label="Years of Practice"
        value={userDraft.yearsOfExperience || ''}
        placeholder="Years of Experience"
        onChangeText={(v) => setUserField('yearsOfExperience', v)}
      />

      <Dropdown
        label="Specialization"
        value={userDraft.specialization || ''}
        onChange={(v) => setUserField('specialization', v)}
        placeholder="Select Specialization"
        options={SPECIALTY_OPTIONS}
      />

      <PrimaryButton title="Next" onPress={next} type="secondary" />
    </View>
  );
}
