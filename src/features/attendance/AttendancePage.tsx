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
import { mockDepartments } from '../../mocks/departments';
import { AttendanceRecord, AttendanceStatus } from '../../types';

export const AttendancePage: React.FC = () => {
  const { t } = useTranslation();
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
      present: { label: 'Present', variant: 'success' },
      late: { label: 'Late', variant: 'warning' },
      absent: { label: 'Absent', variant: 'danger' },
      leave: { label: 'On Leave', variant: 'info' },
      holiday: { label: 'Holiday', variant: 'secondary' },
      weekend: { label: 'Weekend', variant: 'secondary' },
    };
    const s = map[status] || { label: status, variant: 'default' };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const columns: Column<AttendanceRecord>[] = useMemo(
    () => [
      {
        key: 'employeeName',
        header: 'Employee',
        sortable: true,
        render: row => (
          <div>
            <span className="font-semibold text-slate-900 block">{row.employeeName}</span>
            <span className="text-[11px] font-mono text-slate-400">{row.employeeCode}</span>
          </div>
        ),
      },
      {
        key: 'department',
        header: 'Department',
        sortable: true,
        render: row => <span className="text-slate-600 font-medium">{row.department}</span>,
      },
      {
        key: 'checkIn',
        header: t('attendance.checkIn'),
        sortable: true,
        render: row => (
          <span className={`font-mono font-semibold ${row.lateMinutes > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
            {row.checkIn}
          </span>
        ),
      },
      {
        key: 'checkOut',
        header: t('attendance.checkOut'),
        sortable: true,
        render: row => <span className="font-mono text-slate-700">{row.checkOut}</span>,
      },
      {
        key: 'workHours',
        header: t('attendance.workHours'),
        sortable: true,
        render: row => <span>{row.workHours > 0 ? `${row.workHours} hrs` : '-'}</span>,
      },
      {
        key: 'overtimeHours',
        header: t('attendance.overtime'),
        sortable: true,
        render: row => (
          <span className={row.overtimeHours > 0 ? 'font-bold text-emerald-600' : 'text-slate-400'}>
            {row.overtimeHours > 0 ? `+${row.overtimeHours} hrs` : '-'}
          </span>
        ),
      },
      {
        key: 'lateMinutes',
        header: t('attendance.lateMinutes'),
        sortable: true,
        render: row => (
          <span className={row.lateMinutes > 0 ? 'font-semibold text-rose-600' : 'text-slate-400'}>
            {row.lateMinutes > 0 ? `${row.lateMinutes} min` : '-'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: row => getStatusBadge(row.status),
      },
      {
        key: 'deviceSource',
        header: 'Biometric Source',
        render: row => (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[140px]">{row.deviceSource}</span>
          </div>
        ),
      },
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t('attendance.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">{t('attendance.subtitle')}</p>
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
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                {t('attendance.presentCount')}
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">
                {stats.present}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">
                {stats.attendanceRate}% on-time rate
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                {t('attendance.lateCount')}
              </span>
              <span className="text-2xl font-bold text-amber-600 mt-1 block">
                {stats.late}
              </span>
              <span className="text-[11px] text-slate-400">Punched after 09:00</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                {t('attendance.absentCount')}
              </span>
              <span className="text-2xl font-bold text-rose-600 mt-1 block">
                {stats.absent}
              </span>
              <span className="text-[11px] text-rose-500 font-medium">Unexcused</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                {t('attendance.onLeaveCount')}
              </span>
              <span className="text-2xl font-bold text-sky-600 mt-1 block">
                {stats.onLeave}
              </span>
              <span className="text-[11px] text-slate-400">Approved time off</span>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
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
        searchPlaceholder="Search employee name or code..."
        exportFilename={`Apex_Attendance_Log_${selectedDate}`}
        filtersSlot={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all">All Departments</option>
              {mockDepartments.map(d => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all">All Attendance States</option>
              <option value="present">Present</option>
              <option value="late">Late Arrivals</option>
              <option value="absent">Absences</option>
              <option value="leave">On Leave</option>
            </select>
          </div>
        }
      />
    </div>
  );
};
