import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNotifications } from '@/hooks/use-notifications';
import {
  formatNotificationTime,
  getNotificationTypeLabel,
  getRoleNotificationHint,
  mapNotificationLinkToHref,
} from '@/lib/notification-display';
import type { AppNotification } from '@/lib/notifications';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user, role, roleLabel } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

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
      return (
        <Pressable
          onPress={() => void onPressItem(item)}
          style={({ pressed }) => [
            styles.item,
            {
              backgroundColor: unread
                ? colors.backgroundSelected
                : colors.backgroundElement,
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <View style={styles.itemHeader}>
            <ThemedText type="smallBold" style={styles.itemTitle}>
              {item.title}
            </ThemedText>
            {unread ? <View style={styles.dot} /> : null}
          </View>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {getNotificationTypeLabel(item.type)}
            {formatNotificationTime(item.createdAt)
              ? ` · ${formatNotificationTime(item.createdAt)}`
              : ''}
          </ThemedText>
          <ThemedText type="small" numberOfLines={3} style={styles.message}>
            {item.message}
          </ThemedText>
        </Pressable>
      );
    },
    [colors.backgroundElement, colors.backgroundSelected, onPressItem],
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <ThemedText type="subtitle">Thông báo</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {roleLabel ? `${roleLabel} · ` : ''}
              {unreadCount > 0
                ? `${unreadCount} chưa đọc`
                : 'Không có chưa đọc'}
            </ThemedText>
          </View>
          {unreadCount > 0 ? (
            <Pressable
              onPress={() => void markAllAsRead()}
              hitSlop={8}
              style={styles.markAll}>
              <ThemedText type="linkPrimary">Đọc tất cả</ThemedText>
            </Pressable>
          ) : null}
        </View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          {getRoleNotificationHint(role)}
        </ThemedText>

        {isLoading && notifications.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.text} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <ThemedText type="default">
                  {error
                    ? 'Không tải được thông báo.'
                    : 'Không có thông báo nào.'}
                </ThemedText>
                {error ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {error}
                  </ThemedText>
                ) : null}
              </View>
            }
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerText: { flex: 1, gap: Spacing.one },
  markAll: { paddingTop: Spacing.one },
  hint: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  list: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 100,
    gap: Spacing.two,
  },
  item: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  itemTitle: { flex: 1, fontSize: 15 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E53935',
  },
  message: { marginTop: Spacing.one, lineHeight: 20 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    paddingVertical: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
});
