import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, RoleType, PermissionMatrix } from '../types';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { apiClient } from '../services/apiClient';

interface AuthContextType {
  user: UserAccount | null;
  role: RoleType;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: PermissionMatrix[];
  login: (email: string, password?: string) => Promise<UserAccount>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  updateCurrentUser: (updated: Partial<UserAccount>) => void;
  can: (module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(() => authService.getCurrentUser());
  const [permissions, setPermissions] = useState<PermissionMatrix[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const token = apiClient.getToken();
      if (!token) {
        if (isMounted) {
          setUser(null);
          setPermissions([]);
          setIsLoading(false);
        }
        return;
      }
      try {
        const { user: meUser, permissions: mePerms } = await authService.getMe();
        if (isMounted) {
          setUser(meUser);
          setPermissions(mePerms || []);
        }
      } catch (err) {
        console.warn('Initial auth validation failed:', err);
        if (isMounted) {
          authService.logout();
          setUser(null);
          setPermissions([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listen for unauthorized 401 events from apiClient
    const handleUnauthorized = () => {
      setUser(null);
      setPermissions([]);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password?: string) => {
    const res = await authService.login(email, password);
    setUser(res.user);
    setPermissions(res.permissions || []);
    return res.user;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setPermissions([]);
  };

  const refreshMe = async () => {
    try {
      const { user: meUser, permissions: mePerms } = await authService.getMe();
      setUser(meUser);
      setPermissions(mePerms || []);
    } catch {
      logout();
    }
  };

  const can = (module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export'): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admins have full root access

    const modPerm = permissions.find(p => p.module === module);
    if (!modPerm) return false;

    const actionMap: Record<string, string> = {
      view: 'canView',
      create: 'canCreate',
      edit: 'canEdit',
      delete: 'canDelete',
      approve: 'canApprove',
      export: 'canExport',
    };
    const canKey = actionMap[action];
    return !!((modPerm as any)[action] ?? (modPerm as any)[canKey]);
  };

  const updateCurrentUser = (updated: Partial<UserAccount>) => {
    setUser(prev => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      authService.setCurrentUser(next);
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'admin',
        isAuthenticated: !!user,
        isLoading,
        permissions,
        login,
        logout,
        refreshMe,
        updateCurrentUser,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
