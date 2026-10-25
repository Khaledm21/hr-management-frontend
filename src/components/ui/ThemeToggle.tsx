import React from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

export interface ThemeToggleProps {
  variant?: 'icon' | 'switch' | 'segmented' | 'cards';
  size?: number | string;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  size = '11.5px',
  className,
}) => {
  const { theme, setTheme, toggleTheme, isDark } = useTheme();
  const { t } = useTranslation();

  // 1. Day / Night Animated Switch (Default & for Header / Quick access)
  if (variant === 'icon' || variant === 'switch') {
    const computedSize = typeof size === 'number' ? `${size}px` : size;

    return (
      <label
        className={cn('theme-switch cursor-pointer select-none', className)}
        style={{ '--toggle-size': computedSize } as React.CSSProperties}
        title={
          isDark
            ? t('settings.switchToLight', 'التبديل إلى الوضع الفاتح')
            : t('settings.switchToDark', 'التبديل إلى الوضع الداكن')
        }
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <input
          type="checkbox"
          className="theme-switch__checkbox"
          checked={isDark}
          onChange={toggleTheme}
        />
        <div className="theme-switch__container">
          <div className="theme-switch__clouds" />
          <div className="theme-switch__stars-container">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 144 55"
              fill="none"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M135.831 3.00688C135.055 3.85027 134.111 4.29946 133 4.35447C134.111 4.40947 135.055 4.85867 135.831 5.71123C136.607 6.55462 136.996 7.56303 136.996 8.72727C136.996 7.95722 137.172 7.25134 137.525 6.59129C137.886 5.93124 138.372 5.39954 138.98 5.00535C139.598 4.60199 140.268 4.39114 141 4.35447C139.88 4.2903 138.936 3.85027 138.16 3.00688C137.384 2.16348 136.996 1.16425 136.996 0C136.996 1.16425 136.607 2.16348 135.831 3.00688ZM31 23.3545C32.1114 23.2995 33.0551 22.8503 33.8313 22.0069C34.6075 21.1635 34.9956 20.1642 34.9956 19C34.9956 20.1642 35.3837 21.1635 36.1599 22.0069C36.9361 22.8503 37.8798 23.2903 39 23.3545C38.2679 23.3911 37.5976 23.602 36.9802 24.0053C36.3716 24.3995 35.8864 24.9312 35.5248 25.5913C35.172 26.2513 34.9956 26.9572 34.9956 27.7273C34.9956 26.563 34.6075 25.5546 33.8313 24.7112C33.0551 23.8587 32.1114 23.4095 31 23.3545ZM0 36.3545C1.11136 36.2995 2.05513 35.8503 2.83131 35.0069C3.6075 34.1635 3.99559 33.1642 3.99559 32C3.99559 33.1642 4.38368 34.1635 5.15987 35.0069C5.93605 35.8503 6.87982 36.2903 8 36.3545C7.26792 36.3911 6.59757 36.602 5.98015 37.0053C5.37155 37.3995 4.88644 37.9312 4.52481 38.5913C4.172 39.2513 3.99559 39.9572 3.99559 40.7273C3.99559 39.563 3.6075 38.5546 2.83131 37.7112C2.05513 36.8587 1.11136 36.4095 0 36.3545ZM56.8313 24.0069C56.0551 24.8503 55.1114 25.2995 54 25.3545C55.1114 25.4095 56.0551 25.8587 56.8313 26.7112C57.6075 27.5546 57.9956 28.563 57.9956 29.7273C57.9956 28.9572 58.172 28.2513 58.5248 27.5913C58.8864 26.9312 59.3716 26.3995 59.9802 26.0053C60.5976 25.602 61.2679 25.3911 62 25.3545C60.8798 25.2903 59.9361 24.8503 59.1599 24.0069C58.3837 23.1635 57.9956 22.1642 57.9956 21C57.9956 22.1642 57.6075 23.1635 56.8313 24.0069Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="theme-switch__circle-container">
            <div className="theme-switch__sun-moon-container">
              <div className="theme-switch__moon">
                <div className="theme-switch__spot" />
                <div className="theme-switch__spot" />
                <div className="theme-switch__spot" />
              </div>
            </div>
          </div>
        </div>
      </label>
    );
  }

  // 2. Segmented Pill Variant (for Modals, Quick filters)
  if (variant === 'segmented') {
    const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
      { mode: 'light', label: t('settings.themeLight', 'فاتح'), icon: <Sun className="w-3.5 h-3.5" /> },
      { mode: 'dark', label: t('settings.themeDark', 'داكن'), icon: <Moon className="w-3.5 h-3.5" /> },
      { mode: 'system', label: t('settings.themeSystem', 'تلقائي'), icon: <Monitor className="w-3.5 h-3.5" /> },
    ];

    return (
      <div
        className={cn(
          'inline-flex items-center p-1 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F1F5F9]/80 dark:bg-[#0B0F19] gap-1',
          className
        )}
      >
        {options.map(opt => {
          const isActive = theme === opt.mode;
          return (
            <button
              key={opt.mode}
              type="button"
              onClick={() => setTheme(opt.mode)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-white dark:bg-[#1E293B] text-[#0878D1] dark:text-[#38BDF8] shadow-xs border border-[#BFDBFE] dark:border-[#334155]'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#172033] dark:hover:text-[#F8FAFC]'
              )}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // 3. Rich Visual Cards Variant (for Settings Page Appearance Tab)
  const cardOptions: {
    mode: ThemeMode;
    title: string;
    description: string;
    icon: React.ReactNode;
    previewBg: string;
    previewCard: string;
    previewAccent: string;
  }[] = [
    {
      mode: 'light',
      title: t('settings.themeLightTitle', 'الوضع الفاتح (Light)'),
      description: t('settings.themeLightDesc', 'تصميم ناصع وواضح بأزرق مؤسسي مريح للقراءة أثناء ساعات العمل.'),
      icon: <Sun className="w-5 h-5 text-amber-500" />,
      previewBg: 'bg-[#F5F7FB]',
      previewCard: 'bg-white border-[#E2E8F0]',
      previewAccent: 'bg-[#0878D1]',
    },
    {
      mode: 'dark',
      title: t('settings.themeDarkTitle', 'الوضع الداكن (Executive Dark)'),
      description: t('settings.themeDarkDesc', 'خلفيات تيتانيوم كحلية داكنة فاخرة، مريحة للعين وتقلل الإجهاد البصري.'),
      icon: <Moon className="w-5 h-5 text-sky-400" />,
      previewBg: 'bg-[#0B0F19]',
      previewCard: 'bg-[#151D2E] border-[#1E293B]',
      previewAccent: 'bg-[#38BDF8]',
    },
    {
      mode: 'system',
      title: t('settings.themeSystemTitle', 'تلقائي حسب النظام (Auto)'),
      description: t('settings.themeSystemDesc', 'مزامنة تلقائية مع إعدادات نظام التشغيل لجهاز الكمبيوتر أو الهاتف.'),
      icon: <Monitor className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />,
      previewBg: 'bg-gradient-to-r from-[#F5F7FB] to-[#0B0F19]',
      previewCard: 'bg-white dark:bg-[#151D2E] border-[#E2E8F0] dark:border-[#1E293B]',
      previewAccent: 'bg-[#2563EB]',
    },
  ];

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
      {cardOptions.map(opt => {
        const isSelected = theme === opt.mode;
        return (
          <div
            key={opt.mode}
            onClick={() => setTheme(opt.mode)}
            className={cn(
              'group relative rounded-2xl p-4 border transition-all duration-300 cursor-pointer flex flex-col justify-between',
              isSelected
                ? 'bg-[#F0F7FF] dark:bg-[#1E293B]/80 border-[#0878D1] dark:border-[#38BDF8] ring-2 ring-[#0878D1]/20 dark:ring-[#38BDF8]/20 shadow-md -translate-y-0.5'
                : 'bg-white dark:bg-[#151D2E] border-[#E2E8F0] dark:border-[#1E293B] hover:border-[#BFDBFE] dark:hover:border-[#334155] hover:shadow-xs'
            )}
          >
            {/* Visual Header */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#0B0F19] border border-[#E2E8F0] dark:border-[#1E293B] shadow-2xs">
                  {opt.icon}
                </div>
                {isSelected && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[#0878D1] dark:text-[#38BDF8] bg-white dark:bg-[#0B0F19] px-2 py-0.5 rounded-full border border-[#BFDBFE] dark:border-[#334155]">
                    <Check className="w-3 h-3" />
                    <span>{t('common.selected', 'محدد')}</span>
                  </span>
                )}
              </div>

              <h4 className="text-sm font-bold text-[#172033] dark:text-[#F8FAFC] group-hover:text-[#0878D1] dark:group-hover:text-[#38BDF8] transition-colors">
                {opt.title}
              </h4>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 leading-relaxed">
                {opt.description}
              </p>
            </div>

            {/* Live Mini Preview Canvas */}
            <div className={cn('mt-4 p-2.5 rounded-xl border border-dashed border-[#E2E8F0] dark:border-[#334155]', opt.previewBg)}>
              <div className={cn('h-10 rounded-lg p-2 border flex items-center justify-between shadow-2xs', opt.previewCard)}>
                <div className="flex items-center gap-1.5">
                  <div className={cn('w-2 h-2 rounded-full', opt.previewAccent)} />
                  <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                </div>
                <div className="w-4 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
