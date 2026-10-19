import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileCheck,
  AlertTriangle,
  RotateCw,
  Plus,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { contractService } from '../../services/contractService';
import { mockDepartments } from '../../mocks/departments';
import { ContractRecord, ContractStatus, ContractType } from '../../types';
import { useToast } from '../../components/ui/Toast';

export const ContractsPage: React.FC = () => {
  const { t } = useTranslation();
  const { success } = useToast();

  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [expiringList, setExpiringList] = useState<ContractRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Renewal Modal
  const [renewingContract, setRenewingContract] = useState<ContractRecord | null>(null);
  const [newEndDate, setNewEndDate] = useState('2028-04-30');
  const [newSalary, setNewSalary] = useState<number>(0);
  const [isRenewing, setIsRenewing] = useState(false);

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const [all, expiring] = await Promise.all([
        contractService.getContracts({
          department: selectedDept !== 'all' ? selectedDept : undefined,
          status: selectedStatus as any,
          type: selectedType as any,
        }),
        contractService.getExpiringContracts(),
      ]);
      setContracts(all);
      setExpiringList(expiring.slice(0, 5));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [selectedDept, selectedStatus, selectedType]);

  const handleOpenRenew = (contract: ContractRecord) => {
    setRenewingContract(contract);
    setNewSalary(contract.salary);
  };

  const handleConfirmRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingContract) return;

    setIsRenewing(true);
    try {
      await contractService.renewContract(renewingContract.id, newEndDate, newSalary);
      success(
        `Contract for ${renewingContract.employeeName} extended until ${newEndDate}.`,
        'Contract Renewed'
      );
      setRenewingContract(null);
      await fetchContracts();
    } finally {
      setIsRenewing(false);
    }
  };

  const columns: Column<ContractRecord>[] = useMemo(
    () => [
      {
        key: 'contractNumber',
        header: t('contracts.contractNo'),
        sortable: true,
        width: '140px',
        render: row => (
          <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
            {row.contractNumber}
          </span>
        ),
      },
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
        key: 'type',
        header: t('contracts.type'),
        sortable: true,
        render: row => (
          <span className="uppercase text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            {row.type.replace('_', ' ')}
          </span>
        ),
      },
      {
        key: 'startDate',
        header: t('contracts.startDate'),
        sortable: true,
        render: row => <span className="text-slate-600 text-xs">{row.startDate}</span>,
      },
      {
        key: 'endDate',
        header: t('contracts.endDate'),
        sortable: true,
        render: row => (
          <span
            className={`text-xs font-semibold ${
              row.status === 'expiring_soon' ? 'text-amber-600' : 'text-slate-700'
            }`}
          >
            {row.endDate}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: row => {
          if (row.status === 'expiring_soon') return <Badge variant="warning">{t('common.expiringSoon')}</Badge>;
          if (row.status === 'expired') return <Badge variant="danger">{t('common.expired')}</Badge>;
          if (row.status === 'pending_renewal') return <Badge variant="info">Renewal Pending</Badge>;
          return <Badge variant="success">Active</Badge>;
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: row => (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCw className="w-3.5 h-3.5" />}
              onClick={() => handleOpenRenew(row)}
            >
              Renew
            </Button>
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
            {t('contracts.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">{t('contracts.subtitle')}</p>
        </div>
      </div>

      {/* Expiring Soon Banner / Widget */}
      {expiringList.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="py-3 px-5 border-amber-200/60">
            <div className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-xs uppercase tracking-wider">
                Expiring Contracts Action Queue ({expiringList.length} Pending Renewal)
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {expiringList.slice(0, 3).map(cnt => (
              <div
                key={cnt.id}
                className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between shadow-xs"
              >
                <div>
                  <span className="font-semibold text-xs text-slate-900 block">{cnt.employeeName}</span>
                  <span className="text-[11px] text-amber-700">Expires: {cnt.endDate}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleOpenRenew(cnt)}>
                  Initiate Renewal
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Contracts Table */}
      <DataTable
        columns={columns}
        data={contracts}
        keyExtractor={row => row.id}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search contract number or employee..."
        exportFilename="Apex_Enterprise_Employment_Contracts"
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
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all">All Contract Types</option>
              <option value="fixed_term">Fixed Term</option>
              <option value="indefinite">Indefinite (Permanent)</option>
              <option value="probation">Probationary</option>
              <option value="consultancy">Consultancy</option>
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="pending_renewal">Pending Renewal</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        }
      />

      {/* Mock Renewal Modal */}
      {renewingContract && (
        <Modal
          isOpen={!!renewingContract}
          onClose={() => setRenewingContract(null)}
          size="md"
          title={`Contract Renewal: ${renewingContract.employeeName}`}
          description={`Contract ID: ${renewingContract.contractNumber} (${renewingContract.department})`}
        >
          <form onSubmit={handleConfirmRenewal} className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Expiry Date:</span>
                <span className="font-semibold text-slate-900">{renewingContract.endDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Historical Renewals:</span>
                <span className="font-semibold text-slate-900">{renewingContract.renewalCount} times</span>
              </div>
            </div>

            <Input
              label="New Extension End Date *"
              type="date"
              required
              value={newEndDate}
              onChange={e => setNewEndDate(e.target.value)}
            />

            <Input
              label="Adjusted Monthly Total Package (SAR)"
              type="number"
              value={newSalary}
              onChange={e => setNewSalary(Number(e.target.value))}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setRenewingContract(null)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isRenewing}>
                Confirm 2-Year Extension
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
