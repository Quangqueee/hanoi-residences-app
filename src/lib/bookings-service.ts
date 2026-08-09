import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import { db } from '@/firebase/app';
import { createNotification, notifyAdmins } from '@/lib/notifications';
import type { UserRole } from '@/lib/rbac';
import { USERS_COLLECTION } from '@/lib/types';
import { getApartmentShareUrl, ADMIN_BOOKINGS_LINK } from '@/lib/share-apartment';

/** Collections đồng bộ Web booking-widget.tsx — không dùng collection `bookings`. */
export const USER_BOOKINGS_COLLECTION = 'user_bookings';
export const CTV_BOOKINGS_COLLECTION = 'ctv_bookings';

export type AdminBookingMode = 'personal' | 'assign_ctv';

export type CollaboratorOption = {
  uid: string;
  displayName: string;
  phoneNumber: string;
};

export type CreateBookingInput = {
  role: UserRole;
  apartmentId: string;
  apartmentCode?: string;
  apartmentTitle?: string;
  bookingDate: string; // YYYY-MM-DD
  bookingTime?: string; // HH:mm
  notes?: string;
  budget?: string;

  // User personal
  name?: string;
  phone?: string;
  userId?: string;

  // CTV lead client
  clientName?: string;
  clientPhone?: string;
  consultationPrice?: string;
  ctvId?: string;
  ctvName?: string;
  ctvPhone?: string;

  // Admin
  adminMode?: AdminBookingMode;
  createdByAdminId?: string;
};

function toDateTime(bookingDate: string, bookingTime?: string): string {
  return bookingTime ? `${bookingDate}T${bookingTime}` : bookingDate;
}

export async function fetchCollaborators(): Promise<CollaboratorOption[]> {
  const snap = await getDocs(
    query(collection(db, USERS_COLLECTION), where('role', '==', 'collaborator')),
  );

  return snap.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      uid: docSnap.id,
      displayName: String(data.displayName || data.email || 'CTV'),
      phoneNumber: String(data.phoneNumber || ''),
    };
  });
}

export async function createBooking(input: CreateBookingInput): Promise<void> {
  const dateTime = toDateTime(input.bookingDate, input.bookingTime);
  const apartmentLink = getApartmentShareUrl(input.apartmentId);

  const base = {
    apartmentId: input.apartmentId,
    apartmentCode: input.apartmentCode || '',
    apartmentLink,
    notes: input.notes?.trim() || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: input.role === 'admin' ? 'approved' : 'pending',
  };

  if (input.role === 'admin') {
    if (input.adminMode === 'assign_ctv') {
      await addDoc(collection(db, CTV_BOOKINGS_COLLECTION), {
        ...base,
        ctvId: input.ctvId || 'manual_entry',
        ctvName: input.ctvName || 'Chưa rõ',
        ctvPhone: input.ctvPhone || 'N/A',
        address: input.apartmentTitle || '',
        consultationPrice: input.consultationPrice || '',
        clientName: input.clientName || '',
        clientPhone: input.clientPhone || '',
        budget: input.budget || '',
        dateTime,
        createdByAdminId: input.createdByAdminId,
      });

      if (input.ctvId && input.ctvId !== 'manual_entry') {
        await createNotification({
          recipientId: input.ctvId,
          title: 'Lịch hẹn mới được gán',
          message: `Admin đã gán lịch dẫn khách xem mã căn ${input.apartmentCode || 'N/A'}.`,
          type: 'new_booking',
          link: '/profile/bookings',
        });
      }
      return;
    }

    // Admin personal / private client → user_bookings
    await addDoc(collection(db, USER_BOOKINGS_COLLECTION), {
      ...base,
      name: input.clientName || input.name || '',
      phone: input.clientPhone || input.phone || '',
      budget: input.budget || '',
      consultationPrice: input.consultationPrice || '',
      dateTime,
      isExternal: true,
      createdByAdminId: input.createdByAdminId,
    });
    return;
  }

  if (input.role === 'collaborator') {
    await addDoc(collection(db, CTV_BOOKINGS_COLLECTION), {
      ...base,
      ctvId: input.ctvId,
      ctvName: input.ctvName || 'Cộng tác viên',
      ctvPhone: input.ctvPhone || 'N/A',
      address: input.apartmentTitle || '',
      consultationPrice: input.consultationPrice || '',
      clientName: input.clientName || '',
      clientPhone: input.clientPhone || '',
      budget: input.budget || '',
      dateTime,
    });

    await notifyAdmins({
      title: 'Lịch hẹn CTV mới',
      message: `CTV ${input.ctvName || 'Cộng tác viên'} đã đặt lịch dẫn khách ${input.clientName || 'khách hàng'} xem mã căn ${input.apartmentCode || 'N/A'}.`,
      type: 'new_booking',
      link: ADMIN_BOOKINGS_LINK,
    });

    if (input.ctvId) {
      await createNotification({
        recipientId: input.ctvId,
        title: 'Đặt lịch thành công',
        message: `Bạn đã đặt lịch hẹn thành công cho căn ${input.apartmentCode || 'N/A'}.`,
        type: 'new_booking',
        link: '/profile/bookings',
      });
    }
    return;
  }

  // Default: regular user
  await addDoc(collection(db, USER_BOOKINGS_COLLECTION), {
    ...base,
    userId: input.userId,
    name: input.name || '',
    phone: input.phone || '',
    budget: input.budget || '',
    dateTime,
  });

  await notifyAdmins({
    title: 'Lịch hẹn mới từ khách hàng',
    message: `Khách ${input.name || 'Người dùng'} đã đặt lịch mới xem mã căn ${input.apartmentCode || 'N/A'}.`,
    type: 'new_booking',
    link: ADMIN_BOOKINGS_LINK,
  });

  if (input.userId) {
    await createNotification({
      recipientId: input.userId,
      title: 'Đặt lịch thành công',
      message: `Bạn đã đặt lịch hẹn thành công cho căn ${input.apartmentCode || 'N/A'}.`,
      type: 'new_booking',
      link: '/profile/bookings',
    });
  }
}
