import { View, Text } from "react-native";

export const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: string;
}) => (
  <View className="flex-row justify-between mb-3 px-3">
    <Text className="text-gray-800 font-medium text-right max-w-[55%]">{label}:</Text>
    <Text className="text-gray-800 flex-1 text-left max-w-[45%]">
      {value}
    </Text>
  </View>
);