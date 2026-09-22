import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { watchAuth } from "../services/authService";
import { isFirebaseConfigured } from "../services/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  firebaseError: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  firebaseError: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setFirebaseError(true);
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = watchAuth((u) => {
        setUser(u);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Auth error:", e);
      setFirebaseError(true);
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, firebaseError }}>
      {children}
    </AuthContext.Provider>
  );
}
