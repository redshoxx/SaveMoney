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
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: '900' },
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 6,
        },
        tabBarItemStyle: { minHeight: 48 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Start', headerTitle: 'SparFlow', tabBarIcon: ({ color }) => <Symbol name="house.fill" size={20} color={tabIconColor(color)} /> }}
      />
      <Tabs.Screen
        name="goals"
        options={{ title: 'Sparen', headerTitle: 'Sparen', tabBarIcon: ({ color }) => <Symbol name="target" size={20} color={tabIconColor(color)} /> }}
      />
      <Tabs.Screen
        name="challenges"
        options={{ title: 'Challenges', headerTitle: 'Challenges', tabBarIcon: ({ color }) => <Symbol name="flag.fill" size={20} color={tabIconColor(color)} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Einstellungen', headerTitle: 'Einstellungen', tabBarIcon: ({ color }) => <Symbol name="gearshape.fill" size={20} color={tabIconColor(color)} /> }}
      />
    </Tabs>
  );
}
