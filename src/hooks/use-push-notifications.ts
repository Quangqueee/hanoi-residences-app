import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/hooks/use-notifications';
import type { AppNotification } from '@/lib/notifications';
import {
  presentLocalNotification,
  registerForPushNotificationsAsync,
  setAppBadgeCount,
} from '@/lib/push-notifications';

function resolveNotificationRoute(link?: string): string | null {
  if (!link) return null;
  if (link.includes('/profile/bookings') || link.includes('bookings')) {
    return '/(tabs)/bookings';
  }
  if (link.includes('/profile/apartments') || link.includes('apartments')) {
    return '/profile/apartments';
  }
  if (link.includes('/ctv-register')) return '/ctv-register';
  if (link.includes('/partner-register')) return '/partner-register';
  if (link.includes('/admin/users')) return '/admin/users';
  if (link.includes('/admin/partners')) return '/admin/partners';
  if (link.includes('/admin/submissions')) return '/admin/submissions';
  if (link.includes('/admin/bookings') || link.includes('/admin/apartments')) {
    return '/admin';
  }
  const apt = link.match(/\/apartments\/([^/?#]+)/);
  if (apt?.[1]) return `/apartment/${apt[1]}`;
  return '/(tabs)/notifications';
}

/**
 * Registers Expo push when signed in, syncs badge, mirrors new
 * Firestore notifications as local push, and deep-links on tap.
 */
export function usePushNotifications() {
  const router = useRouter();
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
    if (Platform.OS === 'web') return;

    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as {
          link?: string;
        };
        const route = resolveNotificationRoute(data?.link);
        if (route) {
          router.push(route as never);
        }
      },
    );

    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    if (!user?.uid) {
      knownIdsRef.current = null;
      primedRef.current = false;
      return;
    }

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

    notifications.forEach((n) => known.add(n.id));
    knownIdsRef.current = known;
  }, [notifications, user?.uid]);
}
