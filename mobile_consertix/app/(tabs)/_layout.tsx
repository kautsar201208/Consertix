import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 90 : 75,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 10,
          elevation: 20,
          shadowColor: colors.text,
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: -4 },
          shadowRadius: 16,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? [styles.activeTabContainer, { backgroundColor: colors.text }] : styles.inactiveTabContainer}>
              <Ionicons
                size={22}
                name={focused ? 'home' : 'home-outline'}
                color={focused ? colors.background : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? [styles.activeTabContainer, { backgroundColor: colors.text }] : styles.inactiveTabContainer}>
              <Ionicons
                size={22}
                name={focused ? 'person' : 'person-outline'}
                color={focused ? colors.background : color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeTabContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  inactiveTabContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
