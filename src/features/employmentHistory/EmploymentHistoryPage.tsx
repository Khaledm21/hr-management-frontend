import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { employeeService } from '../../services/employeeService';
import { Employee, EmploymentHistoryEvent } from '../../types';

import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

import { History, TrendingUp, Award, ArrowRight, ArrowLeftRight, FileCheck, UserPlus, Filter } from 'lucide-react';

export const EmploymentHistoryPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    employeeService.getEmployees({ pageSize: 20 }).then(res => setEmployees(res?.data || [])).catch(() => []);
  }, []);

  const allEvents: EmploymentHistoryEvent[] = useMemo(() => {
    const list: EmploymentHistoryEvent[] = [];

    employees.forEach((emp, i) => {
      const isSalary = i % 2 === 0;
      const currency = t('insurance.currency') || t('common.egp') || 'EGP';
      list.push({
        id: `agg-hist-${i}`,
        employeeId: emp.id,
        date: `2025-0${(i % 9) + 1}-15`,
        eventType:
          i % 4 === 0
            ? 'promotion'
            : i % 3 === 0
            ? 'department_transfer'
            : isSalary
            ? 'salary_change'
            : 'contract_renewal',
        previousValue: isSalary ? `15,000 ${currency}` : t('employmentHistory.posCoord', 'Senior Specialist'),
        newValue: isSalary ? `18,500 ${currency}` : t('employmentHistory.posLead', 'Lead Supervisor'),
        changedBy: t('employmentHistory.executiveCommittee', 'Executive Committee'),
        notes: t('employmentHistory.annualReviewNote', { 
          name: `${emp.firstName} ${emp.lastName}`,
          defaultValue: `Performance appraisal review and transition approved for ${emp.firstName} ${emp.lastName}.`
        }),
      });
    });

    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }, [t, employees]);

  // Statistics for KPI summary
  const stats = useMemo(() => {
    const total = allEvents.length;
    const promotions = allEvents.filter(e => e.eventType === 'promotion').length;
    const salaryChanges = allEvents.filter(e => e.eventType === 'salary_change').length;
    const transfers = allEvents.filter(e => e.eventType === 'department_transfer').length;
    return { total, promotions, salaryChanges, transfers };
  }, [allEvents]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter(e => {
      const matchesType = selectedEventType === 'all' || e.eventType === selectedEventType;
      const matchesSearch = searchQuery.trim() === '' || 
        e.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.previousValue?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.newValue?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.changedBy?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [allEvents, selectedEventType, searchQuery]);

  const getEventBadge = (type: string) => {
    const map: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'default' | 'danger'; icon: any }> = {
      promotion: { label: t('employmentHistory.promotion', 'Promotion'), variant: 'success', icon: Award },
      salary_change: { label: t('employmentHistory.salaryChange', 'Salary Adjustment'), variant: 'warning', icon: TrendingUp },
      department_transfer: { label: t('employmentHistory.departmentTransfer', 'Transfer'), variant: 'info', icon: ArrowLeftRight },
      contract_renewal: { label: t('employmentHistory.contractRenewal', 'Renewal'), variant: 'default', icon: FileCheck },
      hired: { label: t('employmentHistory.hired', 'New Hire'), variant: 'success', icon: UserPlus },
      termination: { label: t('employmentHistory.termination', 'Termination'), variant: 'danger', icon: History },
    };
    const b = map[type] || { label: type, variant: 'default', icon: History };
    const IconComponent = b.icon;
    return (
      <Badge variant={b.variant} className="flex items-center gap-1.5 px-2.5 py-1">
        <IconComponent className="w-3 h-3" />
        <span>{b.label}</span>
      </Badge>
    );
  };

  const getChangedByLabel = (changedBy: string) => {
    if (changedBy === 'Executive Committee') return t('employmentHistory.executiveCommittee', 'Executive Committee');
    if (changedBy === 'HR Operations') return t('employmentHistory.hrOperations', 'HR Operations');
    if (changedBy === 'Recruitment Team') return t('employmentHistory.recruitmentTeam', 'Recruitment Team');
    return changedBy;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
            {t('employmentHistory.title', 'Career Timeline & Employment History')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('employmentHistory.subtitle', 'Comprehensive audit trail of internal promotions, job transfers, and compensation reviews')}
          </p>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t('employmentHistory.allEvents', 'Total Recorded Events')}
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">{stats.total}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <History className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t('employmentHistory.promotions', 'Promotions')}
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.promotions}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t('employmentHistory.salaryAdjustments', 'Salary Adjustments')}
              </p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.salaryChanges}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t('employmentHistory.transfers', 'Internal Transfers')}
              </p>
              <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{stats.transfers}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('common.filter', 'Filter')}:
              </span>
              <div className="w-full sm:w-60">
                <select
                  value={selectedEventType}
                  onChange={e => setSelectedEventType(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-3 py-2 text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer shadow-xs font-medium [&>option]:bg-white [&>option]:dark:bg-[#151D2E]"
                >
                  <option value="all">{t('employmentHistory.allEvents', 'All Lifecycle Events')}</option>
                  <option value="promotion">{t('employmentHistory.promotions', 'Promotions')}</option>
                  <option value="salary_change">{t('employmentHistory.salaryAdjustments', 'Salary Adjustments')}</option>
                  <option value="department_transfer">{t('employmentHistory.transfers', 'Department Transfers')}</option>
                  <option value="contract_renewal">{t('employmentHistory.contractRenewals', 'Contract Renewals')}</option>
                  <option value="hired">{t('employmentHistory.newHires', 'New Hires')}</option>
                </select>
              </div>
            </div>

            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder={t('common.search', 'Search career history or note...')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-3 py-2 text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Section */}
      <Card className="bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B] shadow-xs">
        <CardContent className="p-6">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <History className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-medium">{t('employmentHistory.noEvents', 'No employment events match criteria')}</p>
            </div>
          ) : (
            <div className="relative pl-6 rtl:pl-0 rtl:pr-6 border-l-2 rtl:border-l-0 rtl:border-r-2 border-slate-200 dark:border-[#1E293B] space-y-8">
              {filteredEvents.map(evt => (
                <div key={evt.id} className="relative group">
                  {/* Timeline indicator node */}
                  <div className="absolute -left-[31px] rtl:-left-auto rtl:-right-[31px] top-1.5 w-4 h-4 rounded-full bg-brand-600 ring-4 ring-white dark:ring-[#151D2E] shadow-sm transition-transform group-hover:scale-125" />

                  <div className="bg-slate-50/70 dark:bg-[#0B0F19]/60 p-4 rounded-xl border border-slate-200/80 dark:border-[#1E293B] shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-[#1E293B]">
                      <div className="flex items-center gap-2.5">
                        {getEventBadge(evt.eventType)}
                        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {evt.date}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {t('employmentHistory.loggedBy', 'Authorized by')}{' '}
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {getChangedByLabel(evt.changedBy)}
                        </span>
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2.5 text-xs">
                      <span className="text-slate-400 dark:text-slate-500 line-through bg-white dark:bg-[#151D2E] px-2.5 py-1 rounded-md border border-slate-200 dark:border-[#1E293B] font-medium">
                        {evt.previousValue}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 rtl:rotate-180 shrink-0" />
                      <span className="font-bold text-slate-900 dark:text-[#F8FAFC] bg-brand-50 dark:bg-brand-500/10 px-2.5 py-1 rounded-md border border-brand-200 dark:border-brand-500/30 text-brand-700 dark:text-brand-400">
                        {evt.newValue}
                      </span>
                    </div>

                    {evt.notes && (
                      <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white/50 dark:bg-[#151D2E]/50 p-2.5 rounded-lg border border-slate-100 dark:border-[#1E293B]/60">
                        {evt.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default EmploymentHistoryPage;
