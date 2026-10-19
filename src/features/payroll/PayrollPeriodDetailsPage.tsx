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

export const PayrollPeriodDetailsPage: React.FC = () => {
  const { period } = useParams<{ period: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
            <div className="flex items-start justify-between border-b border-slate-200 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-brand-600 text-white font-bold">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Apex Enterprise Solutions Co.</h2>
                    <p className="text-xs text-slate-500">CR: 1010892341 • Riyadh, Saudi Arabia</p>
                  </div>
                </div>
              </div>

              <div className="text-right rtl:text-left">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                  Confidential Payslip
                </span>
                <span className="text-base font-bold text-slate-900 mt-1 block">
                  Period: {selectedItem.period}
                </span>
                <Badge variant={selectedItem.status === 'locked' ? 'success' : 'warning'}>
                  {selectedItem.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Employee Demographic Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block">Employee Name:</span>
                <span className="font-bold text-slate-900">{selectedItem.employeeName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Employee Code:</span>
                <span className="font-mono font-bold text-brand-700">{selectedItem.employeeCode}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Department:</span>
                <span className="font-semibold text-slate-900">{selectedItem.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Payment Method:</span>
                <span className="font-semibold text-slate-900 truncate block">{selectedItem.paymentMethod}</span>
              </div>
            </div>

            {/* Earnings & Deductions Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Earnings */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800">
                  Earnings & Allowances
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Basic Salary</span>
                    <span className="font-mono font-semibold">SAR {selectedItem.basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Housing Allowance</span>
                    <span className="font-mono font-semibold">SAR {selectedItem.housingAllowance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Transport Allowance</span>
                    <span className="font-mono font-semibold">SAR {selectedItem.transportAllowance.toLocaleString()}</span>
                  </div>
                  {selectedItem.otherAllowances > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Special Allowances</span>
                      <span className="font-mono font-semibold">SAR {selectedItem.otherAllowances.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                    <span>Gross Total</span>
                    <span>SAR {selectedItem.grossSalary.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800">
                  Statutory & Loan Deductions
                </div>
                <div className="p-4 space-y-2.5">
                  <div className="flex justify-between text-rose-600">
                    <span>GOSI Social Insurance</span>
                    <span className="font-mono font-semibold">- SAR {selectedItem.insuranceDeduction.toLocaleString()}</span>
                  </div>
                  {selectedItem.advancesDeduction > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Salary Advance Installment</span>
                      <span className="font-mono font-semibold">- SAR {selectedItem.advancesDeduction.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-rose-700">
                    <span>Total Deductions</span>
                    <span>- SAR {selectedItem.totalDeductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Amount Box */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                  Net Disbursed Take-Home Pay
                </span>
                <span className="text-2xl font-bold text-emerald-700 mt-0.5 block">
                  SAR {selectedItem.netSalary.toLocaleString()}
                </span>
              </div>
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>

            {/* Footer */}
            <div className="text-[10px] text-slate-400 text-center pt-4 border-t border-slate-100">
              Generated automatically by ApexHR Core System • Verified with Wage Protection System (WPS)
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
