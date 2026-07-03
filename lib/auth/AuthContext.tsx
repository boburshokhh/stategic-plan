"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/endpoints";
import { ApiError, getToken, setToken } from "../api/client";
import type { AuthUser } from "../api/types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;

    authApi
      .me()
      .then(setUser)
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          setToken(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    setToken(response.accessToken);
    const me = await authApi.me();
    setUser(me);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, isLoading, login, logout }), [user, isLoading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth должен использоваться внутри AuthProvider");
  }
  return context;
}
