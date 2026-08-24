import { Tabs } from 'expo-router';

import { Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontWeight: '800' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#8B958C',
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.97)',
          borderTopColor: colors.border,
          height: 82,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '800' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Heute',
          headerTitle: 'SparFlow',
          tabBarIcon: ({ color }) => <Symbol name="house.fill" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Sparen',
          headerTitle: 'Sparen',
          tabBarIcon: ({ color }) => <Symbol name="banknote.fill" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Einstellungen',
          headerTitle: 'Einstellungen',
          tabBarIcon: ({ color }) => <Symbol name="gearshape.fill" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          href: null,
          title: 'Challenges',
        }}
      />
    </Tabs>
  );
}
