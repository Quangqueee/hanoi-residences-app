import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '@/firebase/app';
import { createNotification, notifyAdmins } from '@/lib/notifications';
import type { UserRole } from '@/lib/rbac';
import { USERS_COLLECTION } from '@/lib/types';
import { getApartmentShareUrl, ADMIN_BOOKINGS_LINK } from '@/lib/share-apartment';

/** Collections đồng bộ Web booking-widget.tsx — không dùng `bookings`. */
export const USER_BOOKINGS_COLLECTION = 'user_bookings';
export const CTV_BOOKINGS_COLLECTION = 'ctv_bookings';
export const GUEST_CONSULTATIONS_COLLECTION = 'guest_consultations';

export type BookingCollection =
  | typeof USER_BOOKINGS_COLLECTION
  | typeof CTV_BOOKINGS_COLLECTION
  | typeof GUEST_CONSULTATIONS_COLLECTION;

export type BookingStatus =
  | 'pending'
  | 'approved'
  | 'contacted'
  | 'failed'
  | string;

export type AdminBookingMode = 'personal' | 'assign_ctv';

export type CollaboratorOption = {
  uid: string;
  displayName: string;
  phoneNumber: string;
};

export type BookingRecord = {
  id: string;
  _collection: BookingCollection;
  apartmentId?: string;
  apartmentCode?: string;
  apartmentLink?: string;
  address?: string;
  clientName?: string;
  clientPhone?: string;
  consultationPrice?: string;
  name?: string;
  phone?: string;
  budget?: string;
  dateTime?: string;
  notes?: string;
  adminNotes?: string;
  status: BookingStatus;
  userId?: string;
  ctvId?: string;
  ctvName?: string;
  ctvPhone?: string;
  createdByAdminId?: string;
  isExternal?: boolean;
  createdAt?: Timestamp | { seconds?: number; toMillis?: () => number };
  updatedAt?: Timestamp | { seconds?: number; toMillis?: () => number };
};

export type CreateBookingInput = {
  role: UserRole | null;
  isGuest?: boolean;
  apartmentId: string;
  apartmentCode?: string;
  apartmentTitle?: string;
  bookingDate: string; // YYYY-MM-DD
  bookingTime?: string; // HH:mm
  notes?: string;
  budget?: string;

  // User personal / guest
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

export type UpdateBookingInput = {
  collectionName: BookingCollection;
  bookingId: string;
  bookingDate: string;
  bookingTime?: string;
  notes?: string;
  budget?: string;
  consultationPrice?: string;
  /** user_bookings / guest */
  name?: string;
  phone?: string;
  /** ctv_bookings */
  clientName?: string;
  clientPhone?: string;
};

function toDateTime(bookingDate: string, bookingTime?: string): string {
  return bookingTime ? `${bookingDate}T${bookingTime}` : bookingDate;
}

function toMillis(
  value: BookingRecord['createdAt'] | BookingRecord['updatedAt'],
): number {
  if (!value) return 0;
  if (typeof (value as Timestamp).toMillis === 'function') {
    return (value as Timestamp).toMillis();
  }
  if (typeof value.seconds === 'number') {
    return value.seconds * 1000;
  }
  return 0;
}

export function formatBookingTimeDisplay(dtStr?: string): string {
  if (!dtStr) return 'Chưa xác định';
  try {
    if (dtStr.includes('T')) {
      const [datePart, timePart] = dtStr.split('T');
      const [y, m, d] = (datePart ?? '').split('-');
      if (!y || !m || !d) return dtStr;
      return `${timePart ?? ''} ${d}/${m}/${y}`.trim();
    }
    const [y, m, d] = dtStr.split('-');
    if (!y || !m || !d) return dtStr;
    return `Cả ngày ${d}/${m}/${y}`;
  } catch {
    return dtStr;
  }
}

export function getBookingCustomer(booking: BookingRecord): {
  name: string;
  phone: string;
} {
  if (booking._collection === CTV_BOOKINGS_COLLECTION) {
    return {
      name: booking.clientName?.trim() || '—',
      phone: booking.clientPhone?.trim() || '—',
    };
  }
  return {
    name: booking.name?.trim() || booking.clientName?.trim() || '—',
    phone: booking.phone?.trim() || booking.clientPhone?.trim() || '—',
  };
}

export function getStatusMeta(status: string): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'pending':
      return {
        label: 'CHỜ DUYỆT',
        bg: '#FEF3C7',
        text: '#92400E',
        border: '#FDE68A',
      };
    case 'approved':
      return {
        label: 'ĐÃ DUYỆT',
        bg: '#DBEAFE',
        text: '#1E40AF',
        border: '#BFDBFE',
      };
    case 'contacted':
      return {
        label: 'ĐÃ DẪN KHÁCH',
        bg: '#DCFCE7',
        text: '#166534',
        border: '#BBF7D0',
      };
    case 'failed':
      return {
        label: 'KHÔNG THÀNH CÔNG',
        bg: '#FEE2E2',
        text: '#991B1B',
        border: '#FECACA',
      };
    default:
      return {
        label: 'CHỜ XỬ LÝ',
        bg: '#F3F4F6',
        text: '#374151',
        border: '#E5E7EB',
      };
  }
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

/**
 * List bookings for current user — mirrors Web profile/bookings/page.tsx.
 * Guest has no list (no uid).
 */
export async function fetchMyBookings(input: {
  uid: string;
  role: UserRole | null | undefined;
}): Promise<BookingRecord[]> {
  const { uid, role } = input;
  const fetched: BookingRecord[] = [];

  if (role === 'admin') {
    const [snap1, snap2] = await Promise.all([
      getDocs(
        query(
          collection(db, USER_BOOKINGS_COLLECTION),
          where('createdByAdminId', '==', uid),
        ),
      ),
      getDocs(
        query(
          collection(db, CTV_BOOKINGS_COLLECTION),
          where('ctvId', '==', uid),
        ),
      ),
    ]);

    snap1.docs.forEach((d) =>
      fetched.push({
        id: d.id,
        _collection: USER_BOOKINGS_COLLECTION,
        ...(d.data() as Omit<BookingRecord, 'id' | '_collection'>),
      }),
    );
    snap2.docs.forEach((d) =>
      fetched.push({
        id: d.id,
        _collection: CTV_BOOKINGS_COLLECTION,
        ...(d.data() as Omit<BookingRecord, 'id' | '_collection'>),
      }),
    );
  } else if (role === 'collaborator') {
    const snap = await getDocs(
      query(
        collection(db, CTV_BOOKINGS_COLLECTION),
        where('ctvId', '==', uid),
      ),
    );
    snap.docs.forEach((d) =>
      fetched.push({
        id: d.id,
        _collection: CTV_BOOKINGS_COLLECTION,
        ...(d.data() as Omit<BookingRecord, 'id' | '_collection'>),
      }),
    );
  } else {
    const snap = await getDocs(
      query(
        collection(db, USER_BOOKINGS_COLLECTION),
        where('userId', '==', uid),
      ),
    );
    snap.docs.forEach((d) =>
      fetched.push({
        id: d.id,
        _collection: USER_BOOKINGS_COLLECTION,
        ...(d.data() as Omit<BookingRecord, 'id' | '_collection'>),
      }),
    );
  }

  return fetched.sort(
    (a, b) =>
      Math.max(toMillis(b.updatedAt), toMillis(b.createdAt)) -
      Math.max(toMillis(a.updatedAt), toMillis(a.createdAt)),
  );
}

/** Port of Web handleSaveChanges on profile/bookings. */
export async function updateBooking(input: UpdateBookingInput): Promise<void> {
  const dateTime = toDateTime(input.bookingDate, input.bookingTime);
  const ref = doc(db, input.collectionName, input.bookingId);

  let payload: Record<string, unknown> = {
    dateTime,
    notes: input.notes ?? '',
    budget: input.budget ?? '',
    updatedAt: Timestamp.now(),
  };

  if (input.collectionName === CTV_BOOKINGS_COLLECTION) {
    payload = {
      ...payload,
      clientName: input.clientName ?? '',
      clientPhone: input.clientPhone ?? '',
      consultationPrice: input.consultationPrice ?? '',
    };
  } else {
    payload = {
      ...payload,
      name: input.name ?? '',
      phone: input.phone ?? '',
      consultationPrice: input.consultationPrice ?? '',
    };
  }

  await updateDoc(ref, payload);
}

export async function createBooking(input: CreateBookingInput): Promise<void> {
  const dateTime = toDateTime(input.bookingDate, input.bookingTime);
  const apartmentLink = getApartmentShareUrl(input.apartmentId);
  const isGuest = input.isGuest || (!input.userId && !input.role);

  const base = {
    apartmentId: input.apartmentId,
    apartmentCode: input.apartmentCode || '',
    apartmentLink,
    notes: input.notes?.trim() || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: input.role === 'admin' ? 'approved' : 'pending',
  };

  // Guest vãng lai → guest_consultations (Web booking-widget)
  if (isGuest || !input.role) {
    await addDoc(collection(db, GUEST_CONSULTATIONS_COLLECTION), {
      ...base,
      name: input.name || '',
      phone: input.phone || '',
      budget: input.budget || '',
      dateTime,
    });

    await notifyAdmins({
      title: 'Khách vãng lai đặt lịch tư vấn',
      message: `Khách ${input.name || 'vãng lai'} (SĐT: ${input.phone || 'N/A'}) đã đặt lịch mới xem mã căn ${input.apartmentCode || 'N/A'}.`,
      type: 'new_booking',
      link: ADMIN_BOOKINGS_LINK,
    });
    return;
  }

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

  // Regular user
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
