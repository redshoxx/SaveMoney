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
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarItemStyle: { minHeight: 50 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Start', tabBarIcon: ({ color }) => <Symbol name="house.fill" size={19} color={tabIconColor(color)} /> }}
      />
      <Tabs.Screen
        name="goals"
        options={{ title: 'Sparen', tabBarIcon: ({ color }) => <Symbol name="target" size={19} color={tabIconColor(color)} /> }}
      />
      <Tabs.Screen
        name="quick"
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            router.push({ pathname: '/save', params: { mode: 'save' } });
          },
        }}
        options={{
          title: '',
          tabBarIcon: () => (
            <View
              style={{
                width: 52,
                height: 52,
                marginTop: -15,
                borderRadius: 26,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
                borderWidth: 2,
                borderColor: colors.surface,
                boxShadow: '0 8px 18px rgba(0,0,0,0.28)',
              }}
            >
              <Symbol name="plus" size={21} color="#FFFFFF" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{ title: 'Challenges', tabBarIcon: ({ color }) => <Symbol name="trophy.fill" size={19} color={tabIconColor(color)} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Profil', tabBarIcon: ({ color }) => <Symbol name="person" size={19} color={tabIconColor(color)} /> }}
      />
    </Tabs>
  );
}
