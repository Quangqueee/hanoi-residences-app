import { arrayRemove, arrayUnion, doc, getDoc, setDoc } from 'firebase/firestore';

import { db } from '@/firebase/app';
import { getApartmentById } from '@/lib/apartments-service';
import { USERS_COLLECTION, type Apartment } from '@/lib/types';

/**
 * Toggle favorite on `users/{uid}.favorites` — same Client SDK pattern as Web
 * `apartment-card.tsx` (setDoc + merge + arrayUnion / arrayRemove).
 */
export async function setApartmentFavorite(
  userId: string,
  apartmentId: string,
  nextIsFavorite: boolean,
): Promise<void> {
  if (!userId) throw new Error('User not authenticated.');
  if (!apartmentId) throw new Error('Apartment ID missing.');

  const userRef = doc(db, USERS_COLLECTION, userId);
  await setDoc(
    userRef,
    {
      favorites: nextIsFavorite
        ? arrayUnion(apartmentId)
        : arrayRemove(apartmentId),
    },
    { merge: true },
  );
}

/** Read favorite IDs from the user document (cross-platform source of truth). */
export async function getUserFavoriteIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const snap = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (!snap.exists()) return [];
    const raw = snap.data()?.favorites;
    return Array.isArray(raw)
      ? raw.filter((id): id is string => typeof id === 'string')
      : [];
  } catch (error) {
    console.error('getUserFavoriteIds error:', error);
    throw error;
  }
}

/**
 * Resolve full apartment docs for favorite IDs.
 * Uses the `favorites` array on the user doc (same field the heart button writes)
 * so App ↔ Web heart state stays in sync.
 */
export async function getFullFavoriteApartments(
  userId: string,
  favoriteIds?: string[],
): Promise<Apartment[]> {
  if (!userId) return [];

  try {
    const ids =
      favoriteIds !== undefined
        ? favoriteIds
        : await getUserFavoriteIds(userId);

    if (ids.length === 0) return [];

    const apartments = await Promise.all(ids.map((id) => getApartmentById(id)));
    return apartments.filter((apt): apt is Apartment => apt !== null);
  } catch (error) {
    console.error('getFullFavoriteApartments error:', error);
    throw error;
  }
}
