import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDirection } from '../../context/DirectionContext';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className,
}) => {
  const { isRtl } = useDirection();
  const { t } = useTranslation();

  const startRecord = Math.min((currentPage - 1) * pageSize + 1, totalRecords);
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 border-t border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151D2E] text-xs text-slate-600 dark:text-slate-400',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span>
          {t('common.showing')} <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{totalRecords > 0 ? startRecord : 0}</span>-
          <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{endRecord}</span> {t('common.of')}{' '}
          <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{totalRecords}</span> {t('common.results')}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-4 rtl:ml-0 rtl:mr-4">
            <span className="text-slate-500 dark:text-slate-400">{t('common.rowsPerPage')}:</span>
            <select
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              className="border border-slate-300 dark:border-[#1E293B] rounded px-2 py-1 text-xs bg-white dark:bg-[#0B0F19] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1E293B] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
        >
          <PrevIcon className="w-3.5 h-3.5" />
          <span>{t('common.back')}</span>
        </button>

        <span className="px-2 font-medium text-slate-700 dark:text-slate-300">
          {t('common.page')} <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">{currentPage}</span> / {Math.max(1, totalPages)}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1E293B] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
        >
          <span>{t('common.next')}</span>
          <NextIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
