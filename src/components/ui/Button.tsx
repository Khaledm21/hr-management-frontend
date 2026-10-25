import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0878D1]/30 dark:focus:ring-[#38BDF8]/30 focus:ring-offset-2 dark:focus:ring-offset-[#0B0F19] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

    const variants = {
      primary: 'bg-[#0878D1] dark:bg-[#0878D1] text-white hover:bg-[#0667B2] dark:hover:bg-[#0762A8] shadow-xs shadow-[#0878D1]/25 hover:shadow-sm',
      secondary: 'bg-white dark:bg-[#1E293B] text-[#172033] dark:text-[#F8FAFC] hover:bg-[#F0F7FF] dark:hover:bg-[#334155] hover:border-[#BFDBFE] dark:hover:border-[#38BDF8]/40 hover:text-[#0878D1] dark:hover:text-[#38BDF8] border border-[#E2E8F0] dark:border-[#334155] shadow-2xs',
      outline: 'bg-white dark:bg-[#151D2E] text-[#172033] dark:text-[#F8FAFC] hover:bg-[#F0F7FF] dark:hover:bg-[#1E293B] hover:text-[#0878D1] dark:hover:text-[#38BDF8] hover:border-[#BFDBFE] dark:hover:border-[#38BDF8]/40 border border-[#E2E8F0] dark:border-[#334155] shadow-2xs',
      danger: 'bg-[#E11D48] text-white hover:bg-[#BE123C] shadow-xs shadow-rose-600/20',
      ghost: 'bg-transparent text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F0F7FF] dark:hover:bg-[#1E293B] hover:text-[#0878D1] dark:hover:text-[#38BDF8]',
      success: 'bg-[#059669] text-white hover:bg-[#047857] shadow-xs shadow-emerald-600/20',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-3.5 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
      icon: 'p-2 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0878D1] dark:hover:text-[#38BDF8]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
