import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

const BAR_COLOR = '#004AC6';
const SURFACE_COLOR = '#FFFFFF';
const INACTIVE_COLOR = BAR_COLOR;
const TAB_HORIZONTAL_PADDING = 12;

function ConcertixTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const tabBarWidth =
    state.routes.length * 56 +
    Math.max(0, state.routes.length - 1) * 24 +
    TAB_HORIZONTAL_PADDING * 2;

  return (
    <View style={[styles.bar, { height: 94 + insets.bottom }]}>
      <View
        style={[
          styles.tabRow,
          {
            bottom: insets.bottom + 22,
            left: '50%',
            width: tabBarWidth,
            marginLeft: -tabBarWidth / 2,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = options.title ?? route.name;
          const color = focused ? SURFACE_COLOR : INACTIVE_COLOR;
          const icon = options.tabBarIcon?.({ color, size: 25, focused });

          const onPress = () => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigateToTab(route.key);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={() =>
                emitter.emit({ type: 'tabLongPress', target: route.key })
              }
              style={styles.tabButton}
            >
              <View
                style={[
                  styles.iconContainer,
                  focused ? styles.activeIconContainer : styles.inactiveIconContainer,
                ]}
              >
                {icon}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <ConcertixTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BAR_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transaksi"
        options={{
          title: 'Transaksi',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'bag' : 'bag-outline'}
              size={size}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Akun',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={color as string}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: 'transparent',
  },
  tabRow: {
    position: 'absolute',
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: TAB_HORIZONTAL_PADDING,
    backgroundColor: SURFACE_COLOR,
    borderRadius: 36,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DBEAFE',
    shadowColor: BAR_COLOR,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  tabButton: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  activeIconContainer: {
    backgroundColor: BAR_COLOR,
  },
  inactiveIconContainer: {
    backgroundColor: SURFACE_COLOR,
  },
});
