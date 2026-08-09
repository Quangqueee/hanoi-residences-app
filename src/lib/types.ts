// Ported from Web: Apartment01/src/lib/types.ts — keep in sync.
import type { UserRole } from './rbac';

export type RoomType = 'studio' | '1n1k' | '2n1k' | 'other';
export type ApartmentStatus = 'available' | 'rented';
export type FeatureTag = 'pet_friendly' | 'lake_view';
export type SubmissionStatus = 'pending' | 'published' | 'rejected';

export interface AiContent {
  seoTitle?: string;
  seoDescription?: string;
  description?: string;
  highlights?: string[];
  updatedAt?:
    | {
        seconds: number;
        nanoseconds: number;
      }
    | unknown;
}

export interface Apartment {
  id: string;
  title: string;
  sourceCode: string;
  roomType: RoomType;
  area: number;
  district: string;
  price: number;
  details: string;

  listingSummary?: string;
  address: string;
  landlordPhoneNumber: string;
  commission?: number | string;
  isFavorited?: boolean;
  imageUrls: string[];
  searchKeywords?: string[];

  status?: ApartmentStatus;
  tags?: FeatureTag[];

  submissionStatus?: SubmissionStatus;
  landlordId?: string;
  adminNotes?: string;
  design?: string;
  serviceFees?: string;
  contactPhone?: string;

  aiContent?: AiContent | null;

  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  updatedAt: {
    seconds: number;
    nanoseconds: number;
  };
}

/**
 * Firestore `/users/{userId}` document shape.
 * Merges Web `UserProfile` (types.ts) with runtime fields from Web AuthContext.
 */
export interface UserProfile {
  id?: string;
  uid?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  address?: string;
  preferredDistrict?: string;
  dob?: string;
  gender?: string;
  interests?: string;
  favorites?: string[];

  role?: UserRole | string;

  landlordApprovalStatus?: 'pending' | 'approved' | 'rejected';
  landlordRejectionReason?: string;
  landlordRequestData?: {
    displayName: string;
    phoneNumber: string;
    district: string;
    message?: string;
  };
  landlordRequestSubmittedAt?: unknown;
  lastActiveAt?: unknown;

  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
}

export type UserData = UserProfile;

/** Local image pick result (RN equivalent of Web File + preview). */
export type UploadedImage = {
  uri: string;
  preview: string;
  mimeType?: string;
  fileName?: string;
};

export interface Favorite {
  id: string;
  addedAt: {
    seconds: number;
    nanoseconds: number;
  };
}

export interface LandlordApartmentInput {
  title: string;
  roomType: RoomType;
  district: string;
  area: number;
  price: number;
  details: string;
  commission?: string;
  contactPhone: string;
  status: ApartmentStatus;
  imageUrls: string[];
  aiContent?: AiContent | null;
}

export const USERS_COLLECTION = 'users';
export const APARTMENTS_COLLECTION = 'apartments';
