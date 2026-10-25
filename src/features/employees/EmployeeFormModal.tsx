import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { useDepartments, usePositions } from '../../hooks/queries';
import { Employee } from '../../types';
import {
  Check,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Camera,
  ShieldCheck,
  FileCheck,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

const getEmployeeSchema = (t: (key: string, def?: string) => string) =>
  z.object({
    firstName: z.string().min(2, t('employees.valFirstNameMin', 'الاسم الأول يجب أن يكون حرفين على الأقل')),
    lastName: z.string().min(2, t('employees.valLastNameMin', 'اسم العائلة يجب أن يكون حرفين على الأقل')),
    arabicName: z.string().optional(),
    email: z.string().email(t('employees.valEmailInvalid', 'صيغة البريد الإلكتروني غير صحيحة')).or(z.literal('')).optional(),
    phone: z.string().optional(),
    nationalId: z.string().min(10, t('employees.valNationalIdMin', 'الرقم القومي يجب ألا يقل عن 10 أرقام')),
    dateOfBirth: z.string().min(1, t('employees.valDobRequired', 'تاريخ الميلاد مطلوب')),
    gender: z.enum(['male', 'female']),
    nationality: z.string().min(2, t('employees.valNationalityRequired', 'الجنسية مطلوبة')),
    address: z.string().optional(),
    emergencyName: z.string().optional(),
    emergencyRelationship: z.string().optional(),
    emergencyPhone: z.string().optional(),
    departmentId: z.string().min(1, t('employees.valDeptRequired', 'يرجى اختيار القسم')),
    positionId: z.string().min(1, t('employees.valPositionRequired', 'يرجى اختيار المسمى الوظيفي')),
    employmentType: z.enum(['full_time', 'part_time', 'contract', 'contractor', 'intern']),
    employmentStatus: z.enum(['active', 'probation', 'on_leave', 'suspended', 'terminated']),
    hireDate: z.string().min(1, t('employees.valHireDateRequired', 'تاريخ التعيين مطلوب')),
    basicSalary: z.coerce.number().min(1000, t('employees.valSalaryMin', 'الراتب الأساسي يجب ألا يقل عن 1,000 ج.م')),
    housingAllowance: z.coerce.number().min(0).default(0),
    transportAllowance: z.coerce.number().min(0).default(0),
    workLocation: z.string().min(2, t('employees.valLocationRequired', 'مقر العمل مطلوب')),
    insuranceStatus: z.enum(['insured', 'not_insured']).default('insured'),
    insuranceNumber: z.string().optional(),
    insuranceSalary: z.coerce.number().optional(),
    idCardStatus: z.enum(['available', 'missing']).default('available'),
    qualificationCertificateStatus: z.enum(['available', 'missing']).default('available'),
    birthCertificateStatus: z.enum(['available', 'missing']).default('available'),
    contractDocStatus: z.enum(['available', 'missing']).default('available'),
  });

type EmployeeFormData = z.infer<ReturnType<typeof getEmployeeSchema>>;

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Employee>) => Promise<void>;
  initialData?: Employee | null;
}

// Safely parse emergencyContact whether it's an object, JSON string, or null
const parseEmergency = (ec: any) => {
  if (!ec) return { name: '', relationship: '', phone: '' };
  if (typeof ec === 'string') {
    try {
      const parsed = JSON.parse(ec);
      return {
        name: parsed.name || '',
        relationship: parsed.relationship || '',
        phone: parsed.phone || '',
      };
    } catch {
      return { name: ec, relationship: '', phone: '' };
    }
  }
  return {
    name: ec.name || '',
    relationship: ec.relationship || '',
    phone: ec.phone || '',
  };
};

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarData, setAvatarData] = useState<string | undefined>(initialData?.avatar);
  const { success, info, error: toastError } = useToast();

  const employeeSchema = useMemo(() => getEmployeeSchema(t), [t]);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      arabicName: '',
      email: '',
      phone: '',
      nationalId: '',
      dateOfBirth: '1995-01-01',
      gender: 'male',
      nationality: 'Egyptian',
      address: '',
      emergencyName: '',
      emergencyRelationship: '',
      emergencyPhone: '',
      departmentId: '',
      positionId: '',
      employmentType: 'full_time',
      employmentStatus: 'active',
      hireDate: new Date().toISOString().split('T')[0],
      basicSalary: 4325,
      housingAllowance: 0,
      transportAllowance: 0,
      workLocation: 'مصنع السادات - New Hope Sadat',
      insuranceStatus: 'insured',
      insuranceNumber: '',
      insuranceSalary: 4325,
      idCardStatus: 'available',
      qualificationCertificateStatus: 'available',
      birthCertificateStatus: 'available',
      contractDocStatus: 'available',
    },
  });

  const { data: departments = [] } = useDepartments();
  const { data: allPositions = [] } = usePositions();

  // Populate ALL form fields whenever initialData changes or the modal opens!
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setAvatarData(initialData?.avatar);

      if (initialData) {
        const ec = parseEmergency(initialData.emergencyContact);
        const hireDateStr = initialData.hireDate
          ? String(initialData.hireDate).split('T')[0]
          : new Date().toISOString().split('T')[0];
        const dobStr = initialData.dateOfBirth
          ? String(initialData.dateOfBirth).split('T')[0]
          : '1995-01-01';

        reset({
          firstName: initialData.firstName || '',
          lastName: initialData.lastName || '',
          arabicName: initialData.arabicName || `${initialData.firstName || ''} ${initialData.lastName || ''}`.trim(),
          email: initialData.email || '',
          phone: initialData.phone || '',
          nationalId: initialData.nationalId || '',
          dateOfBirth: dobStr,
          gender: initialData.gender === 'female' ? 'female' : 'male',
          nationality: initialData.nationality || 'Egyptian',
          address: initialData.address || '',
          emergencyName: ec.name,
          emergencyRelationship: ec.relationship,
          emergencyPhone: ec.phone,
          departmentId: initialData.departmentId || (departments[0]?.id ?? ''),
          positionId: initialData.positionId || (allPositions[0]?.id ?? ''),
          employmentType: initialData.employmentType || 'full_time',
          employmentStatus: initialData.employmentStatus || 'active',
          hireDate: hireDateStr,
          basicSalary: Number(initialData.basicSalary ?? 4325),
          housingAllowance: Number(initialData.housingAllowance ?? 0),
          transportAllowance: Number(initialData.transportAllowance ?? 0),
          workLocation: initialData.workLocation || 'مصنع السادات - New Hope Sadat',
          insuranceStatus: initialData.insuranceStatus || 'insured',
          insuranceNumber: initialData.insuranceNumber || '',
          insuranceSalary: Number(initialData.insuranceSalary ?? initialData.basicSalary ?? 4325),
          idCardStatus: initialData.idCardStatus || 'available',
          qualificationCertificateStatus: initialData.qualificationCertificateStatus || 'available',
          birthCertificateStatus: initialData.birthCertificateStatus || 'available',
          contractDocStatus: initialData.contractDocStatus || 'available',
        });
      } else {
        // Reset to clean default values for new registration
        reset({
          firstName: '',
          lastName: '',
          arabicName: '',
          email: '',
          phone: '',
          nationalId: '',
          dateOfBirth: '1995-01-01',
          gender: 'male',
          nationality: 'Egyptian',
          address: '',
          emergencyName: '',
          emergencyRelationship: '',
          emergencyPhone: '',
          departmentId: departments[0]?.id || '',
          positionId: allPositions[0]?.id || '',
          employmentType: 'full_time',
          employmentStatus: 'active',
          hireDate: new Date().toISOString().split('T')[0],
          basicSalary: 4325,
          housingAllowance: 0,
          transportAllowance: 0,
          workLocation: 'مصنع السادات - New Hope Sadat',
          insuranceStatus: 'insured',
          insuranceNumber: '',
          insuranceSalary: 4325,
          idCardStatus: 'available',
          qualificationCertificateStatus: 'available',
          birthCertificateStatus: 'available',
          contractDocStatus: 'available',
        });
      }
    }
  }, [isOpen, initialData, reset, departments, allPositions]);

  const selectedDeptId = watch('departmentId');
  const availablePositions = allPositions.filter(p => !selectedDeptId || p.departmentId === selectedDeptId);

  const steps = [
    { number: 1, title: t('employees.step1Title', 'البيانات الشخصية') },
    { number: 2, title: t('employees.step2Title', 'بيانات الاتصال') },
    { number: 3, title: t('employees.step3Title', 'الوظيفة والراتب') },
    { number: 4, title: t('employees.step4Title', 'جهة اتصال الطوارئ') },
    { number: 5, title: t('employees.step5Title', 'الأوراق والتأمينات') },
    { number: 6, title: t('employees.step6Title', 'مراجعة وتأكيد') },
  ];

  // Auto extract birth date and gender from 14-digit Egyptian National ID
  const handleNationalIdInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim().replace(/[^0-9]/g, '');
    setValue('nationalId', val);
    if (val.length === 14) {
      const century = parseInt(val[0], 10) === 3 ? 2000 : 1900;
      const yr = parseInt(val.substring(1, 3), 10);
      const mo = val.substring(3, 5);
      const da = val.substring(5, 7);
      setValue('dateOfBirth', `${century + yr}-${mo}-${da}`);
      const genderDigit = parseInt(val[12], 10);
      setValue('gender', genderDigit % 2 === 0 ? 'female' : 'male');
    }
  };

  const handleNext = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (currentStep === 1) {
      const isValid = await trigger(['firstName', 'lastName', 'nationalId', 'dateOfBirth', 'gender', 'nationality']);
      if (!isValid) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const emailVal = watch('email');
      if (emailVal && emailVal.trim() !== '') {
        const isValid = await trigger(['email']);
        if (!isValid) return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      const isValid = await trigger(['departmentId', 'positionId', 'employmentType', 'hireDate', 'basicSalary', 'workLocation']);
      if (!isValid) return;
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    } else if (currentStep === 5) {
      setCurrentStep(6);
    }
  };

  const handleSaveDraft = () => {
    info(t('employees.draftSaved', 'تم حفظ المسودة'));
    onClose();
  };

  const onFormSubmit = async (data: EmployeeFormData) => {
    setIsSubmitting(true);
    try {
      const selectedDept = departments.find(d => d.id === data.departmentId);
      const selectedPos = allPositions.find(p => p.id === data.positionId);

      await onSubmit({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        arabicName: data.arabicName?.trim() || `${data.firstName.trim()} ${data.lastName.trim()}`,
        avatar: avatarData,
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        nationalId: data.nationalId.trim(),
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        nationality: data.nationality || 'Egyptian',
        address: data.address?.trim() || undefined,
        emergencyContact: (data.emergencyName || data.emergencyPhone)
          ? {
              name: data.emergencyName?.trim() || '',
              relationship: data.emergencyRelationship?.trim() || '',
              phone: data.emergencyPhone?.trim() || '',
            }
          : undefined,
        departmentId: data.departmentId,
        departmentName: selectedDept?.name || 'Department',
        positionId: data.positionId,
        positionTitle: selectedPos?.title || 'Position',
        employmentType: data.employmentType,
        employmentStatus: data.employmentStatus,
        hireDate: data.hireDate,
        workLocation: data.workLocation,
        basicSalary: Number(data.basicSalary),
        housingAllowance: Number(data.housingAllowance || 0),
        transportAllowance: Number(data.transportAllowance || 0),
        insuranceStatus: data.insuranceStatus,
        insuranceNumber: data.insuranceNumber?.trim() || undefined,
        insuranceSalary: data.insuranceStatus === 'insured' ? Number(data.insuranceSalary || data.basicSalary) : undefined,
        idCardStatus: data.idCardStatus,
        qualificationCertificateStatus: data.qualificationCertificateStatus,
        birthCertificateStatus: data.birthCertificateStatus,
        contractDocStatus: data.contractDocStatus,
      });

      success(
        initialData
          ? t('employees.toastEditSuccessTitle', 'تم تعديل وحفظ بيانات الموظف بنجاح')
          : t('employees.toastAddSuccessTitle', 'تم إضافة الموظف الجديد بنجاح'),
        t('employees.toastSaveSuccessDesc', 'تم حفظ السجل بالكامل في قاعدة البيانات')
      );
      reset();
      setCurrentStep(1);
      onClose();
    } catch (err: any) {
      console.error('Error submitting employee form:', err);
      toastError(err?.message || t('employees.toastSubmitError', 'حدث خطأ أثناء حفظ بيانات الموظف. يرجى مراجعة البيانات المدخلة.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formValues = watch();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title={
        initialData
          ? t('employees.editEmployeeTitleWith', {
              name: `${initialData.firstName} ${initialData.lastName}`,
              defaultValue: `تعديل بيانات الموظف: ${initialData.firstName} ${initialData.lastName}`,
            })
          : t('employees.registerNewModalTitle', 'تسجيل وإضافة موظف جديد')
      }
      description={
        initialData
          ? t('employees.editEmployeeDesc', 'تعديل وتحديث بيانات الموظف الحالية في النظام')
          : t('employees.registerNewModalDesc', 'أدخل تفاصيل الموظف ومسوغات التعيين والموقف التأميني بدقة')
      }
    >
      <div className="space-y-6">
        {/* Step Progress Bar - Clickable to jump directly to any step */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E293B] pb-3 overflow-x-auto gap-1">
          {steps.map(step => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;

            return (
              <button
                key={step.number}
                type="button"
                onClick={() => setCurrentStep(step.number)}
                className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors focus:outline-none"
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-brand-600 dark:bg-[#38BDF8] text-white dark:text-[#0B0F19] shadow-sm ring-2 ring-brand-300 dark:ring-[#38BDF8]/40'
                      : 'bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.number}
                </div>
                <span
                  className={`text-xs whitespace-nowrap ${
                    isCurrent ? 'text-brand-900 dark:text-[#38BDF8] font-bold' : isCompleted ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {step.title}
                </span>
                {step.number < steps.length && (
                  <div className="w-3 sm:w-4 h-0.5 bg-slate-200 dark:bg-[#1E293B] mx-0.5 hidden sm:block" />
                )}
              </button>
            );
          })}
        </div>

        {/* Wizard Form Content - onSubmit prevented so form can never submit accidentally */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="space-y-4"
        >
          {/* STEP 1: Personal Information */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
              {/* Photo Upload Section */}
              <div className="md:col-span-2 flex items-center gap-4 p-3 bg-slate-50 dark:bg-[#111827]/60 border border-slate-200 dark:border-[#1E293B] rounded-xl">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] shrink-0 shadow-xs">
                  {avatarData ? (
                    <img src={avatarData} alt="Employee Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-[#1E293B]">
                      <User className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    {t('employees.photoLabel', 'صورة الموظف (تظهر في الملف الشخصي والكارنيه الرسمي)')}
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#151D2E] border border-slate-300 dark:border-[#1E293B] hover:border-brand-500 dark:hover:border-[#38BDF8] rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-[#38BDF8] transition-colors shadow-2xs">
                      <Camera className="w-3.5 h-3.5 text-brand-600 dark:text-[#38BDF8]" />
                      <span>{avatarData ? t('employees.changePhoto', 'تغيير الصورة') : t('employees.uploadPhoto', 'رفع صورة الموظف')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const dataUrl = ev.target?.result as string;
                            if (dataUrl) {
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
                                setAvatarData(canvas.toDataURL('image/jpeg', 0.85));
                              };
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    {avatarData && (
                      <button
                        type="button"
                        onClick={() => setAvatarData(undefined)}
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1"
                      >
                        {t('employees.removePhoto', 'إزالة الصورة')}
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {t('employees.photoHint', 'صيغ مدعومة: JPG, PNG, WebP (يتم ضبط وتنسيق الصورة تلقائياً لمقاسات الكارنيه)')}
                  </p>
                </div>
              </div>

              <Input
                label={t('employees.firstNameEn', 'الاسم الأول (بالإنجليزي)')}
                required
                {...register('firstName')}
                error={errors.firstName?.message}
                placeholder="Ahmed"
              />
              <Input
                label={t('employees.lastNameEn', 'اسم العائلة (بالإنجليزي)')}
                required
                {...register('lastName')}
                error={errors.lastName?.message}
                placeholder="Saeed"
              />
              <Input
                label={t('employees.arabicFullName', 'الاسم بالكامل باللغة العربية')}
                {...register('arabicName')}
                placeholder={t('employees.placeholderArabicName', 'أحمد سعيد محمد')}
              />
              <Input
                label={t('employees.nationalId14', 'الرقم القومي (14 رقم)')}
                required
                {...register('nationalId')}
                onChange={handleNationalIdInput}
                error={errors.nationalId?.message}
                placeholder="29805121234567"
              />
              <Input
                label={t('employees.dateOfBirth', 'تاريخ الميلاد')}
                type="date"
                required
                {...register('dateOfBirth')}
                error={errors.dateOfBirth?.message}
              />
              <Select
                label={t('employees.genderLabel', 'النوع')}
                required
                {...register('gender')}
                options={[
                  { value: 'male', label: t('employees.genderMale', 'ذكر') },
                  { value: 'female', label: t('employees.genderFemale', 'أنثى') },
                ]}
              />
              <Input
                label={t('employees.nationalityLabel', 'الجنسية')}
                required
                {...register('nationality')}
                error={errors.nationality?.message}
                placeholder={t('employees.nationalityPlaceholder', 'مصري')}
              />
            </div>
          )}

          {/* STEP 2: Contact Information */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
              <Input
                label={t('employees.emailOptional', 'البريد الإلكتروني (اختياري)')}
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="name@company.com"
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              />
              <Input
                label={t('employees.phoneOptional', 'رقم الهاتف المحمول (اختياري)')}
                {...register('phone')}
                error={errors.phone?.message}
                placeholder="+20 10 1234 5678"
                leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
              />
              <div className="md:col-span-2">
                <Input
                  label={t('employees.addressOptional', 'محل الإقامة / العنوان الحالي (اختياري)')}
                  {...register('address')}
                  error={errors.address?.message}
                  placeholder={t('employees.addressPlaceholder', 'مدينة السادات، المنوفية، مصر')}
                  leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Employment Information */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
              <Select
                label={t('employees.departmentLabel', 'القسم / الإدارة')}
                required
                {...register('departmentId')}
                options={departments.map(d => ({ value: d.id, label: `${d.name} (${d.code})` }))}
              />
              <Select
                label={t('employees.positionLabel', 'المسمى الوظيفي')}
                required
                {...register('positionId')}
                options={availablePositions.map(p => ({ value: p.id, label: `${p.title} (${p.level})` }))}
              />
              <Select
                label={t('employees.employmentTypeLabel', 'نوع التوظيف')}
                required
                {...register('employmentType')}
                options={[
                  { value: 'full_time', label: t('employees.typeFullTime', 'دوام كامل') },
                  { value: 'part_time', label: t('employees.typePartTime', 'دوام جزئي') },
                  { value: 'contract', label: t('employees.typeFixedContract', 'عقد محدد المدة') },
                  { value: 'contractor', label: t('employees.typeContractor', 'مقاول / خارجي') },
                  { value: 'intern', label: t('employees.typeInternship', 'تدريب') },
                ]}
              />
              <Select
                label={t('employees.employmentStatusLabel', 'حالة التوظيف')}
                required
                {...register('employmentStatus')}
                options={[
                  { value: 'active', label: t('employees.statusActiveConfirmed', 'نشط / مثبت') },
                  { value: 'probation', label: t('employees.statusProbation', 'تحت الاختبار') },
                  { value: 'on_leave', label: t('common.onLeave', 'في إجازة') },
                  { value: 'suspended', label: t('common.suspended', 'موقوف') },
                  { value: 'terminated', label: t('common.terminated', 'منتهي الخدمة') },
                ]}
              />
              <Input
                label={t('employees.hireDateLabel', 'تاريخ التعيين')}
                type="date"
                required
                {...register('hireDate')}
                error={errors.hireDate?.message}
              />
              <Input
                label={t('employees.workLocationLabel', 'مقر العمل')}
                required
                {...register('workLocation')}
                error={errors.workLocation?.message}
                placeholder={t('employees.workLocationPlaceholder', 'مصنع السادات - New Hope Sadat')}
              />
              <Input
                label={t('employees.basicSalaryEgp', 'الراتب الأساسي (ج.م / شهرياً)')}
                type="number"
                required
                {...register('basicSalary')}
                error={errors.basicSalary?.message}
              />
              <Input
                label={t('employees.housingAllowanceEgp', 'بدل السكن (ج.م)')}
                type="number"
                {...register('housingAllowance')}
              />
              <Input
                label={t('employees.transportAllowanceEgp', 'بدل الانتقال (ج.م)')}
                type="number"
                {...register('transportAllowance')}
              />
            </div>
          )}

          {/* STEP 4: Emergency Contact */}
          {currentStep === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
              <div className="md:col-span-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                {t('employees.emergencyNotice', 'بيانات الطوارئ اختيارية للرجوع إليها في الحالات العاجلة ويمكن استكمالها أو تعديلها في أي وقت.')}
              </div>
              <Input
                label={t('employees.emergencyNameOptional', 'اسم شخص للاتصال به للطوارئ (اختياري)')}
                {...register('emergencyName')}
                placeholder={t('employees.emergencyNamePlaceholder', 'مثال: محمد سعيد (الأخ / الأب)')}
              />
              <Input
                label={t('employees.emergencyRelOptional', 'صلة القرابة (اختياري)')}
                {...register('emergencyRelationship')}
                placeholder={t('employees.emergencyRelPlaceholder', 'أخ / والد / زوجة')}
              />
              <div className="md:col-span-2">
                <Input
                  label={t('employees.emergencyPhoneOptional', 'رقم هاتف الطوارئ (اختياري)')}
                  {...register('emergencyPhone')}
                  placeholder="+20 10 9876 5432"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Required Documents Check & Insurance */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/40 rounded-xl text-xs text-brand-900 dark:text-[#38BDF8] flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-brand-600 dark:text-[#38BDF8] shrink-0 mt-0.5" />
                <span>
                  {t('employees.insuranceNotice', 'حدد مسوغات التعيين والموقف التأميني للموظف. يتم حساب الحصص التأمينية تلقائياً وفقاً لقانون التأمينات المصري.')}
                </span>
              </div>

              {/* Document Status Toggles */}
              <div className="rounded-xl border border-slate-200 dark:border-[#1E293B] p-3 bg-white dark:bg-[#111827]/50 space-y-2">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                  <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('employees.requiredDocsTitle', 'مسوغات التعيين الأساسية المستلمة:')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center justify-between p-2.5 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151D2E]/60 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1E293B]/70 cursor-pointer">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{t('employees.docNationalIdCopy', 'صورة بطاقة الرقم القومي')}</span>
                    <select
                      className="text-xs border border-slate-300 dark:border-[#1E293B] rounded px-2 py-1 bg-white dark:bg-[#0B0F19] font-semibold text-slate-800 dark:text-[#F8FAFC]"
                      {...register('idCardStatus')}
                    >
                      <option value="available">{t('employees.docStatusAvailable', 'مستوفاة ✓')}</option>
                      <option value="missing">{t('employees.docStatusMissing', 'غير مستوفاة ✕')}</option>
                    </select>
                  </label>

                  <label className="flex items-center justify-between p-2.5 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151D2E]/60 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1E293B]/70 cursor-pointer">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{t('employees.docQualificationOriginal', 'أصل شهادة المؤهل الدراسي')}</span>
                    <select
                      className="text-xs border border-slate-300 dark:border-[#1E293B] rounded px-2 py-1 bg-white dark:bg-[#0B0F19] font-semibold text-slate-800 dark:text-[#F8FAFC]"
                      {...register('qualificationCertificateStatus')}
                    >
                      <option value="available">{t('employees.docStatusAvailable', 'مستوفاة ✓')}</option>
                      <option value="missing">{t('employees.docStatusMissing', 'غير مستوفاة ✕')}</option>
                    </select>
                  </label>

                  <label className="flex items-center justify-between p-2.5 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151D2E]/60 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1E293B]/70 cursor-pointer">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{t('employees.docBirthCertOriginal', 'أصل شهادة الميلاد')}</span>
                    <select
                      className="text-xs border border-slate-300 dark:border-[#1E293B] rounded px-2 py-1 bg-white dark:bg-[#0B0F19] font-semibold text-slate-800 dark:text-[#F8FAFC]"
                      {...register('birthCertificateStatus')}
                    >
                      <option value="available">{t('employees.docStatusAvailable', 'مستوفاة ✓')}</option>
                      <option value="missing">{t('employees.docStatusMissing', 'غير مستوفاة ✕')}</option>
                    </select>
                  </label>

                  <label className="flex items-center justify-between p-2.5 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151D2E]/60 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1E293B]/70 cursor-pointer">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{t('employees.docContractSigned', 'عقد العمل الموقع')}</span>
                    <select
                      className="text-xs border border-slate-300 dark:border-[#1E293B] rounded px-2 py-1 bg-white dark:bg-[#0B0F19] font-semibold text-slate-800 dark:text-[#F8FAFC]"
                      {...register('contractDocStatus')}
                    >
                      <option value="available">{t('employees.docStatusAvailable', 'مستوفاة ✓')}</option>
                      <option value="missing">{t('employees.docStatusMissing', 'غير مستوفاة ✕')}</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* Insurance Details Section */}
              <div className="rounded-xl border border-slate-200 dark:border-[#1E293B] p-3 bg-white dark:bg-[#111827]/50 space-y-3">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-[#38BDF8]" />
                  <span>{t('employees.socialInsuranceTitle', 'الموقف من التأمينات الاجتماعية (الهيئة القومية للتأمين الاجتماعي):')}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Select
                    label={t('employees.insuranceStatusLabel', 'الحالة التأمينية')}
                    {...register('insuranceStatus')}
                    options={[
                      { value: 'insured', label: t('employees.insuredRegular', 'مؤمن عليه (نظامي)') },
                      { value: 'not_insured', label: t('employees.notInsured', 'غير مؤمن عليه') },
                    ]}
                  />

                  {watch('insuranceStatus') === 'insured' && (
                    <>
                      <Input
                        label={t('employees.insuranceNoOptional', 'الرقم التأميني (اختياري)')}
                        {...register('insuranceNumber')}
                        placeholder="12345678"
                      />
                      <Input
                        label={t('employees.insuranceWageEgp', 'أجر الاشتراك التأميني (ج.م)')}
                        type="number"
                        {...register('insuranceSalary')}
                        placeholder="4325"
                      />
                    </>
                  )}
                </div>

                {watch('insuranceStatus') === 'insured' && (
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-lg p-2.5 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between flex-wrap gap-2">
                    <span>
                      {t('employees.workerShareText', 'حصة العامل المستقطعة (11%):')}{' '}
                      <strong className="font-bold">
                        {(Number(watch('insuranceSalary') || watch('basicSalary') || 4325) * 0.11).toFixed(2)}{' '}
                        {t('common.egp', 'ج.م')}
                      </strong>
                    </span>
                    <span>
                      {t('employees.companyShareText', 'حصة المنشأة / الشركة (18.75%):')}{' '}
                      <strong className="font-bold">
                        {(Number(watch('insuranceSalary') || watch('basicSalary') || 4325) * 0.1875).toFixed(2)}{' '}
                        {t('common.egp', 'ج.م')}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: Review & Confirmation */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50/70 dark:bg-[#111827]/60 p-4 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E293B] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-[#1E293B] overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                      {avatarData ? (
                        <img src={avatarData} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-[#F8FAFC] text-sm">
                        {formValues.arabicName || `${formValues.firstName} ${formValues.lastName}`}
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {formValues.firstName} {formValues.lastName} • {formValues.nationality}
                      </p>
                    </div>
                  </div>
                  <div className="ltr:text-left rtl:text-right font-mono text-[11px] bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-[#38BDF8] px-2.5 py-1 rounded-md border border-brand-200 dark:border-brand-800/40 font-semibold">
                    {initialData
                      ? t('employees.empCodeLabel', {
                          code: initialData.employeeId,
                          defaultValue: `كود الموظف: ${initialData.employeeId}`,
                        })
                      : t('employees.empCodeAutoGenerated', 'الكود: سيولد تلقائياً في السيرفر')}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{t('employees.nationalIdShort', 'الرقم القومي')}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{formValues.nationalId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{t('employees.dateOfBirth', 'تاريخ الميلاد')}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formValues.dateOfBirth} ({formValues.gender === 'female' ? t('employees.genderFemale', 'أنثى') : t('employees.genderMale', 'ذكر')})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{t('employees.hireDateLabel', 'تاريخ التعيين')}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formValues.hireDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{t('employees.departmentLabel', 'الإدارة / القسم')}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {departments.find(d => d.id === formValues.departmentId)?.name || t('common.department', 'القسم')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{t('employees.positionLabel', 'المسمى الوظيفي')}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {allPositions.find(p => p.id === formValues.positionId)?.title || t('common.position', 'الوظيفة')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{t('employees.workLocationLabel', 'مقر العمل')}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formValues.workLocation}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{t('employees.basicSalaryLabel', 'الراتب الأساسي')}:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {Number(formValues.basicSalary || 0).toLocaleString()} {t('common.egp', 'ج.م')} {t('common.perMonth', '/ شهرياً')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{t('employees.insuranceStatus', 'الموقف التأميني')}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formValues.insuranceStatus === 'insured'
                        ? t('employees.insuredChecked', 'مؤمن عليه ✓')
                        : t('employees.notInsured', 'غير مؤمن عليه')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{t('employees.idCardStatusLabel', 'بطاقة الرقم القومي')}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formValues.idCardStatus === 'available'
                        ? t('employees.docStatusAvailable', 'مستوفاة ✓')
                        : t('employees.docStatusMissingShort', 'ناقصة ✕')}
                    </span>
                  </div>
                </div>

                <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg p-2.5 text-[11px] text-amber-900 dark:text-amber-300">
                  {t('employees.reviewNotice', 'يرجى مراجعة البيانات أعلاه بعناية قبل التأكيد. عند الضغط على الزر الأخضر بالأسفل، سيتم حفظ السجل وتحديث قاعدة البيانات فوراً.')}
                </div>
              </div>
            </div>
          )}

          {/* Wizard Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#1E293B]">
            <div>
              {currentStep > 1 ? (
                <Button
                  key="prev-btn"
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                >
                  <ArrowRight className="w-3.5 h-3.5 ml-1 rtl:rotate-0 ltr:rotate-180" />
                  {t('common.back', 'السابق')}
                </Button>
              ) : (
                <Button key="draft-btn" variant="ghost" size="sm" type="button" onClick={handleSaveDraft}>
                  {t('employees.saveDraft', 'حفظ كمسودة')}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button key="cancel-btn" variant="secondary" size="sm" type="button" onClick={onClose}>
                {t('common.cancel', 'إلغاء')}
              </Button>

              {currentStep < 6 ? (
                <Button
                  key="next-btn"
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={handleNext}
                >
                  <span>{t('common.next', 'التالي')}</span>
                  <ArrowLeft className="w-3.5 h-3.5 mr-1 rtl:rotate-0 ltr:rotate-180" />
                </Button>
              ) : (
                <Button
                  key="submit-btn"
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={() => handleSubmit(onFormSubmit)()}
                  isLoading={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5"
                >
                  <Check className="w-4 h-4 ml-1.5 inline" />
                  {initialData
                    ? t('employees.submitEditEmployee', 'حفظ تعديلات الموظف')
                    : t('employees.submitAddEmployee', 'تأكيد وإتمام تسجيل الموظف')}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
