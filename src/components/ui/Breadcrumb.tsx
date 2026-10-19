import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useDirection } from '../../context/DirectionContext';
import { cn } from '../../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  const { isRtl } = useDirection();
  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <nav className={cn('flex items-center text-xs text-slate-500', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 rtl:space-x-reverse">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center">
              {index > 0 && <ChevronIcon className="w-3.5 h-3.5 text-slate-400 mx-1.5 shrink-0" />}
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="hover:text-brand-600 transition-colors font-medium text-slate-600"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={cn('font-semibold', isLast ? 'text-slate-900' : 'text-slate-500')}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
