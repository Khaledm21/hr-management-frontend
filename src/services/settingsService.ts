import { CompanySettings } from '../types';
import {
  mockCompanySettings,
  mockLeavePolicies,
  mockDocumentRequirements,
  LeavePolicyRule,
  DocRequirementRule,
} from '../mocks/settings';

let settingsState = { ...mockCompanySettings };
let policiesState = [...mockLeavePolicies];
let reqsState = [...mockDocumentRequirements];

export const settingsService = {
  async getCompanySettings(): Promise<CompanySettings> {
    await new Promise(res => setTimeout(res, 30));
    return { ...settingsState };
  },

  async updateCompanySettings(updates: Partial<CompanySettings>): Promise<CompanySettings> {
    await new Promise(res => setTimeout(res, 60));
    settingsState = { ...settingsState, ...updates };
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
