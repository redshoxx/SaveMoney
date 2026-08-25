import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';

function tabIconColor(color: ColorValue) {
  return typeof color === 'string' ? color : colors.textMuted;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 4,
        },
        tabBarItemStyle: { minHeight: 44 },
        tabBarLabelStyle: { fontSize: 9.5, fontWeight: '800' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Start', tabBarIcon: ({ color }) => <Symbol name="house.fill" size={18} color={tabIconColor(color)} /> }}
      />
      <Tabs.Screen
        name="goals"
        options={{ title: 'Sparen', tabBarIcon: ({ color }) => <Symbol name="target" size={18} color={tabIconColor(color)} /> }}
      />
      <Tabs.Screen
        name="challenges"
        options={{ title: 'Challenges', tabBarIcon: ({ color }) => <Symbol name="flag.fill" size={18} color={tabIconColor(color)} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Einstellungen', tabBarIcon: ({ color }) => <Symbol name="gearshape.fill" size={18} color={tabIconColor(color)} /> }}
      />
    </Tabs>
  );
}
