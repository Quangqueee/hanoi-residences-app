import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { ShimmerBlock } from '@/components/ui/shimmer-block';
import { Hoteliq } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/hooks/use-notifications';
import {
  formatNotificationTime,
  getNotificationTypeLabel,
  getRoleNotificationHint,
  mapNotificationLinkToHref,
} from '@/lib/notification-display';
import type { AppNotification, NotificationType } from '@/lib/notifications';

const TAB_BAR_CLEARANCE = 108;

/** Icon per notification type — rendered in a chip-bg circle (Airbnb rows). */
const NOTIFICATION_ICONS: Record<
  NotificationType | 'default',
  { ios: string; android: string }
> = {
  new_booking: { ios: 'calendar', android: 'calendar_month' },
  status_update: { ios: 'arrow.triangle.2.circlepath', android: 'sync' },
  system: { ios: 'bell', android: 'notifications_none' },
  landlord_request: { ios: 'person.crop.circle', android: 'person' },
  landlord_approved: { ios: 'checkmark.seal', android: 'verified' },
  landlord_rejected: { ios: 'xmark.circle', android: 'cancel' },
  new_submission: { ios: 'house', android: 'home_work' },
  submission_reviewed: { ios: 'checkmark.seal', android: 'verified' },
  default: { ios: 'bell', android: 'notifications_none' },
};

function NotificationRowSkeleton() {
  return (
    <View className="flex-row items-start gap-3.5 py-4">
      <ShimmerBlock className="h-11 w-11 rounded-full" />
      <View className="min-w-0 flex-1 gap-2 pt-0.5">
        <ShimmerBlock className="h-3.5 w-[62%] rounded-md" />
        <ShimmerBlock className="h-3 w-[88%] rounded-md" />
        <ShimmerBlock className="h-2.5 w-[34%] rounded-md" />
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, role, roleLabel } = useAuth();

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications(user?.uid);

  const onPressItem = useCallback(
    async (item: AppNotification) => {
      if (!item.isRead) {
        await markAsRead(item.id);
      }
      router.push(mapNotificationLinkToHref(item.link));
    },
    [markAsRead, router],
  );

  const renderItem = useCallback(
    ({ item }: { item: AppNotification }) => {
      const unread = !item.isRead;
      const icon =
        NOTIFICATION_ICONS[item.type] ?? NOTIFICATION_ICONS.default;
      const time = formatNotificationTime(item.createdAt);

      return (
        <Pressable
          onPress={() => void onPressItem(item)}
          accessibilityRole="button"
          accessibilityLabel={item.title}
          className="min-h-[44px] flex-row items-start gap-3.5 py-4"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <View className="h-11 w-11 items-center justify-center rounded-full bg-hoteliq-chip">
            <SymbolView
              name={{
                ios: icon.ios as 'bell',
                android: icon.android as 'notifications_none',
                web: icon.android as 'notifications_none',
              }}
              size={20}
              tintColor={Hoteliq.ink}
              weight={unread ? 'semibold' : 'regular'}
            />
          </View>

          <View className="min-w-0 flex-1 gap-0.5 pt-0.5">
            <Text
              className={`text-[14px] leading-[18px] text-hoteliq-ink ${
                unread ? 'font-semibold' : 'font-normal'
              }`}
              numberOfLines={1}>
              {item.title}
            </Text>
            <Text
              className="text-[14px] leading-[18px] text-hoteliq-gray"
              numberOfLines={2}>
              {item.message}
            </Text>
            <Text
              className="pt-0.5 text-[12px] leading-4 text-hoteliq-gray"
              numberOfLines={1}>
              {getNotificationTypeLabel(item.type)}
              {time ? ` · ${time}` : ''}
            </Text>
          </View>

          {unread ? (
            <View className="mt-1.5 h-2 w-2 rounded-full bg-hoteliq-primary" />
          ) : null}
        </Pressable>
      );
    },
    [onPressItem],
  );

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <SafeAreaView edges={['bottom']} className="flex-1">
        {/* Page header — big Airbnb-style title */}
        <View className="flex-row items-start justify-between gap-2 px-6 pt-2">
          <View className="min-w-0 flex-1 gap-1">
            <Text className="text-[26px] font-semibold leading-[34px] text-hoteliq-ink">
              Thông báo
            </Text>
            <Text className="text-[14px] leading-[18px] text-hoteliq-gray">
              {roleLabel ? `${roleLabel} · ` : ''}
              {unreadCount > 0
                ? `${unreadCount} chưa đọc`
                : 'Không có chưa đọc'}
            </Text>
          </View>
          {unreadCount > 0 ? (
            <Pressable
              onPress={() => void markAllAsRead()}
              hitSlop={8}
              accessibilityRole="button"
              className="min-h-[44px] justify-center"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Text className="text-[14px] font-semibold text-hoteliq-ink underline">
                Đọc tất cả
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Text className="px-6 pb-2 pt-2 text-[12px] leading-4 text-hoteliq-gray">
          {getRoleNotificationHint(role)}
        </Text>

        {isLoading && notifications.length === 0 ? (
          <View className="px-6 pt-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <NotificationRowSkeleton key={`notif-sk-${i}`} />
            ))}
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 4,
              paddingBottom: TAB_BAR_CLEARANCE,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => (
              <View className="h-px bg-hoteliq-line" />
            )}
            ListEmptyComponent={
              <View className="mt-2 items-center gap-3 rounded-[12px] bg-hoteliq-chip px-7 py-10">
                <Text className="text-center text-[16px] font-semibold leading-[22px] text-hoteliq-ink">
                  {error
                    ? 'Không tải được thông báo.'
                    : 'Không có thông báo nào.'}
                </Text>
                {error ? (
                  <Text className="text-center text-[14px] leading-5 text-hoteliq-gray">
                    {error}
                  </Text>
                ) : null}
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}
