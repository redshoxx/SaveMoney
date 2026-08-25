import { router, Tabs } from 'expo-router';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { Symbol } from '@/components/ui';
import { colors } from '@/constants/theme';

function ActionButton() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Pressable
        accessibilityLabel="Aktionen öffnen"
        onPress={() => router.push('/actions')}
        style={({ pressed }) => ({
          width: 54,
          height: 54,
          marginTop: -18,
          borderRadius: 27,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
          borderWidth: 4,
          borderColor: colors.surface,
          opacity: pressed ? 0.78 : 1,
          shadowColor: '#000000',
          shadowOpacity: 0.18,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        })}>
        <Symbol name="plus" size={24} color="#FFFFFF" />
      </Pressable>
      <Text style={{ marginTop: 2, color: colors.textMuted, fontSize: 10, fontWeight: '800' }}>Aktionen</Text>
    </View>
  );
}

export default function TabsLayout() {
  useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontWeight: '900', color: colors.text },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 74,
          paddingTop: 5,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Start',
          headerTitle: 'SparFlow',
          tabBarIcon: ({ color }) => <Symbol name="house.fill" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: '',
          headerTitle: 'Sparbereiche',
          tabBarLabel: () => null,
          tabBarButton: () => <ActionButton />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Einstellungen',
          headerTitle: 'Einstellungen',
          tabBarIcon: ({ color }) => <Symbol name="gearshape.fill" size={21} color={color} />,
        }}
      />
      <Tabs.Screen name="challenges" options={{ href: null, title: 'Challenges' }} />
    </Tabs>
  );
}
