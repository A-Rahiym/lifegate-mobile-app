import { View } from "react-native";
import { router } from "expo-router";
import { LabeledInput } from "components/input";
import { PrimaryButton } from "components/Button";
import { useAuthStore } from "stores/auth-store";

export default function AccountScreen() {
  const { userDraft, setField } = useAuthStore();

  const next = () => {
    if (!userDraft.email || !userDraft.password || !userDraft.name)
      return alert("Please complete all fields");

    if (userDraft.password !== userDraft.confirm)
      return alert("Passwords do not match");

    router.push("/(auth)/(health-professional)/professional");
  };

  return (
    <View className="flex-1 bg-white p-6 justify-start">
      <LabeledInput
        label="Full Name"
        required
        placeholder="Enter your full name"
        value={userDraft.name}
        onChangeText={(v) => setField("name", v)}
      />

      <LabeledInput
        label="Email"
        required
        placeholder="Enter your email address"
        type="email"
        value={userDraft.email}
        onChangeText={(v) => setField("email", v)}
      />

      <LabeledInput
        label="Password"
        secureToggle
        value={userDraft.password}
        onChangeText={(v) => setField("password", v)}
      />

      <LabeledInput
        label="Confirm Password"
        secureToggle
        value={userDraft.confirm}
        onChangeText={(v) => setField("confirm", v)}
      />

      <PrimaryButton title="Next" onPress={next} type="secondary" />
    </View>
  );
}
