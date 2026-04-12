import { View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export type PatientTab = 'chat' | 'health' | 'profile' | 'settings';

interface PatientBottomTabBarProps {
  activeTab: PatientTab;
}

interface TabConfig {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const TABS: Record<PatientTab, TabConfig> = {
  chat: {
    label: 'Chat',
    icon: 'chatbubble-ellipses-outline',
    activeIcon: 'chatbubble-ellipses',
    route: '/(tab)/chatScreen',
  },
  health: {
    label: 'Health',
    icon: 'heart-outline',
    activeIcon: 'heart',
    route: '/(tab)/health',
  },
  profile: {
    label: 'Profile',
    icon: 'person-outline',
    activeIcon: 'person',
    route: '/(tab)/profile',
  },
  settings: {
    label: 'Settings',
    icon: 'settings-outline',
    activeIcon: 'settings',
    route: '/(tab)/settings',
  },
};

export const PatientBottomTabBar = ({ activeTab }: PatientBottomTabBarProps) => {
  const router = useRouter();

  return (
    <View className="flex-row border-t border-gray-200 bg-white mb-7">
      {(Object.entries(TABS) as [PatientTab, TabConfig][]).map(([tabKey, tab]) => {
        const isActive = activeTab === tabKey;
        return (
          <Pressable
            key={tabKey}
            onPress={() => router.push(tab.route as never)}
            className="flex-1 items-center justify-center py-4"
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={24}
              color={isActive ? '#0AADA2' : '#9E9E9E'}
            />
            <Text
              className={`text-xs mt-1 font-medium ${
                isActive ? 'text-teal-600' : 'text-gray-500'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};