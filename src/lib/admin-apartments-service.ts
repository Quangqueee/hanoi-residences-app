import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { deleteObject, ref as storageRef } from 'firebase/storage';

import { db, storage } from '@/firebase/app';
import { consumeApartmentDeleteQuota } from '@/lib/apartment-delete-quota';
import {
  ADMIN_APARTMENTS_PAGE_SIZE,
  MAX_APARTMENT_IMAGES,
} from '@/lib/constants';
import {
  CTV_BOOKINGS_COLLECTION,
  GUEST_CONSULTATIONS_COLLECTION,
  USER_BOOKINGS_COLLECTION,
} from '@/lib/bookings-service';
import { createNotification } from '@/lib/notifications';
import {
  generateSearchKeywords,
  matchesAllSearchTokens,
  planApartmentTextSearch,
} from '@/lib/search-keywords';
import type {
  AiContent,
  Apartment,
  ApartmentStatus,
  FeatureTag,
  RoomType,
  SubmissionStatus,
} from '@/lib/types';
import { APARTMENTS_COLLECTION, USERS_COLLECTION } from '@/lib/types';

export type AdminApartmentInput = {
  title: string;
  sourceCode: string;
  roomType: RoomType;
  district: string;
  area: number;
  price: number;
  details: string;
  address: string;
  landlordPhoneNumber: string;
  commission?: string;
  status?: ApartmentStatus;
  tags?: FeatureTag[];
  imageUrls: string[];
  aiContent?: AiContent | null;
};

export type AdminDashboardStats = {
  totalApartments: number;
  totalUsers: number;
  pendingBookings: number;
  pendingCtvRequests: number;
  pendingSubmissions: number;
};

export type LandlordAptStats = {
  pending: number;
  published: number;
  rejected: number;
  total: number;
};

export type ReviewUpdates = {
  sourceCode?: string;
  address?: string;
  landlordPhoneNumber?: string;
  adminNotes?: string;
  aiContent?: AiContent;
};

function mapApartment(
  id: string,
  data: Record<string, unknown>,
): Apartment {
  return { id, ...(data as Omit<Apartment, 'id'>) };
}

function validateAdminPayload(payload: AdminApartmentInput): void {
  if (!payload.title?.trim() || payload.title.trim().length < 5) {
    throw new Error('Tiêu đề cần ít nhất 5 ký tự.');
  }
  if (!payload.district?.trim()) throw new Error('Vui lòng chọn quận.');
  if (!payload.area || payload.area < 1) {
    throw new Error('Diện tích phải lớn hơn 0.');
  }
  if (payload.price == null || Number.isNaN(payload.price) || payload.price < 0) {
    throw new Error('Giá không hợp lệ.');
  }
  if (!payload.details?.trim() || payload.details.trim().length < 10) {
    throw new Error('Mô tả quá ngắn.');
  }
  if (!payload.imageUrls?.length) {
    throw new Error('Cần ít nhất 1 hình ảnh.');
  }
  if (payload.imageUrls.length > MAX_APARTMENT_IMAGES) {
    throw new Error(`Tối đa ${MAX_APARTMENT_IMAGES} hình ảnh.`);
  }
}

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    const [apt, users, ctv, pendingSub, ...bookingCounts] = await Promise.all([
      getCountFromServer(collection(db, APARTMENTS_COLLECTION)),
      getCountFromServer(collection(db, USERS_COLLECTION)),
      getCountFromServer(
        query(
          collection(db, USERS_COLLECTION),
          where('requestStatus', '==', 'pending'),
        ),
      ),
      getCountFromServer(
        query(
          collection(db, APARTMENTS_COLLECTION),
          where('submissionStatus', '==', 'pending'),
        ),
      ),
      ...[
        USER_BOOKINGS_COLLECTION,
        CTV_BOOKINGS_COLLECTION,
        GUEST_CONSULTATIONS_COLLECTION,
      ].map((name) =>
        getCountFromServer(
          query(collection(db, name), where('status', '==', 'pending')),
        ),
      ),
    ]);

    return {
      totalApartments: apt.data().count,
      totalUsers: users.data().count,
      pendingCtvRequests: ctv.data().count,
      pendingSubmissions: pendingSub.data().count,
      pendingBookings: bookingCounts.reduce((s, c) => s + c.data().count, 0),
    };
  } catch (error) {
    console.error('fetchAdminDashboardStats error:', error);
    throw error;
  }
}

export async function fetchAllApartmentsForAdmin(): Promise<Apartment[]> {
  try {
    const snap = await getDocs(
      query(collection(db, APARTMENTS_COLLECTION), orderBy('createdAt', 'desc')),
    );
    return snap.docs.map((d) =>
      mapApartment(d.id, d.data() as Record<string, unknown>),
    );
  } catch (error) {
    console.error('fetchAllApartmentsForAdmin error:', error);
    throw error;
  }
}

export type AdminApartmentStatusFilter = 'all' | SubmissionStatus;

export type AdminApartmentListQuery = {
  status: AdminApartmentStatusFilter;
  searchQuery?: string;
};

export type AdminApartmentsPageResult = {
  apartments: Apartment[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
};

function buildAdminListWhere(
  filters: AdminApartmentListQuery,
): { constraints: QueryConstraint[]; searchTokens: string[] } {
  const searchPlan = filters.searchQuery?.trim()
    ? planApartmentTextSearch(filters.searchQuery)
    : null;

  const constraints: QueryConstraint[] = [];
  if (filters.status !== 'all') {
    constraints.push(where('submissionStatus', '==', filters.status));
  }
  if (searchPlan?.firestoreValue) {
    constraints.push(
      where('searchKeywords', 'array-contains', searchPlan.firestoreValue),
    );
  }
  return { constraints, searchTokens: searchPlan?.tokens ?? [] };
}

export async function countAdminApartments(
  filters: AdminApartmentListQuery,
): Promise<number> {
  try {
    const { constraints } = buildAdminListWhere(filters);
    const snap = await getCountFromServer(
      query(
        collection(db, APARTMENTS_COLLECTION),
        ...constraints,
        orderBy('createdAt', 'desc'),
      ),
    );
    return snap.data().count;
  } catch (error) {
    console.error('countAdminApartments error:', error);
    throw error;
  }
}

export async function fetchAdminApartmentsPage(
  filters: AdminApartmentListQuery,
  cursor?: QueryDocumentSnapshot<DocumentData> | null,
  pageSize: number = ADMIN_APARTMENTS_PAGE_SIZE,
): Promise<AdminApartmentsPageResult> {
  try {
    const { constraints, searchTokens } = buildAdminListWhere(filters);
    const hasSearch = searchTokens.length > 0;
    const fetchLimit = hasSearch ? pageSize * 3 : pageSize;

    const pageConstraints: QueryConstraint[] = [
      ...constraints,
      orderBy('createdAt', 'desc'),
    ];
    if (cursor) pageConstraints.push(startAfter(cursor));
    pageConstraints.push(limit(fetchLimit));

    const snapshot = await getDocs(
      query(collection(db, APARTMENTS_COLLECTION), ...pageConstraints),
    );

    let apartments = snapshot.docs.map((d) =>
      mapApartment(d.id, d.data() as Record<string, unknown>),
    );
    if (hasSearch) {
      apartments = apartments.filter((apt) =>
        matchesAllSearchTokens(apt, searchTokens),
      );
    }

    const pageApartments = apartments.slice(0, pageSize);
    const lastVisible = snapshot.docs[snapshot.docs.length - 1] ?? null;

    return {
      apartments: pageApartments,
      lastDoc: lastVisible,
      hasMore: snapshot.size >= fetchLimit,
    };
  } catch (error) {
    console.error('fetchAdminApartmentsPage error:', error);
    throw error;
  }
}

export async function fetchPendingSubmissions(): Promise<Apartment[]> {
  try {
    const snap = await getDocs(
      query(
        collection(db, APARTMENTS_COLLECTION),
        where('submissionStatus', '==', 'pending'),
        orderBy('createdAt', 'desc'),
      ),
    );
    return snap.docs.map((d) =>
      mapApartment(d.id, d.data() as Record<string, unknown>),
    );
  } catch (error) {
    console.error('fetchPendingSubmissions error:', error);
    throw error;
  }
}

export async function getAdminApartmentById(
  apartmentId: string,
): Promise<Apartment | null> {
  try {
    const snap = await getDoc(doc(db, APARTMENTS_COLLECTION, apartmentId));
    if (!snap.exists()) return null;
    return mapApartment(snap.id, snap.data() as Record<string, unknown>);
  } catch (error) {
    console.error('getAdminApartmentById error:', error);
    throw error;
  }
}

export async function createAdminApartment(
  payload: AdminApartmentInput,
): Promise<string> {
  try {
    validateAdminPayload(payload);
    const now = Timestamp.now();
    const searchKeywords = generateSearchKeywords(
      `${payload.title} ${payload.address} ${payload.sourceCode}`.trim(),
    );

    const docRef = await addDoc(collection(db, APARTMENTS_COLLECTION), {
      title: payload.title.trim(),
      sourceCode: payload.sourceCode.trim(),
      roomType: payload.roomType,
      district: payload.district,
      area: payload.area,
      price: payload.price,
      details: payload.details.trim(),
      address: payload.address.trim(),
      landlordPhoneNumber: payload.landlordPhoneNumber.trim(),
      commission: payload.commission || '',
      contactPhone: payload.landlordPhoneNumber.trim(),
      status: payload.status || 'available',
      tags: payload.tags || [],
      imageUrls: payload.imageUrls,
      aiContent: payload.aiContent || null,
      searchKeywords,
      submissionStatus: 'published',
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('createAdminApartment error:', error);
    throw error;
  }
}

export async function updateAdminApartment(
  apartmentId: string,
  payload: AdminApartmentInput,
): Promise<void> {
  try {
    validateAdminPayload(payload);
    const searchKeywords = generateSearchKeywords(
      `${payload.title} ${payload.address} ${payload.sourceCode}`.trim(),
    );

    await updateDoc(doc(db, APARTMENTS_COLLECTION, apartmentId), {
      title: payload.title.trim(),
      sourceCode: payload.sourceCode.trim(),
      roomType: payload.roomType,
      district: payload.district,
      area: payload.area,
      price: payload.price,
      details: payload.details.trim(),
      address: payload.address.trim(),
      landlordPhoneNumber: payload.landlordPhoneNumber.trim(),
      commission: payload.commission || '',
      contactPhone: payload.landlordPhoneNumber.trim(),
      status: payload.status || 'available',
      tags: payload.tags || [],
      imageUrls: payload.imageUrls,
      aiContent: payload.aiContent || null,
      searchKeywords,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('updateAdminApartment error:', error);
    throw error;
  }
}

async function deleteApartmentImages(urls: string[]): Promise<void> {
  await Promise.all(
    urls.map(async (url) => {
      try {
        await deleteObject(storageRef(storage, url));
      } catch (error: unknown) {
        const code =
          error && typeof error === 'object' && 'code' in error
            ? String((error as { code: string }).code)
            : '';
        if (code !== 'storage/object-not-found') {
          console.error(`Failed to delete image: ${url}`, error);
        }
      }
    }),
  );
}

export async function deleteAdminApartment(
  actorUid: string,
  apartmentId: string,
): Promise<void> {
  try {
    const quota = await consumeApartmentDeleteQuota(db, actorUid);
    if (!quota.ok) {
      throw new Error(quota.error);
    }

    const apt = await getAdminApartmentById(apartmentId);
    if (!apt) throw new Error('Không tìm thấy căn hộ.');

    if (apt.imageUrls?.length) {
      await deleteApartmentImages(apt.imageUrls);
    }
    await deleteDoc(doc(db, APARTMENTS_COLLECTION, apartmentId));
  } catch (error) {
    console.error('deleteAdminApartment error:', error);
    throw error;
  }
}

export async function pushApartment(apartmentId: string): Promise<void> {
  try {
    const now = Timestamp.now();
    await updateDoc(doc(db, APARTMENTS_COLLECTION, apartmentId), {
      updatedAt: now,
      createdAt: now,
    });
  } catch (error) {
    console.error('pushApartment error:', error);
    throw error;
  }
}

export async function pushApartmentsBatch(ids: string[]): Promise<number> {
  try {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (uniqueIds.length === 0) {
      throw new Error('Chưa chọn căn hộ nào.');
    }
    if (uniqueIds.length > 500) {
      throw new Error('Tối đa 500 căn hộ mỗi lần đẩy.');
    }

    const now = Date.now();
    const CHUNK = 450;
    for (let i = 0; i < uniqueIds.length; i += CHUNK) {
      const chunk = uniqueIds.slice(i, i + CHUNK);
      const batch = writeBatch(db);
      chunk.forEach((id, chunkIndex) => {
        const globalIndex = i + chunkIndex;
        const ts = Timestamp.fromMillis(now + (uniqueIds.length - globalIndex));
        batch.update(doc(db, APARTMENTS_COLLECTION, id), {
          updatedAt: ts,
          createdAt: ts,
        });
      });
      await batch.commit();
    }
    return uniqueIds.length;
  } catch (error) {
    console.error('pushApartmentsBatch error:', error);
    throw error;
  }
}

export async function reviewApartmentSubmission(
  apartmentId: string,
  decision: 'published' | 'rejected',
  updates?: ReviewUpdates,
): Promise<void> {
  try {
    const apartment = await getAdminApartmentById(apartmentId);
    if (!apartment) throw new Error('Không tìm thấy tin đăng.');

    const patch: Record<string, unknown> = {
      submissionStatus: decision,
      updatedAt: Timestamp.now(),
    };
    if (updates?.sourceCode != null) patch.sourceCode = updates.sourceCode;
    if (updates?.address != null) patch.address = updates.address;
    if (updates?.landlordPhoneNumber != null) {
      patch.landlordPhoneNumber = updates.landlordPhoneNumber;
    }
    if (updates?.adminNotes != null) patch.adminNotes = updates.adminNotes;
    if (updates?.aiContent != null) patch.aiContent = updates.aiContent;

    if (decision === 'published' && updates?.sourceCode) {
      patch.searchKeywords = generateSearchKeywords(
        `${apartment.title} ${updates.address || apartment.address || ''} ${updates.sourceCode}`.trim(),
      );
    }

    await updateDoc(doc(db, APARTMENTS_COLLECTION, apartmentId), patch);

    if (apartment.landlordId) {
      try {
        await createNotification({
          recipientId: apartment.landlordId,
          title:
            decision === 'published'
              ? 'Tin đăng của bạn đã được duyệt'
              : 'Tin đăng của bạn bị từ chối',
          message:
            updates?.adminNotes ||
            (decision === 'published'
              ? `Tin đăng "${apartment.title}" đã được đăng công khai.`
              : `Tin đăng "${apartment.title}" đã bị từ chối.`),
          type: 'submission_reviewed',
          link:
            decision === 'published'
              ? `/apartments/${apartmentId}`
              : '/profile/apartments',
        });
      } catch (notifyError) {
        console.error('reviewApartmentSubmission notify:', notifyError);
      }
    }
  } catch (error) {
    console.error('reviewApartmentSubmission error:', error);
    throw error;
  }
}

export async function backfillSubmissionStatus(): Promise<number> {
  try {
    const snap = await getDocs(collection(db, APARTMENTS_COLLECTION));
    const toBackfill = snap.docs.filter((d) => !d.data().submissionStatus);
    const CHUNK = 400;
    for (let i = 0; i < toBackfill.length; i += CHUNK) {
      const chunk = toBackfill.slice(i, i + CHUNK);
      const batch = writeBatch(db);
      chunk.forEach((d) => {
        batch.update(d.ref, { submissionStatus: 'published' });
      });
      await batch.commit();
    }
    return toBackfill.length;
  } catch (error) {
    console.error('backfillSubmissionStatus error:', error);
    throw error;
  }
}

export async function getLandlordApartmentStats(
  landlordId: string,
): Promise<LandlordAptStats> {
  try {
    const snap = await getDocs(
      query(
        collection(db, APARTMENTS_COLLECTION),
        where('landlordId', '==', landlordId),
      ),
    );
    let pending = 0;
    let published = 0;
    let rejected = 0;
    snap.forEach((d) => {
      const status = d.data().submissionStatus;
      if (status === 'pending') pending++;
      else if (status === 'published') published++;
      else if (status === 'rejected') rejected++;
    });
    return { pending, published, rejected, total: snap.size };
  } catch (error) {
    console.error('getLandlordApartmentStats error:', error);
    throw error;
  }
}
