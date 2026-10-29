import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useDirection, LanguageCode } from '../../context/DirectionContext';
import { useCompany } from '../../context/CompanyContext';
import { Lock, Mail, Eye, EyeOff, Globe, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { language, changeLanguage } = useDirection();
  const { companyName, logo } = useCompany();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg(t('auth.credentialsRequired', 'يرجى إدخال البريد الإلكتروني وكلمة المرور.'));
      return;
    }

    setIsLoading(true);
    try {
      await login(cleanEmail, password, rememberMe);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || t('auth.loginFailed', 'فشل تسجيل الدخول. يرجى التأكد من البريد الإلكتروني وكلمة المرور.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0B0F19] flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      {/* Top Language bar */}
      <div className="absolute top-6 right-6 rtl:right-auto rtl:left-6 flex items-center gap-2">
        <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <select
          value={language}
          onChange={e => changeLanguage(e.target.value as LanguageCode)}
          className="text-xs font-semibold bg-white dark:bg-[#151D2E] border border-slate-300 dark:border-[#1E293B] rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer shadow-xs [&>option]:bg-white [&>option]:dark:bg-[#151D2E]"
        >
          <option value="en">English</option>
          <option value="ar">العربية (RTL)</option>
          <option value="zh-CN">简体中文</option>
        </select>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex h-16 w-auto max-w-[220px] items-center justify-center rounded-2xl bg-white dark:bg-[#151D2E] p-2 shadow-lg shadow-slate-200/80 dark:shadow-none border border-slate-200 dark:border-[#1E293B] mb-4">
          <img src={logo} alt="Company Logo" className="h-full w-auto object-contain" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC] leading-snug px-3">
          {companyName}
        </h2>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          {t('auth.loginSubtitle', 'نظام إدارة الموارد البشرية والمؤسسية المتكامل')} • Enterprise Workforce Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-[#151D2E] py-8 px-6 shadow-xl shadow-slate-200/60 dark:shadow-none rounded-2xl border border-slate-200 dark:border-[#1E293B] sm:px-10">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('auth.emailLabel', 'البريد الإلكتروني للعمل')}
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="name@enterprise.com"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setErrorMsg('');
                  }}
                  className="block w-full rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] pl-10 pr-3.5 rtl:pl-3.5 rtl:pr-10 py-2 text-sm text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('auth.passwordLabel', 'كلمة المرور')}
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
                  placeholder="••••••••"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  className="block w-full rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] pl-10 pr-10 rtl:pr-10 rtl:pl-10 py-2 text-sm text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 dark:border-[#1E293B] dark:bg-[#0B0F19] text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 rtl:ml-0 rtl:mr-2 block text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                {t('auth.rememberMe', 'تذكر تسجيل الدخول')}
              </label>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              size="md"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
            >
              {t('auth.signInButton', 'تسجيل الدخول للمنصة')}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Secured Enterprise Portal • ISO 27001 Ready • Live Backend Connected</span>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
