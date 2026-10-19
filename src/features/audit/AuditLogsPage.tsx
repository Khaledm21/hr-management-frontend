import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollText,
  Shield,
  Eye,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
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

  const columns: Column<AuditLogEntry>[] = useMemo(
    () => [
      {
        key: 'timestamp',
        header: t('audit.timestamp'),
        sortable: true,
        width: '170px',
        render: row => (
          <span className="font-mono text-slate-600 text-xs font-medium">
            {row.timestamp}
          </span>
        ),
      },
      {
        key: 'userName',
        header: t('audit.user'),
        sortable: true,
        render: row => (
          <div>
            <span className="font-semibold text-slate-900 block">{row.userName}</span>
            <span className="text-[10px] text-slate-400 capitalize">{row.userRole}</span>
          </div>
        ),
      },
      {
        key: 'action',
        header: t('audit.action'),
        sortable: true,
        render: row => (
          <span className="font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded text-xs">
            {row.action}
          </span>
        ),
      },
      {
        key: 'module',
        header: t('audit.module'),
        sortable: true,
        render: row => <span className="text-slate-600">{row.module}</span>,
      },
      {
        key: 'target',
        header: t('audit.target'),
        render: row => <span className="text-slate-600 font-medium line-clamp-1">{row.target}</span>,
      },
      {
        key: 'ipAddress',
        header: t('audit.ipAddress'),
        render: row => <span className="font-mono text-slate-400 text-[11px]">{row.ipAddress}</span>,
      },
      {
        key: 'status',
        header: 'Result',
        sortable: true,
        render: row => (
          <Badge
            variant={
              row.status === 'success' ? 'success' : row.status === 'warning' ? 'warning' : 'danger'
            }
          >
            {row.status.toUpperCase()}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: 'Inspector',
        align: 'right',
        render: row => (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => setActiveLog(row)}
          >
            Inspect
          </Button>
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
            {t('audit.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">{t('audit.subtitle')}</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        keyExtractor={row => row.id}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search actor, action, or target entity..."
        exportFilename="Apex_Enterprise_Audit_Trail_Log"
        filtersSlot={
          <select
            value={selectedModule}
            onChange={e => setSelectedModule(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            <option value="all">All Modules</option>
            <option value="Leave Management">Leave Management</option>
            <option value="User Administration">User Administration</option>
            <option value="Document Management">Document Management</option>
            <option value="Payroll">Payroll</option>
            <option value="Payroll / Compensation">Compensation</option>
            <option value="Employee Directory">Employee Directory</option>
            <option value="Attendance">Attendance</option>
          </select>
        }
      />

      {/* Details Drawer */}
      {activeLog && (
        <Drawer
          isOpen={!!activeLog}
          onClose={() => setActiveLog(null)}
          title={`Audit Event: ${activeLog.action}`}
          subtitle={`Recorded at ${activeLog.timestamp} from ${activeLog.ipAddress}`}
          width="md"
        >
          <div className="space-y-5 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Executing Actor:</span>
                <span className="font-bold text-slate-900">{activeLog.userName} ({activeLog.userRole})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">System Domain:</span>
                <span className="font-semibold text-slate-800">{activeLog.module}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Object:</span>
                <span className="font-semibold text-slate-800">{activeLog.target}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Client IP Address:</span>
                <span className="font-mono text-slate-800">{activeLog.ipAddress}</span>
              </div>
            </div>

            {/* Details JSON metadata payload */}
            {activeLog.details && (
              <div>
                <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px]">
                  Event Payload Metadata
                </h4>
                <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
                  {JSON.stringify(activeLog.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
};
