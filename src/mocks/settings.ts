import { CompanySettings } from '../types';
import newHopeLogo from '../assets/new-hope-logo.png';

export const mockCompanySettings: CompanySettings = {
  companyName: 'NEW HOPE EGYPT AQUATIC TECHNOLOGY CO., LTD',
  companyNameAr: 'نيو هوب ايجيبت اكوتك تكنولوجي المحدودة',
  companyNameZh: '新希望埃及水产科技有限责任公司',
  logo: newHopeLogo,
  taxRegistrationNumber: '542-891-304',
  crNumber: '421980',
  companyEmail: 'hr-egypt@newhope.com',
  companyPhone: '+20 48 260 8888',
  country: 'Egypt',
  city: 'Sadat City',
  address: 'Sadat City, Second Industrial Zone, Block 14, Menofia, Egypt',
  fiscalYearStart: 'January',
  workingDaysPerWeek: 6,
  probationPeriodMonths: 3,
  noticePeriodDays: 60,
  defaultAnnualLeaveDays: 21,
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
