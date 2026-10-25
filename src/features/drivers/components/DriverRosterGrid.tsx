import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Users, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Driver, DriverWeeklyColumn } from '../../../types/driverPayouts';

interface DriverRosterGridProps {
  drivers: Driver[];
  columns: DriverWeeklyColumn[];
  onAddDriver: () => void;
  onEditDriver: (driver: Driver) => void;
  onDeleteDriver: (driver: Driver) => void;
  onQuickPayout: (driverId: string) => void;
}

export const DriverRosterGrid: React.FC<DriverRosterGridProps> = ({
  drivers,
  columns,
  onAddDriver,
  onEditDriver,
  onDeleteDriver,
  onQuickPayout,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
            {t('driverPayouts.driversTab', 'دليل السائقين والأسطول')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('driverPayouts.driversSubtitle', 'قائمة كافة السائقين المسجلين في أسطول النقل والتوزيع')}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={onAddDriver} className="text-xs font-bold">
          <Plus className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
          {t('driverPayouts.addDriver', 'إضافة سائق جديد')}
        </Button>
      </div>

      {drivers.length === 0 ? (
        <Card className="border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] p-12 text-center transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-[#F8FAFC]">
            {t('driverPayouts.noDriversRegistered', 'لا يوجد سائقين مسجلين')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-5">
            {t('driverPayouts.noDriversSub', 'أضف سائقين لبدء تسجيل مشاويرهم وتتبع قبضهم الأسبوعي.')}
          </p>
          <Button variant="primary" size="sm" onClick={onAddDriver} className="font-bold">
            <Plus className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
            {t('driverPayouts.addDriver', 'إضافة سائق جديد')}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {drivers.map(driver => {
            const colData = columns.find(c => c.driver.id === driver.id);
            const totalPayoutThisWeek = colData ? colData.totalAmount : 0;
            const tripsCount = colData ? colData.operationsCount : 0;

            return (
              <Card
                key={driver.id}
                className="border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] hover:border-brand-300 dark:hover:border-brand-500/50 hover:shadow-md transition-all group"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black flex items-center justify-center text-sm border border-amber-200 dark:border-amber-700/50">
                        {driver.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-[#F8FAFC] text-sm">{driver.name}</h3>
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{driver.code}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={driver.defaultCategory === 'management' ? 'danger' : 'warning'}
                        className="text-[10px]"
                      >
                        {driver.defaultCategory === 'management'
                          ? t('driverPayouts.managementCategory', 'إدارة')
                          : t('driverPayouts.productionCategory', 'إنتاج')}
                      </Badge>
                      <button
                        onClick={() => onEditDriver(driver)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title={t('driverPayouts.editDriver', 'تعديل بيانات السائق')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteDriver(driver)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title={t('driverPayouts.deleteDriver', 'حذف السائق')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#0B0F19] p-2.5 rounded-xl border border-slate-100 dark:border-[#1E293B] transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-slate-500">{t('driverPayouts.vehicleLabel', 'السيارة:')}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {driver.vehicleType === 'عربية فان'
                          ? t('driverPayouts.vehicleVan', 'عربية فان')
                          : t('driverPayouts.vehicleMicrobus', 'ميكروباص')}{' '}
                        ({driver.vehicleNumber || '-'})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-slate-500">{t('driverPayouts.phoneLabel', 'الهاتف:')}</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{driver.phone || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-slate-500">{t('driverPayouts.payoutThisWeek', 'قبض هذا الأسبوع:')}</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        {totalPayoutThisWeek.toLocaleString()} {t('driverPayouts.egp', 'جنيه')} ({tripsCount} {t('driverPayouts.tripsWord', 'رحلات')})
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onQuickPayout(driver.id)}
                      className="flex-1 text-xs font-bold text-brand-700 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30 border-brand-200 dark:border-brand-800/60"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
                      {t('driverPayouts.recordPaymentBtn', 'تسجيل دفعة')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditDriver(driver)}
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-[#1E293B]"
                      title={t('driverPayouts.editDriver', 'تعديل بيانات السائق')}
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
                      {t('driverPayouts.edit', 'تعديل')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteDriver(driver)}
                      className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 border-rose-200 dark:border-rose-900/50 hover:border-rose-600 px-2.5 transition-colors"
                      title={t('driverPayouts.deleteDriver', 'حذف السائق')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
