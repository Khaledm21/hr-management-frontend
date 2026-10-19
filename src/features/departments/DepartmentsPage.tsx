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
      toastError('يرجى إدخال كود القسم واسمه');
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
        success('تم تحديث بيانات القسم بنجاح');
      } else {
        await createMutation.mutateAsync(payload);
        success('تمت إضافة القسم بنجاح');
      }

      setIsModalOpen(false);
    } catch (err: any) {
      toastError(err?.message || 'فشل حفظ بيانات القسم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف قسم "${name}"؟`)) {
      try {
        await deleteMutation.mutateAsync(id);
        success('تم حذف القسم بنجاح');
      } catch {
        toastError('فشل حذف القسم');
      }
    }
  };

  const totalHeadcount = departments.reduce((sum, d) => sum + (d.employeeCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t('nav.departments', 'الأقسام والهيكل التنظيمي')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة الوحدات التنظيمية، الموازنات، وتوزيع الموظفين (مربوط بالباك إند مباشرة)
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
            تحديث
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            className="text-xs font-bold shadow-md shadow-brand-500/20"
          >
            <Plus className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            إضافة قسم جديد
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 text-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-600" />
          جاري تحميل الأقسام من الخادم...
        </div>
      ) : departments.length === 0 ? (
        /* Clean Zero/Empty State */
        <Card className="border-slate-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">لا توجد أقسام مسجلة حتى الآن</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            النظام جاهز لاستقبال بيانات الأقسام من الباك إند أو يمكنك إضافة أول قسم الآن.
          </p>
          <Button variant="primary" size="sm" onClick={handleOpenAddModal} className="font-bold">
            <Plus className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
            إضافة أول قسم
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
              <Card key={dept.id} hoverable className="flex flex-col justify-between border-slate-200/90 shadow-sm">
                <div>
                  <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600 font-bold text-sm">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-slate-900">
                          {localizedName}
                        </CardTitle>
                        <span className="text-[11px] font-mono font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                          {dept.code}
                        </span>
                      </div>
                    </div>
                    <Badge variant={staffCount > 0 ? 'info' : 'default'} className="text-xs">
                      {staffCount} موظف
                    </Badge>
                  </CardHeader>

                  <CardContent className="space-y-2.5 text-xs pt-4">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">مدير القسم:</span>
                      <span className="font-semibold text-slate-800">{dept.managerName || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">موقع العمل:</span>
                      <span className="font-medium text-slate-700">{dept.location || 'المقر الرئيسي'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">الميزانية السنوية:</span>
                      <span className="font-bold text-emerald-700">
                        {dept.budget ? `${dept.budget.toLocaleString()} جنيه` : 'غير محددة'}
                      </span>
                    </div>
                  </CardContent>
                </div>

                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    نسبة القوى العاملة: <strong className="text-slate-700">{headcountRatio}%</strong>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(dept)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                      title="تعديل"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id, dept.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="حذف"
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
        title={editingDept ? 'تعديل بيانات القسم' : 'إضافة قسم جديد'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">كود القسم *</label>
              <Input
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                placeholder="مثال: HR, LOG, PRD"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم القسم (بالإنجليزية) *</label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: Fleet & Logistics"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم القسم (بالعربية)</label>
              <Input
                value={form.nameAr}
                onChange={e => setForm({ ...form, nameAr: e.target.value })}
                placeholder="مثال: إدارة الحركة واللوجستيات"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم القسم (بالصينية)</label>
              <Input
                value={form.nameZh}
                onChange={e => setForm({ ...form, nameZh: e.target.value })}
                placeholder="مثال: 车队后勤部"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">مدير القسم</label>
              <Input
                value={form.managerName}
                onChange={e => setForm({ ...form, managerName: e.target.value })}
                placeholder="اسم المسؤول"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">موقع العمل</label>
              <Input
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder="المقر الرئيسي / المصنع"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">الميزانية التقديرية (جنيه)</label>
              <Input
                type="number"
                value={form.budget}
                onChange={e => setForm({ ...form, budget: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : editingDept ? 'تحديث البيانات' : 'إضافة القسم'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
