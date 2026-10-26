import { CompanySettings } from '../types';
import newHopeLogo from '../assets/new-hope-logo.png';
import { auditService } from './auditService';
import { apiClient } from './apiClient';

export interface LeavePolicyRule {
  type: string;
  name: string;
  annualDays: number;
  carryOverMax: number;
  paidPercentage: number;
  requireMedicalCertificate: boolean;
}

export interface DocRequirementRule {
  id: string;
  docType: string;
  name: string;
  mandatoryForInsurance: boolean;
  requiredOnboardingDays: number;
  hasExpiration: boolean;
}

export const defaultCompanySettings: CompanySettings = {
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

export const defaultLeavePolicies: LeavePolicyRule[] = [
  { type: 'annual', name: 'Annual Paid Vacation', annualDays: 30, carryOverMax: 10, paidPercentage: 100, requireMedicalCertificate: false },
  { type: 'sick', name: 'Sick Leave (Statutory)', annualDays: 15, carryOverMax: 0, paidPercentage: 100, requireMedicalCertificate: true },
  { type: 'emergency', name: 'Casual Emergency Leave', annualDays: 5, carryOverMax: 0, paidPercentage: 100, requireMedicalCertificate: false },
  { type: 'maternity', name: 'Maternity Leave', annualDays: 70, carryOverMax: 0, paidPercentage: 100, requireMedicalCertificate: true },
  { type: 'unpaid', name: 'Unpaid Extended Leave', annualDays: 30, carryOverMax: 0, paidPercentage: 0, requireMedicalCertificate: false },
];

export const defaultDocumentRequirements: DocRequirementRule[] = [
  { id: 'dr-1', docType: 'national_id', name: 'National ID / Resident Iqama Copy', mandatoryForInsurance: true, requiredOnboardingDays: 3, hasExpiration: true },
  { id: 'dr-2', docType: 'birth_certificate', name: 'Certified Birth Certificate', mandatoryForInsurance: true, requiredOnboardingDays: 14, hasExpiration: false },
  { id: 'dr-3', docType: 'qualification', name: 'Attested Academic Degree / Qualification', mandatoryForInsurance: true, requiredOnboardingDays: 30, hasExpiration: false },
  { id: 'dr-4', docType: 'contract', name: 'Fully Signed Labor Contract (Qiwa Certified)', mandatoryForInsurance: true, requiredOnboardingDays: 7, hasExpiration: true },
  { id: 'dr-5', docType: 'medical', name: 'Pre-Employment Occupational Health Screening', mandatoryForInsurance: false, requiredOnboardingDays: 10, hasExpiration: true },
  { id: 'dr-6', docType: 'passport', name: 'Valid Passport Bio-page', mandatoryForInsurance: false, requiredOnboardingDays: 7, hasExpiration: true },
];

const STORAGE_KEY = 'new_hope_company_settings';

const loadSavedSettings = (): CompanySettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.companyName && (parsed.companyName.includes('Apex') || parsed.companyName === '')) {
        parsed.companyName = defaultCompanySettings.companyName;
      }
      if (parsed.companyNameAr && (parsed.companyNameAr.includes('أبيكس') || parsed.companyNameAr === '')) {
        parsed.companyNameAr = defaultCompanySettings.companyNameAr;
      }
      if (!parsed.logo) {
        parsed.logo = defaultCompanySettings.logo;
      }
      return { ...defaultCompanySettings, ...parsed };
    }
  } catch (err) {
    console.error('Error loading company settings from localStorage:', err);
  }
  return { ...defaultCompanySettings };
};

let settingsState: CompanySettings = loadSavedSettings();
let policiesState = [...defaultLeavePolicies];
let reqsState = [...defaultDocumentRequirements];

export const settingsService = {
  async getCompanySettings(): Promise<CompanySettings> {
    if (apiClient.isBackendAvailable()) {
      try {
        const res = await apiClient.get<any>('/settings');
        const data = res?.data || res;
        if (data && (data.companyName || data.companyNameAr)) {
          settingsState = { ...settingsState, ...data };
          return { ...settingsState };
        }
      } catch (err) {
        console.warn('Backend /settings unavailable, using local settings:', err);
      }
    }
    await new Promise(res => setTimeout(res, 20));
    return { ...settingsState };
  },

  getCompanySettingsSync(): CompanySettings {
    return { ...settingsState };
  },

  async updateCompanySettings(updates: Partial<CompanySettings>): Promise<CompanySettings> {
    if (apiClient.isBackendAvailable()) {
      try {
        await apiClient.put('/settings', updates);
      } catch (err) {
        console.warn('Backend PUT /settings failed, saved locally:', err);
      }
    }
    await new Promise(res => setTimeout(res, 40));
    settingsState = { ...settingsState, ...updates };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsState));
      window.dispatchEvent(new CustomEvent('company_settings_updated', { detail: settingsState }));
      auditService.logAction({
        userName: 'Khaled Mossad',
        userRole: 'System Administrator',
        action: 'Updated Company Identity & Settings',
        module: 'System Settings',
        target: updates.companyName || updates.companyNameAr || 'Company Profile',
        status: 'success',
        details: updates,
      }).catch(() => {});
    } catch (err) {
      console.error('Error saving company settings to localStorage:', err);
    }
    return { ...settingsState };
  },

  async resetCompanySettings(): Promise<CompanySettings> {
    localStorage.removeItem(STORAGE_KEY);
    settingsState = { ...defaultCompanySettings };
    window.dispatchEvent(new CustomEvent('company_settings_updated', { detail: settingsState }));
    return { ...settingsState };
  },

  async getLeavePolicies(): Promise<LeavePolicyRule[]> {
    await new Promise(res => setTimeout(res, 30));
    return [...policiesState];
  },

  async getDocumentRequirements(): Promise<DocRequirementRule[]> {
    await new Promise(res => setTimeout(res, 30));
    return [...reqsState];
  },
};
