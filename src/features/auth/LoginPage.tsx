import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useDirection, LanguageCode } from '../../context/DirectionContext';
import { useCompany } from '../../context/CompanyContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Globe,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  KeyRound,
  RotateCcw,
  Building2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import sceneImg from '../../assets/Enterprise Workforce Management Scene.png';
import pandaLogoBadge from '../../assets/New Hope Liuhe HR Panda Logo.png';

const DEFAULT_ADMIN_EMAIL = 'khaled.mossad@enterprise.com';
const DEFAULT_ADMIN_PASS = 'Admin@123456';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { language, changeLanguage } = useDirection();
  const { companyName, logo } = useCompany();
  const navigate = useNavigate();

  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [password, setPassword] = useState(DEFAULT_ADMIN_PASS);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setErrorMsg('');
    const cleanEmail = loginEmail.trim();
    if (!cleanEmail || !loginPass) {
      setErrorMsg(t('auth.credentialsRequired', 'يرجى إدخال البريد الإلكتروني وكلمة المرور.'));
      return;
    }

    setIsLoading(true);
    try {
      await login(cleanEmail, loginPass, rememberMe);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          t('auth.loginFailed', 'فشل تسجيل الدخول. يرجى التأكد من البريد الإلكتروني وكلمة المرور.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(email, password);
  };

  const handleQuickAdminLogin = async () => {
    setEmail(DEFAULT_ADMIN_EMAIL);
    setPassword(DEFAULT_ADMIN_PASS);
    await executeLogin(DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASS);
  };

  const handleResetDefaults = () => {
    setEmail(DEFAULT_ADMIN_EMAIL);
    setPassword(DEFAULT_ADMIN_PASS);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-[#0B0F19] flex flex-col lg:flex-row transition-colors">
      
      {/* ========================================================
          HERO SCENE SIDE (50%):
          Displays 'Enterprise Workforce Management Scene.png'
          Crystal-clear without blocking dark overlays so the Panda,
          Pyramids, China & Egypt flags, and factory shine!
      ======================================================== */}
      <div className="relative w-full lg:w-1/2 min-h-[340px] sm:min-h-[420px] lg:min-h-screen bg-slate-900 overflow-hidden flex flex-col justify-between">
        <img
          src={sceneImg}
          alt="New Hope Liuhe Enterprise Workforce Management Scene"
          className="absolute inset-0 w-full h-full object-cover object-center select-none"
        />

        {/* Very subtle top gradient only to make the badges readable */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 via-black/10 to-transparent pointer-events-none" />

        {/* Top Badges on Image */}
        <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-lg">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>شركة نيو هوب إيجيبت أكواتك تكنولوجي المحدودة • مصنع جمصة</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold shadow-lg">
            <span>🇪🇬 مصر & 🇨🇳 الصين</span>
          </div>
        </div>

        {/* Bottom edge: intentionally clean & unblocked so Panda & desk details are 100% visible */}
        <div className="relative z-10 p-4 pointer-events-none" />
      </div>

      {/* ========================================================
          FORM SIDE (50%): Login Card (Exact Design User Requested)
      ======================================================== */}
      <div className="relative w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-4 sm:p-8 lg:p-12 overflow-y-auto">
        
        {/* Top Header Bar: Language Switcher */}
        <div className="w-full flex items-center justify-end mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#151D2E] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs">
            <Globe className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <select
              value={language}
              onChange={e => changeLanguage(e.target.value as LanguageCode)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-bold text-xs focus:outline-none cursor-pointer [&>option]:bg-white [&>option]:dark:bg-slate-900"
            >
              <option value="ar">العربية (RTL)</option>
              <option value="en">English (LTR)</option>
              <option value="zh-CN">简体中文</option>
            </select>
          </div>
        </div>

        {/* Center Card */}
        <div className="w-full max-w-md mx-auto my-auto">
          <div className="bg-white dark:bg-[#151D2E] rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 dark:shadow-none border border-slate-200 dark:border-[#1E293B]">
            
            {/* Header: Panda Badge Logo */}
            <div className="text-center mb-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-1.5 shadow-md border border-slate-200 dark:border-slate-700 mb-3 hover:scale-105 transition-transform">
                <img
                  src={pandaLogoBadge || logo}
                  alt="New Hope Panda HR Badge"
                  className="h-full w-full object-contain"
                />
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-snug">
                {companyName || 'NEW HOPE EGYPT AQUATIC TECHNOLOGY CO., LTD'}
              </h1>
              <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {t('auth.loginSubtitle', 'Enterprise Workforce Management System')}
              </p>
            </div>

            {/* Quick 1-Click Master Admin Login Button */}
            <button
              type="button"
              onClick={handleQuickAdminLogin}
              disabled={isLoading}
              className="w-full mb-5 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-brand-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-brand-500/25 active:scale-[0.99] transition-all cursor-pointer border border-brand-400/30"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
              <span>{t('auth.quickAdminLogin', 'Quick 1-Click Login (Master Admin - Khaled Mossad)')}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-5">
              <div className="w-full border-t border-slate-200 dark:border-[#1E293B]" />
              <span className="absolute px-3 bg-white dark:bg-[#151D2E] text-[11px] text-slate-400 font-medium">
                {t('common.or', 'أو تسجيل الدخول اليدوي')}
              </span>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex flex-col gap-2 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <span className="font-semibold">{errorMsg}</span>
                </div>
                <div className="text-[11px] text-rose-700 dark:text-rose-300 bg-white/70 dark:bg-black/30 p-2 rounded-lg border border-rose-200/60 space-y-1">
                  <div className="font-medium text-[11px]">
                    {t('auth.loginHint', 'يرجى استخدام الحساب المعتمد أو الضغط على زر تسجيل الدخول السريع:')}
                  </div>
                  <div className="font-mono text-[11px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-slate-700 dark:text-slate-300">
                    <span>✉️ {DEFAULT_ADMIN_EMAIL}</span>
                    <span>🔑 {DEFAULT_ADMIN_PASS}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleQuickAdminLogin}
                  className="self-start text-[11px] font-bold text-rose-800 dark:text-rose-200 hover:underline flex items-center gap-1 cursor-pointer mt-0.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{t('auth.retryWithAdmin', 'دخول فوري بحساب المدير العام')}</span>
                </button>
              </div>
            )}

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('auth.emailLabel', 'Work Email Address')}
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="khaled.mossad@enterprise.com"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      setErrorMsg('');
                    }}
                    className="block w-full rounded-xl border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] pl-10 pr-3.5 rtl:pl-3.5 rtl:pr-10 py-2.5 text-sm text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('auth.passwordLabel', 'Password')}
                  </label>
                </div>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      setErrorMsg('');
                    }}
                    className="block w-full rounded-xl border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] pl-10 pr-10 rtl:pr-10 rtl:pl-10 py-2.5 text-sm text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rtl:right-auto rtl:left-0 rtl:pr-0 rtl:pl-3 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-[#1E293B] dark:bg-[#0B0F19] text-brand-600 focus:ring-brand-500 cursor-pointer accent-brand-600"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 rtl:ml-0 rtl:mr-2 block text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium"
                  >
                    {t('auth.rememberMe', 'Remember this session for 30 days')}
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t('auth.fillCredentials', 'Restore & Fill Credentials')}</span>
                </button>
              </div>

              <Button
                type="submit"
                className="w-full mt-2 py-2.5 font-bold shadow-md shadow-brand-500/20"
                size="md"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
              >
                {t('auth.signInButton', 'Sign In to Dashboard →')}
              </Button>
            </form>

            {/* Credentials Info Badge */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-[#1E293B]/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <KeyRound className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                <span>{DEFAULT_ADMIN_EMAIL}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-900/50">
                Master Admin
              </span>
            </div>
          </div>

          {/* Security Footer Badge */}
          <div className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>New Hope Liuhe Enterprise Portal • Secured & Encrypted</span>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-4">
          © {new Date().getFullYear()} New Hope Egypt Aquatic Technology Co., Ltd. All rights reserved.
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
