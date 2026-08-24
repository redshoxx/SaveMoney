import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/constants/theme';
import { AppStoreProvider } from '@/store/app-store';

export default function RootLayout() {
  return (
    <AppStoreProvider>
      <StatusBar style="dark" />
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
        <Stack.Screen name="save" options={{ title: 'Schnell sparen', presentation: 'modal' }} />
        <Stack.Screen name="add-goal" options={{ title: 'Neues Sparziel', presentation: 'modal' }} />
        <Stack.Screen name="add-challenge" options={{ title: 'Eigene Challenge', presentation: 'modal' }} />
        <Stack.Screen name="achievements" options={{ title: 'Erfolge' }} />
        <Stack.Screen name="statistics" options={{ title: 'Statistiken' }} />
        <Stack.Screen name="history" options={{ title: 'Sparverlauf' }} />
        <Stack.Screen name="rules" options={{ title: 'Sparregeln' }} />
        <Stack.Screen name="what-if" options={{ title: 'Was wäre wenn?' }} />
        <Stack.Screen name="widget-preview" options={{ title: 'Widget' }} />
      </Stack>
    </AppStoreProvider>
  );
}
