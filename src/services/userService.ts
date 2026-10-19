import { UserAccount, RoleType, PermissionMatrix } from '../types';
import { mockUsers, defaultPermissionsByRole } from '../mocks/users';

let usersState = [...mockUsers];
let permissionsState: Record<RoleType, PermissionMatrix[]> = {
  ...defaultPermissionsByRole,
};

export const userService = {
  async getUsers(): Promise<UserAccount[]> {
    await new Promise(res => setTimeout(res, 40));
    return [...usersState];
  },

  async createUser(data: Omit<UserAccount, 'id' | 'lastLogin'>): Promise<UserAccount> {
    await new Promise(res => setTimeout(res, 60));
    const newUser: UserAccount = {
      ...data,
      id: `usr-${Date.now()}`,
      lastLogin: 'Never',
    };
    usersState.push(newUser);
    return newUser;
  },

  async updateUserRole(id: string, role: RoleType): Promise<UserAccount> {
    await new Promise(res => setTimeout(res, 60));
    const user = usersState.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    user.role = role;
    return { ...user };
  },

  async deleteUser(id: string): Promise<boolean> {
    await new Promise(res => setTimeout(res, 60));
    usersState = usersState.filter(u => u.id !== id);
    return true;
  },

  async getRolePermissions(role: RoleType): Promise<PermissionMatrix[]> {
    await new Promise(res => setTimeout(res, 30));
    return [...(permissionsState[role] || [])];
  },

  async updateRolePermissions(role: RoleType, permissions: PermissionMatrix[]): Promise<void> {
    await new Promise(res => setTimeout(res, 50));
    permissionsState[role] = permissions;
  },
};
