import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { mockEmploymentHistory } from '../../mocks/employmentHistory';
import { mockEmployees } from '../../mocks/employees';
import { EmploymentHistoryEvent } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { History, TrendingUp, RefreshCw, Award, ArrowRight } from 'lucide-react';

export const EmploymentHistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedEventType, setSelectedEventType] = useState<string>('all');

  const allEvents: EmploymentHistoryEvent[] = useMemo(() => {
    // Generate an aggregated chronological log across employees
    const list: EmploymentHistoryEvent[] = [...mockEmploymentHistory];

    mockEmployees.slice(0, 15).forEach((emp, i) => {
      list.push({
        id: `agg-hist-${i}`,
        employeeId: emp.id,
        date: `2025-0${(i % 9) + 1}-15`,
        eventType:
          i % 4 === 0
            ? 'promotion'
            : i % 3 === 0
            ? 'department_transfer'
            : i % 2 === 0
            ? 'salary_change'
            : 'contract_renewal',
        previousValue: i % 2 === 0 ? 'SAR 15,000' : 'Operations Coordinator',
        newValue: i % 2 === 0 ? 'SAR 18,500' : 'Operations Lead',
        changedBy: 'Executive Committee',
        notes: `Annual performance review and merit increment recorded for ${emp.firstName} ${emp.lastName}.`,
      });
    });

    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }, []);

  const filteredEvents = useMemo(() => {
    if (selectedEventType === 'all') return allEvents;
    return allEvents.filter(e => e.eventType === selectedEventType);
  }, [allEvents, selectedEventType]);

  const getEventBadge = (type: string) => {
    const map: Record<string, { label: string; variant: any }> = {
      promotion: { label: 'Promotion', variant: 'success' },
      salary_change: { label: 'Salary Adjustment', variant: 'warning' },
      department_transfer: { label: 'Transfer', variant: 'info' },
      contract_renewal: { label: 'Contract Renewal', variant: 'default' },
      hired: { label: 'New Hire', variant: 'success' },
      termination: { label: 'Termination', variant: 'danger' },
    };
    const b = map[type] || { label: type, variant: 'default' };
    return <Badge variant={b.variant}>{b.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t('nav.history')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global timeline of promotions, transfers, salary increments, and tenure changes
          </p>
        </div>

        <div className="w-56">
          <select
            value={selectedEventType}
            onChange={e => setSelectedEventType(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer shadow-sm font-medium"
          >
            <option value="all">All Change Events</option>
            <option value="promotion">Promotions</option>
            <option value="salary_change">Salary Adjustments</option>
            <option value="department_transfer">Department Transfers</option>
            <option value="contract_renewal">Contract Renewals</option>
            <option value="hired">New Hires</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative pl-6 rtl:pl-0 rtl:pr-6 border-l-2 rtl:border-l-0 rtl:border-r-2 border-slate-200 space-y-8">
            {filteredEvents.map(evt => (
              <div key={evt.id} className="relative group">
                {/* Node icon */}
                <div className="absolute -left-[31px] rtl:-left-auto rtl:-right-[31px] top-1 w-4 h-4 rounded-full bg-brand-600 ring-4 ring-white" />

                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getEventBadge(evt.eventType)}
                      <span className="font-mono text-xs font-semibold text-slate-700">{evt.date}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Logged by: <span className="font-semibold text-slate-600">{evt.changedBy}</span>
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center gap-2 text-xs">
                    <span className="text-slate-400 line-through bg-white px-2 py-0.5 rounded border border-slate-200">
                      {evt.previousValue}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 rtl:rotate-180" />
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-brand-200 text-brand-700">
                      {evt.newValue}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">{evt.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
