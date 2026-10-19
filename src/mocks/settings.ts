import { CompanySettings } from '../types';

export const mockCompanySettings: CompanySettings = {
  companyName: 'Apex Enterprise Solutions Co.',
  companyNameAr: 'شركة قمة الحلول للمشاريع المحدودة',
  companyNameZh: '顶峰企业解决方案有限公司',
  taxRegistrationNumber: '310984729100003',
  crNumber: '1010892341',
  companyEmail: 'hr-support@apex-enterprise.com',
  companyPhone: '+966 11 482 9000',
  country: 'Saudi Arabia',
  city: 'Riyadh',
  address: 'King Fahd Road, Al-Nakheel Tower, Level 18, Riyadh 12381',
  fiscalYearStart: 'January',
  workingDaysPerWeek: 5,
  probationPeriodMonths: 3,
  noticePeriodDays: 60,
  defaultAnnualLeaveDays: 30,
  autoAttendanceCheckout: true,
};

export interface LeavePolicyRule {
  type: string;
  name: string;
  annualDays: number;
  carryOverMax: number;
  paidPercentage: number;
  requireMedicalCertificate: boolean;
}

export const mockLeavePolicies: LeavePolicyRule[] = [
  { type: 'annual', name: 'Annual Paid Vacation', annualDays: 30, carryOverMax: 10, paidPercentage: 100, requireMedicalCertificate: false },
  { type: 'sick', name: 'Sick Leave (Statutory)', annualDays: 15, carryOverMax: 0, paidPercentage: 100, requireMedicalCertificate: true },
  { type: 'emergency', name: 'Casual Emergency Leave', annualDays: 5, carryOverMax: 0, paidPercentage: 100, requireMedicalCertificate: false },
  { type: 'maternity', name: 'Maternity Leave', annualDays: 70, carryOverMax: 0, paidPercentage: 100, requireMedicalCertificate: true },
  { type: 'unpaid', name: 'Unpaid Extended Leave', annualDays: 30, carryOverMax: 0, paidPercentage: 0, requireMedicalCertificate: false },
];

export interface DocRequirementRule {
  id: string;
  docType: string;
  name: string;
  mandatoryForInsurance: boolean;
  requiredOnboardingDays: number;
  hasExpiration: boolean;
}

export const mockDocumentRequirements: DocRequirementRule[] = [
  { id: 'dr-1', docType: 'national_id', name: 'National ID / Resident Iqama Copy', mandatoryForInsurance: true, requiredOnboardingDays: 3, hasExpiration: true },
  { id: 'dr-2', docType: 'birth_certificate', name: 'Certified Birth Certificate', mandatoryForInsurance: true, requiredOnboardingDays: 14, hasExpiration: false },
  { id: 'dr-3', docType: 'qualification', name: 'Attested Academic Degree / Qualification', mandatoryForInsurance: true, requiredOnboardingDays: 30, hasExpiration: false },
  { id: 'dr-4', docType: 'contract', name: 'Fully Signed Labor Contract (Qiwa Certified)', mandatoryForInsurance: true, requiredOnboardingDays: 7, hasExpiration: true },
  { id: 'dr-5', docType: 'medical', name: 'Pre-Employment Occupational Health Screening', mandatoryForInsurance: false, requiredOnboardingDays: 10, hasExpiration: true },
  { id: 'dr-6', docType: 'passport', name: 'Valid Passport Bio-page', mandatoryForInsurance: false, requiredOnboardingDays: 7, hasExpiration: true },
];
