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
  try {
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
  } catch (error) {
    console.error('fetchCollaborators error:', error);
    throw error;
  }
}

function mapBookingDocs(
  snap: { docs: { id: string; data: () => Record<string, unknown> }[] },
  collectionName: BookingCollection,
): BookingRecord[] {
  return snap.docs.map((d) => ({
    id: d.id,
    _collection: collectionName,
    ...(d.data() as Omit<BookingRecord, 'id' | '_collection'>),
  }));
}

function sortBookingsNewest(list: BookingRecord[]): BookingRecord[] {
  return list.sort(
    (a, b) =>
      Math.max(toMillis(b.updatedAt), toMillis(b.createdAt)) -
      Math.max(toMillis(a.updatedAt), toMillis(a.createdAt)),
  );
}

/**
 * Admin CRM — list all 3 booking collections (Web `/[adminPath]/bookings`).
 */
export async function fetchAdminAllBookings(): Promise<BookingRecord[]> {
  try {
    const [users, ctv, guest] = await Promise.all([
      getDocs(collection(db, USER_BOOKINGS_COLLECTION)),
      getDocs(collection(db, CTV_BOOKINGS_COLLECTION)),
      getDocs(collection(db, GUEST_CONSULTATIONS_COLLECTION)),
    ]);

    return sortBookingsNewest([
      ...mapBookingDocs(users, USER_BOOKINGS_COLLECTION),
      ...mapBookingDocs(ctv, CTV_BOOKINGS_COLLECTION),
      ...mapBookingDocs(guest, GUEST_CONSULTATIONS_COLLECTION),
    ]);
  } catch (error) {
    console.error('fetchAdminAllBookings error:', error);
    throw error;
  }
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

  try {
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

      fetched.push(...mapBookingDocs(snap1, USER_BOOKINGS_COLLECTION));
      fetched.push(...mapBookingDocs(snap2, CTV_BOOKINGS_COLLECTION));
    } else if (role === 'collaborator') {
      const snap = await getDocs(
        query(
          collection(db, CTV_BOOKINGS_COLLECTION),
          where('ctvId', '==', uid),
        ),
      );
      fetched.push(...mapBookingDocs(snap, CTV_BOOKINGS_COLLECTION));
    } else {
      const snap = await getDocs(
        query(
          collection(db, USER_BOOKINGS_COLLECTION),
          where('userId', '==', uid),
        ),
      );
      fetched.push(...mapBookingDocs(snap, USER_BOOKINGS_COLLECTION));
    }

    return sortBookingsNewest(fetched);
  } catch (error) {
    console.error('fetchMyBookings error:', error);
    throw error;
  }
}

function getBookingNotifyRecipient(booking: BookingRecord): string | null {
  if (booking._collection === CTV_BOOKINGS_COLLECTION) {
    return booking.ctvId || null;
  }
  if (booking._collection === USER_BOOKINGS_COLLECTION) {
    return booking.userId || null;
  }
  return null;
}

/** Port of Web admin bookings `handleStatusChange` + notify. */
export async function updateBookingStatus(input: {
  collectionName: BookingCollection;
  bookingId: string;
  status: BookingStatus;
  booking?: BookingRecord;
}): Promise<void> {
  try {
    await updateDoc(doc(db, input.collectionName, input.bookingId), {
      status: input.status,
      updatedAt: serverTimestamp(),
    });

    const recipientId = input.booking
      ? getBookingNotifyRecipient(input.booking)
      : null;
    if (recipientId) {
      try {
        const label = getStatusMeta(String(input.status)).label;
        await createNotification({
          recipientId,
          title: 'Cập nhật trạng thái lịch hẹn',
          message: `Lịch hẹn của bạn cho căn ${input.booking?.apartmentCode || 'N/A'} đã được chuyển sang trạng thái ${label}.`,
          type: 'status_update',
          link: '/profile/bookings',
        });
      } catch (notifyError) {
        console.error('updateBookingStatus notify error:', notifyError);
      }
    }
  } catch (error) {
    console.error('updateBookingStatus error:', error);
    throw error;
  }
}

export async function updateBookingAdminNotes(input: {
  collectionName: BookingCollection;
  bookingId: string;
  adminNotes: string;
  booking?: BookingRecord;
}): Promise<void> {
  try {
    await updateDoc(doc(db, input.collectionName, input.bookingId), {
      adminNotes: input.adminNotes.trim(),
      updatedAt: serverTimestamp(),
    });

    const recipientId = input.booking
      ? getBookingNotifyRecipient(input.booking)
      : null;
    if (recipientId && input.adminNotes.trim()) {
      try {
        await createNotification({
          recipientId,
          title: 'Ghi chú mới từ Ban quản trị',
          message: `Lịch hẹn căn ${input.booking?.apartmentCode || 'N/A'}: ${input.adminNotes.trim()}`,
          type: 'status_update',
          link: '/profile/bookings',
        });
      } catch (notifyError) {
        console.error('updateBookingAdminNotes notify error:', notifyError);
      }
    }
  } catch (error) {
    console.error('updateBookingAdminNotes error:', error);
    throw error;
  }
}

/** Port of Web handleSaveChanges on profile/bookings. */
export async function updateBooking(input: UpdateBookingInput): Promise<void> {
  try {
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
  } catch (error) {
    console.error('updateBooking error:', error);
    throw error;
  }
}

async function safeNotifyAdmins(
  data: Parameters<typeof notifyAdmins>[0],
): Promise<void> {
  try {
    await notifyAdmins(data);
  } catch (error) {
    console.error('notifyAdmins (non-blocking):', error);
  }
}

async function safeCreateNotification(
  data: Parameters<typeof createNotification>[0],
): Promise<void> {
  try {
    await createNotification(data);
  } catch (error) {
    console.error('createNotification (non-blocking):', error);
  }
}

export async function createBooking(input: CreateBookingInput): Promise<void> {
  try {
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

      await safeNotifyAdmins({
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
          await safeCreateNotification({
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

      await safeNotifyAdmins({
        title: 'Lịch hẹn CTV mới',
        message: `CTV ${input.ctvName || 'Cộng tác viên'} đã đặt lịch dẫn khách ${input.clientName || 'khách hàng'} xem mã căn ${input.apartmentCode || 'N/A'}.`,
        type: 'new_booking',
        link: ADMIN_BOOKINGS_LINK,
      });

      if (input.ctvId) {
        await safeCreateNotification({
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

    await safeNotifyAdmins({
      title: 'Lịch hẹn mới từ khách hàng',
      message: `Khách ${input.name || 'Người dùng'} đã đặt lịch mới xem mã căn ${input.apartmentCode || 'N/A'}.`,
      type: 'new_booking',
      link: ADMIN_BOOKINGS_LINK,
    });

    if (input.userId) {
      await safeCreateNotification({
        recipientId: input.userId,
        title: 'Đặt lịch thành công',
        message: `Bạn đã đặt lịch hẹn thành công cho căn ${input.apartmentCode || 'N/A'}.`,
        type: 'new_booking',
        link: '/profile/bookings',
      });
    }
  } catch (error) {
    console.error('createBooking error:', error);
    throw error;
  }
}
