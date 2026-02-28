import React, { useState } from 'react';
import { View } from 'react-native';
import { SymptomChip } from './SymptomChip';
import {router} from 'expo-router';

const DEFAULT_SYMPTOMS = ['Headache', 'Stomach Pain', 'Fatigue', 'Nausea'];

interface SymptomGridProps {
  symptoms?: string[];
  onSymptomSelect?: (selected: string[]) => void;
}

export const SymptomGrid: React.FC<SymptomGridProps> = ({
  symptoms = DEFAULT_SYMPTOMS,
  onSymptomSelect,
}) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const handleChipPress = (label: string) => {
    const updated = selectedSymptoms.includes(label)
      ? selectedSymptoms.filter((s) => s !== label)
      : [...selectedSymptoms, label];
    setSelectedSymptoms(updated);
    onSymptomSelect?.(updated);
    router.push('/(tab)/chatScreen');
  };

  // Split symptoms into rows of 2
  const pairs: string[][] = [];
  for (let i = 0; i < symptoms.length; i += 2) {
    pairs.push(symptoms.slice(i, i + 2));
  }

  return (
    <View className="px-5 pt-8">
      {pairs.map((pair, rowIndex) => (
        <View key={rowIndex} className="flex-row justify-center mb-1">
          {pair.map((symptom, colIndex) => (
            <SymptomChip
              key={symptom}
              label={symptom}
              selected={selectedSymptoms.includes(symptom)}
              onPress={handleChipPress}
              delay={(rowIndex * 2 + colIndex) * 100 + 600}
            />
          ))}
        </View>
      ))}
    </View>
  );
};
