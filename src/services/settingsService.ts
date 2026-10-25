import { CompanySettings } from '../types';
import {
  mockCompanySettings,
  mockLeavePolicies,
  mockDocumentRequirements,
  LeavePolicyRule,
  DocRequirementRule,
} from '../mocks/settings';
import { auditService } from './auditService';
import { apiClient } from './apiClient';

const STORAGE_KEY = 'new_hope_company_settings';

const loadSavedSettings = (): CompanySettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Clean up legacy mock names if present
      if (parsed.companyName && (parsed.companyName.includes('Apex') || parsed.companyName === '')) {
        parsed.companyName = mockCompanySettings.companyName;
      }
      if (parsed.companyNameAr && (parsed.companyNameAr.includes('أبيكس') || parsed.companyNameAr === '')) {
        parsed.companyNameAr = mockCompanySettings.companyNameAr;
      }
      if (!parsed.logo) {
        parsed.logo = mockCompanySettings.logo;
      }
      return { ...mockCompanySettings, ...parsed };
    }
  } catch (err) {
    console.error('Error loading company settings from localStorage:', err);
  }
  return { ...mockCompanySettings };
};

let settingsState: CompanySettings = loadSavedSettings();
let policiesState = [...mockLeavePolicies];
let reqsState = [...mockDocumentRequirements];

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
    settingsState = { ...mockCompanySettings };
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
