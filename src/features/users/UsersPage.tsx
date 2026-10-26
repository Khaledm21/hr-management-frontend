import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  KeyRound,
  Trash2,
  Lock,
  Edit2,
  RefreshCw,
} from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { userService } from '../../services/userService';
import { departmentService } from '../../services/departmentService';
import { UserAccount, RoleType, Department } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';

// Helper to construct male/female customized DiceBear SVG avatars
const getAvatarUrl = (nameStr: string, g: 'male' | 'female', seedSuffix = 0) => {
  const cleanSeed = (nameStr.trim() || (g === 'female' ? 'sarah' : 'ahmed')).replace(/\s+/g, '-');
  const fullSeed = `${g}-${cleanSeed}${seedSuffix > 0 ? `-${seedSuffix}` : ''}`;
  if (g === 'female') {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullSeed)}&facialHairProbability=0&top=longButNotTooLong,straight01,straight02,curly,curvy,bob`;
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullSeed)}&top=shortFlat,shortRound,shortWaved,sides,theCaesar,theCaesarAndSidePart`;
};

export const UsersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { can, user: currentUser } = useAuth();

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add User Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Enterprise@123');
  const [userRole, setUserRole] = useState<RoleType>('hr_staff');
  const [dept, setDept] = useState('Human Resources');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [avatarSeed, setAvatarSeed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<RoleType>('hr_staff');
  const [editDept, setEditDept] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive' | 'suspended'>('active');
  const [editGender, setEditGender] = useState<'male' | 'female'>('male');
  const [editAvatarSeed, setEditAvatarSeed] = useState(0);
  const [editAvatar, setEditAvatar] = useState('');

  // Live avatar preview for the create modal
  const previewAvatar = useMemo(
    () => getAvatarUrl(name, gender, avatarSeed),
    [name, gender, avatarSeed]
  );

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err: any) {
      toastError(err?.message || 'Failed to fetch users', 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    departmentService.getDepartments().then(setDepartments).catch(() => {});
    if (can('users', 'view')) {
      fetchUsers();
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await userService.createUser({
        name: name.trim(),
        email: email.trim(),
        password: password.trim() || 'Enterprise@123',
        role: userRole,
        department: dept.trim() || 'Human Resources',
        avatar: previewAvatar,
        gender: gender,
      });
      success(
        t('users.userCreatedSuccess', {
          defaultValue: `تم إنشاء حساب المستخدم "${name}" بنجاح (${gender === 'female' ? 'أنثى' : 'ذكر'}).`,
          name,
        }),
        t('common.success', 'User Created')
      );
      setIsAddOpen(false);
      setName('');
      setEmail('');
      setPassword('Enterprise@123');
      setGender('male');
      setAvatarSeed(0);
      await fetchUsers();
    } catch (err: any) {
      toastError(err?.message || 'Failed to create user', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (u: UserAccount) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditRole(u.role);
    setEditDept(u.department || 'Human Resources');
    setEditStatus((u.status as any) || 'active');
    const isFemale = u.gender ? u.gender === 'female' : (u.avatar ? u.avatar.includes('female') : false);
    const initialGender: 'male' | 'female' = isFemale ? 'female' : 'male';
    setEditGender(initialGender);
    setEditAvatarSeed(0);
    setEditAvatar(u.avatar || getAvatarUrl(u.name, initialGender));
  };

  const handleEditGenderChange = (newGender: 'male' | 'female') => {
    setEditGender(newGender);
    setEditAvatar(getAvatarUrl(editName, newGender, editAvatarSeed));
  };

  const handleEditRandomize = () => {
    const nextSeed = editAvatarSeed + 1;
    setEditAvatarSeed(nextSeed);
    setEditAvatar(getAvatarUrl(editName, editGender, nextSeed));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      await userService.updateUser(editingUser.id, {
        name: editName.trim(),
        role: editRole,
        department: editDept.trim(),
        status: editStatus,
        avatar: editAvatar,
        gender: editGender,
      });
      success(
        t('users.userUpdatedSuccess', {
          defaultValue: `تم تحديث حساب "${editName}" بنجاح.`,
          name: editName,
        }),
        t('common.success', 'User Updated')
      );
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      toastError(err?.message || 'Failed to update user', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, userName: string) => {
    if (confirm(t('users.deleteConfirm', { name: userName, defaultValue: `Are you sure you want to delete user "${userName}"?` }))) {
      try {
        await userService.deleteUser(id);
        success(t('users.userDeletedSuccess', { name: userName, defaultValue: `User "${userName}" has been removed.` }), t('common.success', 'Account Removed'));
        await fetchUsers();
      } catch (err: any) {
        toastError(err?.message || 'Failed to delete user', 'Error');
      }
    }
  };

  const getRoleBadge = (r: RoleType) => {
    const map: Record<RoleType, { label: string; variant: 'danger' | 'warning' | 'info' | 'default' | 'success' | 'secondary' }> = {
      admin: { label: t('users.roleAdmin', 'System Admin'), variant: 'danger' },
      hr_manager: { label: t('users.roleHrManager', 'HR Manager'), variant: 'warning' },
      hr_staff: { label: t('users.roleHrStaff', 'HR Staff'), variant: 'info' },
      dept_manager: { label: t('users.roleDeptManager', 'Dept Manager'), variant: 'default' },
    };
    const x = map[r] || { label: r, variant: 'default' };
    return <Badge variant={x.variant}>{x.label}</Badge>;
  };

  const columns: Column<UserAccount>[] = useMemo(
    () => [
      {
        key: 'name',
        header: t('users.userAccount', 'حساب المستخدم'),
        sortable: true,
        render: row => (
          <div className="flex items-center gap-3">
            <Avatar name={row.name} src={row.avatar} size="sm" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] block">{row.name}</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{row.email}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'role',
        header: t('common.role', 'الدور الإداري'),
        sortable: true,
        render: row => getRoleBadge(row.role),
      },
      {
        key: 'department',
        header: t('users.department', 'الإدارة / القسم'),
        sortable: true,
        render: row => <span className="text-slate-600 dark:text-slate-300 font-medium">{row.department}</span>,
      },
      {
        key: 'status',
        header: t('users.status', 'الحالة'),
        sortable: true,
        render: row => {
          const statusLabels: Record<string, string> = {
            active: t('users.statusActive', 'ACTIVE'),
            inactive: t('users.statusInactive', 'INACTIVE'),
            suspended: t('users.statusSuspended', 'SUSPENDED'),
          };
          return (
            <Badge variant={row.status === 'active' ? 'success' : row.status === 'suspended' ? 'danger' : 'secondary'}>
              {statusLabels[row.status] || row.status.toUpperCase()}
            </Badge>
          );
        },
      },
      {
        key: 'lastLogin',
        header: t('users.lastLogin', 'آخر تسجيل دخول'),
        sortable: true,
        render: row => (
          <span className="text-slate-400 dark:text-slate-500 text-xs font-mono">
            {row.lastLogin ? new Date(row.lastLogin).toLocaleString() : t('users.neverLoggedIn', 'Never')}
          </span>
        ),
      },
      {
        key: 'actions',
        header: t('users.actions', 'الإجراءات'),
        align: 'right',
        render: row => {
          const isMasterAdmin = row.email === 'khaled.mossad@enterprise.com';
          return (
            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => openEditModal(row)}
                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors cursor-pointer"
                title={t('users.editUserTitle', 'تعديل المستخدم')}
              >
                <Edit2 className="w-4 h-4" />
              </button>
              {!isMasterAdmin && (
                <button
                  onClick={() => handleDeleteUser(row.id, row.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title={t('users.deleteUser', 'حذف المستخدم')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [t]
  );

  if (!can('users', 'view')) {
    return (
      <div className="text-center py-16 bg-white dark:bg-[#151D2E] rounded-2xl border border-slate-200 dark:border-[#1E293B]">
        <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">{t('users.accessRestricted', 'Access Restricted')}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          {t('users.accessRestrictedDesc', 'User administration is restricted to System Administrators and authorized personnel.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
            {t('users.title', 'إدارة المستخدمين والحسابات')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('users.subtitle', 'التحكم في حسابات مسؤولي النظام، الموظفين، وتعيين الصلاحيات والأدوار')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            leftIcon={<KeyRound className="w-4 h-4" />}
            onClick={() => navigate('/roles')}
          >
            {t('users.rolesPermissions', 'مصفوفة الصلاحيات')}
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsAddOpen(true)}
          >
            {t('users.addUser', 'إضافة مستخدم جديد')}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        keyExtractor={row => row.id}
        isLoading={isLoading}
        searchable
        searchPlaceholder={t('users.searchPlaceholder', 'بحث باسم المستخدم أو البريد الإلكتروني...')}
        exportFilename="Apex_Enterprise_User_Accounts"
      />

      {/* Add User Modal */}
      {isAddOpen && (
        <Modal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          size="md"
          title={t('users.createUserTitle', 'إنشاء حساب مستخدم جديد')}
          description={t('users.createUserDesc', 'إضافة حساب موظف جديد وتعيين صلاحيات الوصول للنظام')}
        >
          <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
            {/* Gender Selection & Live Avatar Preview */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>{t('users.genderLabel', 'نوع المستخدم')}</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    - {t('users.genderDesc', 'تحديد مظهر الصورة الرمزية للمستخدم')}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setAvatarSeed(s => s + 1)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                  title="تغيير شكل الملامح والشعر"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{t('users.randomizeAvatar', 'تغيير الشكل')}</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Live Preview Circle */}
                <div className="relative shrink-0">
                  <img
                    src={previewAvatar}
                    alt="Avatar preview"
                    className="w-14 h-14 rounded-full border-2 border-brand-500 bg-white dark:bg-[#151D2E] shadow-sm object-cover"
                  />
                  <span
                    className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white shadow ${
                      gender === 'male' ? 'bg-blue-600' : 'bg-rose-600'
                    }`}
                  >
                    {gender === 'male' ? t('users.genderMaleShort', 'ذكر') : t('users.genderFemaleShort', 'أنثى')}
                  </span>
                </div>

                {/* Male / Female Segmented Buttons */}
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      gender === 'male'
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-[#1E293B]/70'
                    }`}
                  >
                    <span className="text-lg">👨</span>
                    <div className="text-right rtl:text-right ltr:text-left">
                      <span className="block leading-tight">{t('users.genderMale', 'ذكر')}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{t('users.genderMaleDesc', 'أفاتار مذكر')}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      gender === 'female'
                        ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-[#1E293B]/70'
                    }`}
                  >
                    <span className="text-lg">👩</span>
                    <div className="text-right rtl:text-right ltr:text-left">
                      <span className="block leading-tight">{t('users.genderFemale', 'أنثى')}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{t('users.genderFemaleDesc', 'أفاتار مؤنث')}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <Input
              label={t('users.fullName', 'الاسم الكامل')}
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Ahmed Ali / Sara Ahmed"
            />
            <Input
              label={t('users.corporateEmail', 'البريد الإلكتروني للعمل')}
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@enterprise.com"
            />
            <Input
              label={t('users.initialPassword', 'كلمة المرور الابتدائية')}
              type="text"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
            />
            <Select
              label={t('users.assignedRole', 'الدور المخصص')}
              required
              value={userRole}
              onChange={e => setUserRole(e.target.value as RoleType)}
              options={[
                { value: 'hr_staff', label: t('users.roleHrStaff', 'HR Staff / Specialist') },
                { value: 'hr_manager', label: t('users.roleHrManager', 'HR Operations Manager') },
                { value: 'dept_manager', label: t('users.roleDeptManager', 'Department Manager') },
                { value: 'admin', label: t('users.roleAdmin', 'System Administrator') },
              ]}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {t('users.department', 'الإدارة / القسم')}
              </label>
              <select
                value={dept}
                onChange={e => setDept(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] p-2.5 text-slate-800 dark:text-[#F8FAFC] bg-white dark:bg-[#0B0F19] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer shadow-xs [&>option]:bg-white [&>option]:dark:bg-[#151D2E]"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1E293B]">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setIsAddOpen(false)}
              >
                {t('common.cancel', 'إلغاء')}
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
                {t('users.createButton', 'إنشاء الحساب')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          size="md"
          title={`${t('users.editUserTitle', 'تعديل حساب المستخدم')}: ${editingUser.name}`}
          description={`${t('users.editUserDesc', 'تعديل بيانات الحساب والصورة الرمزية')} (${editingUser.email})`}
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            {/* Edit Avatar & Gender Customization */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>{t('users.genderLabel', 'نوع المستخدم')}</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    - {t('users.genderDesc', 'تحديد مظهر الصورة الرمزية للمستخدم')}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleEditRandomize}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                  title="تغيير شكل الملامح والشعر"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{t('users.randomizeAvatar', 'تغيير الشكل')}</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Live Preview Circle */}
                <div className="relative shrink-0">
                  <img
                    src={editAvatar}
                    alt="Avatar preview"
                    className="w-14 h-14 rounded-full border-2 border-brand-500 bg-white dark:bg-[#151D2E] shadow-sm object-cover"
                  />
                  <span
                    className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white shadow ${
                      editGender === 'male' ? 'bg-blue-600' : 'bg-rose-600'
                    }`}
                  >
                    {editGender === 'male' ? t('users.genderMaleShort', 'ذكر') : t('users.genderFemaleShort', 'أنثى')}
                  </span>
                </div>

                {/* Male / Female Segmented Buttons */}
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => handleEditGenderChange('male')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      editGender === 'male'
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-[#1E293B]/70'
                    }`}
                  >
                    <span className="text-lg">👨</span>
                    <div className="text-right rtl:text-right ltr:text-left">
                      <span className="block leading-tight">{t('users.genderMale', 'ذكر')}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{t('users.genderMaleDesc', 'أفاتار مذكر')}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEditGenderChange('female')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      editGender === 'female'
                        ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-[#1E293B]/70'
                    }`}
                  >
                    <span className="text-lg">👩</span>
                    <div className="text-right rtl:text-right ltr:text-left">
                      <span className="block leading-tight">{t('users.genderFemale', 'أنثى')}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{t('users.genderFemaleDesc', 'أفاتار مؤنث')}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <Input
              label={t('users.fullName', 'الاسم الكامل')}
              required
              value={editName}
              onChange={e => setEditName(e.target.value)}
            />
            <Select
              label={t('users.assignedRole', 'الدور المخصص')}
              required
              value={editRole}
              onChange={e => setEditRole(e.target.value as RoleType)}
              options={[
                { value: 'hr_staff', label: t('users.roleHrStaff', 'HR Staff / Specialist') },
                { value: 'hr_manager', label: t('users.roleHrManager', 'HR Operations Manager') },
                { value: 'dept_manager', label: t('users.roleDeptManager', 'Department Manager') },
                { value: 'admin', label: t('users.roleAdmin', 'System Administrator') },
              ]}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {t('users.department', 'الإدارة / القسم')}
              </label>
              <select
                value={editDept}
                onChange={e => setEditDept(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] p-2.5 text-slate-800 dark:text-[#F8FAFC] bg-white dark:bg-[#0B0F19] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer shadow-xs [&>option]:bg-white [&>option]:dark:bg-[#151D2E]"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <Select
              label={t('users.status', 'حالة الحساب')}
              required
              value={editStatus}
              onChange={e => setEditStatus(e.target.value as any)}
              options={[
                { value: 'active', label: t('users.statusActive', 'Active (Permitted to Log In)') },
                { value: 'inactive', label: t('users.statusInactive', 'Inactive (Login Blocked)') },
                { value: 'suspended', label: t('users.statusSuspended', 'Suspended (Policy Lockdown)') },
              ]}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1E293B]">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setEditingUser(null)}
              >
                {t('common.cancel', 'إلغاء')}
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
                {t('users.saveChanges', 'حفظ التعديلات')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
export default UsersPage;
