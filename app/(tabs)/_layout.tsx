import { router, Tabs } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';

function ActionButton() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Pressable accessibilityLabel="Aktionen öffnen" onPress={() => router.push('/actions')} style={({ pressed }) => ({ width: 54, height: 54, marginTop: -18, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderWidth: 4, borderColor: colors.surface, opacity: pressed ? 0.78 : 1, shadowColor: '#000000', shadowOpacity: 0.14, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } })}>
        <Symbol name="plus" size={24} color="#FFFFFF" />
      </Pressable>
      <Text style={{ marginTop: 2, color: colors.textMuted, fontSize: 9.5, fontWeight: '800' }}>Aktionen</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: colors.background }, headerTitleStyle: { color: colors.text, fontWeight: '900' }, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.textMuted, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 76, paddingTop: 5 }, tabBarLabelStyle: { fontSize: 9.5, fontWeight: '800' } }}>
      <Tabs.Screen name="index" options={{ title: 'Start', headerTitle: 'SparFlow', tabBarIcon: ({ color }) => <Symbol name="house.fill" size={20} color={color} /> }} />
      <Tabs.Screen name="goals" options={{ title: 'Bereiche', headerTitle: 'Sparbereiche', tabBarIcon: ({ color }) => <Symbol name="tray.full.fill" size={20} color={color} /> }} />
      <Tabs.Screen name="quick" options={{ title: '', headerShown: false, tabBarLabel: () => null, tabBarButton: () => <ActionButton /> }} />
      <Tabs.Screen name="challenges" options={{ title: 'Challenges', headerTitle: 'Challenges', tabBarIcon: ({ color }) => <Symbol name="flag.fill" size={20} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Einstellungen', headerTitle: 'Einstellungen', tabBarIcon: ({ color }) => <Symbol name="gearshape.fill" size={20} color={color} /> }} />
    </Tabs>
  );
}
