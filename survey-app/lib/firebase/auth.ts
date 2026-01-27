import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  getRedirectResult,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './config';
import { createUser, getUser } from './firestore';
import { User } from '@/lib/types';

const googleProvider = new GoogleAuthProvider();

export async function signUp(email: string, password: string): Promise<User> {
  const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

  // Create user without username - they'll complete onboarding to set it
  const user: User = {
    id: firebaseUser.uid,
    email: firebaseUser.email!,
    username: undefined, // Will be set during onboarding
    displayName: undefined,
    photoURL: firebaseUser.photoURL || undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await createUser(user);
  return user;
}

export async function signIn(email: string, password: string): Promise<User | null> {
  const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
  return getUser(firebaseUser.uid);
}

export async function signInWithGoogle(): Promise<User | null> {
  // Use popup for localhost (redirect has issues with auth persistence on localhost)
  const { user: firebaseUser } = await signInWithPopup(auth, googleProvider);

  let user = await getUser(firebaseUser.uid);

  if (!user) {
    user = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      username: undefined,
      displayName: firebaseUser.displayName || undefined,
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await createUser(user);
  }

  return user;
}

// Keep this for production use with redirect if needed
export async function handleGoogleRedirect(): Promise<User | null> {
  const result = await getRedirectResult(auth);

  if (!result) return null;

  const firebaseUser = result.user;
  let user = await getUser(firebaseUser.uid);

  if (!user) {
    user = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      username: undefined,
      displayName: firebaseUser.displayName || undefined,
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await createUser(user);
  }

  return user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// Magic Link (Passwordless) Authentication
export async function sendMagicLink(email: string): Promise<void> {
  const actionCodeSettings = {
    url: typeof window !== 'undefined'
      ? `${window.location.origin}/login/verify`
      : 'http://localhost:3000/login/verify',
    handleCodeInApp: true,
  };

  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  // Save email to localStorage for when user returns via link
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('emailForSignIn', email);
  }
}

export function isEmailLink(url: string): boolean {
  return isSignInWithEmailLink(auth, url);
}

export async function completeSignInWithEmailLink(email: string, url: string): Promise<User | null> {
  const { user: firebaseUser } = await signInWithEmailLink(auth, email, url);

  let user = await getUser(firebaseUser.uid);

  if (!user) {
    user = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      username: undefined,
      displayName: undefined,
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await createUser(user);
  }

  // Clear saved email
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('emailForSignIn');
  }

  return user;
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}
