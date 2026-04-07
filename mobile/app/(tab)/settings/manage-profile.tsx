import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from 'stores/auth/auth-store';
import { useProfileStore } from 'stores/auth/profile-store';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function SectionHeader({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 4 }}>
      <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={16} color="#0f766e" />
      </View>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f766e', textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {title}
      </Text>
    </View>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 5 }}>
      {label}{required ? <Text style={{ color: '#dc2626' }}> *</Text> : null}
    </Text>
  );
}

function StyledInput({
  value,
  onChangeText,
  placeholder,
  multiline,
  numberOfLines,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9ca3af"
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={{
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        paddingHorizontal: 13,
        paddingVertical: 11,
        fontSize: 14,
        color: '#111827',
        backgroundColor: '#f9fafb',
        marginBottom: 14,
        minHeight: multiline ? (numberOfLines ?? 3) * 24 + 22 : undefined,
      }}
    />
  );
}

export default function ManageProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const { loading, error, updateHealthProfile, clearError } = useProfileStore();

  const [bloodType, setBloodType] = useState(user?.blood_type ?? '');
  const [allergies, setAllergies] = useState(user?.allergies ?? '');
  const [medicalHistory, setMedicalHistory] = useState(user?.medical_history ?? '');
  const [currentMedications, setCurrentMedications] = useState(user?.current_medications ?? '');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergency_contact ?? '');

  const handleSave = async () => {
    clearError();
    const ok = await updateHealthProfile({
      blood_type: bloodType.trim() || null,
      allergies: allergies.trim() || null,
      medical_history: medicalHistory.trim() || null,
      current_medications: currentMedications.trim() || null,
      emergency_contact: emergencyContact.trim() || null,
    });
    if (ok) {
      Alert.alert('Saved', 'Your health profile has been updated.');
      router.back();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#f3f4f6',
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>Health Profile</Text>
          <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>
            This information helps the AI give you better, personalised advice
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

          {/* Read-only identity info */}
          <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 16 }}>
            <SectionHeader icon="person-outline" title="Identity" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, padding: 10 }}>
                <Text style={{ fontSize: 10, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Name</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 2 }}>{user?.name ?? '—'}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, padding: 10 }}>
                <Text style={{ fontSize: 10, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Gender</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 2 }}>{user?.gender ?? '—'}</Text>
              </View>
            </View>
            <View style={{ backgroundColor: '#f3f4f6', borderRadius: 8, padding: 10, marginTop: 8 }}>
              <Text style={{ fontSize: 10, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Date of Birth</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 2 }}>{user?.dob ?? '—'}</Text>
            </View>
            <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
              Name, gender and date of birth are set during registration and cannot be changed here.
            </Text>
          </View>

          {/* Blood Type */}
          <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 16 }}>
            <SectionHeader icon="water-outline" title="Blood Type" />
            <FieldLabel label="Select your blood type" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
              {BLOOD_TYPES.map((bt) => (
                <Pressable
                  key={bt}
                  onPress={() => setBloodType(bt === bloodType ? '' : bt)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: bloodType === bt ? '#0f766e' : '#e5e7eb',
                    backgroundColor: bloodType === bt ? '#ccfbf1' : '#f9fafb',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: bloodType === bt ? '#0f766e' : '#374151' }}>
                    {bt}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Health Details */}
          <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 16 }}>
            <SectionHeader icon="medical-outline" title="Health Details" />

            <FieldLabel label="Allergies" />
            <StyledInput
              value={allergies}
              onChangeText={setAllergies}
              placeholder="e.g. Penicillin, peanuts, latex…"
              multiline
              numberOfLines={2}
            />

            <FieldLabel label="Medical History" />
            <StyledInput
              value={medicalHistory}
              onChangeText={setMedicalHistory}
              placeholder="e.g. Asthma, Hypertension, Sickle Cell (AS)…"
              multiline
              numberOfLines={3}
            />

            <FieldLabel label="Current Medications" />
            <StyledInput
              value={currentMedications}
              onChangeText={setCurrentMedications}
              placeholder="e.g. Metformin 500mg, Lisinopril 10mg…"
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Emergency Contact */}
          <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 20 }}>
            <SectionHeader icon="call-outline" title="Emergency Contact" />
            <FieldLabel label="Name & Phone Number" />
            <StyledInput
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              placeholder="e.g. Jane Doe — 08012345678"
            />
          </View>

          {/* Error */}
          {error ? (
            <View style={{ backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="alert-circle" size={18} color="#dc2626" />
              <Text style={{ flex: 1, fontSize: 13, color: '#dc2626' }}>{error}</Text>
            </View>
          ) : null}

          {/* Save button */}
          <Pressable
            onPress={handleSave}
            disabled={loading}
            style={({ pressed }) => ({
              backgroundColor: '#0f766e',
              borderRadius: 14,
              paddingVertical: 15,
              alignItems: 'center',
              opacity: pressed || loading ? 0.75 : 1,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            })}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            )}
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>
              {loading ? 'Saving…' : 'Save Health Profile'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
