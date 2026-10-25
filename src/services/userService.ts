import { UserAccount, RoleType, PermissionMatrix } from '../types';
import { apiClient } from './apiClient';

export interface CreateUserData {
  name: string;
  email: string;
  password?: string;
  role: RoleType;
  department?: string;
  avatar?: string;
  gender?: 'male' | 'female';
}

export const userService = {
  async getUsers(params?: { search?: string; role?: string; status?: string }): Promise<UserAccount[]> {
    const res = await apiClient.get<UserAccount[]>('/users', { params });
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  async getUserById(id: string): Promise<UserAccount> {
    return apiClient.get<UserAccount>(`/users/${id}`);
  },

  async createUser(data: CreateUserData): Promise<UserAccount> {
    return apiClient.post<UserAccount>('/users', data);
  },

  async updateUser(id: string, data: Partial<UserAccount>): Promise<UserAccount> {
    return apiClient.put<UserAccount>(`/users/${id}`, data);
  },

  async updateUserRole(id: string, role: RoleType): Promise<UserAccount> {
    return this.updateUser(id, { role });
  },

  async deleteUser(id: string): Promise<boolean> {
    await apiClient.delete(`/users/${id}`);
    return true;
  },

  async getAllRolePermissions(): Promise<Record<RoleType, PermissionMatrix[]>> {
    const res = await apiClient.get<Record<RoleType, PermissionMatrix[]>>('/users/roles/permissions');
    return (res as any)?.data || res;
  },

  async getRolePermissions(role: RoleType): Promise<PermissionMatrix[]> {
    const all = await this.getAllRolePermissions();
    return all?.[role] || [];
  },

  async updateRolePermissions(role: RoleType, permissions: PermissionMatrix[]): Promise<void> {
    await apiClient.put(`/users/roles/permissions/${role}`, { permissions });
  },
};
