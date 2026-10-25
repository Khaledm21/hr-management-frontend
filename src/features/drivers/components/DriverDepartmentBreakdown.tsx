import React from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Building, Factory } from 'lucide-react';
import { WeeklyPayoutSummary } from '../../../types/driverPayouts';

interface DriverDepartmentBreakdownProps {
  summary: WeeklyPayoutSummary | null | undefined;
}

export const DriverDepartmentBreakdown: React.FC<DriverDepartmentBreakdownProps> = ({ summary }) => {
  const { t } = useTranslation();

  const totalAmount = summary?.totalAmount || 0;
  const managementTotal = summary?.managementTotal || 0;
  const productionTotal = summary?.productionTotal || 0;

  const mgtPercent = totalAmount > 0 ? ((managementTotal / totalAmount) * 100).toFixed(1) : '0';
  const prodPercent = totalAmount > 0 ? ((productionTotal / totalAmount) * 100).toFixed(1) : '0';

  return (
    <div className="bg-white dark:bg-[#151D2E] text-[#172033] dark:text-[#F8FAFC] rounded-2xl p-5 shadow-2xs border border-[#E2E8F0] dark:border-[#1E293B] transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 border-b border-[#E2E8F0] dark:border-[#1E293B] pb-3">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-[#172033] dark:text-[#F8FAFC] flex items-center gap-2">
            <span>{t('driverPayouts.deptDistributionTitle', 'توزيع المبالغ والاعتمادات المالية')}</span>
            <span className="text-[11px] text-[#64748B] dark:text-slate-400 font-normal">
              ({t('driverPayouts.deptDistributionSubtitle', 'مطابقة التقرير الختامي للإكسيل')})
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600" />
            <span className="text-[#64748B] dark:text-slate-400">{t('driverPayouts.managementCategory')} ({mgtPercent}%)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-[#64748B] dark:text-slate-400">{t('driverPayouts.productionCategory')} ({prodPercent}%)</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Grand Total */}
        <div className="bg-[#2e6930] dark:bg-[#1b431d] hover:bg-[#285c2a] dark:hover:bg-[#163718] transition-colors rounded-xl p-4 text-white flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold text-emerald-100 block">
              {t('driverPayouts.grandTotal', 'الإجمالي العام')}
            </span>
            <span className="text-2xl font-black tracking-tight mt-1 block">
              {totalAmount.toLocaleString()} {t('driverPayouts.egp')}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-black/20 flex items-center justify-center font-bold text-white">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* 2. Administration Total */}
        <div className="bg-[#b91c1c] dark:bg-[#881337] hover:bg-[#991b1b] dark:hover:bg-[#700f2d] transition-colors rounded-xl p-4 text-white flex items-center justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-rose-100 block">
                {t('driverPayouts.managementTotal', 'اجمالي الاداره')}
              </span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold">
                {mgtPercent}%
              </span>
            </div>
            <span className="text-2xl font-black tracking-tight mt-1 block">
              {managementTotal.toLocaleString()} {t('driverPayouts.egp')}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-black/20 flex items-center justify-center font-bold text-white">
            <Building className="w-5 h-5" />
          </div>
        </div>

        {/* 3. Production Total */}
        <div className="bg-[#ea580c] dark:bg-[#9a3412] hover:bg-[#c2410c] dark:hover:bg-[#7c2d12] transition-colors rounded-xl p-4 text-white flex items-center justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-orange-100 block">
                {t('driverPayouts.productionTotal', 'اجمالي الإنتاج')}
              </span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold">
                {prodPercent}%
              </span>
            </div>
            <span className="text-2xl font-black tracking-tight mt-1 block">
              {productionTotal.toLocaleString()} {t('driverPayouts.egp')}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-black/20 flex items-center justify-center font-bold text-white">
            <Factory className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visual Ratio Progress Bar */}
      <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-[#1E293B]">
        <div className="w-full h-2.5 rounded-full bg-[#F1F5F9] dark:bg-[#0B0F19] overflow-hidden flex">
          <div
            className="bg-rose-600 transition-all duration-500"
            style={{ width: `${totalAmount > 0 ? (managementTotal / totalAmount) * 100 : 0}%` }}
            title={`إدارة: ${managementTotal.toLocaleString()} جنيه`}
          />
          <div
            className="bg-amber-500 transition-all duration-500"
            style={{ width: `${totalAmount > 0 ? (productionTotal / totalAmount) * 100 : 0}%` }}
            title={`إنتاج: ${productionTotal.toLocaleString()} جنيه`}
          />
        </div>
      </div>
    </div>
  );
};
