import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AdminUser, AdminSession } from '../types/admin';
import { adminService } from '../services/adminService';

interface AdminAuthContextType {
  admin: AdminUser | null;
  session: AdminSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Restores the cookie session once; called by the admin portal only. */
  ensureSessionRestored: () => void;
  isRestoringSession: boolean;
  login: (email: string, password?: string, pin?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  logAuditAction: (action: string, entityType: string, entityId: string, details: string, status?: 'success' | 'warning' | 'error') => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(false);
  const restoreStartedRef = useRef(false);

  // Public pages never need the admin session, so it is only checked when the
  // admin portal mounts. This removes a /api/admin/auth/verify call (and its
  // 401 console error) from every public page view.
  const ensureSessionRestored = useCallback(() => {
    if (restoreStartedRef.current) return;
    restoreStartedRef.current = true;
    setIsRestoringSession(true);
    adminService.restoreSession()
      .then((currentSession) => {
        if (!currentSession) return;
        setSession(currentSession);
        setAdmin(currentSession.user);
      })
      .finally(() => setIsRestoringSession(false));
  }, []);

  const login = async (email: string, password?: string, pin?: string) => {
    setIsLoading(true);
    const result = await adminService.login(email, password, pin);
    if (result.success && result.session) {
      setSession(result.session);
      setAdmin(result.session.user);
      setIsLoading(false);
      return { success: true };
    }
    setIsLoading(false);
    return { success: false, error: result.error || 'Authentication failed.' };
  };

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await adminService.logout();
    } finally {
      setSession(null);
      setAdmin(null);
      setIsLoading(false);
    }
  }, []);

  const logAuditAction = async (
    action: string,
    entityType: string,
    entityId: string,
    details: string,
    status: 'success' | 'warning' | 'error' = 'success'
  ) => {
    return adminService.logAudit({ action, entityType, entityId, details, status });
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        session,
        isAuthenticated: !!admin,
        isLoading,
        ensureSessionRestored,
        isRestoringSession,
        login,
        logout,
        logAuditAction,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
