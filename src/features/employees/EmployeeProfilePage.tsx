import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  Shield,
  FileText,
  Clock,
  CalendarDays,
  CreditCard,
  History,
  Lock,
  Edit,
  Download,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { employeeService } from '../../services/employeeService';
import { documentService } from '../../services/documentService';
import { contractService } from '../../services/contractService';
import { attendanceService } from '../../services/attendanceService';
import { leaveService } from '../../services/leaveService';
import { getEmployeeHistory } from '../../mocks/employmentHistory';
import { mockAuditLogs } from '../../mocks/auditLogs';
import { Employee, DocumentRecord, ContractRecord, AttendanceRecord, LeaveRequest, EmploymentHistoryEvent } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useDirection } from '../../context/DirectionContext';

export const EmployeeProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { can, role } = useAuth();
  const { isRtl } = useDirection();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [historyEvents, setHistoryEvents] = useState<EmploymentHistoryEvent[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const emp = await employeeService.getEmployeeById(id);
        if (emp) {
          setEmployee(emp);
          setHistoryEvents(getEmployeeHistory(emp.id));

          const [docs, cnts, att, lvs] = await Promise.all([
            documentService.getDocuments({ employeeId: emp.id }),
            contractService.getContracts({ search: emp.employeeId }),
            attendanceService.getAttendance({ search: emp.employeeId }),
            leaveService.getLeaveRequests({ search: emp.employeeId }),
          ]);

          setDocuments(docs);
          setContracts(cnts);
          setAttendance(att);
          setLeaves(lvs);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Employee Record Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">The requested ID does not exist in the database.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/employees')}>
          Back to Directory
        </Button>
      </div>
    );
  }

  const tabsList = [
    { id: 'overview', label: t('employees.overview'), icon: <Briefcase className="w-4 h-4" /> },
    { id: 'documents', label: t('employees.documentsTab'), icon: <FileText className="w-4 h-4" /> },
    { id: 'contracts', label: t('employees.contractsTab'), icon: <FileText className="w-4 h-4" /> },
    { id: 'history', label: t('employees.historyTab'), icon: <History className="w-4 h-4" /> },
    { id: 'attendance', label: t('employees.attendanceTab'), icon: <Clock className="w-4 h-4" /> },
    { id: 'leave', label: t('employees.leaveTab'), icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'payroll', label: t('employees.payrollTab'), icon: <CreditCard className="w-4 h-4" /> },
    { id: 'activity', label: t('employees.activityTab'), icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb and Back */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />}
          onClick={() => navigate('/employees')}
        >
          {t('common.back')}
        </Button>
        <span className="text-xs text-slate-400">/</span>
        <span className="text-xs font-semibold text-slate-700">{employee.employeeId}</span>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={employee.avatar}
              alt=""
              className="w-20 h-20 rounded-2xl bg-brand-50 border-2 border-white shadow-md object-cover"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">
                  {employee.firstName} {employee.lastName}
                </h1>
                {employee.arabicName && (
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {employee.arabicName}
                  </span>
                )}
                <Badge variant={employee.employmentStatus === 'active' ? 'success' : 'warning'}>
                  {employee.employmentStatus.toUpperCase()}
                </Badge>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                <span className="font-mono font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                  {employee.employeeId}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {employee.positionTitle}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {employee.departmentName}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Hired {employee.hireDate}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileText className="w-3.5 h-3.5" />}
              onClick={() => setActiveTab('documents')}
            >
              Files ({employee.documentCompletenessPercentage}%)
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Edit className="w-3.5 h-3.5" />}
              onClick={() => navigate('/employees')}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Panels */}
      <div className="mt-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t('employees.personalInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Full English Name</span>
                  <span className="font-semibold text-slate-900">{employee.firstName} {employee.lastName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Arabic Name</span>
                  <span className="font-semibold text-slate-900">{employee.arabicName || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">National ID / Iqama</span>
                  <span className="font-mono font-semibold text-slate-900">{employee.nationalId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Date of Birth</span>
                  <span className="font-semibold text-slate-900">{employee.dateOfBirth}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Gender / Nationality</span>
                  <span className="font-semibold text-slate-900 capitalize">{employee.gender} • {employee.nationality}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Work Email</span>
                  <span className="font-semibold text-slate-900">{employee.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Phone Number</span>
                  <span className="font-semibold text-slate-900">{employee.phone}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Residential Address</span>
                  <span className="font-semibold text-slate-900 text-right rtl:text-left max-w-xs">{employee.address}</span>
                </div>
              </CardContent>
            </Card>

            {/* Job & Employment Card */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('employees.jobInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Department</span>
                    <span className="font-semibold text-slate-900">{employee.departmentName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Position Title</span>
                    <span className="font-semibold text-slate-900">{employee.positionTitle}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Reporting Manager</span>
                    <span className="font-semibold text-slate-900">{employee.managerName || 'Board of Directors'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Employment Type</span>
                    <span className="font-semibold text-slate-900 capitalize">{employee.employmentType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Work Location</span>
                    <span className="font-semibold text-slate-900">{employee.workLocation}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Probation End Date</span>
                    <span className="font-semibold text-slate-900">{employee.probationEndDate}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Contract Expiry Status</span>
                    <span>{employee.contractStatus.toUpperCase()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('employees.emergencyContact')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Name</span>
                    <span className="font-semibold text-slate-900">{employee.emergencyContact.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Relationship</span>
                    <span className="font-semibold text-slate-900">{employee.emergencyContact.relationship}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone</span>
                    <span className="font-semibold text-brand-600">{employee.emergencyContact.phone}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Personnel Compliance Documents</CardTitle>
                <CardDescription>File completeness: {employee.documentCompletenessPercentage}%</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 text-xs">
                {documents.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">No documents indexed for this employee.</div>
                ) : (
                  documents.map(doc => (
                    <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-brand-600 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900">{doc.title}</div>
                          <div className="text-[11px] text-slate-400">
                            {doc.fileName} • {doc.fileSize} • Uploaded {doc.uploadedAt || '-'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            doc.status === 'verified'
                              ? 'success'
                              : doc.status === 'under_review'
                              ? 'warning'
                              : doc.status === 'missing'
                              ? 'danger'
                              : 'secondary'
                          }
                        >
                          {doc.status.toUpperCase()}
                        </Badge>
                        <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
                          Download
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CONTRACTS TAB */}
        {activeTab === 'contracts' && (
          <div className="space-y-4">
            {contracts.map(cnt => (
              <Card key={cnt.id}>
                <CardHeader>
                  <div>
                    <CardTitle className="font-mono">{cnt.contractNumber}</CardTitle>
                    <CardDescription>Type: {cnt.type.toUpperCase()}</CardDescription>
                  </div>
                  <Badge variant={cnt.status === 'active' ? 'success' : 'warning'}>{cnt.status.toUpperCase()}</Badge>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Start Date:</span>
                    <span className="font-semibold text-slate-900">{cnt.startDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">End Date:</span>
                    <span className="font-semibold text-slate-900">{cnt.endDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Notice Period:</span>
                    <span className="font-semibold text-slate-900">{cnt.noticePeriodDays} Days</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Renewal Count:</span>
                    <span className="font-semibold text-slate-900">{cnt.renewalCount} Times</span>
                  </div>
                  <div className="col-span-2 md:col-span-4 pt-2 border-t border-slate-100 text-slate-600">
                    {cnt.termsSummary}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* EMPLOYMENT HISTORY TAB (TIMELINE) */}
        {activeTab === 'history' && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Career Progression & Events Timeline</CardTitle>
                <CardDescription>Audited record of promotions, transfers, and compensation updates</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 rtl:pl-0 rtl:pr-6 border-l-2 rtl:border-l-0 rtl:border-r-2 border-slate-200 space-y-6">
                {historyEvents.map(evt => (
                  <div key={evt.id} className="relative group">
                    {/* Circle icon */}
                    <div className="absolute -left-[31px] rtl:-left-auto rtl:-right-[31px] top-0.5 w-4 h-4 rounded-full bg-brand-600 ring-4 ring-white" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 uppercase">
                          {evt.eventType.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400">• {evt.date}</span>
                      </div>

                      <div className="mt-1 text-xs text-slate-600">
                        <span className="text-slate-400 line-through mr-2 rtl:mr-0 rtl:ml-2">
                          {evt.previousValue}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {evt.newValue}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {evt.notes}
                      </p>

                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Action verified by: {evt.changedBy}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <Card>
            <CardHeader>
              <CardTitle>Attendance Log & Punch Records</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Check In</th>
                    <th className="p-3">Check Out</th>
                    <th className="p-3">Work Hours</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Device Gateway</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {attendance.slice(0, 5).map(att => (
                    <tr key={att.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold">{att.date}</td>
                      <td className="p-3 font-mono">{att.checkIn}</td>
                      <td className="p-3 font-mono">{att.checkOut}</td>
                      <td className="p-3">{att.workHours} hrs</td>
                      <td className="p-3">
                        <Badge variant={att.status === 'present' ? 'success' : 'warning'}>
                          {att.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-3 text-[11px] text-slate-400">{att.deviceSource}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* LEAVE TAB */}
        {activeTab === 'leave' && (
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests & Accrual Balance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 text-xs">
                {leaves.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">No leave requests recorded.</div>
                ) : (
                  leaves.map(req => (
                    <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="font-semibold text-slate-900 capitalize">
                          {req.leaveType} Leave ({req.days} Days)
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {req.startDate} to {req.endDate} • Reason: {req.reason}
                        </div>
                      </div>
                      <Badge variant={req.status === 'approved' ? 'success' : 'warning'}>
                        {req.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* PAYROLL TAB (RBAC RESTRICTED) */}
        {activeTab === 'payroll' && (
          <div>
            {!can('payroll', 'view') ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-900">Access Restricted</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {t('payroll.restrictedNotice')} Current persona ({role}) has no payroll view privileges.
                  Switch to HR Manager or System Admin in the top header to inspect salary information.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <span className="text-xs text-slate-500 font-semibold block">Basic Salary</span>
                      <span className="text-xl font-bold text-slate-900 mt-1 block">
                        SAR {employee.basicSalary.toLocaleString()}
                      </span>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <span className="text-xs text-slate-500 font-semibold block">Total Allowances</span>
                      <span className="text-xl font-bold text-brand-600 mt-1 block">
                        SAR {(employee.housingAllowance + employee.transportAllowance).toLocaleString()}
                      </span>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <span className="text-xs text-slate-500 font-semibold block">Gross Monthly Package</span>
                      <span className="text-xl font-bold text-emerald-600 mt-1 block">
                        SAR {(employee.basicSalary + employee.housingAllowance + employee.transportAllowance).toLocaleString()}
                      </span>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Compensation Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Base Salary</span>
                      <span className="font-semibold text-slate-900">SAR {employee.basicSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Housing Allowance (25%)</span>
                      <span className="font-semibold text-slate-900">SAR {employee.housingAllowance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-600">Transportation Allowance (10%)</span>
                      <span className="font-semibold text-slate-900">SAR {employee.transportAllowance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 text-rose-600">
                      <span>Social Insurance (GOSI Employee Share ~9.75%)</span>
                      <span className="font-semibold">- SAR {Math.round(employee.basicSalary * 0.0975).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 font-bold text-slate-900 text-sm">
                      <span>Estimated Net Monthly</span>
                      <span className="text-emerald-700">
                        SAR {Math.round(employee.basicSalary * 1.35 - employee.basicSalary * 0.0975).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <Card>
            <CardHeader>
              <CardTitle>Employee Audit Log History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs">
                {mockAuditLogs.map(log => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900">{log.action}</span>
                      <span className="text-[11px] text-slate-500 block">{log.target}</span>
                    </div>
                    <div className="text-right rtl:text-left text-[11px] text-slate-400">
                      <span>{log.userName}</span>
                      <span className="block">{log.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
