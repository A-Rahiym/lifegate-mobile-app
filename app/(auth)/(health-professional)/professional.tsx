import { View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from 'stores/auth-store';
import { LabeledInput } from 'components/input';
import { Dropdown } from 'components/DropDown';
import { PrimaryButton } from 'components/Button';
import { GENDER_OPTIONS, SPECIALTY_OPTIONS } from 'constants/constants';
import { PrimaryCalendar } from 'components/Calender';

export default function ProfessionalScreen() {
  const { userDraft, setField } = useAuthStore();

  const next = () => {
    if (!userDraft.phone || !userDraft.gender || !userDraft.specialization)
      return alert('Fill all required fields');

    router.push('/(auth)/(health-professional)/license');
  };

  return (
    <View className="flex-1 justify-start bg-white p-3">
      <LabeledInput
        label="Phone"
        value={userDraft.phone}
        onChangeText={(v) => setField('phone', v)}
      />

      <PrimaryCalendar
        label="Date of Birth"
        placeholder="Select your date of birth"
        value={userDraft.dob}
        onChange={(date: string) => setField('dob', date)}
      />
      <Dropdown
        label="Gender"
        value={userDraft.gender}
        onChange={(v) => setField('gender', v)}
        placeholder='Select Gender'
        options={GENDER_OPTIONS}
      />

      <LabeledInput 
        label="Years of Practice"
        value={userDraft.yearsOfExperience || ''}
        placeholder='Years of Experience'
        onChangeText={(v) => setField('yearsOfExperience', v)}
      />

      <Dropdown
        label="Specialization"
        value={userDraft.specialization || ''}
        onChange={(v) => setField('specialization', v)}
        placeholder='Select Specialization'
        options={SPECIALTY_OPTIONS}
      />

      <PrimaryButton title="Next" onPress={next} type="secondary" />
    </View>
  );
}
