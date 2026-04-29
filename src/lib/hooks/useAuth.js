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
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const { data } = await getUserData(firebaseUser.uid);
          setUser(firebaseUser);
          setUserData(data);
        } catch (err) {
          console.error('[Auth] Failed to get user data:', err);
          setUser(firebaseUser);
          setUserData(null);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
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
