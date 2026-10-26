import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  UserCheck,
  AlertCircle,
  CalendarOff,
  TrendingUp,
  Cpu,
  Calendar,
  Filter,
} from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceRecord, AttendanceStatus } from '../../types';

export const AttendancePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    onLeave: 0,
    attendanceRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('2026-03-30');

  const getDeptName = (deptName: string) => {
    const d = mockDepartments.find(
      item => item.name === deptName || item.nameAr === deptName || item.code === deptName
    );
    if (!d) return deptName;
    if (i18n.language === 'ar') return d.nameAr || d.name;
    if (i18n.language.startsWith('zh')) return d.nameZh || d.name;
    return d.name;
  };

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const [list, statsData] = await Promise.all([
        attendanceService.getAttendance({
          department: selectedDept !== 'all' ? selectedDept : undefined,
          status: selectedStatus as any,
          date: selectedDate,
        }),
        attendanceService.getAttendanceStats(),
      ]);
      setRecords(list);
      setStats(statsData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDept, selectedStatus, selectedDate]);

  const getStatusBadge = (status: AttendanceStatus) => {
    const map: Record<AttendanceStatus, { label: string; variant: any }> = {
      present: { label: t('attendance.statusPresent'), variant: 'success' },
      late: { label: t('attendance.statusLate'), variant: 'warning' },
      absent: { label: t('attendance.statusAbsent'), variant: 'danger' },
      leave: { label: t('attendance.statusLeave'), variant: 'info' },
      holiday: { label: t('attendance.statusHoliday'), variant: 'secondary' },
      weekend: { label: t('attendance.statusWeekend'), variant: 'secondary' },
    };
    const s = map[status] || { label: status, variant: 'default' };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const columns: Column<AttendanceRecord>[] = useMemo(
    () => [
      {
        key: 'employeeName',
        header: t('attendance.employee'),
        sortable: true,
        render: row => (
          <div>
            <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] block">{row.employeeName}</span>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{row.employeeCode}</span>
          </div>
        ),
      },
      {
        key: 'department',
        header: t('attendance.department'),
        sortable: true,
        render: row => <span className="text-slate-600 dark:text-slate-400 font-medium">{getDeptName(row.department)}</span>,
      },
      {
        key: 'checkIn',
        header: t('attendance.checkIn'),
        sortable: true,
        render: row => (
          <span className={`font-mono font-semibold ${row.lateMinutes > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
            {row.checkIn}
          </span>
        ),
      },
      {
        key: 'checkOut',
        header: t('attendance.checkOut'),
        sortable: true,
        render: row => <span className="font-mono text-slate-700 dark:text-slate-300">{row.checkOut}</span>,
      },
      {
        key: 'workHours',
        header: t('attendance.workHours'),
        sortable: true,
        render: row => <span className="text-slate-700 dark:text-slate-300">{row.workHours > 0 ? t('attendance.workHoursUnit', { hours: row.workHours }) : '-'}</span>,
      },
      {
        key: 'overtimeHours',
        header: t('attendance.overtime'),
        sortable: true,
        render: row => (
          <span className={row.overtimeHours > 0 ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}>
            {row.overtimeHours > 0 ? t('attendance.overtimeUnit', { hours: row.overtimeHours }) : '-'}
          </span>
        ),
      },
      {
        key: 'lateMinutes',
        header: t('attendance.lateMinutes'),
        sortable: true,
        render: row => (
          <span className={row.lateMinutes > 0 ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}>
            {row.lateMinutes > 0 ? t('attendance.lateMinutesUnit', { minutes: row.lateMinutes }) : '-'}
          </span>
        ),
      },
      {
        key: 'status',
        header: t('attendance.status'),
        sortable: true,
        render: row => getStatusBadge(row.status),
      },
      {
        key: 'deviceSource',
        header: t('attendance.biometricSource'),
        render: row => (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <Cpu className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span className="truncate max-w-[140px]">{row.deviceSource}</span>
          </div>
        ),
      },
    ],
    [t, i18n.language]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
            {t('attendance.title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('attendance.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-40 text-xs"
          />
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t('attendance.presentCount')}
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1 block">
                {stats.present}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {t('attendance.onTimeRate', { rate: stats.attendanceRate })}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t('attendance.lateCount')}
              </span>
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                {stats.late}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{t('attendance.punchedAfter')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t('attendance.absentCount')}
              </span>
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 block">
                {stats.absent}
              </span>
              <span className="text-[11px] text-rose-500 dark:text-rose-400 font-medium">{t('attendance.unexcused')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t('attendance.onLeaveCount')}
              </span>
              <span className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1 block">
                {stats.onLeave}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{t('attendance.approvedTimeOff')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
              <CalendarOff className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={records}
        keyExtractor={row => row.id}
        isLoading={isLoading}
        searchable
        searchPlaceholder={t('attendance.searchPlaceholder')}
        exportFilename={`Apex_Attendance_Log_${selectedDate}`}
        filtersSlot={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-2.5 py-1.5 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 dark:focus:ring-[#38BDF8] cursor-pointer"
            >
              <option value="all">{t('attendance.allDepartments')}</option>
              {mockDepartments.map(d => (
                <option key={d.id} value={d.name}>
                  {i18n.language === 'ar' ? (d.nameAr || d.name) : (i18n.language.startsWith('zh') ? (d.nameZh || d.name) : d.name)}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-2.5 py-1.5 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 dark:focus:ring-[#38BDF8] cursor-pointer"
            >
              <option value="all">{t('attendance.allStatuses')}</option>
              <option value="present">{t('attendance.filterPresent')}</option>
              <option value="late">{t('attendance.filterLate')}</option>
              <option value="absent">{t('attendance.filterAbsent')}</option>
              <option value="leave">{t('attendance.filterLeave')}</option>
            </select>
          </div>
        }
      />
    </div>
  );
};
