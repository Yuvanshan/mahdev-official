import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CustomerUser,
  LoginCredentials,
  RegisterInput,
} from '../types/customer';
import { authService } from '../services/authService';

interface AuthContextType {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (input: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<CustomerUser>) => Promise<{ success: boolean; error?: string }>;
  switchAccount: (email: string) => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const current = authService.getCurrentUser();
    setUser(current);
    setIsLoading(false);
  }, []);

  const refreshUser = () => {
    const current = authService.getCurrentUser();
    setUser(current);
  };

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const res = await authService.login(credentials);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Login failed' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Login error' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (input: RegisterInput) => {
    setIsLoading(true);
    try {
      const res = await authService.register(input);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Registration failed' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Registration error' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<CustomerUser>) => {
    if (!user) return { success: false, error: 'No active session' };
    try {
      const res = await authService.updateProfile(user.id, updates);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Update failed' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Update failed' };
    }
  };

  const switchAccount = (email: string) => {
    const switched = authService.switchDemoAccount(email);
    if (switched) {
      setUser(switched);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        switchAccount,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
