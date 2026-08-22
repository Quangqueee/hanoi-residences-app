import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { db } from '@/firebase/app';
import {
  NOTIFICATIONS_COLLECTION,
  markNotificationAsRead,
  markNotificationsAsRead,
  type AppNotification,
} from '@/lib/notifications';

/**
 * Realtime notifications for the signed-in user.
 * Query uses `recipientId` (Web schema) — not a separate `userId` field.
 */
export function useNotifications(userId?: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setNotifications(
          snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as AppNotification,
          ),
        );
        setIsLoading(false);
      },
      (err) => {
        console.error('Lỗi lắng nghe thông báo:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Không tải được thông báo. Kiểm tra Firestore index nếu cần.',
        );
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userId]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (err) {
      console.error('Lỗi cập nhật thông báo đã đọc:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;
    try {
      await markNotificationsAsRead(unreadIds);
    } catch (err) {
      console.error('Lỗi đánh dấu tất cả đã đọc:', err);
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
  };
}
