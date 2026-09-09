import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ActivityIndicator, View } from 'react-native';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';

export const unstable_settings = {
  anchor: 'login',
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();

  // Redirect based on auth state
  useEffect(() => {
    if (!loading) {
      if (isLoggedIn) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoggedIn, loading]);

  const customDefaultTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: '#111844',
      background: '#ffffff',
      card: '#ffffff',
      text: '#111844',
      border: '#11184420',
    },
  };

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: '#ffffff',
      background: '#111844',
      card: '#111844',
      text: '#ffffff',
      border: '#ffffff20',
    },
  };

  // Loading state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#111844' : '#ffffff' }}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#ffffff' : '#111844'} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? customDarkTheme : customDefaultTheme}>
      <Stack initialRouteName="login">
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="event/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
