import { getApps, initializeApp, getApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (!serviceAccount) {
  console.error('Firebase service account key not found. Make sure FIREBASE_SERVICE_ACCOUNT_KEY environment variable is set.');
}

const adminApp = !getApps().length && serviceAccount
  ? initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
  : getApp();

const adminStorage = serviceAccount ? getStorage(adminApp) : null;

export { adminApp, adminStorage };
