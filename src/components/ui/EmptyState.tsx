import React from 'react';
import { cn } from '../../lib/utils';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn('text-center py-12 px-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-[#1E293B] bg-slate-50/50 dark:bg-[#151D2E]/40', className)}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-slate-400 mb-3.5">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">{title}</h3>
      {description && <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8] max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
