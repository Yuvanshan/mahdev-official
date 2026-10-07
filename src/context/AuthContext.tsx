import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CustomerUser,
  LoginCredentials,
  RegisterInput,
  AuthStatus,
} from '../types/customer';
import { authService } from '../services/authService';

interface AuthContextType {
  user: CustomerUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  isUnauthenticated: boolean;
  isError: boolean;
  error: string | null;
  isAdmin: boolean;
  isStaff: boolean;
  isPrivileged: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (input: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; error?: string }>;
  updateProfile: (updates: Partial<CustomerUser>) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch from authService
    const current = authService.getCurrentUser();
    if (current) {
      setUser(current);
      setStatus('authenticated');
    } else {
      setUser(null);
      setStatus('unauthenticated');
    }

    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe((updatedUser) => {
      if (updatedUser) {
        setUser(updatedUser);
        setStatus('authenticated');
        setError(null);
      } else {
        setUser(null);
        setStatus('unauthenticated');
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = () => {
    const current = authService.getCurrentUser();
    setUser(current);
    setStatus(current ? 'authenticated' : 'unauthenticated');
  };

  const login = async (credentials: LoginCredentials) => {
    setStatus('loading');
    setError(null);
    try {
      const res = await authService.login(credentials);
      if (res.success && res.user) {
        setUser(res.user);
        setStatus('authenticated');
        setError(null);
        return { success: true };
      }
      setStatus('unauthenticated');
      const errMsg = res.error || 'Login failed';
      setError(errMsg);
      return { success: false, error: errMsg };
    } catch (e: any) {
      setStatus('error');
      const errMsg = e.message || 'Login error';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const register = async (input: RegisterInput) => {
    setStatus('loading');
    setError(null);
    try {
      const res = await authService.register(input);
      if (res.success && res.user) {
        setUser(res.user);
        setStatus('authenticated');
        setError(null);
        return { success: true };
      }
      setStatus('unauthenticated');
      const errMsg = res.error || 'Registration failed';
      setError(errMsg);
      return { success: false, error: errMsg };
    } catch (e: any) {
      setStatus('error');
      const errMsg = e.message || 'Registration error';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setStatus('unauthenticated');
    setError(null);
  };

  const requestPasswordReset = async (email: string) => {
    return authService.requestPasswordReset(email);
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

  const isPrivileged = Boolean(
    user && ['admin', 'superAdmin', 'manager', 'staff'].includes(user.role)
  );
  const isAdmin = Boolean(
    user && ['admin', 'superAdmin'].includes(user.role)
  );
  const isStaff = Boolean(
    user && ['admin', 'superAdmin', 'manager', 'staff'].includes(user.role)
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isAuthenticated: status === 'authenticated' && !!user,
        isLoading: status === 'loading',
        isUnauthenticated: status === 'unauthenticated' || (!user && status !== 'loading'),
        isError: status === 'error',
        error,
        isAdmin,
        isStaff,
        isPrivileged,
        login,
        register,
        logout,
        requestPasswordReset,
        updateProfile,
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
