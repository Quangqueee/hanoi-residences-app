import { Redirect, Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/auth-context';

const TabUI = {
  primary: '#1E75FF',
  inactive: '#B0B6C3',
  surface: '#FFFFFF',
  shadow: '#0F172A',
} as const;

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = scheme === 'dark';

  if (!loading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  const bottomGap = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: TabUI.primary,
        tabBarInactiveTintColor: TabUI.inactive,
        tabBarStyle: {
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: bottomGap,
          height: 64,
          marginHorizontal: 4,
          borderRadius: 32,
          backgroundColor: isDark ? '#1C1C1E' : TabUI.surface,
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: 8,
          ...Platform.select({
            ios: {
              shadowColor: TabUI.shadow,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.14,
              shadowRadius: 20,
            },
            android: {
              elevation: 12,
            },
            default: {
              shadowColor: TabUI.shadow,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.14,
              shadowRadius: 20,
            },
          }),
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}>
      {/* 1. Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <SymbolView
              name={{ ios: 'house.fill', android: 'home', web: 'home' }}
              size={focused ? 26 : 24}
              tintColor={color}
              weight={focused ? 'bold' : 'regular'}
            />
          ),
        }}
      />

      {/* 2. Bookings */}
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Lịch hẹn',
          tabBarIcon: ({ color, focused }) => (
            <SymbolView
              name={{
                ios: 'calendar',
                android: 'calendar_month',
                web: 'calendar_month',
              }}
              size={focused ? 26 : 24}
              tintColor={color}
              weight={focused ? 'bold' : 'regular'}
            />
          ),
        }}
      />

      {/* 3. Search — center, emphasized */}
      <Tabs.Screen
        name="search"
        options={{
          title: 'Tìm kiếm',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: focused ? 52 : 48,
                height: focused ? 52 : 48,
                marginTop: -18,
                borderRadius: 26,
                backgroundColor: TabUI.primary,
                alignItems: 'center',
                justifyContent: 'center',
                ...Platform.select({
                  ios: {
                    shadowColor: TabUI.primary,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.35,
                    shadowRadius: 10,
                  },
                  android: { elevation: 6 },
                  default: {},
                }),
              }}>
              <SymbolView
                name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                size={focused ? 26 : 24}
                tintColor="#FFFFFF"
                weight="bold"
              />
            </View>
          ),
        }}
      />

      {/* 4. Favorites */}
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Yêu thích',
          tabBarIcon: ({ color, focused }) => (
            <SymbolView
              name={{
                ios: focused ? 'heart.fill' : 'heart',
                android: focused ? 'favorite' : 'favorite_border',
                web: focused ? 'favorite' : 'favorite_border',
              }}
              size={focused ? 26 : 24}
              tintColor={color}
              weight={focused ? 'bold' : 'regular'}
            />
          ),
        }}
      />

      {/* 5. Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, focused }) => (
            <SymbolView
              name={{
                ios: focused ? 'person.fill' : 'person',
                android: focused ? 'person' : 'person_outline',
                web: focused ? 'person' : 'person_outline',
              }}
              size={focused ? 26 : 24}
              tintColor={color}
              weight={focused ? 'bold' : 'regular'}
            />
          ),
        }}
      />

      {/* Hidden from tab bar — still reachable via router.push */}
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
