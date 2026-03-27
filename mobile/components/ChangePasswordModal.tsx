import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LabeledInput } from './LabeledInput';

interface ChangePasswordModalProps {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onSave: (values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  loading,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSave = () => {
    if (
      !form.currentPassword.trim() ||
      !form.newPassword.trim() ||
      !form.confirmPassword.trim()
    ) {
      return;
    }
    onSave(form);
  };

  const handleClose = () => {
    setForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white p-6 pb-8">
          {/* Header */}
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-gray-800">Change Password</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <ScrollView showsVerticalScrollIndicator={false} className="mb-6">
            <LabeledInput
              label="Current Password"
              required
              secureToggle
              placeholder="Enter current password"
              value={form.currentPassword}
              onChangeText={(text) => setForm({ ...form, currentPassword: text })}
            />

            <LabeledInput
              label="New Password"
              required
              secureToggle
              placeholder="Enter new password"
              value={form.newPassword}
              onChangeText={(text) => setForm({ ...form, newPassword: text })}
            />

            <LabeledInput
              label="Confirm New Password"
              required
              secureToggle
              placeholder="Confirm new password"
              value={form.confirmPassword}
              onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
            />
          </ScrollView>

          {/* Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleClose}
              className="flex-1 rounded-lg border border-gray-300 bg-white py-3">
              <Text className="text-center font-semibold text-gray-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              className="flex-1 rounded-lg bg-teal-600 py-3">
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-center font-semibold text-white">Change Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
