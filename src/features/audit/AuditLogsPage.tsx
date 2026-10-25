import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollText,
  Shield,
  Eye,
  Filter,
  CheckCircle2,
  RotateCcw,
  Activity,
  User,
} from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { auditService } from '../../services/auditService';
import { AuditLogEntry } from '../../types';

export const AuditLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [activeLog, setActiveLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await auditService.getAuditLogs(selectedModule !== 'all' ? selectedModule : undefined);
      setLogs(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedModule]);

  const getModuleLabel = (mod: string) => {
    const map: Record<string, string> = {
      'Leave Management': t('audit.modLeave', 'إدارة الإجازات'),
      'User Administration': t('audit.modUsers', 'إدارة المستخدمين والحسابات'),
      'Document Management': t('audit.modDocs', 'الأرشيف والمستندات'),
      'Payroll': t('audit.modPayroll', 'الرواتب والأجور'),
      'Payroll / Compensation': t('audit.modPayroll', 'الرواتب والأجور'),
      'Employee Directory': t('audit.modEmployees', 'شؤون وسجل الموظفين'),
      'Attendance': t('audit.modAttendance', 'الحضور والانصراف'),
      'System Settings': t('audit.modSettings', 'إعدادات النظام والهوية'),
      'Driver Fleet / Payouts': t('audit.modDrivers', 'قبض ونقل السائقين'),
      'Social Insurance': t('audit.modInsurance', 'التأمينات الاجتماعية'),
      'Contracts': t('audit.modContracts', 'عقود العمل والتوظيف'),
    };
    return map[mod] || mod;
  };

  // Metrics
  const totalLogs = logs.length;
  const successCount = logs.filter(l => l.status === 'success').length;
  const successPct = totalLogs > 0 ? Math.round((successCount / totalLogs) * 100) : 100;
  const uniqueModulesCount = new Set(logs.map(l => l.module)).size;
  const primaryOperator = logs[0]?.userName || 'Khaled Mossad';

  const columns: Column<AuditLogEntry>[] = useMemo(
    () => [
      {
        key: 'timestamp',
        header: t('audit.timestamp', 'التاريخ والوقت'),
        sortable: true,
        width: '170px',
        render: row => (
          <span className="font-mono text-slate-700 dark:text-slate-300 text-xs font-semibold">
            {row.timestamp}
          </span>
        ),
      },
      {
        key: 'userName',
        header: t('audit.user', 'المستخدم والمسؤول'),
        sortable: true,
        render: row => (
          <div>
            <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">{row.userName}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{row.userRole}</span>
          </div>
        ),
      },
      {
        key: 'action',
        header: t('audit.action', 'العملية / الإجراء'),
        sortable: true,
        render: row => (
          <span className="font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-[#1E293B] px-2.5 py-1 rounded-md text-xs inline-block">
            {row.action}
          </span>
        ),
      },
      {
        key: 'module',
        header: t('audit.module', 'الوحدة والنظام'),
        sortable: true,
        render: row => (
          <span className="text-slate-700 dark:text-slate-300 font-medium">{getModuleLabel(row.module)}</span>
        ),
      },
      {
        key: 'target',
        header: t('audit.target', 'الجهة المستهدفة'),
        render: row => (
          <span className="text-slate-800 dark:text-slate-200 font-medium line-clamp-1" title={row.target}>
            {row.target}
          </span>
        ),
      },
      {
        key: 'ipAddress',
        header: t('audit.ipAddress', 'عنوان IP'),
        render: row => (
          <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px] bg-slate-50 dark:bg-[#0B0F19] px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#1E293B]">
            {row.ipAddress}
          </span>
        ),
      },
      {
        key: 'status',
        header: t('audit.result', 'الحالة والنتيجة'),
        sortable: true,
        render: row => {
          const statusText =
            row.status === 'success'
              ? t('audit.statusSuccess', 'ناجحة')
              : row.status === 'warning'
              ? t('audit.statusWarning', 'تنبيه')
              : t('audit.statusFailed', 'فشلت');
          return (
            <Badge
              variant={
                row.status === 'success'
                  ? 'success'
                  : row.status === 'warning'
                  ? 'warning'
                  : 'danger'
              }
            >
              {statusText}
            </Badge>
          );
        },
      },
      {
        key: 'actions',
        header: t('audit.inspector', 'الفحص والبيانات'),
        align: 'right',
        render: row => (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => setActiveLog(row)}
          >
            {t('audit.inspect', 'التفاصيل')}
          </Button>
        ),
      },
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>{t('audit.title', 'سجل العمليات والرقابة الأمنية')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('audit.subtitle', 'سجل تدقيق رقابي حي وغير قابل للتلاعب لجميع عمليات النظام والمصادقة والتعديلات')}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          onClick={fetchLogs}
          isLoading={isLoading}
        >
          {t('common.refresh', 'تحديث السجل')}
        </Button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t('audit.totalAuditLogs', 'إجمالي العمليات المسجلة')}
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1 block">{totalLogs}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <ScrollText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t('audit.successRate', 'نسبة العمليات الناجحة')}
              </span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">{successPct}%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t('audit.monitoredDomains', 'الوحدات المراقبة')}
              </span>
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 block">
                {uniqueModulesCount} {t('common.modules', 'وحدات')}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t('audit.activeOperator', 'المسؤول الإداري الأخير')}
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] mt-1 block truncate max-w-[130px]" title={primaryOperator}>
                {primaryOperator}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
              <User className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={logs}
        keyExtractor={row => row.id}
        isLoading={isLoading}
        searchable
        searchPlaceholder={t('audit.searchPlaceholder', 'بحث في العمليات، المسؤولين، والجهات المستهدفة...')}
        exportFilename="New_Hope_Enterprise_Audit_Trail_Log"
        filtersSlot={
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-2.5 py-1.5 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer shadow-xs [&>option]:bg-white [&>option]:dark:bg-[#151D2E]"
            >
              <option value="all">{t('audit.allModules', 'جميع الوحدات والأنشطة')}</option>
              <option value="System Settings">{t('audit.modSettings', 'إعدادات النظام والهوية')}</option>
              <option value="Driver Fleet / Payouts">{t('audit.modDrivers', 'قبض ونقل السائقين')}</option>
              <option value="Employee Directory">{t('audit.modEmployees', 'شؤون وسجل الموظفين')}</option>
              <option value="User Administration">{t('audit.modUsers', 'إدارة المستخدمين والحسابات')}</option>
              <option value="Social Insurance">{t('audit.modInsurance', 'التأمينات الاجتماعية')}</option>
              <option value="Document Management">{t('audit.modDocs', 'الأرشيف والمستندات')}</option>
              <option value="Contracts">{t('audit.modContracts', 'عقود العمل والتوظيف')}</option>
              <option value="Attendance">{t('audit.modAttendance', 'الحضور والانصراف')}</option>
              <option value="Payroll">{t('audit.modPayroll', 'الرواتب والأجور')}</option>
              <option value="Leave Management">{t('audit.modLeave', 'إدارة الإجازات')}</option>
            </select>
          </div>
        }
      />

      {/* Details Drawer */}
      {activeLog && (
        <Drawer
          isOpen={!!activeLog}
          onClose={() => setActiveLog(null)}
          title={t('audit.drawerTitle', { action: activeLog.action, defaultValue: activeLog.action })}
          subtitle={t('audit.drawerSubtitle', {
            timestamp: activeLog.timestamp,
            ip: activeLog.ipAddress,
            defaultValue: `${activeLog.timestamp} • IP: ${activeLog.ipAddress}`,
          })}
          width="md"
        >
          <div className="space-y-5 text-xs">
            <div className="bg-slate-50 dark:bg-[#0B0F19] p-4 rounded-xl border border-slate-200 dark:border-[#1E293B] space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">{t('audit.actor', 'المسؤول القائم بالعملية')}</span>
                <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">{activeLog.userName} ({activeLog.userRole})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">{t('audit.domain', 'النظام والوحدة')}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{getModuleLabel(activeLog.module)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">{t('audit.targetObject', 'الجهة المستهدفة')}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{activeLog.target}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">{t('audit.clientIp', 'عنوان IP للعميل')}</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-[#151D2E] px-2 py-0.5 rounded border border-slate-200 dark:border-[#1E293B]">{activeLog.ipAddress}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">{t('audit.timestamp', 'التوقيت المسجل')}</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{activeLog.timestamp}</span>
              </div>
            </div>

            {/* Details JSON metadata payload */}
            {activeLog.details && (
              <div>
                <h4 className="font-bold text-slate-900 dark:text-[#F8FAFC] mb-2 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>{t('audit.metadata', 'البيانات التقنية للحركة (Technical Metadata)')}</span>
                </h4>
                <pre className="bg-slate-950 dark:bg-[#0B0F19] text-slate-200 p-4 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800 dark:border-[#1E293B]">
                  {typeof activeLog.details === 'string'
                    ? activeLog.details
                    : JSON.stringify(activeLog.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
};
export default AuditLogsPage;
