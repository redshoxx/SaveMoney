import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { Component, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';

import { applyNativeThemeMode, colors, setActiveColorScheme } from '@/constants/theme';
import { AppStoreProvider, useAppStore } from '@/store/app-store';
import { configureLocalNotifications, getLastNotificationUrl, subscribeToNotificationNavigation } from '@/utils/local-notifications';

class ReleaseErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Deliberately avoid persisting crash details: SparPilot contains personal financial notes.
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 }}>
        <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.danger, fontSize: 24, fontWeight: '900' }}>!</Text>
        </View>
        <Text selectable style={{ color: colors.text, fontSize: 21, fontWeight: '800', textAlign: 'center' }}>SparPilot konnte diese Ansicht nicht laden.</Text>
        <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20, textAlign: 'center' }}>Deine lokalen Spar-Daten wurden dadurch nicht gelöscht. Du kannst die Oberfläche erneut laden.</Text>
        <Pressable accessibilityRole="button" onPress={() => this.setState({ failed: false })} style={({ pressed }) => ({ minHeight: 48, paddingHorizontal: 20, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.76 : 1 })}>
          <Text selectable style={{ color: '#FFFFFF', fontWeight: '800' }}>Erneut versuchen</Text>
        </Pressable>
      </View>
    );
  }
}

function RootNavigator() {
  const store = useAppStore();
  const systemScheme = useColorScheme();
  const themeMode = store.preferences.themeMode;
  const resolvedScheme = themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeMode;

  setActiveColorScheme(resolvedScheme);

  useEffect(() => {
    applyNativeThemeMode(themeMode);
    return () => applyNativeThemeMode('system');
  }, [themeMode]);

  useEffect(() => {
    void configureLocalNotifications();
    const unsubscribe = subscribeToNotificationNavigation((url) => router.push(url as never));
    void getLastNotificationUrl().then((url) => {
      if (url) router.push(url as never);
    });
    return unsubscribe;
  }, []);

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
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: 'Einstellungen' }} />
        <Stack.Screen name="reminders" options={{ title: 'Erinnerungen' }} />
        <Stack.Screen name="actions" options={{ title: 'Weitere Funktionen', presentation: 'modal' }} />
        <Stack.Screen name="save" options={{ title: 'Sparen', presentation: 'modal' }} />
        <Stack.Screen name="goal-detail" options={{ title: 'Ziel' }} />
        <Stack.Screen name="month-details" options={{ title: 'Monatsplan' }} />
        <Stack.Screen name="add-goal" options={{ title: 'Neues Ziel', presentation: 'modal' }} />
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
    <ReleaseErrorBoundary>
      <AppStoreProvider>
        <RootNavigator />
      </AppStoreProvider>
    </ReleaseErrorBoundary>
  );
}
