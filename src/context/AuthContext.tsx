import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, RoleType } from '../types';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

interface AuthContextType {
  user: UserAccount | null;
  role: RoleType;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<UserAccount>;
  logout: () => void;
  switchRole: (role: RoleType) => Promise<UserAccount>;
  can: (module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(() => authService.getCurrentUser());
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role) {
      userService.getRolePermissions(user.role).then(setRolePermissions);
    }
  }, [user?.role]);

  const login = async (email: string, password?: string) => {
    const loggedUser = await authService.login(email, password);
    setUser(loggedUser);
    const perms = await userService.getRolePermissions(loggedUser.role);
    setRolePermissions(perms);
    return loggedUser;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const switchRole = async (newRole: RoleType) => {
    const updatedUser = await authService.switchRole(newRole);
    setUser(updatedUser);
    const perms = await userService.getRolePermissions(newRole);
    setRolePermissions(perms);
    return updatedUser;
  };

  const can = (module: string, action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export'): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admins have broad access

    const modPerm = rolePermissions.find(p => p.module === module);
    if (!modPerm) return true; // Default fallback to allow viewing unless expressly disabled
    return !!modPerm[action];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'hr_manager',
        isAuthenticated: !!user,
        login,
        logout,
        switchRole,
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
