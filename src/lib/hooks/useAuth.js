'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, getUserData } from '@/lib/firebase/auth';
import { signIn as firebaseSignIn, signOut as firebaseSignOut } from '@/lib/firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let userDocUnsub = null;

    const unsubscribe = onAuthChange((firebaseUser) => {
      // Clean up previous user doc listener
      if (userDocUnsub) {
        userDocUnsub();
        userDocUnsub = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        // Use real-time listener so userData updates automatically
        // (e.g., when tenantId/role are set during onboarding)
        const { doc, onSnapshot } = require('firebase/firestore');
        const { db } = require('@/lib/firebase/config');
        const userRef = doc(db, 'users', firebaseUser.uid);
        userDocUnsub = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setUserData({ id: snap.id, ...snap.data() });
          } else {
            setUserData(null);
          }
          setLoading(false);
        }, (err) => {
          console.error('[Auth] User doc listener error:', err);
          setUserData(null);
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (userDocUnsub) userDocUnsub();
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
