import { router, Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { View } from 'react-native';

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
          borderTopColor: `${colors.primary}38`,
          borderTopWidth: 1,
          paddingTop: 5,
          boxShadow: `0 -8px 28px ${colors.glow}`,
        },
        tabBarItemStyle: { minHeight: 46 },
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
        name="quick"
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            router.push('/actions');
          },
        }}
        options={{
          title: '',
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <View
              style={{
                width: 48,
                height: 48,
                marginTop: -14,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
                borderWidth: 1,
                borderColor: `${colors.primaryDark}85`,
                boxShadow: `0 0 22px ${colors.primary}`,
              }}
            >
              <Symbol name="plus" size={20} color="#FFFFFF" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{ title: 'Challenges', tabBarIcon: ({ color }) => <Symbol name="trophy.fill" size={18} color={tabIconColor(color)} /> }}
      />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
