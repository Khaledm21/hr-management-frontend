import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Printer, Download, CreditCard, Building, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { payrollService } from '../../services/payrollService';
import { employeeService } from '../../services/employeeService';
import { PayrollItem, PayrollPeriodSummary, Employee } from '../../types';
import { useCompany } from '../../context/CompanyContext';

export const PayrollPeriodDetailsPage: React.FC = () => {
  const { period } = useParams<{ period: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { companyName, logo, settings } = useCompany();

  const [summary, setSummary] = useState<PayrollPeriodSummary | null>(null);
  const [selectedItem, setSelectedItem] = useState<PayrollItem | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (period) {
      payrollService.getPayrollSummary(period).then(setSummary);
      payrollService.getPayrollItems({ period }).then(items => {
        const empId = searchParams.get('employee');
        if (empId) {
          const found = items.find(i => i.employeeId === empId || i.id.includes(empId));
          setSelectedItem(found || items[0]);
        } else {
          setSelectedItem(items[0]);
        }
      });
    }
  }, [period, searchParams]);

  useEffect(() => {
    if (selectedItem) {
      employeeService.getEmployeeById(selectedItem.employeeId).then(setEmployee);
    }
  }, [selectedItem]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />}
          onClick={() => navigate('/payroll')}
        >
          Back to Payroll
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            onClick={() => window.print()}
          >
            Print Payslip
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={() => window.print()}
          >
            Download PDF
          </Button>
        </div>
      </div>

      {selectedItem && (
        <Card className="max-w-3xl mx-auto shadow-md">
          {/* Official Payslip Template */}
          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-[#1E293B] pb-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] p-1 shadow-sm flex items-center justify-center overflow-hidden">
                    <img
                      src={logo}
                      alt={companyName}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">{companyName}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {settings.crNumber ? `CR: ${settings.crNumber} • ` : ''}
                      {settings.address || 'Sadat City, Menofia, Egypt'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right rtl:text-left">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                  Confidential Payslip
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] mt-1 block font-mono">
                  Period: {selectedItem.period}
                </span>
                <Badge variant={selectedItem.status === 'locked' ? 'success' : 'warning'}>
                  {selectedItem.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Employee Demographic Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Employee Name:</span>
                <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">{selectedItem.employeeName}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Employee Code:</span>
                <span className="font-mono font-bold text-brand-700 dark:text-[#38BDF8]">{selectedItem.employeeCode}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Department:</span>
                <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{selectedItem.department}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Payment Method:</span>
                <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] truncate block">{selectedItem.paymentMethod}</span>
              </div>
            </div>

            {/* Earnings & Deductions Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Earnings */}
              <div className="border border-slate-200 dark:border-[#1E293B] rounded-xl overflow-hidden bg-white dark:bg-[#151D2E]">
                <div className="bg-slate-100 dark:bg-[#0B0F19] px-4 py-2 font-bold text-slate-800 dark:text-[#F8FAFC] border-b border-slate-200 dark:border-[#1E293B]">
                  Earnings & Allowances
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Basic Salary</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-[#F8FAFC]">SAR {selectedItem.basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Housing Allowance</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-[#F8FAFC]">SAR {selectedItem.housingAllowance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Transport Allowance</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-[#F8FAFC]">SAR {selectedItem.transportAllowance.toLocaleString()}</span>
                  </div>
                  {selectedItem.otherAllowances > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Special Allowances</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-[#F8FAFC]">SAR {selectedItem.otherAllowances.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 dark:border-[#1E293B] flex justify-between font-bold text-slate-900 dark:text-[#F8FAFC]">
                    <span>Gross Total</span>
                    <span className="font-mono">SAR {selectedItem.grossSalary.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="border border-slate-200 dark:border-[#1E293B] rounded-xl overflow-hidden bg-white dark:bg-[#151D2E]">
                <div className="bg-slate-100 dark:bg-[#0B0F19] px-4 py-2 font-bold text-slate-800 dark:text-[#F8FAFC] border-b border-slate-200 dark:border-[#1E293B]">
                  Statutory & Loan Deductions
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="flex justify-between text-rose-600 dark:text-rose-400">
                    <span>GOSI Social Insurance</span>
                    <span className="font-mono font-semibold">- SAR {selectedItem.insuranceDeduction.toLocaleString()}</span>
                  </div>
                  {selectedItem.advancesDeduction > 0 && (
                    <div className="flex justify-between text-rose-600 dark:text-rose-400">
                      <span>Salary Advance Installment</span>
                      <span className="font-mono font-semibold">- SAR {selectedItem.advancesDeduction.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 dark:border-[#1E293B] flex justify-between font-bold text-rose-700 dark:text-rose-400">
                    <span>Total Deductions</span>
                    <span className="font-mono">- SAR {selectedItem.totalDeductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Amount Box */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                  Net Disbursed Take-Home Pay
                </span>
                <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block font-mono">
                  SAR {selectedItem.netSalary.toLocaleString()}
                </span>
              </div>
              <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>

            {/* Footer */}
            <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center pt-4 border-t border-slate-100 dark:border-[#1E293B]">
              Generated automatically by {companyName} Core System • Verified with Wage Protection System (WPS)
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
