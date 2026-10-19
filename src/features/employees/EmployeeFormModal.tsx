import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { useDepartments, usePositions } from '../../hooks/queries';
import { Employee } from '../../types';
import { Check, User, Mail, Phone, MapPin, Briefcase, FileText, AlertCircle } from 'lucide-react';

const employeeSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  arabicName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 characters'),
  nationalId: z.string().min(9, 'National ID/Iqama must be at least 9 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female']),
  nationality: z.string().min(2, 'Nationality is required'),
  address: z.string().min(4, 'Residential address is required'),
  emergencyName: z.string().min(2, 'Emergency contact name is required'),
  emergencyRelationship: z.string().min(2, 'Relationship is required'),
  emergencyPhone: z.string().min(8, 'Emergency phone is required'),
  departmentId: z.string().min(1, 'Department is required'),
  positionId: z.string().min(1, 'Position is required'),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'contractor', 'intern']),
  employmentStatus: z.enum(['active', 'probation']),
  hireDate: z.string().min(1, 'Hire date is required'),
  basicSalary: z.coerce.number().min(3000, 'Basic salary must be at least 3,000'),
  housingAllowance: z.coerce.number().min(0),
  transportAllowance: z.coerce.number().min(0),
  workLocation: z.string().min(2, 'Work location is required'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Employee>) => Promise<void>;
  initialData?: Employee | null;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, info } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: initialData
      ? {
          firstName: initialData.firstName,
          lastName: initialData.lastName,
          arabicName: initialData.arabicName || '',
          email: initialData.email,
          phone: initialData.phone,
          nationalId: initialData.nationalId,
          dateOfBirth: initialData.dateOfBirth,
          gender: initialData.gender,
          nationality: initialData.nationality,
          address: initialData.address,
          emergencyName: initialData.emergencyContact?.name || '',
          emergencyRelationship: initialData.emergencyContact?.relationship || '',
          emergencyPhone: initialData.emergencyContact?.phone || '',
          departmentId: initialData.departmentId,
          positionId: initialData.positionId,
          employmentType: initialData.employmentType,
          employmentStatus: initialData.employmentStatus === 'probation' ? 'probation' : 'active',
          hireDate: initialData.hireDate,
          basicSalary: initialData.basicSalary,
          housingAllowance: initialData.housingAllowance,
          transportAllowance: initialData.transportAllowance,
          workLocation: initialData.workLocation,
        }
      : {
          gender: 'male',
          nationality: 'Saudi',
          employmentType: 'full_time',
          employmentStatus: 'probation',
          departmentId: 'dept-1',
          positionId: 'pos-04',
          workLocation: 'Riyadh HQ - Floor 4',
          basicSalary: 14000,
          housingAllowance: 3500,
          transportAllowance: 1400,
          hireDate: new Date().toISOString().split('T')[0],
          dateOfBirth: '1995-05-15',
        },
  });

  const { data: departments = [] } = useDepartments();
  const { data: allPositions = [] } = usePositions();

  const selectedDeptId = watch('departmentId');
  const availablePositions = allPositions.filter(p => !selectedDeptId || p.departmentId === selectedDeptId);

  const steps = [
    { number: 1, title: 'Personal Information' },
    { number: 2, title: 'Contact Information' },
    { number: 3, title: 'Employment & Role' },
    { number: 4, title: 'Emergency Contact' },
    { number: 5, title: 'Required Documents' },
    { number: 6, title: 'Review & Submit' },
  ];

  const handleNext = async () => {
    let fieldsToValidate: (keyof EmployeeFormData)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['firstName', 'lastName', 'nationalId', 'dateOfBirth', 'gender', 'nationality'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['email', 'phone', 'address'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['departmentId', 'positionId', 'employmentType', 'hireDate', 'basicSalary', 'workLocation'];
    } else if (currentStep === 4) {
      fieldsToValidate = ['emergencyName', 'emergencyRelationship', 'emergencyPhone'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSaveDraft = () => {
    info('Employee onboarding draft saved locally.');
    onClose();
  };

  const onFormSubmit = async (data: EmployeeFormData) => {
    setIsSubmitting(true);
    try {
      const selectedDept = departments.find(d => d.id === data.departmentId);
      const selectedPos = allPositions.find(p => p.id === data.positionId);

      await onSubmit({
        firstName: data.firstName,
        lastName: data.lastName,
        arabicName: data.arabicName,
        email: data.email,
        phone: data.phone,
        nationalId: data.nationalId,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        nationality: data.nationality,
        address: data.address,
        emergencyContact: {
          name: data.emergencyName,
          relationship: data.emergencyRelationship,
          phone: data.emergencyPhone,
        },
        departmentId: data.departmentId,
        departmentName: selectedDept?.name || 'Department',
        positionId: data.positionId,
        positionTitle: selectedPos?.title || 'Position',
        employmentType: data.employmentType,
        employmentStatus: data.employmentStatus,
        hireDate: data.hireDate,
        workLocation: data.workLocation,
        basicSalary: data.basicSalary,
        housingAllowance: data.housingAllowance,
        transportAllowance: data.transportAllowance,
      });

      success(
        initialData ? 'Employee profile updated successfully.' : 'New employee registered successfully.',
        'Record Saved'
      );
      reset();
      setCurrentStep(1);
      onClose();
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
      title={initialData ? 'Edit Employee Record' : 'Register New Employee'}
      description="Multi-stage onboarding wizard with document checklist and verification"
    >
      <div className="space-y-6">
        {/* Step Progress Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 overflow-x-auto">
          {steps.map(step => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;

            return (
              <div key={step.number} className="flex items-center gap-2 shrink-0">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                </div>
                <span
                  className={`text-xs hidden md:inline font-medium ${
                    isCurrent ? 'text-slate-900 font-semibold' : 'text-slate-500'
                  }`}
                >
                  {step.title}
                </span>
                {step.number < steps.length && (
                  <div className="w-4 sm:w-6 h-0.5 bg-slate-200 mx-1 hidden sm:block" />
                )}
              </div>
            );
          })}
        </div>

        {/* Wizard Form Content */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* STEP 1: Personal Information */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
              <Input
                label="First Name (English)"
                required
                {...register('firstName')}
                error={errors.firstName?.message}
                placeholder="e.g. Omar"
              />
              <Input
                label="Last Name (English)"
                required
                {...register('lastName')}
                error={errors.lastName?.message}
                placeholder="e.g. Al-Zahrani"
              />
              <Input
                label="Full Arabic Name (الاسم باللغة العربية)"
                {...register('arabicName')}
                placeholder="مثال: عمر بن خالد الزهراني"
              />
              <Input
                label="National ID / Iqama Number"
                required
                {...register('nationalId')}
                error={errors.nationalId?.message}
                placeholder="10-digit civil number"
              />
              <Input
                label="Date of Birth"
                type="date"
                required
                {...register('dateOfBirth')}
                error={errors.dateOfBirth?.message}
              />
              <Select
                label="Gender"
                required
                {...register('gender')}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                ]}
              />
              <Input
                label="Nationality"
                required
                {...register('nationality')}
                error={errors.nationality?.message}
                placeholder="e.g. Saudi"
              />
            </div>
          )}

          {/* STEP 2: Contact Information */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
              <Input
                label="Corporate Email Address"
                type="email"
                required
                {...register('email')}
                error={errors.email?.message}
                placeholder="name@enterprise.com"
                leftIcon={<Mail className="w-4 h-4" />}
              />
              <Input
                label="Mobile Phone Number"
                required
                {...register('phone')}
                error={errors.phone?.message}
                placeholder="+966 50 123 4567"
                leftIcon={<Phone className="w-4 h-4" />}
              />
              <div className="md:col-span-2">
                <Input
                  label="Residential Address (National Address)"
                  required
                  {...register('address')}
                  error={errors.address?.message}
                  placeholder="Building number, street, district, city, zip code"
                  leftIcon={<MapPin className="w-4 h-4" />}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Employment Information */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
              <Select
                label="Department"
                required
                {...register('departmentId')}
                options={departments.map(d => ({ value: d.id, label: d.name }))}
              />
              <Select
                label="Job Position"
                required
                {...register('positionId')}
                options={availablePositions.map(p => ({ value: p.id, label: `${p.title} (${p.level})` }))}
              />
              <Select
                label="Employment Type"
                required
                {...register('employmentType')}
                options={[
                  { value: 'full_time', label: 'Full Time (دوام كامل)' },
                  { value: 'part_time', label: 'Part Time (دوام جزئي)' },
                  { value: 'contractor', label: 'Contractor (مقاول / متعاقد)' },
                  { value: 'contract', label: 'Fixed Contract (عقد محدد)' },
                  { value: 'intern', label: 'Internship (تدريب)' },
                ]}
              />
              <Select
                label="Employment Status"
                required
                {...register('employmentStatus')}
                options={[
                  { value: 'probation', label: 'Probationary Period (90 Days)' },
                  { value: 'active', label: 'Confirmed Active' },
                ]}
              />
              <Input
                label="Hire Date"
                type="date"
                required
                {...register('hireDate')}
                error={errors.hireDate?.message}
              />
              <Input
                label="Work Location"
                required
                {...register('workLocation')}
                error={errors.workLocation?.message}
                placeholder="Riyadh HQ Floor 4"
              />
              <Input
                label="Basic Salary (SAR / Month)"
                type="number"
                required
                {...register('basicSalary')}
                error={errors.basicSalary?.message}
              />
              <Input
                label="Housing Allowance (SAR)"
                type="number"
                {...register('housingAllowance')}
              />
              <Input
                label="Transport Allowance (SAR)"
                type="number"
                {...register('transportAllowance')}
              />
            </div>
          )}

          {/* STEP 4: Emergency Contact */}
          {currentStep === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
              <Input
                label="Contact Person Name"
                required
                {...register('emergencyName')}
                error={errors.emergencyName?.message}
                placeholder="e.g. Noura Al-Zahrani"
              />
              <Input
                label="Relationship to Employee"
                required
                {...register('emergencyRelationship')}
                error={errors.emergencyRelationship?.message}
                placeholder="e.g. Spouse / Brother / Father"
              />
              <Input
                label="Emergency Contact Phone"
                required
                {...register('emergencyPhone')}
                error={errors.emergencyPhone?.message}
                placeholder="+966 50 987 6543"
              />
            </div>
          )}

          {/* STEP 5: Required Documents Check */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-xs text-brand-900 flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span>
                  Initial documents can be uploaded now or completed during the 14-day onboarding window.
                  Medical and GOSI insurance coverage requires at least National ID and Degree Certificate.
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                {[
                  { name: 'National ID / Resident Iqama Copy', required: true, status: 'Ready for upload' },
                  { name: 'Attested Academic Qualification Certificate', required: true, status: 'Ready for upload' },
                  { name: 'Signed Employment Contract', required: true, status: 'Will auto-generate' },
                  { name: 'Birth Certificate', required: false, status: 'Optional' },
                  { name: 'Pre-Employment Medical Clearance', required: false, status: 'Optional' },
                ].map((doc, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>{doc.name}</span>
                        {doc.required && <span className="text-rose-500 font-bold">*</span>}
                      </div>
                      <span className="text-slate-400 text-[11px]">{doc.status}</span>
                    </div>
                    <Button variant="outline" size="sm" type="button">
                      Attach Mock File
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: Review & Submit */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2">
                  Summary Verification
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block">Full Name:</span>
                    <span className="font-semibold text-slate-800">
                      {formValues.firstName} {formValues.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Email:</span>
                    <span className="font-semibold text-slate-800">{formValues.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">National ID:</span>
                    <span className="font-semibold text-slate-800">{formValues.nationalId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Nationality / Gender:</span>
                    <span className="font-semibold text-slate-800">
                      {formValues.nationality} • {formValues.gender}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Department:</span>
                    <span className="font-semibold text-slate-800">
                      {departments.find(d => d.id === formValues.departmentId)?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Position:</span>
                    <span className="font-semibold text-slate-800">
                      {allPositions.find(p => p.id === formValues.positionId)?.title}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Basic Salary:</span>
                    <span className="font-semibold text-emerald-700">
                      SAR {Number(formValues.basicSalary || 0).toLocaleString()} / month
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Hire Date:</span>
                    <span className="font-semibold text-slate-800">{formValues.hireDate}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div>
              {currentStep > 1 ? (
                <Button variant="outline" size="sm" type="button" onClick={() => setCurrentStep(prev => prev - 1)}>
                  Back
                </Button>
              ) : (
                <Button variant="ghost" size="sm" type="button" onClick={handleSaveDraft}>
                  Save Draft
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                Cancel
              </Button>
              {currentStep < 6 ? (
                <Button variant="primary" size="sm" type="button" onClick={handleNext}>
                  Next Step
                </Button>
              ) : (
                <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
                  Complete Registration
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
