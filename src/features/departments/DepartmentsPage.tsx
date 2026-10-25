import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Department } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { Building2, Users, MapPin, DollarSign, Plus, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { useDirection } from '../../context/DirectionContext';
import {
  useDepartments,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} from '../../hooks/queries';

export const DepartmentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useDirection();
  const { success, error: toastError } = useToast();

  const { data: departments = [], isLoading, refetch } = useDepartments();
  const createMutation = useCreateDepartmentMutation();
  const updateMutation = useUpdateDepartmentMutation();
  const deleteMutation = useDeleteDepartmentMutation();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    code: '',
    name: '',
    nameAr: '',
    nameZh: '',
    managerName: '',
    location: '',
    budget: '',
  });

  const handleOpenAddModal = () => {
    setEditingDept(null);
    setForm({
      code: '',
      name: '',
      nameAr: '',
      nameZh: '',
      managerName: '',
      location: '',
      budget: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept: Department) => {
    setEditingDept(dept);
    setForm({
      code: dept.code,
      name: dept.name,
      nameAr: dept.nameAr || '',
      nameZh: dept.nameZh || '',
      managerName: dept.managerName || '',
      location: dept.location || '',
      budget: String(dept.budget || ''),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      toastError(t('departments.validationError'));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<Department> = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        nameAr: form.nameAr.trim() || form.name.trim(),
        nameZh: form.nameZh.trim() || form.name.trim(),
        managerName: form.managerName.trim(),
        location: form.location.trim(),
        budget: Number(form.budget) || 0,
      };

      if (editingDept) {
        await updateMutation.mutateAsync({ id: editingDept.id, data: payload });
        success(t('departments.updateSuccess'));
      } else {
        await createMutation.mutateAsync(payload);
        success(t('departments.createSuccess'));
      }

      setIsModalOpen(false);
    } catch (err: any) {
      toastError(err?.message || t('departments.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(t('departments.confirmDelete', { name }))) {
      try {
        await deleteMutation.mutateAsync(id);
        success(t('departments.deleteSuccess'));
      } catch {
        toastError(t('departments.deleteError'));
      }
    }
  };

  const totalHeadcount = departments.reduce((sum, d) => sum + (d.employeeCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
            {t('departments.title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('departments.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs font-semibold"
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 rtl:ml-1.5 rtl:mr-0 ${isLoading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            className="text-xs font-bold shadow-md shadow-brand-500/20"
          >
            <Plus className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            {t('departments.addDepartment')}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-600 dark:text-[#38BDF8]" />
          {t('departments.loading')}
        </div>
      ) : departments.length === 0 ? (
        /* Clean Zero/Empty State */
        <Card className="border-slate-200 dark:border-[#1E293B] shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-[#38BDF8] flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-[#F8FAFC]">{t('departments.emptyTitle')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-5">
            {t('departments.emptyDesc')}
          </p>
          <Button variant="primary" size="sm" onClick={handleOpenAddModal} className="font-bold">
            <Plus className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
            {t('departments.addFirst')}
          </Button>
        </Card>
      ) : (
        /* Departments Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map(dept => {
            const localizedName = language === 'ar' ? (dept.nameAr || dept.name) : language === 'zh-CN' ? (dept.nameZh || dept.name) : dept.name;
            const staffCount = dept.employeeCount || 0;
            const headcountRatio = totalHeadcount > 0 ? Math.round((staffCount / totalHeadcount) * 100) : 0;

            return (
              <Card key={dept.id} hoverable className="flex flex-col justify-between border-slate-200/90 dark:border-[#1E293B] shadow-sm">
                <div>
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-[#1E293B] flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-[#38BDF8] font-bold text-sm">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                          {localizedName}
                        </CardTitle>
                        <span className="text-[11px] font-mono font-bold text-brand-700 dark:text-[#38BDF8] bg-brand-50 dark:bg-brand-950/40 px-1.5 py-0.5 rounded">
                          {dept.code}
                        </span>
                      </div>
                    </div>
                    <Badge variant={staffCount > 0 ? 'info' : 'default'} className="text-xs">
                      {t('departments.employeeCount', { count: staffCount })}
                    </Badge>
                  </CardHeader>

                  <CardContent className="space-y-2.5 text-xs pt-4">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400 dark:text-slate-500">{t('departments.manager')}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{dept.managerName || t('common.unspecified')}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400 dark:text-slate-500">{t('departments.location')}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{dept.location || t('departments.headquarters')}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400 dark:text-slate-500">{t('departments.budget')}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {dept.budget ? `${dept.budget.toLocaleString()} ${t('common.egp')}` : t('common.unspecified')}
                      </span>
                    </div>
                  </CardContent>
                </div>

                <div className="px-5 py-3 bg-slate-50 dark:bg-[#111827]/60 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {t('departments.headcountRatio')} <strong className="text-slate-700 dark:text-slate-200">{headcountRatio}%</strong>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(dept)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-[#38BDF8] rounded-lg hover:bg-slate-200/60 dark:hover:bg-[#1E293B] transition-colors"
                      title={t('common.edit')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id, dept.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? t('departments.editModalTitle') : t('departments.addModalTitle')}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">{t('departments.code')}</label>
              <Input
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                placeholder={t('departments.codePlaceholder')}
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">{t('departments.nameEn')}</label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={t('departments.nameEnPlaceholder')}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">{t('departments.nameAr')}</label>
              <Input
                value={form.nameAr}
                onChange={e => setForm({ ...form, nameAr: e.target.value })}
                placeholder={t('departments.nameArPlaceholder')}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">{t('departments.nameZh')}</label>
              <Input
                value={form.nameZh}
                onChange={e => setForm({ ...form, nameZh: e.target.value })}
                placeholder={t('departments.nameZhPlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">{t('departments.managerName')}</label>
              <Input
                value={form.managerName}
                onChange={e => setForm({ ...form, managerName: e.target.value })}
                placeholder={t('departments.managerPlaceholder')}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">{t('departments.workLocation')}</label>
              <Input
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder={t('departments.locationPlaceholder')}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">{t('departments.annualBudget')}</label>
              <Input
                type="number"
                value={form.budget}
                onChange={e => setForm({ ...form, budget: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-[#1E293B]">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : editingDept ? t('departments.updateBtn') : t('departments.createBtn')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
