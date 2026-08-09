import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/hooks/use-notifications';
import type { AppNotification } from '@/lib/notifications';
import {
  presentLocalNotification,
  registerForPushNotificationsAsync,
  setAppBadgeCount,
} from '@/lib/push-notifications';

/**
 * Registers Expo push when signed in, syncs badge, and mirrors new
 * Firestore notifications as local push while the app is open.
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications(user?.uid);
  const knownIdsRef = useRef<Set<string> | null>(null);
  const primedRef = useRef(false);

  useEffect(() => {
    if (!user?.uid || Platform.OS === 'web') return;
    void registerForPushNotificationsAsync(user.uid);
  }, [user?.uid]);

  useEffect(() => {
    void setAppBadgeCount(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    if (!user?.uid) {
      knownIdsRef.current = null;
      primedRef.current = false;
      return;
    }

    // First snapshot: seed known IDs without firing local pushes.
    if (!primedRef.current) {
      knownIdsRef.current = new Set(notifications.map((n) => n.id));
      primedRef.current = true;
      return;
    }

    const known = knownIdsRef.current ?? new Set<string>();
    const newcomers = notifications.filter(
      (n) => !known.has(n.id) && !n.isRead,
    );

    newcomers.forEach((n: AppNotification) => {
      void presentLocalNotification({
        title: n.title,
        body: n.message,
        data: {
          notificationId: n.id,
          link: n.link,
          type: n.type,
        },
      });
      known.add(n.id);
    });

    // Keep set updated with current page
    notifications.forEach((n) => known.add(n.id));
    knownIdsRef.current = known;
  }, [notifications, user?.uid]);
}
