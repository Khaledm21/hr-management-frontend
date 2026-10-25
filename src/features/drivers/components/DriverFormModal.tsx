import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Trash2 } from 'lucide-react';
import { DriverCategory } from '../../../types/driverPayouts';

interface DriverFormData {
  name: string;
  phone: string;
  nationalId: string;
  vehicleNumber: string;
  vehicleType: string;
  defaultCategory: DriverCategory;
  notes: string;
}

interface DriverFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEdit?: boolean;
  formData: DriverFormData;
  onChange: (data: DriverFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDelete?: () => void;
}

export const DriverFormModal: React.FC<DriverFormModalProps> = ({
  isOpen,
  onClose,
  isEdit = false,
  formData,
  onChange,
  onSubmit,
  onDelete,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('driverPayouts.editDriverModalTitle', 'تعديل بيانات السائق') : t('driverPayouts.addNewDriverModalTitle', 'إضافة سائق جديد')}
      size="md"
    >
      <form onSubmit={onSubmit} autoComplete="off" className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {t('driverPayouts.driverFullName', 'اسم السائق الكامل')} <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder={t('driverPayouts.driverFullNamePlaceholder', 'مثال: محمود عبد الرازق')}
            value={formData.name}
            onChange={e => onChange({ ...formData, name: e.target.value })}
            required
            className="w-full text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-300 dark:border-[#1E293B] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-3 py-2 focus:bg-white dark:focus:bg-[#0B0F19] focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('driverPayouts.driverPhone', 'رقم الهاتف')}
            </label>
            <input
              type="text"
              placeholder={t('driverPayouts.driverPhonePlaceholder', '010xxxxxxxx')}
              value={formData.phone}
              onChange={e => onChange({ ...formData, phone: e.target.value })}
              className="w-full text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-300 dark:border-[#1E293B] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-3 py-2 focus:bg-white dark:focus:bg-[#0B0F19] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('driverPayouts.nationalIdLabel', 'الرقم القومي')}
            </label>
            <input
              type="text"
              placeholder={t('driverPayouts.nationalIdPlaceholder', 'الرقم القومي (14 رقم)')}
              value={formData.nationalId}
              onChange={e => onChange({ ...formData, nationalId: e.target.value })}
              className="w-full text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-300 dark:border-[#1E293B] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-3 py-2 focus:bg-white dark:focus:bg-[#0B0F19] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('driverPayouts.vehiclePlateLabel', 'رقم لوحة السيارة')}
            </label>
            <input
              type="text"
              placeholder={t('driverPayouts.vehiclePlatePlaceholder', 'مثال: أ ب ج 1234')}
              value={formData.vehicleNumber}
              onChange={e => onChange({ ...formData, vehicleNumber: e.target.value })}
              className="w-full text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-300 dark:border-[#1E293B] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-3 py-2 focus:bg-white dark:focus:bg-[#0B0F19] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('driverPayouts.vehicleTypeLabel', 'نوع المركبة')}
            </label>
            <select
              value={formData.vehicleType || 'ميكروباص'}
              onChange={e => onChange({ ...formData, vehicleType: e.target.value })}
              className="w-full text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-300 dark:border-[#1E293B] text-slate-900 dark:text-[#F8FAFC] [&>option]:bg-white [&>option]:dark:bg-[#151D2E] rounded-xl px-3 py-2 focus:bg-white dark:focus:bg-[#0B0F19] focus:outline-none font-bold transition-colors"
            >
              <option value="ميكروباص">{t('driverPayouts.vehicleMicrobus', 'ميكروباص')}</option>
              <option value="عربية فان">{t('driverPayouts.vehicleVan', 'عربية فان')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {t('driverPayouts.defaultDeptLabel', 'القسم الافتراضي')}
          </label>
          <select
            value={formData.defaultCategory}
            onChange={e => onChange({ ...formData, defaultCategory: e.target.value as DriverCategory })}
            className="w-full text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-300 dark:border-[#1E293B] text-slate-900 dark:text-[#F8FAFC] [&>option]:bg-white [&>option]:dark:bg-[#151D2E] rounded-xl px-3 py-2 focus:bg-white dark:focus:bg-[#0B0F19] focus:outline-none transition-colors"
          >
            <option value="production">{t('driverPayouts.productionOption', 'الإنتاج (Production)')}</option>
            <option value="management">{t('driverPayouts.managementOption', 'الإدارة (Management)')}</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#1E293B]">
          <div>
            {isEdit && onDelete && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 border-rose-200 dark:border-rose-900/50 hover:border-rose-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
                {t('driverPayouts.deleteDriverBtn', 'حذف السائق')}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              {t('driverPayouts.cancel', 'إلغاء')}
            </Button>
            <Button variant="primary" size="sm" type="submit" className="font-bold">
              {isEdit ? t('driverPayouts.saveChangesBtn', 'حفظ التعديلات') : t('driverPayouts.submitAddDriver', 'إضافة السائق')}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
