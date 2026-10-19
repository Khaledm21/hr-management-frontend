import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Users, Edit2 } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Driver, DriverWeeklyColumn } from '../../../types/driverPayouts';

interface DriverRosterGridProps {
  drivers: Driver[];
  columns: DriverWeeklyColumn[];
  onAddDriver: () => void;
  onEditDriver: (driver: Driver) => void;
  onQuickPayout: (driverId: string) => void;
}

export const DriverRosterGrid: React.FC<DriverRosterGridProps> = ({
  drivers,
  columns,
  onAddDriver,
  onEditDriver,
  onQuickPayout,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {t('driverPayouts.driversTab', 'دليل السائقين والأسطول')}
          </h2>
          <p className="text-xs text-slate-500">
            {t('driverPayouts.driversSubtitle', 'قائمة كافة السائقين المسجلين في أسطول النقل والتوزيع')}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={onAddDriver} className="text-xs font-bold">
          <Plus className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
          {t('driverPayouts.addDriver', 'إضافة سائق جديد')}
        </Button>
      </div>

      {drivers.length === 0 ? (
        <Card className="border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {t('driverPayouts.noDriversRegistered', 'لا يوجد سائقين مسجلين')}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
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
                className="border-slate-200 hover:border-brand-300 hover:shadow-md transition-all group"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 font-black flex items-center justify-center text-sm border border-amber-200">
                        {driver.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{driver.name}</h3>
                        <span className="text-[11px] font-mono text-slate-400">{driver.code}</span>
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
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title={t('driverPayouts.editDriver', 'تعديل بيانات السائق')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{t('driverPayouts.vehicleLabel', 'السيارة:')}</span>
                      <span className="font-semibold text-slate-800">
                        {driver.vehicleType === 'عربية فان'
                          ? t('driverPayouts.vehicleVan', 'عربية فان')
                          : t('driverPayouts.vehicleMicrobus', 'ميكروباص')}{' '}
                        ({driver.vehicleNumber || '-'})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{t('driverPayouts.phoneLabel', 'الهاتف:')}</span>
                      <span className="font-mono text-slate-800">{driver.phone || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{t('driverPayouts.payoutThisWeek', 'قبض هذا الأسبوع:')}</span>
                      <span className="font-black text-emerald-600">
                        {totalPayoutThisWeek.toLocaleString()} {t('driverPayouts.egp', 'جنيه')} ({tripsCount} {t('driverPayouts.tripsWord', 'رحلات')})
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onQuickPayout(driver.id)}
                      className="flex-1 text-xs font-bold text-brand-700 hover:bg-brand-50 border-brand-200"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
                      {t('driverPayouts.recordPaymentBtn', 'تسجيل دفعة')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditDriver(driver)}
                      className="text-xs font-bold text-slate-700 hover:text-brand-700 hover:bg-slate-100 border-slate-200"
                      title={t('driverPayouts.editDriver', 'تعديل بيانات السائق')}
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
                      {t('driverPayouts.edit', 'تعديل')}
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
