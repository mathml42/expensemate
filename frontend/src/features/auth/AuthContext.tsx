import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../../lib/firebase/app";
import {
  getCurrentUser,
  getUserById,
  login as firebaseLogin,
  logout as firebaseLogout,
} from "../../lib/firebase/users";
import type { LoginCredentials, User } from "./types";

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      setUser(await getCurrentUser());
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const profile = await getUserById(firebaseUser.uid);
        if (!profile || !profile.is_active) {
          await firebaseLogout();
          setUser(null);
          return;
        }
        setUser(profile);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [refreshUser]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setUser(await firebaseLogin(credentials.email, credentials.password));
    },
    [],
  );

  const logout = useCallback(async () => {
    await firebaseLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [isLoading, login, logout, refreshUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
