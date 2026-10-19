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
  const { success } = useToast();
  const { can } = useAuth();

  const [activeRole, setActiveRole] = useState<RoleType>('hr_manager');
  const [permissions, setPermissions] = useState<PermissionMatrix[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    userService.getRolePermissions(activeRole).then(setPermissions);
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await userService.updateRolePermissions(activeRole, permissions);
      success(`Updated security policy matrix for role "${activeRole}".`, 'Permissions Saved');
    } finally {
      setIsSaving(false);
    }
  };

  const rolesList: { id: RoleType; name: string; desc: string }[] = [
    { id: 'hr_manager', name: 'HR Manager', desc: 'Full workforce governance, policy & compensation oversight' },
    { id: 'hr_staff', name: 'HR Staff / Specialist', desc: 'Daily directory records & document verification (No payroll)' },
    { id: 'dept_manager', name: 'Department Manager', desc: 'Department level approvals for leaves & contracts' },
    { id: 'admin', name: 'System Administrator', desc: 'Global root level access to settings & user permissions' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />}
              onClick={() => navigate('/users')}
            >
              Back to Users
            </Button>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t('users.rolesPermissions')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Granular Role-Based Access Control (RBAC) across all 13 enterprise system domains
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Save className="w-4 h-4" />}
          onClick={handleSave}
          isLoading={isSaving}
        >
          Save Role Permissions
        </Button>
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
                  ? 'border-brand-600 bg-brand-50/70 shadow-sm ring-1 ring-brand-500'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${isSelected ? 'text-brand-900' : 'text-slate-900'}`}>
                  {r.name}
                </span>
                {isSelected && <ShieldCheck className="w-4 h-4 text-brand-600" />}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">{r.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Granular Permission Matrix Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              {t('users.roleMatrixTitle')}: <span className="text-brand-600 uppercase">{activeRole.replace('_', ' ')}</span>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Click checkboxes to grant or revoke specific operation capabilities.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left rtl:text-right border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
              <tr>
                <th className="p-3.5 pl-6 rtl:pl-3.5 rtl:pr-6">Functional Module</th>
                <th className="p-3.5 text-center">{t('users.permView')}</th>
                <th className="p-3.5 text-center">{t('users.permCreate')}</th>
                <th className="p-3.5 text-center">{t('users.permEdit')}</th>
                <th className="p-3.5 text-center">{t('users.permDelete')}</th>
                <th className="p-3.5 text-center">{t('users.permApprove')}</th>
                <th className="p-3.5 text-center pr-6 rtl:pr-3.5 rtl:pl-6">{t('users.permExport')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {permissions.map((p, idx) => (
                <tr key={p.module} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 pl-6 rtl:pl-3.5 rtl:pr-6 font-semibold text-slate-900">
                    {p.label}
                  </td>
                  <td className="p-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={p.view}
                      onChange={() => handleToggle(idx, 'view')}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer w-4 h-4"
                    />
                  </td>
                  <td className="p-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={p.create}
                      onChange={() => handleToggle(idx, 'create')}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer w-4 h-4"
                    />
                  </td>
                  <td className="p-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={p.edit}
                      onChange={() => handleToggle(idx, 'edit')}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer w-4 h-4"
                    />
                  </td>
                  <td className="p-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={p.delete}
                      onChange={() => handleToggle(idx, 'delete')}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer w-4 h-4"
                    />
                  </td>
                  <td className="p-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={p.approve}
                      onChange={() => handleToggle(idx, 'approve')}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                    />
                  </td>
                  <td className="p-3.5 text-center pr-6 rtl:pr-3.5 rtl:pl-6">
                    <input
                      type="checkbox"
                      checked={p.export}
                      onChange={() => handleToggle(idx, 'export')}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer w-4 h-4"
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
