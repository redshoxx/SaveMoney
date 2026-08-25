import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { colors } from '@/constants/theme';
import { AppStoreProvider, useAppStore } from '@/store/app-store';

function RootNavigator() {
  const store = useAppStore();
  const systemScheme = useColorScheme();
  const themeMode = store.preferences.themeMode;
  const resolvedScheme = themeMode === 'system' ? (systemScheme ?? 'light') : themeMode;

  useEffect(() => {
    Appearance.setColorScheme(themeMode === 'system' ? null : themeMode);
  }, [themeMode]);

  return (
    <>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.background },
          contentStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="actions" options={{ title: 'Aktionen', presentation: 'modal' }} />
        <Stack.Screen name="save" options={{ title: 'Betrag ändern', presentation: 'modal' }} />
        <Stack.Screen name="add-goal" options={{ title: 'Neues Sparziel', presentation: 'modal' }} />
        <Stack.Screen name="add-challenge" options={{ title: 'Eigene Challenge', presentation: 'modal' }} />
        <Stack.Screen name="achievements" options={{ title: 'Erfolge' }} />
        <Stack.Screen name="statistics" options={{ title: 'Statistiken' }} />
        <Stack.Screen name="history" options={{ title: 'Sparverlauf' }} />
        <Stack.Screen name="rules" options={{ title: 'Sparregeln' }} />
        <Stack.Screen name="what-if" options={{ title: 'Was wäre wenn?' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppStoreProvider>
      <RootNavigator />
    </AppStoreProvider>
  );
}
