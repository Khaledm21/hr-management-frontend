import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'secondary'
  | 'outline';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  dot = false,
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-[#E8F3FF] dark:bg-[#1E293B] text-[#0878D1] dark:text-[#38BDF8] border-[#BFDBFE] dark:border-[#38BDF8]/30',
    success: 'bg-[#ECFDF5] dark:bg-emerald-950/40 text-[#059669] dark:text-emerald-400 border-[#A7F3D0] dark:border-emerald-800/40',
    warning: 'bg-[#FFFBEB] dark:bg-amber-950/40 text-[#D97706] dark:text-amber-400 border-[#FDE68A] dark:border-amber-800/40',
    danger: 'bg-[#FFF1F2] dark:bg-rose-950/40 text-[#E11D48] dark:text-rose-400 border-[#FECDD3] dark:border-rose-800/40',
    info: 'bg-[#F0F9FF] dark:bg-sky-950/40 text-[#0284C7] dark:text-sky-400 border-[#BAE6FD] dark:border-sky-800/40',
    secondary: 'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#334155]',
    outline: 'bg-transparent text-[#64748B] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#334155]',
  };

  const dotColors = {
    default: 'bg-[#0878D1]',
    success: 'bg-[#059669]',
    warning: 'bg-[#D97706]',
    danger: 'bg-[#E11D48]',
    info: 'bg-[#0284C7]',
    secondary: 'bg-[#64748B]',
    outline: 'bg-[#94A3B8]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
};
