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
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import panoramaImg from '../../assets/Panda-Farm-and-Sunrise-Gateway.png';
import companyLogoImg from '../../assets/new-hope-logo.png';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { language, changeLanguage } = useDirection();
  const { companyName, logo } = useCompany();
  const navigate = useNavigate();

  // Inputs are strictly empty by default for maximum privacy & security
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden selection:bg-brand-500 selection:text-white">
      
      {/* ========================================================
          BACKGROUND IMAGE WITH CINEMATIC SOFT BLUR:
          Soft subtle blur (2px) so the farm & sunrise background stays
          recognizable and bright, while the frosted glass card blends classily!
      ======================================================== */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <img
          src={panoramaImg}
          alt="New Hope Liuhe - Panda, Farm, and Sunrise Gateway"
          className="w-full h-full object-cover object-bottom select-none scale-[1.01] filter blur-[2px] brightness-95"
        />
        {/* Soft light tint overlay */}
        <div className="absolute inset-0 bg-slate-950/15" />
      </div>

      {/* ========================================================
          TOP NAVIGATION BAR:
          Language Selector only (Clean, Minimalist)
      ======================================================== */}
      <header className="relative z-20 w-full px-4 sm:px-6 pt-4 flex items-center justify-end">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/75 dark:bg-slate-900/85 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-lg">
          <Globe className="w-3.5 h-3.5 text-brand-400" />
          <select
            value={language}
            onChange={e => changeLanguage(e.target.value as LanguageCode)}
            className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
          >
            <option value="ar">العربية (RTL)</option>
            <option value="en">English (LTR)</option>
            <option value="zh-CN">简体中文</option>
          </select>
        </div>
      </header>

      {/* ========================================================
          LOGIN CARD:
          - Classy Frosted Glass (Acrylic Glassmorphism with backdrop-blur)
          - Blends beautifully with the bright sunny panorama
          - Clean, empty inputs: NO auto-filling, NO exposed secrets
          - Completely removed redundant subtitles, preview buttons & badges
      ======================================================== */}
      <main className="relative z-20 flex-1 flex flex-col justify-center items-center py-6 px-4">
        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white/75 dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-sky-950/20 border border-white/60 dark:border-white/15">
            
            {/* Header: Company Diamond Logo Badge & Company Name Only */}
            <div className="text-center mb-6 pb-4 border-b border-slate-200/60 dark:border-slate-700/50">
              <div className="mx-auto inline-flex items-center justify-center px-6 py-2 rounded-2xl bg-white/95 shadow-md border border-slate-200/80 mb-3 hover:scale-105 transition-transform">
                <img
                  src={companyLogoImg || logo}
                  alt="New Hope Company Logo"
                  className="h-8 w-auto object-contain select-none"
                />
              </div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                {companyName || 'NEW HOPE EGYPT AQUATIC TECHNOLOGY CO., LTD'}
              </h1>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50/90 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800/80 flex items-center gap-2 text-rose-700 dark:text-rose-200 text-xs font-bold animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form: Secure, Clean, No Auto-fill */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  {t('auth.emailLabel', 'البريد الإلكتروني للعمل')}
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400 rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="name@company.com"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      setErrorMsg('');
                    }}
                    className="block w-full rounded-xl border border-slate-300/80 dark:border-slate-600/80 bg-white/80 dark:bg-slate-800/80 pl-10 pr-3.5 rtl:pl-3.5 rtl:pr-10 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  {t('auth.passwordLabel', 'كلمة المرور')}
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400 rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3.5">
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
                    className="block w-full rounded-xl border border-slate-300/80 dark:border-slate-600/80 bg-white/80 dark:bg-slate-800/80 pl-10 pr-10 rtl:pr-10 rtl:pl-10 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rtl:right-auto rtl:left-0 rtl:pr-0 rtl:pl-3 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 rtl:ml-0 rtl:mr-2 text-slate-800 dark:text-slate-200 cursor-pointer font-bold select-none"
                  >
                    {t('auth.rememberMe', 'تذكر الجلسة لمدة 30 يوماً')}
                  </label>
                </div>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full mt-3 py-3 text-sm font-black shadow-lg shadow-emerald-600/20 bg-gradient-to-r from-emerald-600 via-teal-600 to-brand-600 hover:from-emerald-500 hover:to-brand-500 active:scale-[0.99] transition-all cursor-pointer"
                size="lg"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
              >
                {t('auth.signInButton', 'الدخول إلى لوحة التحكم ←')}
              </Button>
            </form>
          </div>
        </div>
      </main>

      {/* ========================================================
          BOTTOM FOOTER:
          Minimalist glass pill
      ======================================================== */}
      <footer className="relative z-20 w-full px-4 pb-3 flex items-center justify-center pointer-events-none">
        <div className="px-4 py-1.5 rounded-full bg-slate-900/75 backdrop-blur-md text-[11px] text-white/90 font-medium shadow-lg border border-white/10 pointer-events-auto">
          © {new Date().getFullYear()} New Hope Egypt Aquatic Technology Co., Ltd. • All rights reserved
        </div>
      </footer>
    </div>
  );
};
export default LoginPage;
