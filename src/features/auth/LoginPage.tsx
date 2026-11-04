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
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import panoramaImg from '../../assets/Panda-Global-Harvest-Panorama.png';
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
  const [isMinimized, setIsMinimized] = useState(false);

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
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden selection:bg-brand-500 selection:text-white">
      
      {/* ========================================================
          FULL-SCREEN PANORAMIC BACKGROUND:
          Anchored at bottom ('object-bottom') so the Panda,
          the desk, laptop, Pyramids, factory, flags and animals
          are 100% visible in the lower half of the screen.
      ======================================================== */}
      <img
        src={panoramaImg}
        alt="New Hope Liuhe - Panda's Global Harvest Panorama"
        className="fixed inset-0 w-full h-full object-cover object-bottom select-none pointer-events-none -z-10"
      />

      {/* Gentle gradient at very top to enhance text readability against sky */}
      <div className="fixed inset-x-0 top-0 h-44 bg-gradient-to-b from-sky-950/40 via-sky-900/10 to-transparent pointer-events-none -z-10" />

      {/* ========================================================
          TOP NAVIGATION BAR:
          Company pill on one side, Language switcher & Panorama view toggle on other side
      ======================================================== */}
      <header className="relative z-20 w-full px-4 sm:px-6 pt-3 sm:pt-4 flex items-center justify-between gap-2 flex-wrap">
        
        {/* Company Identity Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 text-xs font-bold shadow-md">
          <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="hidden sm:inline">شركة نيو هوب إيجيبت أكواتك تكنولوجي المحدودة • مصنع جمصة</span>
          <span className="sm:hidden">نيو هوب إيجيبت • جمصة</span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-[10px] text-emerald-800 dark:text-emerald-300 font-extrabold">
            🇪🇬 مصر & 🇨🇳 الصين
          </span>
        </div>

        {/* Controls: Language Selector + Cinema View Toggle */}
        <div className="flex items-center gap-2">
          
          {/* Cinema / Panorama Fullscreen View Toggle */}
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'عرض لوحة تسجيل الدخول' : 'معاينة البانوراما كاملة بدون بطاقة'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 text-xs font-bold shadow-md hover:bg-white transition-all cursor-pointer"
          >
            {isMinimized ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-brand-600" />
                <span>تسجيل الدخول</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">معاينة الصورة كاملة</span>
              </>
            )}
          </button>

          {/* Language Switcher */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 text-xs font-semibold shadow-md">
            <Globe className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <select
              value={language}
              onChange={e => changeLanguage(e.target.value as LanguageCode)}
              className="bg-transparent text-slate-900 dark:text-slate-100 font-bold text-xs focus:outline-none cursor-pointer [&>option]:bg-white [&>option]:dark:bg-slate-900"
            >
              <option value="ar">العربية (RTL)</option>
              <option value="en">English (LTR)</option>
              <option value="zh-CN">简体中文</option>
            </select>
          </div>
        </div>
      </header>

      {/* ========================================================
          LOGIN CARD (POSITIONED IN THE OPEN SKY):
          Carefully tuned compact width & height so it sits high in the sky
          and leaves the Panda, his laptop, and the ground 100% visible!
      ======================================================== */}
      <main className="relative z-20 flex-1 flex flex-col justify-start items-center pt-2 sm:pt-4 pb-6 px-3 sm:px-4">
        
        {isMinimized ? (
          /* Minimized pill when user wants to admire the wallpaper */
          <div className="mt-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsMinimized(false)}
              className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/80 dark:border-slate-700 shadow-2xl text-slate-900 dark:text-white font-bold text-sm hover:scale-105 transition-all cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <img src={pandaLogoBadge || logo} alt="Panda Logo" className="w-5 h-5 object-contain" />
              </div>
              <span>مرحباً بك! انقر هنا لفتح لوحة تسجيل الدخول 🔑</span>
              <Sparkles className="w-4 h-4 text-amber-500 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        ) : (
          /* Main Compact Glassmorphic Card */
          <div className="w-full max-w-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-white/85 dark:bg-[#0F172A]/85 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-2xl shadow-sky-950/20 border border-white/70 dark:border-white/10">
              
              {/* Header: Panda Badge + Title (Compact Horizontal Flex) */}
              <div className="flex items-center gap-3.5 mb-4 pb-3 border-b border-slate-200/70 dark:border-slate-700/60">
                <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-md border border-slate-200/80 hover:scale-105 transition-transform">
                  <img
                    src={pandaLogoBadge || logo}
                    alt="New Hope Panda Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                    {companyName || 'NEW HOPE EGYPT AQUATIC TECHNOLOGY CO., LTD'}
                  </h1>
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                    {t('auth.loginSubtitle', 'Enterprise Workforce Management System')}
                  </p>
                </div>
              </div>

              {/* Quick 1-Click Master Admin Login */}
              <button
                type="button"
                onClick={handleQuickAdminLogin}
                disabled={isLoading}
                className="w-full mb-3.5 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-brand-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 active:scale-[0.99] transition-all cursor-pointer border border-brand-400/30"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
                <span>{t('auth.quickAdminLogin', 'Quick 1-Click Login (Master Admin - Khaled Mossad)')}</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center mb-3">
                <div className="w-full border-t border-slate-200 dark:border-slate-700/60" />
                <span className="absolute px-3 bg-white/90 dark:bg-[#0F172A] text-[10px] text-slate-500 dark:text-slate-400 font-semibold rounded-full">
                  {t('common.or', 'أو تسجيل الدخول اليدوي')}
                </span>
              </div>

              {/* Error Message Alert */}
              {errorMsg && (
                <div className="mb-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-semibold">{errorMsg}</span>
                </div>
              )}

              {/* Form: Side-by-side on sm+ screens to preserve vertical space! */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Email Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t('auth.emailLabel', 'Work Email Address')}
                    </label>
                    <div className="relative rounded-lg">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3">
                        <Mail className="w-3.5 h-3.5" />
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
                        className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t('auth.passwordLabel', 'Password')}
                    </label>
                    <div className="relative rounded-lg">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3">
                        <Lock className="w-3.5 h-3.5" />
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
                        className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 pl-9 pr-9 rtl:pr-9 rtl:pl-9 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rtl:right-auto rtl:left-0 rtl:pr-0 rtl:pl-2.5 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remember Me & Restore Credentials */}
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer accent-brand-600"
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-2 rtl:ml-0 rtl:mr-2 text-slate-700 dark:text-slate-300 cursor-pointer font-medium"
                    >
                      {t('auth.rememberMe', 'Remember this session for 30 days')}
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t('auth.fillCredentials', 'Restore & Fill Credentials')}</span>
                  </button>
                </div>

                {/* Sign In Button */}
                <Button
                  type="submit"
                  className="w-full py-2.5 text-xs font-bold shadow-md shadow-brand-500/20"
                  size="md"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
                >
                  {t('auth.signInButton', 'Sign In to Dashboard →')}
                </Button>
              </form>

              {/* Bottom Credentials & Security Indicator */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1 font-mono">
                  <KeyRound className="w-3 h-3 text-brand-500 shrink-0" />
                  <span className="truncate max-w-[160px] sm:max-w-none">{DEFAULT_ADMIN_EMAIL}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-900/50">
                    Master Admin
                  </span>
                  <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span className="hidden sm:inline">Secured</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================
          BOTTOM FOOTER:
          Ultra-minimal glass pill at the bottom that doesn't block the desk
      ======================================================== */}
      <footer className="relative z-20 w-full px-4 pb-3 flex items-center justify-center pointer-events-none">
        <div className="px-4 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] text-white/90 font-medium shadow-lg border border-white/10 pointer-events-auto">
          © {new Date().getFullYear()} New Hope Egypt Aquatic Technology Co., Ltd. • All rights reserved
        </div>
      </footer>
    </div>
  );
};
export default LoginPage;
