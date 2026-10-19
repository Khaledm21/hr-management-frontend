import { RoleType, UserAccount } from '../types';
import { mockUsers } from '../mocks/users';

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

export const authService = {
  getCurrentUser(): UserAccount {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    // Default to HR Manager for rich demo experience
    return mockUsers[0];
  },

  setCurrentUser(user: UserAccount): void {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  },

  async login(email: string, _password?: string): Promise<UserAccount> {
    await new Promise(res => setTimeout(res, 200));
    const found = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      this.setCurrentUser(found);
      return found;
    }

    // Default fallback user if random email typed
    const customUser: UserAccount = {
      id: 'usr-custom',
      name: email.split('@')[0],
      email,
      role: 'hr_manager',
      department: 'Human Resources',
      status: 'active',
      lastLogin: 'Just now',
    };
    this.setCurrentUser(customUser);
    return customUser;
  },

  async switchRole(role: RoleType): Promise<UserAccount> {
    const demo = demoAccounts.find(d => d.role === role) || demoAccounts[0];
    const user: UserAccount = {
      id: `usr-${role}`,
      name: demo.name,
      email: demo.email,
      role: demo.role,
      department: role === 'dept_manager' ? 'Engineering & Technology' : 'Human Resources',
      status: 'active',
      lastLogin: 'Just now',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${demo.name.replace(' ', '-')}`,
    };
    this.setCurrentUser(user);
    return user;
  },

  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },
};
