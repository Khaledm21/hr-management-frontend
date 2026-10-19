import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, DollarSign, Truck, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { WeeklyPayoutSummary } from '../../../types/driverPayouts';

interface DriverPayoutKPIsProps {
  summary: WeeklyPayoutSummary | null | undefined;
}

export const DriverPayoutKPIs: React.FC<DriverPayoutKPIsProps> = ({ summary }) => {
  const { t } = useTranslation();

  const totalDrivers = summary?.totalDrivers || 0;
  const totalAmount = summary?.totalAmount || 0;
  const totalOperations = summary?.totalOperations || 0;
  const averagePayout = summary?.averagePayout || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Drivers */}
      <Card className="border-slate-200/80 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('driverPayouts.kpiTotalDrivers', 'إجمالي عدد السواقين')}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{totalDrivers}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Total Paid Amount */}
      <Card className="border-slate-200/80 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('driverPayouts.kpiTotalAmount', 'إجمالي المبالغ المدفوعة')}
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-emerald-600">
                {totalAmount.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-600">{t('driverPayouts.egp')}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>

      {/* 3. Operations Count */}
      <Card className="border-slate-200/80 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('driverPayouts.kpiTotalOperations', 'عدد عمليات القبض')}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-600">{totalOperations}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Truck className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>

      {/* 4. Average Payout */}
      <Card className="border-slate-200/80 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('driverPayouts.kpiAveragePayout', 'متوسط قبض السائق')}
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-indigo-600">
                {averagePayout.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-600">{t('driverPayouts.egp')}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
