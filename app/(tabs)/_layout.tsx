import { router, Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { Text, View } from 'react-native';

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
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 9.5,
          fontWeight: '700',
          paddingTop: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 78,
          paddingTop: 7,
          paddingBottom: 9,
        },
        tabBarItemStyle: { minHeight: 58 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Start', tabBarIcon: ({ color }) => <Symbol name="house.fill" size={18} color={tabIconColor(color)} /> }}
      />
      <Tabs.Screen
        name="goals"
        options={{ title: 'Ziele', tabBarIcon: ({ color }) => <Symbol name="target" size={18} color={tabIconColor(color)} /> }}
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
          title: 'Sparen',
          tabBarIcon: () => (
            <View style={{ alignItems: 'center', gap: 2, marginTop: -15 }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primary,
                  borderWidth: 2,
                  borderColor: colors.surface,
                  boxShadow: '0 8px 18px rgba(0,0,0,0.24)',
                }}
              >
                <Symbol name="plus" size={21} color="#FFFFFF" />
              </View>
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? colors.primary : colors.textMuted, fontSize: 9.5, fontWeight: '800' }}>Sparen</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="todos"
        options={{ title: 'Aufgaben', tabBarIcon: ({ color }) => <Symbol name="checklist" size={18} color={tabIconColor(color)} /> }}
      />
      <Tabs.Screen
        name="challenges"
        options={{ title: 'Challenge', tabBarIcon: ({ color }) => <Symbol name="trophy.fill" size={18} color={tabIconColor(color)} /> }}
      />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
