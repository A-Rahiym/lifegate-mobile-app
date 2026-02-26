import React from "react";
import { View, Alert } from "react-native";
import { PrimaryButton } from "components/Button";
import { LabeledInput } from "components/LabeledInput";
import { useAuthStore } from "stores/auth-store";
import { router } from "expo-router";

export default function UserAccountStep() {
  const { userDraft, setUserField } = useAuthStore();

  const handleNext = () => {
    // Frontend password validation (only frontend check)
    if (!userDraft.password || !userDraft.confirmPassword) {
      Alert.alert("Validation Error", "Please enter and confirm your password");
      return;
    }

    if (userDraft.password !== userDraft.confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
      return;
    }

    router.push("/(auth)/(user)/profile");
  };

  return (
    <View className="px-6">
      <LabeledInput
        label="Full Name"
        required
        placeholder="Enter your full name"
        value={userDraft.name}
        onChangeText={(v) => setUserField("name", v)}
      />
      <LabeledInput
        label="Email"
        required
        placeholder="Enter your email"
        value={userDraft.email}
        onChangeText={(v) => setUserField("email", v)}
      />
      <LabeledInput
        label="Password"
        required
        placeholder="Password"
        secureToggle
        value={userDraft.password}
        onChangeText={(v) => setUserField("password", v)}
      />
      <LabeledInput
        label="Confirm Password"
        required
        placeholder="Confirm Password"
        secureToggle
        value={userDraft.confirmPassword}
        onChangeText={(v) => setUserField("confirmPassword", v)}
      />

      <View className="mt-8">
        <PrimaryButton
          title="Next"
          onPress={handleNext}
          type="secondary"
        />
      </View>
    </View>
  );
}
