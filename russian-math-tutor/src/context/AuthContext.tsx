import React, {
  createContext, useContext, useState,
  useEffect, useCallback, ReactNode,
} from 'react';
import { UserProfile } from '../types';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { ProgressService } from '../services/ProgressService';

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextType {
  currentUser: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, displayName: string, avatarEmoji: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<Pick<UserProfile, 'displayName' | 'avatarEmoji'>>) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const session = AuthService.getSession();
    if (session) {
      setCurrentUser(session);
      ProgressService.getInstance().switchUser(session.userId);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await AuthService.login(username, password);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      ProgressService.getInstance().switchUser(result.user.userId);
    }
    return { success: result.success, error: result.error };
  }, []);

  const register = useCallback(async (
    username: string, password: string, displayName: string, avatarEmoji: string
  ) => {
    const result = await AuthService.register(username, password, displayName, avatarEmoji);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      ProgressService.getInstance().switchUser(result.user.userId);
    }
    return { success: result.success, error: result.error };
  }, []);

  const logout = useCallback(() => {
    AuthService.logout();
    setCurrentUser(null);
    ProgressService.getInstance().switchUser('guest');
  }, []);

  const updateUser = useCallback(async (
    updates: Partial<Pick<UserProfile, 'displayName' | 'avatarEmoji'>>
  ) => {
    if (!currentUser) return;
    const updated = await UserService.updateProfile(currentUser.userId, updates);
    if (updated) setCurrentUser(updated);
  }, [currentUser]);

  const deleteAccount = useCallback(async () => {
    if (!currentUser) return;
    await UserService.deleteAccount(currentUser.userId, currentUser.username);
    setCurrentUser(null);
    ProgressService.getInstance().switchUser('guest');
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{
      currentUser, isLoggedIn: !!currentUser, isLoading,
      login, register, logout, updateUser, deleteAccount,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
