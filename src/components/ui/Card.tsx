import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, hoverable = false, children, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-[#151D2E] rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] shadow-2xs transition-all duration-300',
        hoverable && 'hover:shadow-md hover:border-[#BFDBFE] dark:hover:border-[#38BDF8]/40 hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('px-6 py-4.5 border-b border-[#E2E8F0]/80 dark:border-[#1E293B] flex items-center justify-between', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h3 className={cn('text-base font-bold text-[#172033] dark:text-[#F8FAFC] tracking-tight', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => (
  <p className={cn('text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5 font-normal', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('p-6', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('px-6 py-3.5 bg-slate-50/50 dark:bg-[#0B0F19]/50 border-t border-slate-100 dark:border-[#1E293B] rounded-b-xl', className)} {...props}>
    {children}
  </div>
);
