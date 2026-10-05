import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { authApi, type LoginPayload, type RegisterPayload } from "@/lib/auth-api";
import { tokenStorage } from "@/lib/token-storage";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!tokenStorage.get()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const profile = await authApi.me();
      setUser(profile);
    } catch {
      tokenStorage.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
    const handleLogout = () => setUser(null);
    window.addEventListener("taskflow:logout", handleLogout);
    return () => window.removeEventListener("taskflow:logout", handleLogout);
  }, [loadProfile]);

  const login = useCallback(async (payload: LoginPayload) => {
    const { token, user: loggedInUser } = await authApi.login(payload);
    tokenStorage.set(token);
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await authApi.register(payload);
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: Boolean(user), isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
