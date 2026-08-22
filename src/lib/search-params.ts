import type { ApartmentFilters } from '@/lib/apartments-service';
import { getRoomTypeLabel } from '@/lib/apartment-display';
import { ROOM_TYPES } from '@/lib/constants';
import { buildPriceRangeValue } from '@/lib/format';
import type { RoomType } from '@/lib/types';

/**
 * Web-aligned filter form state
 * (`Apartment01/src/components/filter-controls.tsx` → FilterState)
 */
export type FilterState = {
  query: string;
  district: string[];
  roomType: string[];
  priceMinInput: string;
  priceMaxInput: string;
};

export type SortOption = NonNullable<ApartmentFilters['sortBy']>;

/** Payload passed through Expo Router as a single JSON string param. */
export type SearchQueryPayload = {
  filters: FilterState;
  sort: SortOption;
};

export const DEFAULT_FILTER_STATE: FilterState = {
  query: '',
  district: [],
  roomType: [],
  priceMinInput: '',
  priceMaxInput: '',
};

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Mới nhất',
  'price-asc': 'Giá tăng dần',
  'price-desc': 'Giá giảm dần',
};

const ROOM_TYPE_VALUES = new Set<string>(ROOM_TYPES.map((rt) => rt.value));

const isRoomType = (value: string): value is RoomType =>
  ROOM_TYPE_VALUES.has(value);

const isSortOption = (value: unknown): value is SortOption =>
  value === 'newest' || value === 'price-asc' || value === 'price-desc';

export function hasActiveFilterState(filters: FilterState, sort?: SortOption) {
  return Boolean(
    filters.query.trim() ||
      filters.district.length > 0 ||
      filters.roomType.length > 0 ||
      filters.priceMinInput.trim() ||
      filters.priceMaxInput.trim() ||
      (sort && sort !== 'newest'),
  );
}

/**
 * Convert UI FilterState + sort → service ApartmentFilters.
 * Price validation: returns `{ ok: false, error }` when invalid.
 */
export function filterStateToApartmentFilters(
  filters: FilterState,
  sort: SortOption = 'newest',
):
  | { ok: true; apartmentFilters: ApartmentFilters; query: string }
  | { ok: false; error: string } {
  const hasPriceInput =
    filters.priceMinInput.trim().length > 0 ||
    filters.priceMaxInput.trim().length > 0;

  let priceRange: string | undefined;
  if (hasPriceInput) {
    const built = buildPriceRangeValue(
      filters.priceMinInput,
      filters.priceMaxInput,
    );
    if (!built) {
      return { ok: false, error: 'Nhập mức giá hợp lệ (triệu VNĐ).' };
    }
    priceRange = built;
  }

  const roomTypes = filters.roomType.filter(isRoomType);

  return {
    ok: true,
    query: filters.query.trim(),
    apartmentFilters: {
      district:
        filters.district.length > 0 ? [...filters.district] : undefined,
      roomType: roomTypes.length > 0 ? roomTypes : undefined,
      priceRange,
      sortBy: sort,
      searchQuery: filters.query.trim() || undefined,
    },
  };
}

export function stringifySearchQueryData(payload: SearchQueryPayload): string {
  return JSON.stringify(payload);
}

/** Safe parse of `queryData` route param — never throws. */
export function parseSearchQueryData(
  raw: string | string[] | undefined,
): SearchQueryPayload {
  const fallback: SearchQueryPayload = {
    filters: { ...DEFAULT_FILTER_STATE },
    sort: 'newest',
  };

  try {
    const text = Array.isArray(raw) ? raw[0] : raw;
    if (!text || typeof text !== 'string') return fallback;

    const parsed = JSON.parse(text) as {
      filters?: Partial<FilterState> | null;
      sort?: unknown;
    };
    const f = (parsed.filters ?? {}) as Partial<FilterState>;

    return {
      sort: isSortOption(parsed.sort) ? parsed.sort : 'newest',
      filters: {
        query: typeof f.query === 'string' ? f.query : '',
        district: Array.isArray(f.district)
          ? f.district.filter((d): d is string => typeof d === 'string')
          : [],
        roomType: Array.isArray(f.roomType)
          ? f.roomType.filter((r): r is string => typeof r === 'string')
          : [],
        priceMinInput:
          typeof f.priceMinInput === 'string' ? f.priceMinInput : '',
        priceMaxInput:
          typeof f.priceMaxInput === 'string' ? f.priceMaxInput : '',
      },
    };
  } catch (err) {
    console.warn('parseSearchQueryData failed:', err);
    return fallback;
  }
}

export function summarizeFilterState(
  filters: FilterState,
  sort: SortOption,
): string {
  const parts: string[] = [];
  if (filters.query.trim()) parts.push(`“${filters.query.trim()}”`);
  if (filters.district.length === 1) parts.push(filters.district[0]!);
  else if (filters.district.length > 1) {
    parts.push(`${filters.district.length} quận`);
  }
  if (filters.roomType.length === 1) {
    const rt = filters.roomType[0]!;
    parts.push(isRoomType(rt) ? getRoomTypeLabel(rt) : rt);
  } else if (filters.roomType.length > 1) {
    parts.push(`${filters.roomType.length} loại phòng`);
  }
  if (filters.priceMinInput.trim() || filters.priceMaxInput.trim()) {
    const min = filters.priceMinInput.trim() || '…';
    const max = filters.priceMaxInput.trim() || '…';
    parts.push(`${min}–${max}tr`);
  }
  if (sort !== 'newest') parts.push(SORT_LABELS[sort]);
  return parts.length > 0 ? parts.join(' · ') : 'Tất cả căn hộ';
}
