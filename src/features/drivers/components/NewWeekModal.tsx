import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

interface NewWeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  onDateChange: (val: string) => void;
  label: string;
  onLabelChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const NewWeekModal: React.FC<NewWeekModalProps> = ({
  isOpen,
  onClose,
  date,
  onDateChange,
  label,
  onLabelChange,
  onSubmit,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('driverPayouts.startNewWeekTitle', 'بدء أسبوع قبض جديد')}
      size="sm"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {t('driverPayouts.weekDateLabel', 'تاريخ الأسبوع')} <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={e => {
              onDateChange(e.target.value);
              onLabelChange(`أسبوع ${e.target.value}`);
            }}
            required
            className="w-full text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-300 dark:border-[#1E293B] text-slate-900 dark:text-[#F8FAFC] rounded-xl px-3 py-2 focus:bg-white dark:focus:bg-[#0B0F19] focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {t('driverPayouts.weekNameLabel', 'اسم / تصنيف الأسبوع')}
          </label>
          <input
            type="text"
            value={label}
            onChange={e => onLabelChange(e.target.value)}
            className="w-full text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-300 dark:border-[#1E293B] text-slate-900 dark:text-[#F8FAFC] rounded-xl px-3 py-2 focus:bg-white dark:focus:bg-[#0B0F19] focus:outline-none font-bold transition-colors"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1E293B]">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            {t('driverPayouts.cancel', 'إلغاء')}
          </Button>
          <Button variant="primary" size="sm" type="submit" className="font-bold">
            {t('driverPayouts.startWeekBtn', 'بدء الأسبوع')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
