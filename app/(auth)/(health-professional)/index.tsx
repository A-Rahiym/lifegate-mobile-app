import { View, Alert } from "react-native";
import { router } from "expo-router";
import { LabeledInput } from "components/LabeledInput";
import { PrimaryButton } from "components/Button";
import { useAuthStore } from "stores/auth-store";

export default function AccountScreen() {
  const { userDraft, setUserField } = useAuthStore();

  const next = () => {
    // Frontend password validation (only frontend check)
    if (!userDraft.email || !userDraft.password || !userDraft.name) {
      Alert.alert("Validation Error", "Please complete all fields");
      return;
    }

    if (userDraft.password !== userDraft.confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
      return;
    }

    router.push("/(auth)/(health-professional)/professional");
  };

  return (
    <View className="flex-1 bg-white p-6 justify-start">
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
        placeholder="Enter your email address"
        type="email"
        value={userDraft.email}
        onChangeText={(v) => setUserField("email", v)}
      />

      <LabeledInput
        label="Password"
        secureToggle
        value={userDraft.password}
        onChangeText={(v) => setUserField("password", v)}
      />

      <LabeledInput
        label="Confirm Password"
        secureToggle
        value={userDraft.confirmPassword}
        onChangeText={(v) => setUserField("confirmPassword", v)}
      />

      <PrimaryButton title="Next" onPress={next} type="secondary" />
    </View>
  );
}
