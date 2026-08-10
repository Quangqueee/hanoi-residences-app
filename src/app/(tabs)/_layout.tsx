import { Redirect, Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Hoteliq } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

/** Airbnb-style tab bar: icon + label luôn hiện, active đỏ, inactive xám */
const TabUI = {
  active: Hoteliq.primaryDark,
  inactive: Hoteliq.muted,
  surface: '#FFFFFF',
  shadow: Hoteliq.shadow,
} as const;

function HoteliqTabIcon({
  focused,
  label,
  ios,
  android,
}: {
  focused: boolean;
  label: string;
  ios: string;
  android: string;
}) {
  const tint = focused ? TabUI.active : TabUI.inactive;
  return (
    <View
      style={{
        minWidth: 56,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
      }}>
      <SymbolView
        name={{
          ios: ios as 'house',
          android: android as 'home',
          web: android as 'home',
        }}
        size={24}
        tintColor={tint}
        weight={focused ? 'semibold' : 'regular'}
      />
      <Text
        style={{
          color: tint,
          fontSize: 10,
          lineHeight: 13,
          fontWeight: focused ? '600' : '400',
        }}
        numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();

  if (!loading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  const bottomGap = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: TabUI.active,
        tabBarInactiveTintColor: TabUI.inactive,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: bottomGap,
          height: 68,
          borderRadius: 28,
          backgroundColor: TabUI.surface,
          borderTopWidth: 0,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: Hoteliq.line,
          paddingTop: 10,
          paddingBottom: 10,
          paddingHorizontal: 6,
          ...Platform.select({
            ios: {
              shadowColor: TabUI.shadow,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
            },
            android: {
              elevation: 6,
            },
            default: {
              shadowColor: TabUI.shadow,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
            },
          }),
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <HoteliqTabIcon
              focused={focused}
              label="Home"
              ios={focused ? 'house.fill' : 'house'}
              android="home"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ focused }) => (
            <HoteliqTabIcon
              focused={focused}
              label="Schedule"
              ios="calendar"
              android="calendar_month"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: focused ? 52 : 48,
                height: focused ? 52 : 48,
                marginTop: -18,
                borderRadius: 26,
                backgroundColor: Hoteliq.primary,
                alignItems: 'center',
                justifyContent: 'center',
                ...Platform.select({
                  ios: {
                    shadowColor: Hoteliq.primary,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.32,
                    shadowRadius: 10,
                  },
                  android: { elevation: 5 },
                  default: {},
                }),
              }}>
              <SymbolView
                name={{
                  ios: 'magnifyingglass',
                  android: 'search',
                  web: 'search',
                }}
                size={focused ? 22 : 20}
                tintColor="#FFFFFF"
                weight="semibold"
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Saved',
          tabBarIcon: ({ focused }) => (
            <HoteliqTabIcon
              focused={focused}
              label="Saved"
              ios={focused ? 'bookmark.fill' : 'bookmark'}
              android={focused ? 'bookmark' : 'bookmark_border'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <HoteliqTabIcon
              focused={focused}
              label="Profile"
              ios={focused ? 'person.fill' : 'person'}
              android={focused ? 'person' : 'person_outline'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          title: 'Thông báo',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
