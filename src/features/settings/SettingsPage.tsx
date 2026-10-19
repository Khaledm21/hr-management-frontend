import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Building,
  Calendar,
  FileText,
  Bell,
  Globe,
  Palette,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Tabs } from '../../components/ui/Tabs';
import { settingsService } from '../../services/settingsService';
import { CompanySettings, RoleType } from '../../types';
import { LeavePolicyRule, DocRequirementRule } from '../../mocks/settings';
import { useToast } from '../../components/ui/Toast';
import { useDirection, LanguageCode } from '../../context/DirectionContext';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { success } = useToast();
  const { language, changeLanguage } = useDirection();

  const [activeTab, setActiveTab] = useState('company');
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [leavePolicies, setLeavePolicies] = useState<LeavePolicyRule[]>([]);
  const [docReqs, setDocReqs] = useState<DocRequirementRule[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      settingsService.getCompanySettings(),
      settingsService.getLeavePolicies(),
      settingsService.getDocumentRequirements(),
    ]).then(([cs, lp, dr]) => {
      setCompanySettings(cs);
      setLeavePolicies(lp);
      setDocReqs(dr);
    });
  }, []);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companySettings) return;
    setIsSaving(true);
    try {
      await settingsService.updateCompanySettings(companySettings);
      success('Company profile configuration saved.', 'Settings Updated');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'company', label: t('settings.company'), icon: <Building className="w-4 h-4" /> },
    { id: 'leave', label: t('settings.leavePolicies'), icon: <Calendar className="w-4 h-4" /> },
    { id: 'docs', label: t('settings.docRequirements'), icon: <FileText className="w-4 h-4" /> },
    { id: 'language', label: t('settings.localization'), icon: <Globe className="w-4 h-4" /> },
    { id: 'notifications', label: 'Alert Preferences', icon: <Bell className="w-4 h-4" /> },
    { id: 'appearance', label: 'Theme & Styling', icon: <Palette className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t('settings.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">{t('settings.subtitle')}</p>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Panels */}
      <div className="mt-4">
        {/* COMPANY TAB */}
        {activeTab === 'company' && companySettings && (
          <form onSubmit={handleSaveCompany}>
            <Card>
              <CardHeader>
                <CardTitle>Legal Entity Details & Regulatory Numbers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Company Name (English)"
                    value={companySettings.companyName}
                    onChange={e =>
                      setCompanySettings({ ...companySettings, companyName: e.target.value })
                    }
                  />
                  <Input
                    label="Company Name (Arabic)"
                    value={companySettings.companyNameAr}
                    onChange={e =>
                      setCompanySettings({ ...companySettings, companyNameAr: e.target.value })
                    }
                  />
                  <Input
                    label="Tax Registration Number (VAT TRN)"
                    value={companySettings.taxRegistrationNumber}
                    onChange={e =>
                      setCompanySettings({
                        ...companySettings,
                        taxRegistrationNumber: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Commercial Registration (CR #)"
                    value={companySettings.crNumber}
                    onChange={e =>
                      setCompanySettings({ ...companySettings, crNumber: e.target.value })
                    }
                  />
                  <Input
                    label="Corporate Support Email"
                    value={companySettings.companyEmail}
                    onChange={e =>
                      setCompanySettings({ ...companySettings, companyEmail: e.target.value })
                    }
                  />
                  <Input
                    label="Main Phone"
                    value={companySettings.companyPhone}
                    onChange={e =>
                      setCompanySettings({ ...companySettings, companyPhone: e.target.value })
                    }
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="HQ Address"
                      value={companySettings.address}
                      onChange={e =>
                        setCompanySettings({ ...companySettings, address: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    isLoading={isSaving}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        )}

        {/* LEAVE POLICIES TAB */}
        {activeTab === 'leave' && (
          <Card>
            <CardHeader>
              <CardTitle>Corporate Leave Accruals & Policy Limits</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3 pl-6 rtl:pl-3 rtl:pr-6">Leave Classification</th>
                    <th className="p-3">Annual Entitlement</th>
                    <th className="p-3">Max Carry Over</th>
                    <th className="p-3">Compensation Rate</th>
                    <th className="p-3">Requires Medical Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {leavePolicies.map(lp => (
                    <tr key={lp.type} className="hover:bg-slate-50">
                      <td className="p-3 pl-6 rtl:pl-3 rtl:pr-6 font-semibold text-slate-900">{lp.name}</td>
                      <td className="p-3">{lp.annualDays} Days</td>
                      <td className="p-3">{lp.carryOverMax} Days</td>
                      <td className="p-3 font-semibold text-emerald-700">{lp.paidPercentage}% Full Pay</td>
                      <td className="p-3">{lp.requireMedicalCertificate ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* DOCUMENT REQUIREMENTS TAB */}
        {activeTab === 'docs' && (
          <Card>
            <CardHeader>
              <CardTitle>Mandatory Compliance Checklist for Insurance & Onboarding</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3 pl-6 rtl:pl-3 rtl:pr-6">Required Personnel Document</th>
                    <th className="p-3">Mandatory for GOSI/Medical</th>
                    <th className="p-3">Grace Window (Days)</th>
                    <th className="p-3">Track Expiration Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {docReqs.map(dr => (
                    <tr key={dr.id} className="hover:bg-slate-50">
                      <td className="p-3 pl-6 rtl:pl-3 rtl:pr-6 font-semibold text-slate-900">{dr.name}</td>
                      <td className="p-3">
                        <span className={dr.mandatoryForInsurance ? 'font-bold text-rose-600' : 'text-slate-400'}>
                          {dr.mandatoryForInsurance ? 'Mandatory' : 'Optional'}
                        </span>
                      </td>
                      <td className="p-3">{dr.requiredOnboardingDays} Days</td>
                      <td className="p-3">{dr.hasExpiration ? 'Monitored' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* LANGUAGE / LOCALIZATION TAB */}
        {activeTab === 'language' && (
          <Card>
            <CardHeader>
              <CardTitle>Display Language & Layout Direction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { code: 'en' as LanguageCode, label: 'English', desc: 'Left-to-Right (LTR) default layout', flag: '🇬🇧' },
                  { code: 'ar' as LanguageCode, label: 'العربية', desc: 'Right-to-Left (RTL) Arabic typography', flag: '🇸🇦' },
                  { code: 'zh-CN' as LanguageCode, label: '简体中文', desc: 'Simplified Chinese (LTR) layout', flag: '🇨🇳' },
                ].map(l => (
                  <button
                    key={l.code}
                    onClick={() => {
                      changeLanguage(l.code);
                      success(`Active language switched to ${l.label}.`);
                    }}
                    className={`p-4 rounded-xl border text-left rtl:text-right transition-all cursor-pointer ${
                      language === l.code
                        ? 'border-brand-600 bg-brand-50/70 ring-1 ring-brand-500 font-semibold'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{l.flag}</div>
                    <div className="text-sm font-bold text-slate-900">{l.label}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{l.desc}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* NOTIFICATIONS & APPEARANCE TABS */}
        {activeTab === 'notifications' && (
          <Card>
            <CardHeader>
              <CardTitle>Automated Notification Dispatches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {[
                { title: 'Notify HR when contracts reach 30-day expiration window', enabled: true },
                { title: 'Alert department managers when employee exceeds 3 consecutive absences', enabled: true },
                { title: 'Send monthly payroll reminder to Finance Director 5 days before closing', enabled: true },
                { title: 'Notify employee on document verification or rejection with comments', enabled: true },
              ].map((item, idx) => (
                <label key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <span className="text-slate-800 font-medium">{item.title}</span>
                  <input type="checkbox" defaultChecked={item.enabled} className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4" />
                </label>
              ))}
            </CardContent>
          </Card>
        )}

        {activeTab === 'appearance' && (
          <Card>
            <CardHeader>
              <CardTitle>System Theme & Visual Styling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <p className="text-slate-600">
                The Enterprise HR Management System uses tailored navy-slate enterprise hues with high contrast,
                optimized for readability across thousands of workforce records.
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-600 shadow-sm" title="Brand Primary" />
                <div className="w-8 h-8 rounded-full bg-slate-900 shadow-sm" title="Navy Sidebar" />
                <div className="w-8 h-8 rounded-full bg-emerald-600 shadow-sm" title="Success Emerald" />
                <div className="w-8 h-8 rounded-full bg-amber-500 shadow-sm" title="Warning Amber" />
                <div className="w-8 h-8 rounded-full bg-rose-600 shadow-sm" title="Danger Rose" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
