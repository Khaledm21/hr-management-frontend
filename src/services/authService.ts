import { UserAccount, PermissionMatrix, RoleType } from '../types';
import { apiClient } from './apiClient';

const AUTH_STORAGE_KEY = 'hr_auth_user';

export const demoAccounts: { role: RoleType; name: string; email: string; label: string; desc: string }[] = [
  {
    role: 'admin',
    name: 'Khaled Mossad',
    email: 'khaled.mossad@enterprise.com',
    label: 'System Administrator',
    desc: 'Full system access: users, roles, audit logs, all settings & modules',
  },
  {
    role: 'hr_manager',
    name: 'Sarah Al-Ghamdi',
    email: 'sarah.ghamdi@enterprise.com',
    label: 'HR Manager',
    desc: 'Full workforce, approvals, payroll, contracts, leave & policy sign-offs',
  },
  {
    role: 'hr_staff',
    name: 'Noura Al-Shehri',
    email: 'noura.shehri@enterprise.com',
    label: 'HR Staff / Specialist',
    desc: 'Employee directory, document verification, leave entry (no payroll)',
  },
  {
    role: 'dept_manager',
    name: 'Tariq Al-Mansoor',
    email: 'tariq.mansoor@enterprise.com',
    label: 'Department Manager (Engineering)',
    desc: 'Team attendance, approval inbox for department leaves & contract requests',
  },
];

export interface LoginResult {
  user: UserAccount;
  token: string;
  permissions: PermissionMatrix[];
}

export const authService = {
  getCurrentUser(): UserAccount | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return null;
  },

  setCurrentUser(user: UserAccount | null): void {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  },

  async login(email: string, password?: string): Promise<LoginResult> {
    const res = await apiClient.post<{ token: string; user: UserAccount; permissions: PermissionMatrix[] }>(
      '/auth/login',
      { email, password }
    );
    if (res && res.token && res.user) {
      apiClient.setToken(res.token);
      this.setCurrentUser(res.user);
      return {
        user: res.user,
        token: res.token,
        permissions: res.permissions || [],
      };
    }
    throw new Error('Authentication failed');
  },

  async getMe(): Promise<{ user: UserAccount; permissions: PermissionMatrix[] }> {
    const res = await apiClient.get<{ user: UserAccount; permissions: PermissionMatrix[] }>('/auth/me');
    if (res && res.user) {
      this.setCurrentUser(res.user);
      return {
        user: res.user,
        permissions: res.permissions || [],
      };
    }
    throw new Error('Session invalid');
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', { currentPassword, newPassword });
  },

  async updateProfile(
    userId: string,
    data: { name?: string; avatar?: string; gender?: 'male' | 'female' }
  ): Promise<UserAccount> {
    const res = await apiClient.put<UserAccount>(`/users/${userId}`, data);
    const updatedUser = (res as any)?.data || res;
    const current = this.getCurrentUser();
    if (current) {
      const merged = { ...current, ...updatedUser };
      this.setCurrentUser(merged);
    }
    return updatedUser;
  },

  logout(): void {
    apiClient.setToken(null);
    this.setCurrentUser(null);
  },
};
