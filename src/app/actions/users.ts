'use server';

import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

export async function createNewUser(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  // A temporary secondary app is used to create a new user without signing out the currently logged-in admin.
  // The name must be unique for each initialization.
  const tempAppName = `secondary-auth-${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, tempAppName);
  
  try {
    const secondaryAuth = getAuth(secondaryApp);
    await createUserWithEmailAndPassword(secondaryAuth, email, password);
    // User created successfully. The current user (admin) remains signed in on the main app.
    return { success: true };
  } catch (error: any) {
    let errorMessage = 'An unexpected error occurred.';
    if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already in use by another account.';
    } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'The email address is not valid.';
    } else if (error.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak.';
    }
    console.error("Failed to create new user: ", error);
    return { success: false, error: errorMessage };
  } finally {
    // Clean up the secondary app instance to avoid memory leaks
    await deleteApp(secondaryApp);
  }
}
