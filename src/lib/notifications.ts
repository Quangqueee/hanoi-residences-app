import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/firebase/app';
import { USERS_COLLECTION } from '@/lib/types';

export type NotificationType =
  | 'new_booking'
  | 'status_update'
  | 'system'
  | 'landlord_request'
  | 'landlord_approved'
  | 'landlord_rejected'
  | 'new_submission'
  | 'submission_reviewed';

export type CreateNotificationInput = {
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string;
};

/** Ported from Web `use-notifications.ts` / notification-bell. */
export type AppNotification = {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link: string;
  createdAt?: {
    seconds?: number;
    nanoseconds?: number;
    toDate?: () => Date;
  } | null;
};

export const NOTIFICATIONS_COLLECTION = 'notifications';

/** Ported from Web `notifications.ts` — keep Firestore shape in sync. */
export async function createNotification(data: CreateNotificationInput) {
  try {
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      recipientId: data.recipientId,
      title: data.title,
      message: data.message,
      type: data.type,
      isRead: false,
      link: data.link,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Lỗi tạo thông báo:', error);
  }
}

export async function notifyAdmins(
  data: Omit<CreateNotificationInput, 'recipientId'>,
) {
  try {
    const adminsSnap = await getDocs(
      query(collection(db, USERS_COLLECTION), where('role', '==', 'admin')),
    );
    await Promise.all(
      adminsSnap.docs.map((adminDoc) =>
        createNotification({ ...data, recipientId: adminDoc.id }),
      ),
    );
  } catch (error) {
    console.error('Lỗi gửi thông báo cho admin:', error);
  }
}

export async function markNotificationAsRead(notificationId: string) {
  await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), {
    isRead: true,
  });
}

export async function markNotificationsAsRead(notificationIds: string[]) {
  if (notificationIds.length === 0) return;
  const batch = writeBatch(db);
  notificationIds.forEach((id) => {
    batch.update(doc(db, NOTIFICATIONS_COLLECTION, id), { isRead: true });
  });
  await batch.commit();
}
