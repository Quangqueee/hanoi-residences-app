import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/app';
import { ADMIN_PATH } from '@/lib/constants';
import { notifyAdmins } from '@/lib/notifications';
import { USERS_COLLECTION } from '@/lib/types';

/** Yêu cầu xóa tài khoản (App Store / Play) — đánh dấu + báo admin. */
export async function requestAccountDeletion(input: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, input.uid), {
      accountDeletionRequestedAt: serverTimestamp(),
      accountDeletionStatus: 'pending',
    });

    try {
      await notifyAdmins({
        title: 'Yêu cầu xóa tài khoản',
        message: `${input.displayName || input.email || input.uid} vừa yêu cầu xóa tài khoản app. Cần xử lý Auth + dữ liệu liên quan.`,
        type: 'system',
        link: `/${ADMIN_PATH}/users`,
      });
    } catch (notifyError) {
      console.error('requestAccountDeletion notify:', notifyError);
    }
  } catch (error) {
    console.error('requestAccountDeletion error:', error);
    throw error;
  }
}
