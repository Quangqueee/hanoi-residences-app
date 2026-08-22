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
  matchesAllSearchTokens,
  planApartmentTextSearch,
} from '@/lib/search-keywords';
import {
  APARTMENTS_COLLECTION,
  type Apartment,
  type RoomType,
} from '@/lib/types';

export type ApartmentFilters = {
  /** Single district or multi-select (Web `district=a,b` → Firestore `in`) */
  district?: string | string[];
  priceRange?: string;
  /** Single room type or multi-select */
  roomType?: RoomType | RoomType[];
  sortBy?: 'newest' | 'price-asc' | 'price-desc';
  /** Free-text — Web `planApartmentTextSearch` / `searchKeywords` */
  searchQuery?: string;
};

export type ApartmentsPageResult = {
  apartments: Apartment[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
};

const SEARCH_CANDIDATE_CAP = 500;

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

function normalizeStringList(
  value: string | string[] | undefined,
): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => v.trim()).filter(Boolean);
  }
  if (value === 'all') return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function buildBaseConstraints(filters: ApartmentFilters): QueryConstraint[] {
  const constraints: QueryConstraint[] = [
    where('submissionStatus', '==', 'published'),
  ];

  const districtArray = normalizeStringList(filters.district);
  const roomTypeArray = normalizeStringList(
    filters.roomType as string | string[] | undefined,
  );

  if (districtArray.length > 0) {
    constraints.push(
      districtArray.length === 1
        ? where('district', '==', districtArray[0])
        : where('district', 'in', districtArray.slice(0, 30)),
    );
  }

  if (roomTypeArray.length > 0) {
    constraints.push(
      roomTypeArray.length === 1
        ? where('roomType', '==', roomTypeArray[0])
        : where('roomType', 'in', roomTypeArray.slice(0, 30)),
    );
  }

  return constraints;
}

function buildSortConstraints(
  filters: ApartmentFilters,
): QueryConstraint[] {
  const sortBy = filters.sortBy ?? 'newest';
  if (sortBy === 'price-asc') return [orderBy('price', 'asc')];
  if (sortBy === 'price-desc') return [orderBy('price', 'desc')];
  return [orderBy('createdAt', 'desc')];
}

function applyClientFilters(
  apartments: Apartment[],
  filters: ApartmentFilters,
  searchTokens: string[] | null,
): Apartment[] {
  let next = apartments;

  if (filters.priceRange && filters.priceRange !== 'all') {
    const range = parsePriceRange(filters.priceRange);
    next = next.filter((apt) => isPriceInRange(apt.price, range));
  }

  if (searchTokens && searchTokens.length > 0) {
    next = next.filter((apt) => matchesAllSearchTokens(apt, searchTokens));
  }

  return next;
}

export async function fetchApartmentsPage(
  filters: ApartmentFilters = {},
  cursor?: QueryDocumentSnapshot<DocumentData> | null,
  pageSize: number = APARTMENTS_PAGE_SIZE,
): Promise<ApartmentsPageResult> {
  try {
    const apartmentsRef = collection(db, APARTMENTS_COLLECTION);
    const searchPlan = filters.searchQuery?.trim()
      ? planApartmentTextSearch(filters.searchQuery)
      : null;
    const searchTokens = searchPlan?.tokens ?? null;
    const searchValues = searchPlan?.firestoreValues ?? [];
    const needsCandidateScan =
      !!searchPlan &&
      (searchPlan.tokens.length > 1 || searchValues.length > 1);

    const hasPriceFilter =
      !!filters.priceRange && filters.priceRange !== 'all';
    const hasClientFilter = hasPriceFilter || !!searchPlan;

    // Multi-token / đ–d variants: mirror Web candidate scan (cap), then page in memory.
    // Cursor pagination on Firestore docs is unsafe after client AND-filter.
    if (needsCandidateScan && searchPlan) {
      const snapshots = await Promise.all(
        searchValues.map((value) =>
          getDocs(
            query(
              apartmentsRef,
              ...buildBaseConstraints(filters),
              where('searchKeywords', 'array-contains', value),
              ...buildSortConstraints(filters),
              limit(SEARCH_CANDIDATE_CAP),
            ),
          ),
        ),
      );

      const byId = new Map<string, Apartment>();
      for (const snapshot of snapshots) {
        for (const docSnap of snapshot.docs) {
          if (!byId.has(docSnap.id)) {
            byId.set(docSnap.id, toApartment(docSnap));
          }
        }
      }

      let matched = applyClientFilters(
        [...byId.values()],
        filters,
        searchPlan.tokens,
      );

      // Keep sort consistent after merge
      const sortBy = filters.sortBy ?? 'newest';
      matched = matched.sort((a, b) => {
        if (sortBy === 'price-asc') return (a.price ?? 0) - (b.price ?? 0);
        if (sortBy === 'price-desc') return (b.price ?? 0) - (a.price ?? 0);
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });

      let start = 0;
      if (cursor) {
        const idx = matched.findIndex((apt) => apt.id === cursor.id);
        start = idx >= 0 ? idx + 1 : 0;
      }

      const pageApartments = matched.slice(start, start + pageSize);
      const lastApt = pageApartments[pageApartments.length - 1];
      const lastDoc =
        lastApt != null
          ? ((snapshots
              .flatMap((s) => s.docs)
              .find((d) => d.id === lastApt.id) as
              | QueryDocumentSnapshot<DocumentData>
              | undefined) ?? null)
          : null;

      return {
        apartments: pageApartments,
        lastDoc,
        hasMore: start + pageSize < matched.length,
      };
    }

    const constraints: QueryConstraint[] = [
      ...buildBaseConstraints(filters),
    ];

    if (searchPlan?.firestoreValue) {
      constraints.push(
        where('searchKeywords', 'array-contains', searchPlan.firestoreValue),
      );
    }

    constraints.push(...buildSortConstraints(filters));

    if (cursor) {
      constraints.push(startAfter(cursor));
    }

    const fetchLimit = hasClientFilter ? pageSize * 3 : pageSize;
    constraints.push(limit(fetchLimit));

    const snapshot = await getDocs(query(apartmentsRef, ...constraints));
    let apartments = applyClientFilters(
      snapshot.docs.map(toApartment),
      filters,
      searchTokens,
    );

    const pageApartments = apartments.slice(0, pageSize);
    const lastVisible = snapshot.docs[snapshot.docs.length - 1] ?? null;
    const fetchedFullBatch = snapshot.size >= fetchLimit;

    return {
      apartments: pageApartments,
      lastDoc: lastVisible,
      hasMore: fetchedFullBatch,
    };
  } catch (error) {
    console.error('fetchApartmentsPage error:', error);
    throw error;
  }
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
