import type { Apartment } from './types';
import type { UserRole } from './rbac';
import { ROOM_TYPES } from './constants';

/** Price is stored in millions VND on Firestore (same as Web). */
export function formatPrice(price: number): string {
  if (!Number.isFinite(price)) return '—';
  const vnd = price * 1_000_000;
  return `${vnd.toLocaleString('vi-VN')}₫/tháng`;
}

export function formatCommission(
  commission: Apartment['commission'],
): string | null {
  if (commission === undefined || commission === null || commission === '') {
    return null;
  }
  if (typeof commission === 'number') {
    return commission.toLocaleString('vi-VN');
  }
  return String(commission);
}

export function getRoomTypeLabel(value: Apartment['roomType']): string {
  return ROOM_TYPES.find((rt) => rt.value === value)?.label ?? value;
}

/**
 * RBAC display rules (.cursorrules):
 * - user / landlord → AI SEO title & description
 * - admin / collaborator (CTV) → original title & details + commission
 */
export function usesAiSeoContent(role: UserRole | null | undefined): boolean {
  return role !== 'admin' && role !== 'collaborator';
}

export function getApartmentDisplayTitle(
  apartment: Apartment,
  role: UserRole | null | undefined,
): string {
  if (usesAiSeoContent(role)) {
    return apartment.aiContent?.seoTitle?.trim() || apartment.title;
  }
  return apartment.title;
}

export function getApartmentDisplayDescription(
  apartment: Apartment,
  role: UserRole | null | undefined,
): string {
  if (usesAiSeoContent(role)) {
    return (
      apartment.aiContent?.description?.trim() ||
      apartment.details ||
      'Thông tin đang được cập nhật...'
    );
  }
  return apartment.details || 'Thông tin đang được cập nhật...';
}

export function truncateText(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

type FirestoreTimestampLike = { seconds?: number } | null | undefined;

/** Ported from Web `utils.formatRelativeTime`. */
export function formatRelativeTime(timestamp: FirestoreTimestampLike): string {
  if (!timestamp || typeof timestamp.seconds !== 'number' || !timestamp.seconds) {
    return 'N/A';
  }

  const now = new Date();
  const updateDate = new Date(timestamp.seconds * 1000);
  const diffInMs = now.getTime() - updateDate.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) return 'Vừa xong';
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  if (diffInDays < 7) return `${diffInDays} ngày trước`;
  return updateDate.toLocaleDateString('vi-VN');
}

export function getListingTimestamp(
  apartment: Apartment,
): FirestoreTimestampLike {
  return apartment.updatedAt?.seconds
    ? apartment.updatedAt
    : apartment.createdAt;
}

/** Web card price display: ₫X.XXX.XXX + /tháng (price stored in millions). */
export function formatPriceAmount(price: number): string {
  if (!Number.isFinite(price)) return '—';
  return `₫${(price * 1_000_000).toLocaleString('vi-VN')}`;
}

export type ListingBadge = {
  label: string;
  backgroundColor: string;
  /** CTV status ribbon vs B2C marketing ribbon */
  placement: 'status' | 'marketing';
};

const B2C_FAKE_TAGS: { label: string; backgroundColor: string }[] = [
  { label: 'Hot Deal', backgroundColor: '#EF4444' }, // red-500
  { label: 'Trending', backgroundColor: '#F97316' }, // orange-500
  { label: 'Best Price', backgroundColor: '#3B82F6' }, // blue-500
  { label: 'Hot Listing', backgroundColor: '#F43F5E' }, // rose-500
  { label: 'Great Value', backgroundColor: '#6366F1' }, // indigo-500
  { label: 'Unique Property', backgroundColor: '#8B5CF6' }, // violet-500
];

/**
 * Ported from Web apartment-card badge/RBAC logic.
 * Admin/CTV → listing status; B2C → feature / synthetic marketing tags.
 */
export function resolveListingBadge(
  apartment: Apartment,
  isCollaborator: boolean,
): ListingBadge | null {
  const timeToDisplay = getListingTimestamp(apartment);
  const isRented = apartment.status === 'rented';
  const dateInMs =
    timeToDisplay && typeof timeToDisplay.seconds === 'number'
      ? timeToDisplay.seconds * 1000
      : Date.now();
  const daysPassed = Math.floor(
    (Date.now() - dateInMs) / (1000 * 60 * 60 * 24),
  );
  const isOldListing = daysPassed >= 14;

  if (isCollaborator) {
    if (isRented) {
      return {
        label: 'Tạm hết',
        backgroundColor: '#6B7280', // gray-500
        placement: 'status',
      };
    }
    if (isOldListing) {
      return {
        label: 'Liên hệ xác nhận',
        backgroundColor: '#F59E0B', // amber-500
        placement: 'status',
      };
    }
    return {
      label: 'Còn trống',
      backgroundColor: '#5CB85C',
      placement: 'status',
    };
  }

  const hasPetFriendly = apartment.tags?.includes('pet_friendly');
  const hasLakeView = apartment.tags?.includes('lake_view');

  if (hasPetFriendly) {
    return {
      label: 'Pet Friendly',
      backgroundColor: '#10B981', // emerald-500
      placement: 'marketing',
    };
  }
  if (hasLakeView) {
    return {
      label: 'Lake View',
      backgroundColor: '#0EA5E9', // sky-500
      placement: 'marketing',
    };
  }
  if (isRented || isOldListing) {
    const tagIndex =
      apartment.id
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      B2C_FAKE_TAGS.length;
    const tag = B2C_FAKE_TAGS[tagIndex];
    return {
      label: tag.label,
      backgroundColor: tag.backgroundColor,
      placement: 'marketing',
    };
  }

  return {
    label: 'Available',
    backgroundColor: '#22C55E', // green-500
    placement: 'marketing',
  };
}
