import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  KeyRound,
  ShieldCheck,
  Check,
  Save,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { userService } from '../../services/userService';
import { RoleType, PermissionMatrix } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';

export const RolesPermissionsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { can, refreshMe } = useAuth();

  const [activeRole, setActiveRole] = useState<RoleType>('hr_manager');
  const [permissions, setPermissions] = useState<PermissionMatrix[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    userService.getRolePermissions(activeRole).then(data => {
      if (isMounted && Array.isArray(data)) {
        const normalized: PermissionMatrix[] = data.map(item => ({
          module: item.module,
          label: item.label,
          view: item.view ?? (item as any).canView ?? true,
          create: item.create ?? (item as any).canCreate ?? false,
          edit: item.edit ?? (item as any).canEdit ?? false,
          delete: item.delete ?? (item as any).canDelete ?? false,
          approve: item.approve ?? (item as any).canApprove ?? false,
          export: item.export ?? (item as any).canExport ?? false,
        }));
        setPermissions(normalized);
      }
    }).catch(err => {
      toastError(err?.message || 'Failed to load permissions');
    });
    return () => {
      isMounted = false;
    };
  }, [activeRole]);

  const handleToggle = (moduleIndex: number, action: keyof Omit<PermissionMatrix, 'module' | 'label'>) => {
    setPermissions(prev => {
      const copy = [...prev];
      copy[moduleIndex] = {
        ...copy[moduleIndex],
        [action]: !copy[moduleIndex][action],
      };
      return copy;
    });
  };

  const rolesList: { id: RoleType; name: string; desc: string }[] = [
    { id: 'hr_manager', name: t('users.roleHrManager', 'HR Manager'), desc: t('users.roleHrManagerDesc', 'Full HR lifecycle administration and approval authorization') },
    { id: 'hr_staff', name: t('users.roleHrStaff', 'HR Operations Staff'), desc: t('users.roleHrStaffDesc', 'Operational data entry, document review and attendance verification') },
    { id: 'dept_manager', name: t('users.roleDeptManager', 'Department Head'), desc: t('users.roleDeptManagerDesc', 'Team leaves and requests endorsement within departmental scope') },
    { id: 'admin', name: t('users.roleAdmin', 'System Administrator'), desc: t('users.roleAdminDesc', 'Enterprise-wide governance, security logs, and role configurations') },
  ];

  const getModuleLabel = (moduleKey: string, fallback: string) => {
    const map: Record<string, string> = {
      employees: 'nav.employees',
      documents: 'nav.documents',
      insurance: 'nav.insurance',
      contracts: 'nav.contracts',
      attendance: 'nav.attendance',
      leave: 'nav.leave',
      payroll: 'nav.payroll',
      advances: 'nav.advances',
      approvals: 'nav.approvals',
      reports: 'nav.reports',
      users: 'nav.users',
      settings: 'nav.settings',
      audit_logs: 'nav.auditLogs',
      auditLogs: 'nav.auditLogs',
    };
    const key = map[moduleKey];
    return key ? t(key, fallback) : fallback;
  };

  const handleSave = async () => {
    if (!can('users', 'edit')) return;
    setIsSaving(true);
    try {
      await userService.updateRolePermissions(activeRole, permissions);
      const roleName = rolesList.find(r => r.id === activeRole)?.name || activeRole;
      success(t('users.permissionsSavedSuccess', { role: roleName }), t('users.rolesPermissions', 'Permissions Matrix'));
      await refreshMe();
    } catch (err: any) {
      toastError(err?.message || 'Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

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
          <div className="flex items-center gap-2 mb-1.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />}
              onClick={() => navigate('/users')}
            >
              {t('users.backToUsers', 'الرجوع لقائمة المستخدمين')}
            </Button>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <KeyRound className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>{t('users.rolesPermissions', 'مصفوفة الصلاحيات والأدوار الإدارية')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('users.rolesSubtitle', 'تحديد دقيق ومحكم لصلاحيات كل دور وظيفي عبر شاشات ووحدات النظام')}
          </p>
        </div>

        {can('users', 'edit') && (
          <Button
            variant="primary"
            size="md"
            leftIcon={<Save className="w-4 h-4" />}
            onClick={handleSave}
            isLoading={isSaving}
          >
            {t('users.savePermissions', 'حفظ مصفوفة الصلاحيات')}
          </Button>
        )}
      </div>

      {/* Role Picker Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {rolesList.map(r => {
          const isSelected = r.id === activeRole;
          return (
            <button
              key={r.id}
              onClick={() => setActiveRole(r.id)}
              className={`p-4 rounded-xl border text-left rtl:text-right transition-all cursor-pointer ${
                isSelected
                  ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 dark:border-brand-500 shadow-sm ring-1 ring-brand-500'
                  : 'border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-bold ${isSelected ? 'text-brand-900 dark:text-brand-300' : 'text-slate-900 dark:text-[#F8FAFC]'}`}>
                  {r.name}
                </span>
                {isSelected && <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{r.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Granular Permission Matrix Table */}
      <Card className="bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B]">
        <CardHeader className="border-b border-slate-100 dark:border-[#1E293B] pb-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
              {t('users.roleMatrixTitle', 'صلاحيات الدور المحدد')}: <span className="text-brand-600 dark:text-brand-400 font-bold">{rolesList.find(r => r.id === activeRole)?.name || activeRole}</span>
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('users.matrixHint', 'قم بتفعيل أو تعطيل الصلاحيات الفردية ثم اضغط حفظ لتطبيق التغييرات فورا')}
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left rtl:text-right border-collapse">
            <thead className="bg-slate-50/80 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-[#1E293B] text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px]">
              <tr>
                <th className="p-3.5 pl-6 rtl:pl-3.5 rtl:pr-6">{t('users.functionalModule', 'الوحدة الوظيفية')}</th>
                <th className="p-3.5 text-center">{t('users.permView', 'عرض')}</th>
                <th className="p-3.5 text-center">{t('users.permCreate', 'إنشاء')}</th>
                <th className="p-3.5 text-center">{t('users.permEdit', 'تعديل')}</th>
                <th className="p-3.5 text-center">{t('users.permDelete', 'حذف')}</th>
                <th className="p-3.5 text-center">{t('users.permApprove', 'اعتماد')}</th>
                <th className="p-3.5 text-center pr-6 rtl:pr-3.5 rtl:pl-6">{t('users.permExport', 'تصدير')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B] text-slate-700 dark:text-slate-300">
              {permissions.map((p, idx) => (
                <tr key={p.module} className="hover:bg-slate-50/80 dark:hover:bg-[#1E293B]/40 transition-colors">
                  <td className="p-3.5 pl-6 rtl:pl-3.5 rtl:pr-6 font-semibold text-slate-900 dark:text-[#F8FAFC]">
                    {getModuleLabel(p.module, p.label)}
                  </td>
                  <td className="p-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={p.view}
                      onChange={() => handleToggle(idx, 'view')}
                      className="rounded border-slate-300 dark:border-slate-600 dark:bg-[#0B0F19] text-brand-600 focus:ring-brand-500 cursor-pointer w-4 h-4"
                    />
                  </td>
                  <td className="p-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={p.create}
                      onChange={() => handleToggle(idx, 'create')}
                      className="rounded border-slate-300 dark:border-slate-600 dark:bg-[#0B0F19] text-brand-600 focus:ring-brand-500 cursor-pointer w-4 h-4"
                    />
                  </td>
                  <td className="p-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={p.edit}
                      onChange={() => handleToggle(idx, 'edit')}
                      className="rounded border-slate-300 dark:border-slate-600 dark:bg-[#0B0F19] text-brand-600 focus:ring-brand-500 cursor-pointer w-4 h-4"
                    />
                  </td>
                  <td className="p-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={p.delete}
                      onChange={() => handleToggle(idx, 'delete')}
                      className="rounded border-slate-300 dark:border-slate-600 dark:bg-[#0B0F19] text-rose-600 focus:ring-rose-500 cursor-pointer w-4 h-4"
                    />
                  </td>
                  <td className="p-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={p.approve}
                      onChange={() => handleToggle(idx, 'approve')}
                      className="rounded border-slate-300 dark:border-slate-600 dark:bg-[#0B0F19] text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                    />
                  </td>
                  <td className="p-3.5 text-center pr-6 rtl:pr-3.5 rtl:pl-6">
                    <input
                      type="checkbox"
                      checked={p.export}
                      onChange={() => handleToggle(idx, 'export')}
                      className="rounded border-slate-300 dark:border-slate-600 dark:bg-[#0B0F19] text-brand-600 focus:ring-brand-500 cursor-pointer w-4 h-4"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
export default RolesPermissionsPage;
