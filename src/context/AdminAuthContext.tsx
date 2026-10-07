import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser, AdminSession } from '../types/admin';
import { adminService } from '../services/adminService';

interface AdminAuthContextType {
  admin: AdminUser | null;
  session: AdminSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string, pin?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  logAuditAction: (action: string, entityType: string, entityId: string, details: string, status?: 'success' | 'warning' | 'error') => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const currentSession = adminService.getCurrentSession();
    if (currentSession && adminService.isAuthenticated()) {
      setSession(currentSession);
      setAdmin(currentSession.user);
    }
    setIsLoading(false);
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

  const logout = async () => {
    setIsLoading(true);
    await adminService.logout();
    setSession(null);
    setAdmin(null);
    setIsLoading(false);
  };

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
