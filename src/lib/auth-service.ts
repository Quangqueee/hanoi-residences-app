import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from '@/firebase/app';
import { USERS_COLLECTION } from '@/lib/types';

export async function login(email: string, pass: string) {
  return signInWithEmailAndPassword(auth, email.trim(), pass);
}

export async function signup(
  email: string,
  pass: string,
  fullName: string,
  phoneNumber?: string,
): Promise<User> {
  const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  await setDoc(doc(db, USERS_COLLECTION, res.user.uid), {
    uid: res.user.uid,
    email: email.trim(),
    displayName: fullName.trim(),
    phoneNumber: phoneNumber?.trim() || '',
    role: 'user',
    favorites: [],
    createdAt: serverTimestamp(),
  });
  // Admin notify is handled on Web; mobile will hook into notifications later.
  return res.user;
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email.trim());
}

export async function changePassword(
  newPassword: string,
  currentPassword: string,
) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    const error = new Error('No authenticated user.');
    (error as Error & { code?: string }).code = 'auth/no-current-user';
    throw error;
  }

  if (!currentUser.email) {
    const error = new Error('Current user has no email.');
    (error as Error & { code?: string }).code = 'auth/missing-email';
    throw error;
  }

  const credential = EmailAuthProvider.credential(
    currentUser.email,
    currentPassword,
  );
  await reauthenticateWithCredential(currentUser, credential);
  await updatePassword(currentUser, newPassword);
}

export function logout() {
  return signOut(auth);
}

export async function confirmResetPassword(
  oobCode: string,
  newPassword: string,
) {
  return firebaseConfirmPasswordReset(auth, oobCode, newPassword);
}

export async function getCurrentUserRole(uid: string) {
  if (!uid) return null;

  try {
    const userDocSnap = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (userDocSnap.exists()) {
      return userDocSnap.data().role ?? null;
    }
    return null;
  } catch (error) {
    console.error('Lỗi khi truy xuất phân quyền người dùng:', error);
    return null;
  }
}
