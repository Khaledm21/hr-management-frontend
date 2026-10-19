import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Trash2 } from 'lucide-react';
import { Driver, DriverCategory } from '../../../types/driverPayouts';

interface PayoutFormData {
  driverId: string;
  amount: string;
  category: DriverCategory;
  date: string;
  description: string;
  vehiclePlate: string;
  paymentMethod: 'cash' | 'transfer' | 'cheque';
  status: 'paid' | 'pending';
}

interface PayoutFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEdit: boolean;
  formData: PayoutFormData;
  onChange: (data: PayoutFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDelete?: () => void;
  drivers: Driver[];
}

export const PayoutFormModal: React.FC<PayoutFormModalProps> = ({
  isOpen,
  onClose,
  isEdit,
  formData,
  onChange,
  onSubmit,
  onDelete,
  drivers,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('driverPayouts.editPayoutModalTitle', 'تعديل دفعة القبض') : t('driverPayouts.newPayoutModalTitle', 'تسجيل دفعة قبض جديدة')}
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {t('driverPayouts.driverName', 'اسم السائق')} <span className="text-rose-500">*</span>
          </label>
          <select
            value={formData.driverId}
            onChange={e => {
              const drv = drivers.find(d => d.id === e.target.value);
              onChange({
                ...formData,
                driverId: e.target.value,
                vehiclePlate: drv?.vehicleNumber || formData.vehiclePlate,
                category: drv?.defaultCategory || formData.category,
              });
            }}
            required
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">{t('driverPayouts.selectDriverPlaceholder', '-- اختر السائق --')}</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code}) - {d.vehicleType === 'عربية فان' ? t('driverPayouts.vehicleVan', 'عربية فان') : t('driverPayouts.vehicleMicrobus', 'ميكروباص')}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('driverPayouts.amountEgpLabel', 'المبلغ (جنيه)')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              placeholder="4585"
              value={formData.amount}
              onChange={e => onChange({ ...formData, amount: e.target.value })}
              required
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('driverPayouts.categoryAccountLabel', 'القسم / الحساب')} <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={e => onChange({ ...formData, category: e.target.value as DriverCategory })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="production">{t('driverPayouts.productionSubOption', 'الإنتاج (شحنات مصانع وتوزيع)')}</option>
              <option value="management">{t('driverPayouts.managementSubOption', 'الإدارة (مشاوير ومأموريات إدارية)')}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('driverPayouts.date', 'التاريخ')}</label>
            <input
              type="date"
              value={formData.date}
              onChange={e => onChange({ ...formData, date: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('driverPayouts.paymentMethod', 'طريقة الدفع')}</label>
            <select
              value={formData.paymentMethod}
              onChange={e => onChange({ ...formData, paymentMethod: e.target.value as any })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:bg-white focus:outline-none"
            >
              <option value="cash">{t('driverPayouts.paymentCash', 'نقداً (خزينة)')}</option>
              <option value="transfer">{t('driverPayouts.paymentTransfer', 'تحويل بنكي / محفظة')}</option>
              <option value="cheque">{t('driverPayouts.paymentCheque', 'شيك')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('driverPayouts.tripDescriptionLabel', 'البيان / تفاصيل الرحلة')}</label>
          <input
            type="text"
            placeholder={t('driverPayouts.tripDescriptionPlaceholder', 'مثال: نقل خامات خط الإنتاج 1، مشوار إدارة عامة...')}
            value={formData.description}
            onChange={e => onChange({ ...formData, description: e.target.value })}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <div>
            {isEdit && onDelete && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={onDelete}
                className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('driverPayouts.deletePayoutBtn', 'حذف هذه الدفعة')}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              {t('driverPayouts.cancel', 'إلغاء')}
            </Button>
            <Button variant="primary" size="sm" type="submit" className="font-bold">
              {isEdit ? t('driverPayouts.saveChangesBtn', 'حفظ التعديلات') : t('driverPayouts.savePayoutBtn', 'تسجيل الدفعة')}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
