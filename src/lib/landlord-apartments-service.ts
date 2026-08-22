import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';

import { db, storage } from '@/firebase/app';
import { ADMIN_PATH, MAX_APARTMENT_IMAGES } from '@/lib/constants';
import { notifyAdmins } from '@/lib/notifications';
import { generateSearchKeywords } from '@/lib/search-keywords';
import type {
  Apartment,
  ApartmentStatus,
  LandlordApartmentInput,
  UploadedImage,
} from '@/lib/types';
import { APARTMENTS_COLLECTION, USERS_COLLECTION } from '@/lib/types';

const UPLOAD_RETRY_COUNT = 3;

function buildSearchKeywords(input: {
  title: string;
  district: string;
  sourceCode?: string;
  address?: string;
}): string[] {
  return generateSearchKeywords(
    [input.title, input.address || input.district, input.sourceCode || '']
      .filter(Boolean)
      .join(' '),
  );
}

function mapApartmentDoc(
  id: string,
  data: Record<string, unknown>,
): Apartment {
  return {
    id,
    ...(data as Omit<Apartment, 'id'>),
  };
}

async function assertIsLandlord(uid: string): Promise<void> {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snap.exists() || snap.data().role !== 'landlord') {
    throw new Error('Chỉ chủ nhà đã được duyệt mới có thể đăng tin.');
  }
}

async function uploadBlobWithRetry(
  blob: Blob,
  path: string,
  contentType: string,
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < UPLOAD_RETRY_COUNT; attempt++) {
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob, { contentType });
      return await getDownloadURL(storageRef);
    } catch (error) {
      lastError = error;
      if (attempt < UPLOAD_RETRY_COUNT - 1) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('Không thể tải ảnh lên máy chủ.');
}

/** Upload local picks → Storage `apartments/{ts}-{id}.jpg`. */
export async function uploadApartmentImages(
  images: UploadedImage[],
): Promise<string[]> {
  if (images.length === 0) {
    throw new Error('Cần ít nhất 1 hình ảnh.');
  }
  if (images.length > MAX_APARTMENT_IMAGES) {
    throw new Error(`Tối đa ${MAX_APARTMENT_IMAGES} hình ảnh.`);
  }

  try {
    const urls: string[] = [];
    for (const image of images) {
      if (image.uri.startsWith('http://') || image.uri.startsWith('https://')) {
        urls.push(image.uri);
        continue;
      }

      const response = await fetch(image.uri);
      const blob = await response.blob();
      const contentType =
        image.mimeType || blob.type || 'image/jpeg';
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const path = `apartments/${id}.jpg`;
      urls.push(await uploadBlobWithRetry(blob, path, contentType));
    }
    return urls;
  } catch (error) {
    console.error('uploadApartmentImages error:', error);
    throw error instanceof Error
      ? error
      : new Error('Không tải được ảnh lên. Vui lòng thử lại.');
  }
}

export async function fetchMyLandlordApartments(
  landlordId: string,
): Promise<Apartment[]> {
  try {
    const snap = await getDocs(
      query(
        collection(db, APARTMENTS_COLLECTION),
        where('landlordId', '==', landlordId),
      ),
    );

    const list = snap.docs.map((d) =>
      mapApartmentDoc(d.id, d.data() as Record<string, unknown>),
    );

    return list.sort((a, b) => {
      const ta = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
      const tb = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
      return tb - ta;
    });
  } catch (error) {
    console.error('fetchMyLandlordApartments error:', error);
    throw error;
  }
}

export async function getLandlordApartmentById(
  apartmentId: string,
  landlordId: string,
): Promise<Apartment | null> {
  try {
    const snap = await getDoc(doc(db, APARTMENTS_COLLECTION, apartmentId));
    if (!snap.exists()) return null;
    const apt = mapApartmentDoc(
      snap.id,
      snap.data() as Record<string, unknown>,
    );
    if (apt.landlordId !== landlordId) return null;
    return apt;
  } catch (error) {
    console.error('getLandlordApartmentById error:', error);
    throw error;
  }
}

function validateLandlordPayload(payload: LandlordApartmentInput): void {
  if (!payload.title?.trim() || payload.title.trim().length < 5) {
    throw new Error('Tiêu đề cần ít nhất 5 ký tự.');
  }
  if (!payload.district?.trim()) {
    throw new Error('Vui lòng chọn quận.');
  }
  if (!payload.area || payload.area < 1) {
    throw new Error('Diện tích phải lớn hơn 0.');
  }
  if (payload.price == null || Number.isNaN(payload.price) || payload.price < 0) {
    throw new Error('Giá không hợp lệ.');
  }
  if (!payload.details?.trim() || payload.details.trim().length < 20) {
    throw new Error('Mô tả cần ít nhất 20 ký tự.');
  }
  if (!payload.contactPhone?.trim() || payload.contactPhone.trim().length < 8) {
    throw new Error('Số điện thoại không hợp lệ.');
  }
  if (!payload.imageUrls?.length) {
    throw new Error('Cần ít nhất 1 hình ảnh.');
  }
  if (payload.imageUrls.length > MAX_APARTMENT_IMAGES) {
    throw new Error(`Tối đa ${MAX_APARTMENT_IMAGES} hình ảnh.`);
  }
  for (const url of payload.imageUrls) {
    if (
      !url ||
      url.startsWith('blob:') ||
      url.startsWith('data:') ||
      url.startsWith('file:')
    ) {
      throw new Error('Ảnh chưa được tải lên máy chủ.');
    }
  }
}

/** Port Web `submitApartmentByLandlord` — create. */
export async function createLandlordApartment(
  uid: string,
  payload: LandlordApartmentInput,
): Promise<string> {
  try {
    await assertIsLandlord(uid);
    validateLandlordPayload(payload);

    const now = Timestamp.now();
    const searchKeywords = buildSearchKeywords({
      title: payload.title,
      district: payload.district,
      address: payload.district,
    });

    const docRef = await addDoc(collection(db, APARTMENTS_COLLECTION), {
      title: payload.title.trim(),
      roomType: payload.roomType,
      district: payload.district,
      area: payload.area,
      price: payload.price,
      details: payload.details.trim(),
      commission: payload.commission || '',
      contactPhone: payload.contactPhone.trim(),
      imageUrls: payload.imageUrls,
      sourceCode: '',
      address: payload.district,
      landlordPhoneNumber: payload.contactPhone.trim(),
      status: payload.status || 'available',
      submissionStatus: 'pending',
      landlordId: uid,
      aiContent: payload.aiContent || null,
      tags: [],
      searchKeywords,
      createdAt: now,
      updatedAt: now,
    });

    try {
      await notifyAdmins({
        title: 'Tin đăng mới cần duyệt',
        message: `Chủ nhà vừa gửi tin đăng "${payload.title.trim()}" - ${payload.district} chờ duyệt.`,
        type: 'new_submission',
        link: `/${ADMIN_PATH}/submissions`,
      });
    } catch (notifyError) {
      console.error('createLandlordApartment notify:', notifyError);
    }

    return docRef.id;
  } catch (error) {
    console.error('createLandlordApartment error:', error);
    throw error;
  }
}

/** Port Web `submitApartmentByLandlord` — update (không tự published). */
export async function updateLandlordApartment(
  uid: string,
  apartmentId: string,
  payload: LandlordApartmentInput,
): Promise<void> {
  try {
    await assertIsLandlord(uid);
    validateLandlordPayload(payload);

    const existing = await getLandlordApartmentById(apartmentId, uid);
    if (!existing) {
      throw new Error('Không tìm thấy căn hộ hoặc không có quyền truy cập.');
    }

    const searchKeywords = buildSearchKeywords({
      title: payload.title,
      district: payload.district,
      sourceCode: existing.sourceCode,
      address: existing.address || payload.district,
    });

    await updateDoc(doc(db, APARTMENTS_COLLECTION, apartmentId), {
      title: payload.title.trim(),
      roomType: payload.roomType,
      district: payload.district,
      area: payload.area,
      price: payload.price,
      details: payload.details.trim(),
      commission: payload.commission || '',
      contactPhone: payload.contactPhone.trim(),
      status: payload.status || 'available',
      imageUrls: payload.imageUrls,
      aiContent: payload.aiContent ?? existing.aiContent ?? null,
      searchKeywords,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('updateLandlordApartment error:', error);
    throw error;
  }
}

/** Port Web `updateLandlordApartmentStatusAction`. */
export async function updateLandlordApartmentStatus(
  landlordId: string,
  apartmentId: string,
  newStatus: ApartmentStatus,
): Promise<void> {
  try {
    const apartmentRef = doc(db, APARTMENTS_COLLECTION, apartmentId);
    const snap = await getDoc(apartmentRef);
    if (!snap.exists()) {
      throw new Error('Không tìm thấy dữ liệu căn hộ.');
    }
    const data = snap.data();
    if (data.landlordId !== landlordId) {
      throw new Error('Bạn không có quyền chỉnh sửa căn hộ này.');
    }

    await updateDoc(apartmentRef, {
      status: newStatus,
      updatedAt: Timestamp.now(),
    });

    const statusText = newStatus === 'available' ? 'Còn trống' : 'Tạm hết';
    try {
      await notifyAdmins({
        title: 'Chủ nhà cập nhật trạng thái phòng',
        message: `Căn hộ "${data.address || data.title}" (Mã: ${data.sourceCode || apartmentId}) vừa được đổi trạng thái thành: ${statusText}.`,
        type: 'system',
        link: `/${ADMIN_PATH}/apartments`,
      });
    } catch (notifyError) {
      console.error('updateLandlordApartmentStatus notify:', notifyError);
    }
  } catch (error) {
    console.error('updateLandlordApartmentStatus error:', error);
    throw error;
  }
}

/**
 * Port Web `requestPushApartmentAction`:
 * đánh dấu xin đẩy + bump timestamps để lên đầu feed.
 */
export async function requestPushApartment(
  uid: string,
  apartmentId: string,
): Promise<void> {
  try {
    const existing = await getLandlordApartmentById(apartmentId, uid);
    if (!existing) {
      throw new Error('Không tìm thấy căn hộ hoặc không có quyền.');
    }
    if (existing.submissionStatus !== 'published') {
      throw new Error('Chỉ xin đẩy được tin đã được duyệt (published).');
    }

    const now = Timestamp.now();
    await updateDoc(doc(db, APARTMENTS_COLLECTION, apartmentId), {
      isPushRequested: true,
      pushRequestedAt: now,
      updatedAt: now,
      createdAt: now,
    });
  } catch (error) {
    console.error('requestPushApartment error:', error);
    throw error;
  }
}
