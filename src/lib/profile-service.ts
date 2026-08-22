import { doc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/app';
import { USERS_COLLECTION } from '@/lib/types';

/** Fields editable on Profile → Edit (U3) + Settings (U4). */
export type ProfileUpdateInput = {
  displayName?: string;
  phoneNumber?: string;
  address?: string;
  preferredDistrict?: string;
  dob?: string;
  gender?: string;
  interests?: string;
};

export async function updateUserProfile(
  userId: string,
  data: ProfileUpdateInput,
): Promise<void> {
  if (!userId) throw new Error('User not authenticated.');

  try {
    const payload: Record<string, string> = {};
    (Object.keys(data) as (keyof ProfileUpdateInput)[]).forEach((key) => {
      const value = data[key];
      if (typeof value === 'string') {
        payload[key] = value.trim();
      }
    });

    await updateDoc(doc(db, USERS_COLLECTION, userId), payload);
  } catch (error) {
    console.error('updateUserProfile error:', error);
    throw error;
  }
}
