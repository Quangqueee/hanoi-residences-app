import type { RoomType } from './types';

export const HANOI_DISTRICTS = [
  'Ba Đình',
  'Hoàn Kiếm',
  'Tây Hồ',
  'Cầu Giấy',
  'Đống Đa',
  'Hai Bà Trưng',
  'Thanh Xuân',
  'Hoàng Mai',
  'Long Biên',
  'Nam Từ Liêm',
  'Bắc Từ Liêm',
  'Hà Đông',
] as const;

export const PRICE_RANGES = [
  { label: 'Dưới 5tr', value: '0-5' },
  { label: '5 - 7tr', value: '5-7' },
  { label: '8 - 10tr', value: '8-10' },
  { label: '11 - 15tr', value: '11-15' },
  { label: '16 - 20tr', value: '16-20' },
  { label: 'Trên 20tr', value: '20-' },
] as const;

export const ROOM_TYPES: { label: string; value: RoomType }[] = [
  { label: 'Studio', value: 'studio' },
  { label: '1 Phòng ngủ', value: '1n1k' },
  { label: '2 Phòng ngủ', value: '2n1k' },
  { label: '3 Phòng ngủ', value: '3n1k' },
  { label: '4 Phòng ngủ', value: '4n1k' },
  { label: 'Duplex', value: 'duplex' },
  { label: 'Penthouse', value: 'penthouse' },
  { label: 'Khác', value: 'other' },
];

export const SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Giá: Thấp đến cao', value: 'price-asc' },
  { label: 'Giá: Cao đến thấp', value: 'price-desc' },
] as const;

export const APARTMENTS_PAGE_SIZE = 12;

/** Admin apartment list — cursor pages (`fetchAdminApartmentsPage`). */
export const ADMIN_APARTMENTS_PAGE_SIZE = 20;

/**
 * Web admin path segment (notification `link` only).
 * App gates admin by `users.role`, never by this secret URL.
 */
export const ADMIN_PATH = 'admin';

/** Đồng bộ Web `MAX_APARTMENT_IMAGES`. */
export const MAX_APARTMENT_IMAGES = 15;

/** Quota xóa căn hộ — Web `apartment-delete-quota.ts`. */
export const APARTMENT_DELETE_LIMIT_PER_HOUR = 10;
export const APARTMENT_DELETE_WINDOW_MS = 60 * 60 * 1000;
