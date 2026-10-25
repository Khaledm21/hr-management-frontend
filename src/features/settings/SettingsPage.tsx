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
  Upload,
  RotateCcw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Tabs } from '../../components/ui/Tabs';
import { settingsService } from '../../services/settingsService';
import { CompanySettings, RoleType } from '../../types';
import { LeavePolicyRule, DocRequirementRule } from '../../mocks/settings';
import { useToast } from '../../components/ui/Toast';
import { useDirection, LanguageCode } from '../../context/DirectionContext';
import { useCompany } from '../../context/CompanyContext';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { success } = useToast();
  const { language, changeLanguage } = useDirection();
  const { settings, updateSettings, resetToDefault } = useCompany();

  const [activeTab, setActiveTab] = useState('company');
  const [companySettings, setCompanySettings] = useState<CompanySettings>(settings);
  const [leavePolicies, setLeavePolicies] = useState<LeavePolicyRule[]>([]);
  const [docReqs, setDocReqs] = useState<DocRequirementRule[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCompanySettings(settings);
  }, [settings]);

  useEffect(() => {
    Promise.all([
      settingsService.getLeavePolicies(),
      settingsService.getDocumentRequirements(),
    ]).then(([lp, dr]) => {
      setLeavePolicies(lp);
      setDocReqs(dr);
    });
  }, []);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companySettings) return;
    setIsSaving(true);
    try {
      await updateSettings(companySettings);
      success(t('settings.savedSuccess'), t('settings.title'));
    } catch (err) {
      console.error('Failed to update company settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      if (result) {
        setCompanySettings(prev => ({ ...prev, logo: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetToDefaultLogo = async () => {
    const fresh = await resetToDefault();
    setCompanySettings(fresh);
    success(t('settings.savedSuccess'), t('settings.title'));
  };

  const getLeaveName = (lp: LeavePolicyRule) => {
    const key = `settings.leave_${lp.type}`;
    const trans = t(key);
    return trans && trans !== key ? trans : lp.name;
  };

  const getDocName = (dr: DocRequirementRule) => {
    const key = `settings.doc_${dr.docType}`;
    const trans = t(key);
    return trans && trans !== key ? trans : dr.name;
  };

  const tabs = [
    { id: 'company', label: t('settings.company'), icon: <Building className="w-4 h-4" /> },
    { id: 'leave', label: t('settings.leavePolicies'), icon: <Calendar className="w-4 h-4" /> },
    { id: 'docs', label: t('settings.docRequirements'), icon: <FileText className="w-4 h-4" /> },
    { id: 'language', label: t('settings.localization'), icon: <Globe className="w-4 h-4" /> },
    { id: 'notifications', label: t('settings.notifications'), icon: <Bell className="w-4 h-4" /> },
    { id: 'appearance', label: t('settings.appearance'), icon: <Palette className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
            {t('settings.title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">{t('settings.subtitle')}</p>
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
                <CardTitle>{t('settings.companyTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-xs">
                {/* Logo & Branding Management Section */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1E293B] bg-slate-50/70 dark:bg-[#0B0F19] flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white dark:bg-[#151D2E] p-2 border-2 border-slate-200 dark:border-[#1E293B] shadow-sm flex items-center justify-center overflow-hidden">
                      {companySettings.logo ? (
                        <img
                          src={companySettings.logo}
                          alt="Company Logo Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <Building className="w-10 h-10 text-slate-400" />
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {t('settings.companyLogo')}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3 text-center sm:text-left rtl:sm:text-right">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-[#F8FAFC] text-sm">
                        {t('settings.companyLogo')}
                      </h3>
                      <p className="text-slate-500 dark:text-[#94A3B8] text-xs mt-0.5 leading-relaxed">
                        {t('settings.companyLogoDesc')}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start rtl:sm:justify-start gap-2 pt-1">
                      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs cursor-pointer shadow-sm transition-colors">
                        <Upload className="w-4 h-4" />
                        <span>{t('settings.uploadLogo')}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoChange}
                        />
                      </label>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetToDefaultLogo}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      >
                        {t('settings.resetLogo')}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Company Name & Legal Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('settings.companyNameEn')}
                    value={companySettings.companyName || ''}
                    onChange={e =>
                      setCompanySettings({ ...companySettings, companyName: e.target.value })
                    }
                  />
                  <Input
                    label={t('settings.companyNameAr')}
                    value={companySettings.companyNameAr || ''}
                    onChange={e =>
                      setCompanySettings({ ...companySettings, companyNameAr: e.target.value })
                    }
                  />
                  <div className="md:col-span-2">
                    <Input
                      label={t('settings.companyNameZh')}
                      value={companySettings.companyNameZh || ''}
                      onChange={e =>
                        setCompanySettings({ ...companySettings, companyNameZh: e.target.value })
                      }
                    />
                  </div>
                  <Input
                    label={t('settings.trn')}
                    value={companySettings.taxRegistrationNumber || ''}
                    onChange={e =>
                      setCompanySettings({
                        ...companySettings,
                        taxRegistrationNumber: e.target.value,
                      })
                    }
                  />
                  <Input
                    label={t('settings.cr')}
                    value={companySettings.crNumber || ''}
                    onChange={e =>
                      setCompanySettings({ ...companySettings, crNumber: e.target.value })
                    }
                  />
                  <Input
                    label={t('settings.supportEmail')}
                    value={companySettings.companyEmail || ''}
                    onChange={e =>
                      setCompanySettings({ ...companySettings, companyEmail: e.target.value })
                    }
                  />
                  <Input
                    label={t('settings.phone')}
                    value={companySettings.companyPhone || ''}
                    onChange={e =>
                      setCompanySettings({ ...companySettings, companyPhone: e.target.value })
                    }
                  />
                  <div className="md:col-span-2">
                    <Input
                      label={t('settings.hqAddress')}
                      value={companySettings.address || ''}
                      onChange={e =>
                        setCompanySettings({ ...companySettings, address: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetToDefaultLogo}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    {t('settings.resetDefaults')}
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    isLoading={isSaving}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    {t('settings.saveChanges')}
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
              <CardTitle>{t('settings.leavePoliciesTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead className="bg-slate-50 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-[#1E293B] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3 pl-6 rtl:pl-3 rtl:pr-6">{t('settings.colLeaveClass')}</th>
                    <th className="p-3">{t('settings.colAnnualEntitlement')}</th>
                    <th className="p-3">{t('settings.colMaxCarryOver')}</th>
                    <th className="p-3">{t('settings.colCompensationRate')}</th>
                    <th className="p-3">{t('settings.colRequiresMedical')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B] text-slate-700 dark:text-slate-300">
                  {leavePolicies.map(lp => (
                    <tr key={lp.type} className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/40 transition-colors">
                      <td className="p-3 pl-6 rtl:pl-3 rtl:pr-6 font-semibold text-slate-900 dark:text-[#F8FAFC]">{getLeaveName(lp)}</td>
                      <td className="p-3">{lp.annualDays} {t('settings.daysUnit')}</td>
                      <td className="p-3">{lp.carryOverMax} {t('settings.daysUnit')}</td>
                      <td className="p-3 font-semibold text-emerald-700 dark:text-emerald-400">{lp.paidPercentage}% {t('settings.fullPay')}</td>
                      <td className="p-3">{lp.requireMedicalCertificate ? t('settings.yes') : t('settings.no')}</td>
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
              <CardTitle>{t('settings.docsComplianceTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead className="bg-slate-50 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-[#1E293B] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3 pl-6 rtl:pl-3 rtl:pr-6">{t('settings.colRequiredDoc')}</th>
                    <th className="p-3">{t('settings.colMandatoryInsurance')}</th>
                    <th className="p-3">{t('settings.colGraceWindow')}</th>
                    <th className="p-3">{t('settings.colTrackExpiration')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B] text-slate-700 dark:text-slate-300">
                  {docReqs.map(dr => (
                    <tr key={dr.id} className="hover:bg-slate-50 dark:hover:bg-[#1E293B]/40 transition-colors">
                      <td className="p-3 pl-6 rtl:pl-3 rtl:pr-6 font-semibold text-slate-900 dark:text-[#F8FAFC]">{getDocName(dr)}</td>
                      <td className="p-3">
                        <span className={dr.mandatoryForInsurance ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}>
                          {dr.mandatoryForInsurance ? t('settings.mandatory') : t('settings.optional')}
                        </span>
                      </td>
                      <td className="p-3">{dr.requiredOnboardingDays} {t('settings.daysUnit')}</td>
                      <td className="p-3">{dr.hasExpiration ? t('settings.monitored') : t('settings.no')}</td>
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
              <CardTitle>{t('settings.localizationTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">{t('settings.localizationDesc')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { code: 'en' as LanguageCode, label: t('settings.langEn'), desc: t('settings.langEnDesc'), flag: '🇬🇧' },
                  { code: 'ar' as LanguageCode, label: t('settings.langAr'), desc: t('settings.langArDesc'), flag: '🇸🇦' },
                  { code: 'zh-CN' as LanguageCode, label: t('settings.langZh'), desc: t('settings.langZhDesc'), flag: '🇨🇳' },
                ].map(l => (
                  <button
                    key={l.code}
                    onClick={() => {
                      changeLanguage(l.code);
                      success(t('settings.langSwitched', { lang: l.label }));
                    }}
                    className={`p-4 rounded-xl border text-left rtl:text-right transition-all cursor-pointer ${
                      language === l.code
                        ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 dark:border-brand-500 ring-1 ring-brand-500 font-semibold'
                        : 'border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xl mb-1">{l.flag}</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">{l.label}</div>
                    <div className="text-slate-500 dark:text-[#94A3B8] text-[11px] mt-0.5">{l.desc}</div>
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
              <div>
                <CardTitle>{t('settings.notificationsTitle')}</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('settings.notificationsDesc')}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {[
                { title: t('settings.notifContractExp'), enabled: true },
                { title: t('settings.notifAbsence'), enabled: true },
                { title: t('settings.notifPayroll'), enabled: true },
                { title: t('settings.notifDocStatus'), enabled: true },
              ].map((item, idx) => (
                <label key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-[#1E293B] hover:bg-slate-50 dark:hover:bg-[#1E293B]/40 transition-colors cursor-pointer">
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{item.title}</span>
                  <input type="checkbox" defaultChecked={item.enabled} className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer" />
                </label>
              ))}
            </CardContent>
          </Card>
        )}

        {activeTab === 'appearance' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.appearanceTitle', 'مظهر النظام والسمة البصرية')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-xs">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('settings.appearanceDesc', 'اختر النمط البصري المفضل لواجهة نظام الموارد البشرية. يمكنك التبديل بين الوضع الفاتح الكلاسيكي أو الوضع الليلي الرئاسي الفاخر أو مزامنة إعداد جهازك.')}
              </p>
              
              <ThemeToggle variant="cards" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
