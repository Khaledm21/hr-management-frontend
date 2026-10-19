import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  UserPlus,
  Shield,
  KeyRound,
  Trash2,
  Lock,
  Mail,
  Building2,
} from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { userService } from '../../services/userService';
import { UserAccount, RoleType } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';

export const UsersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { can, role } = useAuth();

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Invite User form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userRole, setUserRole] = useState<RoleType>('hr_staff');
  const [dept, setDept] = useState('Human Resources');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (can('users', 'view')) {
      fetchUsers();
    } else {
      setIsLoading(false);
    }
  }, []);

  if (!can('users', 'view')) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          User administration is restricted to System Administrators and HR Directors.
        </p>
      </div>
    );
  }

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await userService.createUser({
      name,
      email,
      role: userRole,
      department: dept,
      status: 'active',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(' ', '-')}`,
    });
    success(`Account invite dispatched to ${email}.`, 'User Created');
    setIsInviteOpen(false);
    setName('');
    setEmail('');
    await fetchUsers();
  };

  const handleDeleteUser = async (id: string, userName: string) => {
    await userService.deleteUser(id);
    success(`User ${userName} has been removed.`, 'Account Removed');
    await fetchUsers();
  };

  const getRoleBadge = (r: RoleType) => {
    const map: Record<RoleType, { label: string; variant: any }> = {
      admin: { label: 'System Admin', variant: 'danger' },
      hr_manager: { label: 'HR Manager', variant: 'warning' },
      hr_staff: { label: 'HR Staff', variant: 'info' },
      dept_manager: { label: 'Dept Manager', variant: 'default' },
    };
    const x = map[r] || { label: r, variant: 'default' };
    return <Badge variant={x.variant}>{x.label}</Badge>;
  };

  const columns: Column<UserAccount>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'User Account',
        sortable: true,
        render: row => (
          <div className="flex items-center gap-3">
            <Avatar name={row.name} src={row.avatar} size="sm" />
            <div>
              <span className="font-semibold text-slate-900 block">{row.name}</span>
              <span className="text-[11px] text-slate-400">{row.email}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'role',
        header: t('common.role'),
        sortable: true,
        render: row => getRoleBadge(row.role),
      },
      {
        key: 'department',
        header: 'Department',
        sortable: true,
        render: row => <span className="text-slate-600 font-medium">{row.department}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: row => (
          <Badge variant={row.status === 'active' ? 'success' : 'secondary'}>
            {row.status.toUpperCase()}
          </Badge>
        ),
      },
      {
        key: 'lastLogin',
        header: t('users.lastLogin'),
        sortable: true,
        render: row => <span className="text-slate-400 text-xs">{row.lastLogin}</span>,
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: row => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => handleDeleteUser(row.id, row.name)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Remove User"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t('users.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">{t('users.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            leftIcon={<KeyRound className="w-4 h-4" />}
            onClick={() => navigate('/roles')}
          >
            {t('users.rolesPermissions')}
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsInviteOpen(true)}
          >
            {t('users.addUser')}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        keyExtractor={row => row.id}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search user name or email..."
        exportFilename="Apex_Enterprise_User_Accounts"
      />

      {/* Invite User Modal */}
      {isInviteOpen && (
        <Modal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          size="md"
          title="Invite System User"
          description="Grant administrative portal access and assign role tier"
        >
          <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
            <Input
              label="Full Name"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Layla Al-Qahtani"
            />
            <Input
              label="Corporate Email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="layla.qahtani@enterprise.com"
            />
            <Select
              label="Assigned Role Tier"
              required
              value={userRole}
              onChange={e => setUserRole(e.target.value as RoleType)}
              options={[
                { value: 'hr_staff', label: 'HR Staff / Specialist' },
                { value: 'hr_manager', label: 'HR Operations Manager' },
                { value: 'dept_manager', label: 'Department Manager' },
                { value: 'admin', label: 'System Administrator' },
              ]}
            />
            <Input
              label="Department Association"
              required
              value={dept}
              onChange={e => setDept(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setIsInviteOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Dispatch Invite
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
