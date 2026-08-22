import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/firebase/app';
import { ADMIN_PATH } from '@/lib/constants';
import { createNotification, notifyAdmins } from '@/lib/notifications';
import type { UserRole } from '@/lib/rbac';
import {
  APARTMENTS_COLLECTION,
  USERS_COLLECTION,
  type UserProfile,
} from '@/lib/types';

export type CtvRegisterInput = {
  uid: string;
  email?: string | null;
  displayName: string;
  phoneNumber: string;
  /** Năm sinh — field `dob` trên Web */
  dob: string;
  gender: string;
  introduction: string;
};

export type LandlordRequestInput = {
  displayName: string;
  phoneNumber: string;
  /** Chuỗi quận, ngăn cách bằng dấu phẩy (Web join) */
  district: string;
  message: string;
};

export type AdminUserRecord = UserProfile & {
  uid: string;
  email?: string;
};

export type PartnerRecord = {
  id: string;
  email?: string;
  role?: string;
  status?: 'pending' | 'approved' | 'rejected' | string;
  displayName?: string;
  phoneNumber?: string;
  district?: string;
  message?: string;
  submittedAt?: { seconds?: number; nanoseconds?: number } | null;
};

/** Port Web `ctv-register` — merge users/{uid}. */
export async function submitCtvRegistration(
  input: CtvRegisterInput,
): Promise<void> {
  try {
    await setDoc(
      doc(db, USERS_COLLECTION, input.uid),
      {
        uid: input.uid,
        email: input.email ?? '',
        displayName: input.displayName.trim(),
        phoneNumber: input.phoneNumber.trim(),
        dob: input.dob.trim(),
        gender: input.gender,
        ctvIntroduction: input.introduction.trim(),
        requestStatus: 'pending',
        requestSubmittedAt: serverTimestamp(),
      },
      { merge: true },
    );

    try {
      await notifyAdmins({
        title: 'Yêu cầu đăng ký CTV mới',
        message: `${input.displayName.trim() || input.email || 'Người dùng'} vừa gửi yêu cầu đăng ký trở thành CTV, cần xét duyệt.`,
        type: 'system',
        link: `/${ADMIN_PATH}/users`,
      });
    } catch (notifyError) {
      console.error('submitCtvRegistration notify:', notifyError);
    }
  } catch (error) {
    console.error('submitCtvRegistration error:', error);
    throw error;
  }
}

/** Port Web `createLandlordRequest` (landlord-actions). */
export async function submitLandlordRequest(
  uid: string,
  values: LandlordRequestInput,
): Promise<void> {
  try {
    const payload: LandlordRequestInput = {
      displayName: values.displayName.trim(),
      phoneNumber: values.phoneNumber.trim(),
      district: values.district.trim(),
      message: values.message.trim(),
    };

    await updateDoc(doc(db, USERS_COLLECTION, uid), {
      landlordApprovalStatus: 'pending',
      landlordRequestData: payload,
      landlordRequestSubmittedAt: Timestamp.now(),
    });

    try {
      await notifyAdmins({
        title: 'Yêu cầu đăng ký chủ nhà mới',
        message: `${payload.displayName} vừa gửi yêu cầu trở thành chủ nhà (khu vực ${payload.district}).`,
        type: 'landlord_request',
        link: `/${ADMIN_PATH}/partners`,
      });
    } catch (notifyError) {
      console.error('submitLandlordRequest notify:', notifyError);
    }
  } catch (error) {
    console.error('submitLandlordRequest error:', error);
    throw error;
  }
}

export async function fetchAdminUsers(): Promise<AdminUserRecord[]> {
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    const list = snap.docs.map((d) => ({
      uid: d.id,
      ...(d.data() as Omit<AdminUserRecord, 'uid'>),
    }));
    return list.sort((a, b) => {
      const ta =
        typeof a.createdAt === 'object' && a.createdAt && 'seconds' in a.createdAt
          ? Number(a.createdAt.seconds) || 0
          : 0;
      const tb =
        typeof b.createdAt === 'object' && b.createdAt && 'seconds' in b.createdAt
          ? Number(b.createdAt.seconds) || 0
          : 0;
      return tb - ta;
    });
  } catch (error) {
    console.error('fetchAdminUsers error:', error);
    throw error;
  }
}

export async function updateManageableUserRole(
  targetUid: string,
  nextRole: Extract<UserRole, 'user' | 'collaborator'>,
): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, targetUid), {
      role: nextRole,
      requestStatus: deleteField(),
    });
  } catch (error) {
    console.error('updateManageableUserRole error:', error);
    throw error;
  }
}

export async function approveCtvRequest(targetUid: string): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, targetUid), {
      role: 'collaborator',
      requestStatus: deleteField(),
    });
  } catch (error) {
    console.error('approveCtvRequest error:', error);
    throw error;
  }
}

/** Từ chối hồ sơ CTV — xóa requestStatus, giữ role hiện tại (thường là user). */
export async function rejectCtvRequest(targetUid: string): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, targetUid), {
      requestStatus: deleteField(),
    });
    try {
      await createNotification({
        recipientId: targetUid,
        title: 'Yêu cầu CTV bị từ chối',
        message:
          'Hồ sơ đăng ký cộng tác viên của bạn chưa được duyệt. Bạn có thể bổ sung thông tin và gửi lại sau.',
        type: 'system',
        link: '/ctv-register',
      });
    } catch (notifyError) {
      console.error('rejectCtvRequest notify:', notifyError);
    }
  } catch (error) {
    console.error('rejectCtvRequest error:', error);
    throw error;
  }
}

/** Port Web admin users — xóa doc `users/{uid}` (không xóa Auth). */
export async function deleteUserProfileDoc(targetUid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, targetUid));
  } catch (error) {
    console.error('deleteUserProfileDoc error:', error);
    throw error;
  }
}

export async function fetchPartners(): Promise<PartnerRecord[]> {
  try {
    const snap = await getDocs(
      query(
        collection(db, USERS_COLLECTION),
        where('landlordApprovalStatus', 'in', [
          'pending',
          'approved',
          'rejected',
        ]),
      ),
    );

    const partners = snap.docs.map((d) => {
      const data = d.data();
      const req = (data.landlordRequestData || {}) as LandlordRequestInput;
      const submitted = data.landlordRequestSubmittedAt as
        | { seconds?: number; nanoseconds?: number }
        | undefined;
      return {
        id: d.id,
        email: data.email as string | undefined,
        role: data.role as string | undefined,
        status: data.landlordApprovalStatus as PartnerRecord['status'],
        displayName: req.displayName,
        phoneNumber: req.phoneNumber,
        district: req.district,
        message: req.message,
        submittedAt: submitted
          ? { seconds: submitted.seconds, nanoseconds: submitted.nanoseconds }
          : null,
      };
    });

    return partners.sort(
      (a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0),
    );
  } catch (error) {
    console.error('fetchPartners error:', error);
    throw error;
  }
}

export async function approveLandlordPartner(targetUid: string): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, targetUid), {
      role: 'landlord',
      landlordApprovalStatus: 'approved',
    });
    try {
      await createNotification({
        recipientId: targetUid,
        title: 'Yêu cầu chủ nhà đã được duyệt',
        message:
          'Bạn đã được duyệt làm chủ nhà và có thể đăng tin căn hộ để admin xét duyệt.',
        type: 'landlord_approved',
        link: '/submit-apartment',
      });
    } catch (notifyError) {
      console.error('approveLandlordPartner notify:', notifyError);
    }
  } catch (error) {
    console.error('approveLandlordPartner error:', error);
    throw error;
  }
}

export async function rejectLandlordPartner(
  targetUid: string,
  reason?: string,
): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, targetUid), {
      landlordApprovalStatus: 'rejected',
      landlordRejectionReason: reason?.trim()
        ? reason.trim()
        : deleteField(),
    });
    try {
      await createNotification({
        recipientId: targetUid,
        title: 'Yêu cầu chủ nhà bị từ chối',
        message:
          reason?.trim() ||
          'Yêu cầu đăng ký chủ nhà của bạn đã bị từ chối.',
        type: 'landlord_rejected',
        link: '/partner-register',
      });
    } catch (notifyError) {
      console.error('rejectLandlordPartner notify:', notifyError);
    }
  } catch (error) {
    console.error('rejectLandlordPartner error:', error);
    throw error;
  }
}

/**
 * Port Web `terminatePartnershipAction`:
 * xóa tin landlordId + hạ role về user.
 */
export async function terminatePartnership(targetUid: string): Promise<number> {
  try {
    const snap = await getDocs(
      query(
        collection(db, APARTMENTS_COLLECTION),
        where('landlordId', '==', targetUid),
      ),
    );

    const ids = snap.docs.map((d) => d.id);
    for (let i = 0; i < ids.length; i += 400) {
      const chunk = ids.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach((id) => {
        batch.delete(doc(db, APARTMENTS_COLLECTION, id));
      });
      await batch.commit();
    }

    await updateDoc(doc(db, USERS_COLLECTION, targetUid), {
      role: 'user',
      landlordApprovalStatus: 'rejected',
      landlordRejectionReason:
        'Hợp tác đã bị chấm dứt và thu hồi bởi Quản trị viên.',
      landlordRequestData: deleteField(),
      landlordRequestSubmittedAt: deleteField(),
    });

    try {
      await createNotification({
        recipientId: targetUid,
        title: 'Hợp tác đã bị chấm dứt',
        message:
          'Tư cách chủ nhà của bạn đã bị thu hồi và toàn bộ tin đăng căn hộ đã được gỡ bỏ bởi quản trị viên.',
        type: 'landlord_rejected',
        link: '/',
      });
    } catch (notifyError) {
      console.error('terminatePartnership notify:', notifyError);
    }

    return ids.length;
  } catch (error) {
    console.error('terminatePartnership error:', error);
    throw error;
  }
}
