import { Tabs } from 'expo-router';
import { AppSymbol as SymbolView } from '@/components/app-symbol';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Hoteliq, TAB_BAR_BODY_HEIGHT } from '@/constants/theme';
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
  const { isLandlord } = useAuth();
  const insets = useSafeAreaInsets();

  const bookingsLabel = isLandlord ? 'Tòa nhà' : 'Đặt lịch';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: TabUI.active,
        tabBarInactiveTintColor: TabUI.inactive,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: TAB_BAR_BODY_HEIGHT + insets.bottom,
          backgroundColor: TabUI.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: Hoteliq.line,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderBottomWidth: 0,
          paddingTop: 8,
          paddingBottom: insets.bottom,
          paddingHorizontal: 6,
          ...Platform.select({
            ios: {
              shadowColor: TabUI.shadow,
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
            },
            android: {
              elevation: 12,
            },
            default: {
              shadowColor: TabUI.shadow,
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
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
              label="Trang chủ"
              ios={focused ? 'house.fill' : 'house'}
              android="Trang chủ"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: bookingsLabel,
          tabBarIcon: ({ focused }) => (
            <HoteliqTabIcon
              focused={focused}
              label={bookingsLabel}
              ios={
                isLandlord
                  ? focused
                    ? 'building.2.fill'
                    : 'building.2'
                  : 'calendar'
              }
              android={isLandlord ? 'apartment' : 'calendar_month'}
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
                width: focused ? 48 : 44,
                height: focused ? 48 : 44,
                borderRadius: 24,
                backgroundColor: Hoteliq.primary,
                alignItems: 'center',
                justifyContent: 'center',
                ...Platform.select({
                  ios: {
                    shadowColor: Hoteliq.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.28,
                    shadowRadius: 8,
                  },
                  android: { elevation: 4 },
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
              label="Yêu thích"
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
              label="Tài khoản"
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
