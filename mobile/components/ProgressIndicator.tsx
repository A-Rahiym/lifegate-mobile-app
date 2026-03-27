import React from "react";
import { View, Text } from "react-native";

interface WizardProgressProps {
  totalSteps: number;
  currentStep: number;
}

export const WizardProgress: React.FC<WizardProgressProps> = ({
  totalSteps,
  currentStep,
}) => {
  return (
    <View className="flex-row items-center justify-center mt-6">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const active = stepNumber === currentStep;

        return (
          <View key={index} className="flex-row items-center">
            {/* Circle */}
            <View
              className={`h-8 w-8 items-center justify-center rounded-full border-2 border-white ${
                active ? "bg-white" : "bg-transparent"
              }`}
            >
              <Text
                className={`font-bold ${active ? "text-[#0EA5A4]" : "text-white"}`}
              >
                {stepNumber}
              </Text>
            </View>

            {/* Connecting Line */}
            {index !== totalSteps - 1 && (
              <View
                className={`mx-2 h-[2px] w-10 bg-white/40`}
              />
            )}
          </View>
        );
      })}
    </View>
  );
};
