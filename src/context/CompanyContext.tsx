import React, { createContext, useContext, useState, useEffect } from 'react';
import { CompanySettings } from '../types';
import { settingsService } from '../services/settingsService';
import { useDirection } from './DirectionContext';
import defaultLogo from '../assets/new-hope-logo.png';

interface CompanyContextType {
  settings: CompanySettings;
  companyName: string;
  logo: string;
  updateSettings: (updates: Partial<CompanySettings>) => Promise<CompanySettings>;
  resetToDefault: () => Promise<CompanySettings>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useDirection();
  const [settings, setSettings] = useState<CompanySettings>(settingsService.getCompanySettingsSync());

  useEffect(() => {
    // Initial fetch
    settingsService.getCompanySettings().then(setSettings);

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setSettings({ ...e.detail });
      } else {
        settingsService.getCompanySettings().then(setSettings);
      }
    };

    window.addEventListener('company_settings_updated', handleUpdate);
    return () => window.removeEventListener('company_settings_updated', handleUpdate);
  }, []);

  const updateSettings = async (updates: Partial<CompanySettings>) => {
    const updated = await settingsService.updateCompanySettings(updates);
    setSettings(updated);
    return updated;
  };

  const resetToDefault = async () => {
    const fresh = await settingsService.resetCompanySettings();
    setSettings(fresh);
    return fresh;
  };

  const companyName =
    language === 'ar'
      ? settings.companyNameAr || settings.companyName
      : language === 'zh-CN'
      ? settings.companyNameZh || settings.companyName
      : settings.companyName;

  const logo = settings.logo || defaultLogo;

  return (
    <CompanyContext.Provider value={{ settings, companyName, logo, updateSettings, resetToDefault }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
