import { UserAccount, PermissionMatrix } from '../types';
import { apiClient } from './apiClient';

const AUTH_STORAGE_KEY = 'hr_auth_user';

export interface LoginResult {
  user: UserAccount;
  token: string;
  permissions: PermissionMatrix[];
}

export const authService = {
  getCurrentUser(): UserAccount | null {
    try {
      const token = apiClient.getToken();
      if (!token) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }
      const stored = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserAccount;
        if (parsed && parsed.status && parsed.status !== 'active') {
          this.logout();
          return null;
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  },

  setCurrentUser(user: UserAccount | null, rememberMe?: boolean): void {
    try {
      if (user) {
        const useLocal =
          rememberMe !== undefined
            ? rememberMe
            : Boolean(localStorage.getItem('auth_token') || !sessionStorage.getItem('auth_token'));
        if (useLocal) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
          sessionStorage.removeItem(AUTH_STORAGE_KEY);
        } else {
          sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  },

  async login(email: string, password: string, rememberMe = true): Promise<LoginResult> {
    if (!email?.trim() || !password) {
      throw new Error('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
    }
    const res = await apiClient.post<{ token: string; user: UserAccount; permissions: PermissionMatrix[] }>(
      '/auth/login',
      { email: email.trim(), password }
    );
    if (res && res.token && res.user) {
      if (res.user.status && res.user.status !== 'active') {
        this.logout();
        throw new Error('هذا الحساب غير نشط أو موقوف حالياً. يرجى التواصل مع مسؤول النظام.');
      }
      apiClient.setToken(res.token, rememberMe);
      this.setCurrentUser(res.user, rememberMe);
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
      if (res.user.status && res.user.status !== 'active') {
        this.logout();
        throw new Error('Account is inactive or suspended');
      }
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
