import {
  DocumentData,
  DocumentSnapshot,
  QueryConstraint,
  QueryDocumentSnapshot,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore';

import { db } from '@/firebase/app';
import { APARTMENTS_PAGE_SIZE } from '@/lib/constants';
import { isPriceInRange, parsePriceRange } from '@/lib/format';
import {
  APARTMENTS_COLLECTION,
  type Apartment,
  type RoomType,
} from '@/lib/types';

export type ApartmentFilters = {
  district?: string;
  priceRange?: string;
  roomType?: RoomType;
  sortBy?: 'newest' | 'price-asc' | 'price-desc';
};

export type ApartmentsPageResult = {
  apartments: Apartment[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
};

const toPlainTimestamp = (ts: unknown) => {
  if (!ts || typeof ts !== 'object') {
    return { seconds: 0, nanoseconds: 0 };
  }

  const value = ts as {
    toDate?: () => Date;
    seconds?: number;
    nanoseconds?: number;
  };

  if (typeof value.toDate === 'function' && typeof value.seconds === 'number') {
    return {
      seconds: value.seconds,
      nanoseconds: value.nanoseconds || 0,
    };
  }

  if (typeof value.seconds === 'number') {
    return {
      seconds: value.seconds,
      nanoseconds: value.nanoseconds || 0,
    };
  }

  return { seconds: 0, nanoseconds: 0 };
};

/** Ported from Web `toApartment` — keep Firestore mapping in sync. */
export function toApartment(docSnap: DocumentSnapshot<DocumentData>): Apartment {
  const data = docSnap.data() ?? {};
  const createdAt = toPlainTimestamp(data.createdAt);
  const updatedAt = toPlainTimestamp(data.updatedAt);

  const rawAi = data.aiContent;
  const aiContent = rawAi
    ? {
        ...rawAi,
        updatedAt: rawAi.updatedAt?.toDate
          ? rawAi.updatedAt.toDate().toISOString()
          : rawAi.updatedAt?.seconds
            ? new Date(rawAi.updatedAt.seconds * 1000).toISOString()
            : (rawAi.updatedAt ?? null),
      }
    : null;

  return {
    id: docSnap.id,
    ...data,
    createdAt,
    updatedAt,
    aiContent,
  } as Apartment;
}

function buildConstraints(
  filters: ApartmentFilters,
  pageSize: number,
  cursor?: QueryDocumentSnapshot<DocumentData> | null,
): QueryConstraint[] {
  const constraints: QueryConstraint[] = [
    // Public listing only — same as Web data.ts
    where('submissionStatus', '==', 'published'),
  ];

  if (filters.district && filters.district !== 'all') {
    constraints.push(where('district', '==', filters.district));
  }

  if (filters.roomType) {
    constraints.push(where('roomType', '==', filters.roomType));
  }

  const sortBy = filters.sortBy ?? 'newest';
  if (sortBy === 'price-asc') {
    constraints.push(orderBy('price', 'asc'));
  } else if (sortBy === 'price-desc') {
    constraints.push(orderBy('price', 'desc'));
  } else {
    constraints.push(orderBy('createdAt', 'desc'));
  }

  if (cursor) {
    constraints.push(startAfter(cursor));
  }

  // Over-fetch slightly when price is filtered client-side
  const hasPriceFilter =
    !!filters.priceRange && filters.priceRange !== 'all';
  constraints.push(limit(hasPriceFilter ? pageSize * 2 : pageSize));

  return constraints;
}

export async function fetchApartmentsPage(
  filters: ApartmentFilters = {},
  cursor?: QueryDocumentSnapshot<DocumentData> | null,
  pageSize: number = APARTMENTS_PAGE_SIZE,
): Promise<ApartmentsPageResult> {
  const apartmentsRef = collection(db, APARTMENTS_COLLECTION);
  const q = query(apartmentsRef, ...buildConstraints(filters, pageSize, cursor));
  const snapshot = await getDocs(q);

  let apartments = snapshot.docs.map(toApartment);

  if (filters.priceRange && filters.priceRange !== 'all') {
    const range = parsePriceRange(filters.priceRange);
    apartments = apartments.filter((apt) => isPriceInRange(apt.price, range));
  }

  // Trim to page size after client price filter
  const pageApartments = apartments.slice(0, pageSize);
  const lastVisible = snapshot.docs[snapshot.docs.length - 1] ?? null;

  // If Firestore returned a full batch, there may be more pages
  const expectedBatch =
    filters.priceRange && filters.priceRange !== 'all'
      ? pageSize * 2
      : pageSize;
  const fetchedFullBatch = snapshot.size >= expectedBatch;

  return {
    apartments: pageApartments,
    lastDoc: lastVisible,
    hasMore: fetchedFullBatch,
  };
}

export async function getApartmentById(
  id: string,
): Promise<Apartment | null> {
  if (!id) return null;
  try {
    const docSnap = await getDoc(doc(db, APARTMENTS_COLLECTION, id));
    if (docSnap.exists()) return toApartment(docSnap);
    return null;
  } catch (error) {
    console.error('Error fetching apartment by ID:', error);
    return null;
  }
}
