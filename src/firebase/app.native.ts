import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  initializeAuth,
  type Persistence,
} from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';

import { firebaseConfig } from './config';

export const firebaseApp: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

type ReactNativePersistenceFactory = (
  storage: ReturnType<typeof createAsyncStorage>,
) => Persistence;

/**
 * `getReactNativePersistence` exists on the RN Auth entry, but TypeScript
 * resolves `firebase/auth` to the web typings which omit it.
 */
function loadReactNativePersistence(): ReactNativePersistenceFactory | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const authModule = require('firebase/auth') as {
      getReactNativePersistence?: ReactNativePersistenceFactory;
    };
    return authModule.getReactNativePersistence ?? null;
  } catch {
    return null;
  }
}

function createAuth(app: FirebaseApp): Auth {
  const getPersistence = loadReactNativePersistence();
  if (!getPersistence) {
    return getAuth(app);
  }

  try {
    const storage = createAsyncStorage('firebase-auth');
    return initializeAuth(app, {
      persistence: getPersistence(storage),
    });
  } catch {
    // Hot reload / second init — Auth already registered
    return getAuth(app);
  }
}

export const auth = createAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);

export function getSdks(app: FirebaseApp = firebaseApp) {
  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app),
    storage: getStorage(app),
  };
}
