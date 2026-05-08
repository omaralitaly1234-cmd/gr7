'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { onAuthChange, getUserData } from '@/lib/firebase/auth';
import { signIn as firebaseSignIn, signOut as firebaseSignOut } from '@/lib/firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const userDocUnsubRef = useRef(null);
  const safetyTimerRef = useRef(null);

  useEffect(() => {
    // Safety timeout: if loading doesn't resolve in 10 seconds, force it
    safetyTimerRef.current = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn('[Auth] Safety timeout reached — forcing loading=false');
          return false;
        }
        return prev;
      });
    }, 10000);

    const unsubscribe = onAuthChange((firebaseUser) => {
      // Clean up previous user doc listener
      if (userDocUnsubRef.current) {
        userDocUnsubRef.current();
        userDocUnsubRef.current = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        // Use real-time listener so userData updates automatically
        // (e.g., when tenantId/role are set during onboarding)
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          userDocUnsubRef.current = onSnapshot(userRef, (snap) => {
            if (snap.exists()) {
              setUserData({ id: snap.id, ...snap.data() });
            } else {
              console.warn('[Auth] User doc does not exist for uid:', firebaseUser.uid);
              setUserData(null);
            }
            setLoading(false);
            clearTimeout(safetyTimerRef.current);
          }, (err) => {
            console.error('[Auth] User doc listener error:', err.code, err.message);
            setUserData(null);
            setLoading(false);
            clearTimeout(safetyTimerRef.current);
          });
        } catch (err) {
          console.error('[Auth] Failed to set up user doc listener:', err);
          setUserData(null);
          setLoading(false);
          clearTimeout(safetyTimerRef.current);
        }
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
        clearTimeout(safetyTimerRef.current);
      }
    });

    return () => {
      unsubscribe();
      if (userDocUnsubRef.current) userDocUnsubRef.current();
      clearTimeout(safetyTimerRef.current);
    };
  }, []);

  const signIn = async (email, password) => {
    return firebaseSignIn(email, password);
  };

  const signOut = async () => {
    const result = await firebaseSignOut();
    setUser(null);
    setUserData(null);
    return result;
  };

  const value = {
    user,
    userData,
    loading,
    signIn,
    signOut,
    // Role checks
    isAdmin: userData?.role === 'admin' || userData?.role === 'superadmin' || userData?.tenantRole === 'owner',
    isTrainer: userData?.role === 'trainer',
    isMember: userData?.role === 'member',
    role: userData?.role,
    // Multi-tenancy fields
    tenantId: userData?.tenantId || null,
    isSuperAdmin: userData?.superAdmin === true,
    tenantRole: userData?.tenantRole || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Safe defaults if used outside provider
    return {
      user: null,
      userData: null,
      loading: true,
      signIn: async () => ({}),
      signOut: async () => {},
      isAdmin: false,
      isTrainer: false,
      isMember: false,
      role: null,
      tenantId: null,
      isSuperAdmin: false,
      tenantRole: null,
    };
  }
  return context;
}

export default AuthContext;
