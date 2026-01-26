'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthChange, handleGoogleRedirect } from '@/lib/firebase/auth';
import { getUser } from '@/lib/firebase/firestore';
import { User } from '@/lib/types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  needsOnboarding: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  user: null,
  loading: true,
  needsOnboarding: false,
  refreshUser: async () => {},
});

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (firebaseUser) {
      const userData = await getUser(firebaseUser.uid);
      setUser(userData);
    }
  }, [firebaseUser]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      // Handle Google redirect result on app load
      try {
        const redirectUser = await handleGoogleRedirect();
        if (redirectUser) {
          console.log('Google redirect successful:', redirectUser.email);
        }
      } catch (error) {
        console.error('Google redirect error:', error);
      }
    };

    init();

    const unsubscribe = onAuthChange(async (fbUser) => {
      if (!isMounted) return;

      console.log('Auth state changed:', fbUser?.email || 'null');
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          const userData = await getUser(fbUser.uid);
          console.log('User data from Firestore:', userData?.username || 'no username');
          if (isMounted) setUser(userData);
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      } else {
        if (isMounted) setUser(null);
      }

      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // User needs onboarding if they're logged in but don't have a username
  const needsOnboarding = !loading && !!firebaseUser && (!user || !user.username);

  return (
    <AuthContext.Provider value={{ firebaseUser, user, loading, needsOnboarding, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
