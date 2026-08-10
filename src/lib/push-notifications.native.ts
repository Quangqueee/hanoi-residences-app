import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '@/firebase/app';
import { USERS_COLLECTION } from '@/lib/types';

const ANDROID_CHANNEL_ID = 'hanoi-residences-default';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Thông báo Hanoi Residences',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF385C',
  });
}

/**
 * Request permission + Expo push token.
 * Saves token to `/users/{uid}.expoPushToken` for future server push.
 */
export async function registerForPushNotificationsAsync(
  userId: string,
): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device.');
      return null;
    }

    await ensureAndroidChannel();

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Push notification permission not granted.');
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    let token: string | null = null;
    try {
      const push = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      token = push.data;
    } catch (error) {
      // Expo Go / missing EAS projectId — local notifications still work.
      console.warn('getExpoPushTokenAsync failed:', error);
    }

    if (token) {
      await setDoc(
        doc(db, USERS_COLLECTION, userId),
        {
          expoPushToken: token,
          expoPushTokenUpdatedAt: serverTimestamp(),
          expoPushPlatform: Platform.OS,
        },
        { merge: true },
      );
    }

    return token;
  } catch (error) {
    console.error('registerForPushNotificationsAsync failed:', error);
    return null;
  }
}

/** Local (device) notification — useful when Firestore delivers a new item. */
export async function presentLocalNotification(params: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    await ensureAndroidChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        data: params.data ?? {},
        sound: true,
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('presentLocalNotification failed:', error);
  }
}

export async function setAppBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(Math.max(0, count));
  } catch {
    // Badge unsupported on some platforms
  }
}
