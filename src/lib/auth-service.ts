import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

import { auth, db } from '@/firebase/app';
import { ADMIN_PATH } from '@/lib/constants';
import { notifyAdmins } from '@/lib/notifications';
import { USERS_COLLECTION } from '@/lib/types';

/**
 * Ensure `users/{uid}` exists after Auth (email signup or Google).
 * Never escalate role from client — defaults to `user` on create.
 */
export async function ensureUserDocument(user: User): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      await setDoc(
        userRef,
        {
          email: user.email ?? snap.data()?.email ?? '',
          lastActiveAt: serverTimestamp(),
        },
        { merge: true },
      );
      return;
    }

    await setDoc(userRef, {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName?.trim() || '',
      phoneNumber: user.phoneNumber || '',
      photoURL: user.photoURL || '',
      role: 'user',
      favorites: [],
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('ensureUserDocument error:', error);
    throw error;
  }
}

export async function login(email: string, pass: string) {
  try {
    return await signInWithEmailAndPassword(auth, email.trim(), pass);
  } catch (error) {
    console.error('login error:', error);
    throw error;
  }
}

export async function signup(
  email: string,
  pass: string,
  fullName: string,
  phoneNumber?: string,
): Promise<User> {
  try {
    const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    await setDoc(doc(db, USERS_COLLECTION, res.user.uid), {
      uid: res.user.uid,
      email: email.trim(),
      displayName: fullName.trim(),
      phoneNumber: phoneNumber?.trim() || '',
      role: 'user',
      favorites: [],
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    });

    // Same as website — notify must not block signup if rules block admin list.
    try {
      await notifyAdmins({
        title: 'Thành viên mới đăng ký',
        message: `${fullName.trim() || email.trim()} vừa đăng ký tài khoản mới trên app.`,
        type: 'system',
        link: `/${ADMIN_PATH}/users`,
      });
    } catch (notifyError) {
      console.error('signup notifyAdmins error:', notifyError);
    }

    return res.user;
  } catch (error) {
    console.error('signup error:', error);
    throw error;
  }
}

/**
 * Google Sign-In.
 * - Web: Firebase popup (same project as website).
 * - Native: requires Firebase iOS/Android apps + OAuth clients + native SDK —
 *   not configured yet; surfaces a clear error instead of silent failure.
 */
export async function loginWithGoogle(): Promise<User> {
  try {
    if (Platform.OS !== 'web') {
      const error = new Error(
        'Google Sign-In native chưa cấu hình. Dùng email/mật khẩu hoặc mở bản Web.',
      );
      (error as Error & { code?: string }).code = 'auth/google-native-unavailable';
      throw error;
    }

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await ensureUserDocument(result.user);
    return result.user;
  } catch (error) {
    console.error('loginWithGoogle error:', error);
    throw error;
  }
}

export async function resetPassword(email: string) {
  try {
    return await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    console.error('resetPassword error:', error);
    throw error;
  }
}

export async function changePassword(
  newPassword: string,
  currentPassword: string,
) {
  try {
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
  } catch (error) {
    console.error('changePassword error:', error);
    throw error;
  }
}

export async function logout() {
  try {
    return await signOut(auth);
  } catch (error) {
    console.error('logout error:', error);
    throw error;
  }
}

export async function confirmResetPassword(
  oobCode: string,
  newPassword: string,
) {
  try {
    return await firebaseConfirmPasswordReset(auth, oobCode, newPassword);
  } catch (error) {
    console.error('confirmResetPassword error:', error);
    throw error;
  }
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
