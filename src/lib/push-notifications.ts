/**
 * Web stub — Expo push is native-focused; avoid importing expo-notifications
 * into web SSR/client paths where it can be unstable.
 */
export async function registerForPushNotificationsAsync(
  _userId: string,
): Promise<string | null> {
  return null;
}

export async function presentLocalNotification(_params: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  // no-op on web
}

export async function setAppBadgeCount(_count: number): Promise<void> {
  // no-op on web
}

export async function ensureAndroidChannel(): Promise<void> {
  // no-op on web
}
