import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { auth, db } from '@/firebase/app';
import {
  getRoleLabel,
  hasMinimumRole,
  hasPermission,
  hasRole,
  isAdmin,
  isCollaborator,
  isLandlord,
  isRegularUser,
  normalizeUserRole,
  type Permission,
  type UserRole,
} from '@/lib/rbac';
import { USERS_COLLECTION, type UserData } from '@/lib/types';
import * as authService from '@/lib/auth-service';

const ACTIVITY_INTERVAL_MS = 15 * 60 * 1000;

type AuthContextValue = {
  user: User | null;
  userData: UserData | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;

  hasPermission: (permission: Permission) => boolean;
  hasRole: (targetRole: UserRole) => boolean;
  hasMinimumRole: (minRequiredRole: UserRole) => boolean;
  isAdmin: boolean;
  isCollaborator: boolean;
  isLandlord: boolean;
  isRegularUser: boolean;
  roleLabel: string | null;

  login: (email: string, pass: string) => ReturnType<typeof authService.login>;
  signup: (
    email: string,
    pass: string,
    fullName: string,
    phoneNumber?: string,
  ) => ReturnType<typeof authService.signup>;
  logout: () => ReturnType<typeof authService.logout>;
  resetPassword: (
    email: string,
  ) => ReturnType<typeof authService.resetPassword>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;
    let activityInterval: ReturnType<typeof setInterval> | null = null;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }
      if (activityInterval) {
        clearInterval(activityInterval);
        activityInterval = null;
      }

      if (!currentUser) {
        setUserData(null);
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, USERS_COLLECTION, currentUser.uid);

      unsubscribeUserDoc = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setUserData({ id: docSnap.id, ...docSnap.data() } as UserData);
          } else {
            setUserData(null);
          }
          setLoading(false);
        },
        (error) => {
          console.error('Auth Snapshot Error:', error);
          setLoading(false);
        },
      );

      const updateActivity = async () => {
        try {
          await updateDoc(userDocRef, {
            lastActiveAt: serverTimestamp(),
          });
        } catch (error) {
          console.error('Lỗi cập nhật lastActiveAt:', error);
        }
      };

      void updateActivity();
      activityInterval = setInterval(updateActivity, ACTIVITY_INTERVAL_MS);
    });

    return () => {
      unsubscribe();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      if (activityInterval) clearInterval(activityInterval);
    };
  }, []);

  const role = useMemo<UserRole | null>(() => {
    if (!user) return null;
    return normalizeUserRole(userData?.role);
  }, [user, userData?.role]);

  const value = useMemo<AuthContextValue>(() => {
    const resolvedRole = role ?? 'user';

    return {
      user,
      userData,
      role,
      loading,
      isAuthenticated: !!user,

      hasPermission: (permission: Permission) =>
        role ? hasPermission(role, permission) : false,
      hasRole: (targetRole: UserRole) => hasRole(role, targetRole),
      hasMinimumRole: (minRequiredRole: UserRole) =>
        hasMinimumRole(role, minRequiredRole),
      isAdmin: isAdmin(role),
      isCollaborator: isCollaborator(role),
      isLandlord: isLandlord(role),
      isRegularUser: isRegularUser(role),
      roleLabel: role ? getRoleLabel(resolvedRole) : null,

      login: authService.login,
      signup: authService.signup,
      logout: authService.logout,
      resetPassword: authService.resetPassword,
    };
  }, [user, userData, role, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
