import { Redirect, Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Hoteliq } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

const TabUI = {
  active: Hoteliq.primary,
  inactive: '#A0A0A0',
  soft: Hoteliq.primarySoft,
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
  if (focused) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: TabUI.soft,
          borderRadius: 22,
          paddingHorizontal: 12,
          paddingVertical: 8,
          minHeight: 40,
        }}>
        <SymbolView
          name={{
            ios: ios as 'house.fill',
            android: android as 'home',
            web: android as 'home',
          }}
          size={18}
          tintColor={TabUI.active}
          weight="semibold"
        />
        <Text
          style={{
            color: TabUI.active,
            fontSize: 12,
            fontWeight: '600',
          }}
          numberOfLines={1}>
          {label}
        </Text>
      </View>
    );
  }

  return (
    <SymbolView
      name={{
        ios: ios as 'house',
        android: android as 'home',
        web: android as 'home',
      }}
      size={22}
      tintColor={TabUI.inactive}
      weight="regular"
    />
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
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.08,
              shadowRadius: 24,
            },
            android: {
              elevation: 8,
            },
            default: {
              shadowColor: TabUI.shadow,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.08,
              shadowRadius: 24,
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
                backgroundColor: TabUI.active,
                alignItems: 'center',
                justifyContent: 'center',
                ...Platform.select({
                  ios: {
                    shadowColor: TabUI.active,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.28,
                    shadowRadius: 14,
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
