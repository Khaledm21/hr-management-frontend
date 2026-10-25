import React from 'react';
import { cn } from '../../lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label: React.FC<LabelProps> = ({ children, required, className, ...props }) => {
  return (
    <label
      className={cn(
        'block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5 select-none',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-rose-500 ml-1 rtl:mr-1 rtl:ml-0">*</span>}
    </label>
  );
};
