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
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 8.5, fontWeight: '700', paddingTop: 1 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 74,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarItemStyle: { minHeight: 56 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Start', tabBarIcon: ({ color }) => <Symbol name="house.fill" size={17} color={tabIconColor(color)} /> }} />
      <Tabs.Screen name="goals" options={{ title: 'Ziele', tabBarIcon: ({ color }) => <Symbol name="target" size={17} color={tabIconColor(color)} /> }} />
      <Tabs.Screen
        name="quick"
        listeners={{ tabPress: (event) => { event.preventDefault(); router.push({ pathname: '/save', params: { mode: 'save' } }); } }}
        options={{
          title: 'Sparen',
          tabBarIcon: () => (
            <View style={{ alignItems: 'center', marginTop: -12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.surface, boxShadow: '0 6px 16px rgba(0,0,0,0.20)' }}>
                <Symbol name="plus" size={19} color="#FFFFFF" />
              </View>
            </View>
          ),
          tabBarLabel: ({ focused }) => <Text selectable style={{ color: focused ? colors.primary : colors.textMuted, fontSize: 8.5, fontWeight: '800' }}>Sparen</Text>,
        }}
      />
      <Tabs.Screen name="todos" options={{ title: 'To Do', tabBarIcon: ({ color }) => <Symbol name="checklist" size={17} color={tabIconColor(color)} /> }} />
      <Tabs.Screen name="challenges" options={{ title: 'Challenge', tabBarIcon: ({ color }) => <Symbol name="trophy.fill" size={17} color={tabIconColor(color)} /> }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
