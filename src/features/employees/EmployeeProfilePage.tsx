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
  ShieldCheck,
  Printer,
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
  Sparkles,
  ChevronDown,
  Camera,
  User,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { employeeService } from '../../services/employeeService';
import { InsuranceForm1GuideModal } from '../insurance/components/InsuranceForm1GuideModal';
import { EmployeeTemplateFillModal } from '../documents/components/EmployeeTemplateFillModal';
import { EmployeeBadgeModal } from './components/badge/EmployeeBadgeModal';
import { EmployeeBadge3DPreview } from './components/badge/EmployeeBadge3DPreview';
import { EmployeeFormModal } from './EmployeeFormModal';
import { documentService } from '../../services/documentService';
import { contractService } from '../../services/contractService';
import { attendanceService } from '../../services/attendanceService';
import { leaveService } from '../../services/leaveService';
import { auditService } from '../../services/auditService';
import { Employee, DocumentRecord, ContractRecord, AttendanceRecord, LeaveRequest, EmploymentHistoryEvent } from '../../types';
import { formatCurrency, formatDate, getGenderAvatarUrl } from '../../lib/utils';
import { useDirection } from '../../context/DirectionContext';
import { useToast } from '../../components/ui/Toast';
import { useQueryClient } from '@tanstack/react-query';
import { employeeKeys, useDepartments } from '../../hooks/queries';

export const EmployeeProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { can, role } = useAuth();
  const { isRtl, language } = useDirection();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const { data: departments = [] } = useDepartments();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [historyEvents, setHistoryEvents] = useState<EmploymentHistoryEvent[]>([]);
  const [employeeLogs, setEmployeeLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isInsuranceGuideOpen, setIsInsuranceGuideOpen] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [docFillModalState, setDocFillModalState] = useState<{
    isOpen: boolean;
    templateId: 'salary-slip-template' | 'clearance-form' | 'resignation-form';
    titleAr: string;
  } | null>(null);
  const [isDocMenuOpen, setIsDocMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadProfileData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const rawEmp = await employeeService.getEmployeeById(id);
        const emp: Employee | null = (rawEmp as any)?.data || rawEmp;
        if (emp && isMounted) {
          setEmployee(emp);
          setHistoryEvents([]);

          try {
            const [docs, cnts, att, lvs, aud] = await Promise.all([
              documentService.getDocuments({ employeeId: emp.id }).catch(() => []),
              contractService.getContracts({ search: emp.employeeId }).catch(() => []),
              attendanceService.getAttendance({ search: emp.employeeId }).catch(() => []),
              leaveService.getLeaveRequests({ search: emp.employeeId }).catch(() => []),
              auditService.getAuditLogs('employees', emp.employeeId).catch(() => []),
            ]);

            if (isMounted) {
              setDocuments(Array.isArray(docs) ? docs : (docs as any)?.data || []);
              setContracts(Array.isArray(cnts) ? cnts : (cnts as any)?.data || []);
              setAttendance(Array.isArray(att) ? att : (att as any)?.data || []);
              setLeaves(Array.isArray(lvs) ? lvs : (lvs as any)?.data || []);
              setEmployeeLogs(Array.isArray(aud) ? aud : (aud as any)?.data || []);
            }
          } catch (subErr) {
            console.warn('Could not load secondary employee records:', subErr);
          }
        }
      } catch (err) {
        console.error('Error loading employee profile:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfileData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const emergencyContact = React.useMemo(() => {
    if (!employee?.emergencyContact) return null;
    if (typeof employee.emergencyContact === 'string') {
      try {
        const parsed = JSON.parse(employee.emergencyContact);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
      } catch {
        return { name: employee.emergencyContact, relationship: '-', phone: '-' };
      }
    }
    return employee.emergencyContact;
  }, [employee?.emergencyContact]);

  const basicSalary = Number(employee?.basicSalary) || 0;
  const housingAllowance = Number(employee?.housingAllowance) || 0;
  const transportAllowance = Number(employee?.transportAllowance) || 0;
  const totalAllowances = housingAllowance + transportAllowance;
  const grossMonthlyPackage = basicSalary + totalAllowances;
  const socialInsurance = Math.round(basicSalary * 0.0975);
  const estimatedNetMonthly = Math.round(basicSalary * 1.35 - socialInsurance);

  const dept = departments.find(d => d.id === employee?.departmentId || d.name === employee?.departmentName);
  const localizedDeptName = employee ? (
    language === 'zh-CN' ? (dept?.nameZh || employee.departmentName)
    : language === 'ar' ? (dept?.nameAr || employee.departmentName)
    : (dept?.name || employee.departmentName)
  ) : '-';

  const localizedPositionTitle = employee ? (
    language === 'zh-CN' && employee.chinesePosition
      ? employee.chinesePosition
      : employee.positionTitle
  ) : '-';

  const getStatusBadge = (status?: string) => {
    const map: Record<string, { label: string; variant: BadgeVariant }> = {
      active: { label: t('common.active'), variant: 'success' },
      probation: { label: t('common.probation'), variant: 'warning' },
      on_leave: { label: t('common.onLeave'), variant: 'info' },
      suspended: { label: t('common.suspended'), variant: 'danger' },
      terminated: { label: t('common.terminated'), variant: 'secondary' },
    };
    const s = status ? map[status] : undefined;
    return s ? <Badge variant={s.variant}>{s.label}</Badge> : <Badge variant="success">{t('common.active')}</Badge>;
  };

  const getContractStatusLabel = (status?: string) => {
    if (status === 'expiring_soon') return t('common.expiringSoon');
    if (status === 'expired') return t('common.expired');
    if (status === 'pending_renewal') return t('common.pendingRenewal');
    return t('common.active');
  };

  const getEmploymentTypeLabel = (type?: string) => {
    const map: Record<string, string> = {
      full_time: t('employees.typeFullTime'),
      part_time: t('employees.typePartTime'),
      contract: t('employees.typeFixedContract'),
      contractor: t('employees.typeContractor'),
      intern: t('employees.typeInternship'),
    };
    return (type && map[type]) || type || '-';
  };

  const localizedGender = employee?.gender === 'female' ? t('employees.genderFemale') : t('employees.genderMale');
  const localizedNationality = employee?.nationality === 'Egyptian' ? t('employees.nationalityEgyptian', 'Egyptian') : (employee?.nationality || '-');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employee) return;

    if (!file.type.startsWith('image/')) {
      toastError(t('employees.invalidPhotoType', 'يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)'));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        employeeService.updateEmployee(employee.id, { avatar: compressedDataUrl })
          .then(() => {
            setEmployee(prev => prev ? { ...prev, avatar: compressedDataUrl } : null);
            queryClient.invalidateQueries({ queryKey: employeeKeys.all });
            success(t('employees.toastPhotoUpdateSuccess', 'تم تحديث صورة الموظف بنجاح وستظهر فوراً في الكارنيه والملف الشخصي'));
          })
          .catch((err) => {
            console.error('Failed to update employee photo:', err);
            toastError(t('employees.toastPhotoUpdateError', 'فشل في حفظ صورة الموظف'));
          });
      };
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateFromModal = async (data: Partial<Employee>) => {
    if (!employee) return;
    try {
      await employeeService.updateEmployee(employee.id, data);
      setEmployee(prev => prev ? { ...prev, ...data } : null);
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      setIsEditModalOpen(false);
      success(t('employees.updateSuccess', 'تم تحديث بيانات الموظف بنجاح'));
    } catch (err) {
      console.error('Failed to update employee:', err);
      toastError(t('employees.toastSubmitError', 'فشل في حفظ بيانات الموظف'));
    }
  };

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
      <div className="text-center py-16 bg-white dark:bg-[#151D2E] rounded-2xl border border-slate-200 dark:border-[#1E293B]">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">{t('employees.notFoundTitle')}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('employees.notFoundDesc')}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/employees')}>
          {t('employees.backToDirectory')}
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
        <span className="text-xs text-slate-400 dark:text-slate-500">/</span>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{employee.employeeId}</span>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white dark:bg-[#151D2E] rounded-2xl border border-slate-200/90 dark:border-[#1E293B] shadow-sm p-6 relative z-20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Interactive Avatar with Photo Upload */}
            <div className="relative group/avatar cursor-pointer shrink-0">
              <img
                src={getGenderAvatarUrl(employee.avatar, employee.gender, employee.firstName || employee.id)}
                alt=""
                className="w-20 h-20 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border-2 border-white dark:border-[#1E293B] shadow-md object-cover transition-opacity group-hover/avatar:opacity-75"
              />
              <label
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer p-1 text-center"
                title={t('employees.changeOrUploadPhoto', 'تغيير أو رفع صورة الموظف')}
              >
                <Camera className="w-5 h-5 mb-0.5 text-white" />
                <span className="text-[9px] font-bold">{t('employees.changePhoto', 'تغيير الصورة')}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                  {employee.firstName} {employee.lastName}
                </h1>
                {employee.arabicName && (
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#1E293B] px-2.5 py-0.5 rounded-full">
                    {employee.arabicName}
                  </span>
                )}
                {getStatusBadge(employee.employmentStatus)}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono font-semibold text-brand-700 dark:text-[#38BDF8] bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded">
                  {employee.employeeId}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  {localizedPositionTitle}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  {localizedDeptName}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  {t('employees.hiredOn', { date: employee.hireDate || '-' })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
            {/* Quick Word Documents Auto-Fill */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                rightIcon={<ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />}
                onClick={() => setIsDocMenuOpen(!isDocMenuOpen)}
                className="border-emerald-300 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 font-bold shadow-2xs"
              >
                {t('employees.generateWordDoc')}
              </Button>

              {isDocMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setIsDocMenuOpen(false)}
                  />
                  <div className="absolute top-full end-0 mt-2 w-64 bg-white dark:bg-[#151D2E] rounded-xl shadow-2xl border border-slate-200 dark:border-[#1E293B] py-1.5 z-50 divide-y divide-slate-100 dark:divide-[#1E293B] text-start animate-in fade-in zoom-in-95 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDocMenuOpen(false);
                        setDocFillModalState({
                          isOpen: true,
                          templateId: 'salary-slip-template',
                          titleAr: t('employees.salarySlipDocFull'),
                        });
                      }}
                      className="w-full px-3.5 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">📄</span>
                        <span>{t('employees.salarySlipDoc')}</span>
                      </div>
                      <Badge variant="success" className="text-[9px]">Word</Badge>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDocMenuOpen(false);
                        setDocFillModalState({
                          isOpen: true,
                          templateId: 'clearance-form',
                          titleAr: t('employees.clearanceDoc'),
                        });
                      }}
                      className="w-full px-3.5 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">📋</span>
                        <span>{t('employees.clearanceDoc')}</span>
                      </div>
                      <Badge variant="success" className="text-[9px]">Word</Badge>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDocMenuOpen(false);
                        setDocFillModalState({
                          isOpen: true,
                          templateId: 'resignation-form',
                          titleAr: t('employees.resignationDocFull'),
                        });
                      }}
                      className="w-full px-3.5 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">📝</span>
                        <span>{t('employees.resignationDoc')}</span>
                      </div>
                      <Badge variant="success" className="text-[9px]">Word</Badge>
                    </button>
                  </div>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              onClick={() => setIsBadgeModalOpen(true)}
              className="border-emerald-300 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 font-bold"
            >
              {t('employees.printBadge')}
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileText className="w-3.5 h-3.5" />}
              onClick={() => setActiveTab('documents')}
            >
              {t('employees.filesCount', { percentage: employee.documentCompletenessPercentage ?? 0 })}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Edit className="w-3.5 h-3.5" />}
              onClick={() => setIsEditModalOpen(true)}
            >
              {t('employees.editDetails')}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Panels */}
      <div className="mt-6">
        {/* OVERVIEW TAB: EXECUTIVE DOSSIER WITH INTEGRATED 3D BADGE */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Main Profile Info Cards (xl:col-span-8) */}
            <div className="xl:col-span-8 space-y-6">
              {/* Personal Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    {t('employees.personalInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#1E293B]">
                      <span className="text-slate-500 dark:text-slate-400">{t('employees.fullEnglishName')}</span>
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{employee.firstName} {employee.lastName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#1E293B]">
                      <span className="text-slate-500 dark:text-slate-400">{t('employees.arabicName')}</span>
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{employee.arabicName || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#1E293B]">
                      <span className="text-slate-500 dark:text-slate-400">{t('employees.nationalId')}</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-[#F8FAFC]">{employee.nationalId || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#1E293B]">
                      <span className="text-slate-500 dark:text-slate-400">{t('employees.dateOfBirth')}</span>
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{employee.dateOfBirth || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#1E293B]">
                      <span className="text-slate-500 dark:text-slate-400">{t('employees.genderNationality')}</span>
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{localizedGender} • {localizedNationality}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#1E293B]">
                      <span className="text-slate-500 dark:text-slate-400">{t('employees.workEmail')}</span>
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{employee.email || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#1E293B]">
                      <span className="text-slate-500 dark:text-slate-400">{t('employees.phoneNumber')}</span>
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{employee.phone || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#1E293B]">
                      <span className="text-slate-500 dark:text-slate-400">{t('employees.residentialAddress')}</span>
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-right rtl:text-left max-w-xs">{employee.address || '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Job & Employment Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    {t('employees.jobInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#1E293B]">
                      <span className="text-slate-500 dark:text-slate-400">{t('common.department')}</span>
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{localizedDeptName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#1E293B]">
                      <span className="text-slate-500 dark:text-slate-400">{t('common.position')}</span>
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{localizedPositionTitle}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#1E293B]">
                      <span className="text-slate-500 dark:text-slate-400">{t('employees.reportingManager')}</span>
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{employee.managerName || t('common.unspecified')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#1E293B]">
                      <span className="text-slate-500 dark:text-slate-400">{t('employees.employmentType')}</span>
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{getEmploymentTypeLabel(employee.employmentType)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#1E293B]">
                      <span className="text-slate-500 dark:text-slate-400">{t('employees.workLocation')}</span>
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{employee.workLocation || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#1E293B]">
                      <span className="text-slate-500 dark:text-slate-400">{t('employees.probationEndDate')}</span>
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{employee.probationEndDate || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 items-center border-b border-slate-100 dark:border-[#1E293B]">
                      <span className="text-slate-500 dark:text-slate-400">{t('employees.contractExpiryStatus')}</span>
                      <Badge variant={employee.contractStatus === 'expired' ? 'danger' : employee.contractStatus === 'expiring_soon' ? 'warning' : 'success'}>
                        {getContractStatusLabel(employee.contractStatus)}
                      </Badge>
                    </div>
                    <div className="flex justify-between py-1 items-center border-b border-slate-100 dark:border-[#1E293B]">
                      <span className="text-slate-500 dark:text-slate-400">{t('employees.emergencyContact')}</span>
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] truncate">
                        {emergencyContact?.name ? `${emergencyContact.name} (${emergencyContact.phone || '-'})` : '-'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Official Digital ID Badge Showcase (xl:col-span-4) */}
            <div className="xl:col-span-4">
              <EmployeeBadge3DPreview
                employee={employee}
                initialOrientation="vertical"
                onOpenPrintModal={() => setIsBadgeModalOpen(true)}
              />
            </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>{t('employees.personnelComplianceDocs')}</CardTitle>
                <CardDescription>{t('employees.fileCompleteness', { percentage: employee.documentCompletenessPercentage })}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-[#1E293B] text-xs">
                {documents.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500">{t('employees.noDocsIndexed')}</div>
                ) : (
                  documents.map(doc => (
                    <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-brand-600 dark:text-[#38BDF8] shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{doc.title}</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            {doc.fileName} • {doc.fileSize} • {t('employees.uploadedAt', { date: doc.uploadedAt || '-' })}
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
                          {doc.status === 'verified'
                            ? t('common.verified')
                            : doc.status === 'under_review'
                            ? t('common.underReview')
                            : doc.status === 'missing'
                            ? t('common.missing')
                            : doc.status === 'expired'
                            ? t('common.expired')
                            : t('documents.statusUploaded', 'Uploaded')}
                        </Badge>
                        <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
                          {t('common.download')}
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
                    <CardDescription>{t('contracts.type')}: {getEmploymentTypeLabel(cnt.type)}</CardDescription>
                  </div>
                  <Badge variant={cnt.status === 'active' ? 'success' : 'warning'}>
                    {getContractStatusLabel(cnt.status)}
                  </Badge>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">{t('contracts.startDate')}:</span>
                    <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{cnt.startDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">{t('contracts.endDate')}:</span>
                    <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{cnt.endDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">{t('contracts.noticePeriod')}:</span>
                    <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{t('employees.daysCount', { count: cnt.noticePeriodDays })}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">{t('contracts.renewalCount')}:</span>
                    <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{t('employees.timesCount', { count: cnt.renewalCount })}</span>
                  </div>
                  <div className="col-span-2 md:col-span-4 pt-2 border-t border-slate-100 dark:border-[#1E293B] text-slate-600 dark:text-slate-300">
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
                <CardTitle>{t('employees.historyTimelineTitle')}</CardTitle>
                <CardDescription>{t('employees.historyTimelineSubtitle')}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 rtl:pl-0 rtl:pr-6 border-l-2 rtl:border-l-0 rtl:border-r-2 border-slate-200 dark:border-[#1E293B] space-y-6">
                {historyEvents.map(evt => (
                  <div key={evt.id} className="relative group">
                    {/* Circle icon */}
                    <div className="absolute -left-[31px] rtl:-left-auto rtl:-right-[31px] top-0.5 w-4 h-4 rounded-full bg-brand-600 dark:bg-[#38BDF8] ring-4 ring-white dark:ring-[#151D2E]" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] uppercase">
                          {evt.eventType.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">• {evt.date}</span>
                      </div>

                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400 dark:text-slate-500 line-through mr-2 rtl:mr-0 rtl:ml-2">
                          {evt.previousValue}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                          {evt.newValue}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#111827]/60 p-2 rounded-lg border border-slate-100 dark:border-[#1E293B]">
                        {evt.notes}
                      </p>

                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                        {t('employees.actionVerifiedBy', { name: evt.changedBy })}
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
              <CardTitle>{t('employees.attendanceLogTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead className="bg-slate-50 dark:bg-[#111827]/80 border-b border-slate-200 dark:border-[#1E293B] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3">{t('common.date')}</th>
                    <th className="p-3">{t('attendance.checkIn')}</th>
                    <th className="p-3">{t('attendance.checkOut')}</th>
                    <th className="p-3">{t('attendance.workHours')}</th>
                    <th className="p-3">{t('common.status')}</th>
                    <th className="p-3">{t('attendance.deviceGateway')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B] text-slate-700 dark:text-slate-200">
                  {attendance.slice(0, 5).map(att => (
                    <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 transition-colors">
                      <td className="p-3 font-semibold text-slate-900 dark:text-[#F8FAFC]">{att.date}</td>
                      <td className="p-3 font-mono">{att.checkIn}</td>
                      <td className="p-3 font-mono">{att.checkOut}</td>
                      <td className="p-3">{t('attendance.hoursCount', { count: att.workHours })}</td>
                      <td className="p-3">
                        <Badge variant={att.status === 'present' ? 'success' : 'warning'}>
                          {att.status === 'present' ? t('dashboard.presentCount') : att.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-[11px] text-slate-400 dark:text-slate-500">{att.deviceSource}</td>
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
              <CardTitle>{t('employees.leaveRequestsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-[#1E293B] text-xs">
                {leaves.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-500">{t('employees.noLeaveRecorded')}</div>
                ) : (
                  leaves.map(req => (
                    <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 transition-colors">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-[#F8FAFC] capitalize">
                          {req.leaveType} ({t('employees.daysCount', { count: req.days })})
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {req.startDate} {t('common.to')} {req.endDate} • {t('common.reason')}: {req.reason}
                        </div>
                      </div>
                      <Badge variant={req.status === 'approved' ? 'success' : 'warning'}>
                        {req.status === 'approved' ? t('common.approved') : req.status === 'rejected' ? t('common.rejected') : t('common.pending')}
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
              <div className="p-8 text-center bg-white dark:bg-[#151D2E] rounded-2xl border border-slate-200 dark:border-[#1E293B]">
                <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">{t('payroll.accessRestricted')}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  {t('payroll.restrictedNoticeDesc', { role })}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">{t('payroll.basicSalary')}</span>
                      <span className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1 block">
                        {basicSalary.toLocaleString()} {t('common.egp')}
                      </span>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">{t('payroll.totalAllowances')}</span>
                      <span className="text-xl font-bold text-brand-600 dark:text-[#38BDF8] mt-1 block">
                        {totalAllowances.toLocaleString()} {t('common.egp')}
                      </span>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">{t('payroll.grossMonthlyPackage')}</span>
                      <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                        {grossMonthlyPackage.toLocaleString()} {t('common.egp')}
                      </span>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('payroll.compensationBreakdown')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#1E293B]">
                      <span className="text-slate-600 dark:text-slate-400">{t('payroll.basicSalary')}</span>
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{basicSalary.toLocaleString()} {t('common.egp')}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#1E293B]">
                      <span className="text-slate-600 dark:text-slate-400">{t('payroll.housingAllowance')} (25%)</span>
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{housingAllowance.toLocaleString()} {t('common.egp')}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#1E293B]">
                      <span className="text-slate-600 dark:text-slate-400">{t('payroll.transportAllowance')} (10%)</span>
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{transportAllowance.toLocaleString()} {t('common.egp')}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#1E293B] text-rose-600 dark:text-rose-400">
                      <span>{t('payroll.socialInsuranceDeduction')}</span>
                      <span className="font-semibold">- {socialInsurance.toLocaleString()} {t('common.egp')}</span>
                    </div>
                    <div className="flex justify-between pt-2 font-bold text-slate-900 dark:text-[#F8FAFC] text-sm">
                      <span>{t('payroll.estimatedNetMonthly')}</span>
                      <span className="text-emerald-700 dark:text-emerald-400">
                        {estimatedNetMonthly.toLocaleString()} {t('common.egp')}
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
              <CardTitle>{t('employees.auditLogTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              {employeeLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {t('common.noData', 'لا توجد عمليات رقابية مسجلة حديثاً على هذا الموظف')}
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  {employeeLogs.map(log => (
                    <div key={log.id} className="p-3 bg-slate-50 dark:bg-[#111827]/60 rounded-xl border border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{log.action}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{log.target}</span>
                      </div>
                      <div className="text-right rtl:text-left text-[11px] text-slate-400 dark:text-slate-500">
                        <span>{log.userName}</span>
                        <span className="block">{log.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Employee Docx Auto-Fill Modal */}
      {docFillModalState && employee && (
        <EmployeeTemplateFillModal
          isOpen={docFillModalState.isOpen}
          onClose={() => setDocFillModalState(null)}
          templateId={docFillModalState.templateId}
          templateTitleAr={docFillModalState.titleAr}
          initialEmployee={employee}
        />
      )}

      {/* Employee ID Badge Modal */}
      {isBadgeModalOpen && employee && (
        <EmployeeBadgeModal
          isOpen={isBadgeModalOpen}
          onClose={() => setIsBadgeModalOpen(false)}
          employees={[employee]}
        />
      )}

      {/* Edit Employee Details & Photo Modal */}
      {isEditModalOpen && employee && (
        <EmployeeFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateFromModal}
          initialData={employee}
        />
      )}
    </div>
  );
};
