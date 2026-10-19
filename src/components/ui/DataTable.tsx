import React, { useState, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  SlidersHorizontal,
  Download,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';
import { useTranslation } from 'react-i18next';
import { cn, downloadCSV } from '../../lib/utils';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  accessor?: (row: T) => any;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  hidden?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  searchPlaceholder?: string;
  searchable?: boolean;
  exportFilename?: string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  selectAllAcrossPages?: boolean;
  bulkActions?: (selectedIds: string[], clearSelection: () => void) => React.ReactNode;
  filtersSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
  pageSize?: number;
  initialSortKey?: string;
  initialSortDirection?: 'asc' | 'desc';
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  error = null,
  emptyTitle,
  emptyDescription,
  emptyAction,
  searchPlaceholder,
  searchable = true,
  exportFilename,
  onRowClick,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  selectAllAcrossPages = false,
  bulkActions,
  filtersSlot,
  actionsSlot,
  pageSize: initialPageSize = 10,
  initialSortKey,
  initialSortDirection = 'asc',
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortKey, setSortKey] = useState<string | undefined>(initialSortKey);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() =>
    columns.filter(c => !c.hidden).map(c => c.key)
  );
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // Column visibility filter
  const activeColumns = useMemo(
    () => columns.filter(col => visibleColumnKeys.includes(col.key)),
    [columns, visibleColumnKeys]
  );

  // Client side filtering & sorting
  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(row => {
        return Object.values(row).some(val => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    if (sortKey) {
      const col = columns.find(c => c.key === sortKey);
      result.sort((a, b) => {
        let valA = col?.accessor ? col.accessor(a) : a[sortKey];
        let valB = col?.accessor ? col.accessor(b) : b[sortKey];

        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
      });
    }

    return result;
  }, [data, searchTerm, sortKey, sortDirection, columns]);

  // Pagination calculation
  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Selection handlers
  const allFilteredSelected =
    filteredData.length > 0 &&
    filteredData.every(row => selectedIds.includes(keyExtractor(row)));

  const someFilteredSelected =
    filteredData.some(row => selectedIds.includes(keyExtractor(row))) && !allFilteredSelected;

  const allCurrentSelected =
    paginatedData.length > 0 &&
    paginatedData.every(row => selectedIds.includes(keyExtractor(row)));

  const someCurrentSelected =
    paginatedData.some(row => selectedIds.includes(keyExtractor(row))) && !allCurrentSelected;

  const isHeaderChecked = selectAllAcrossPages ? allFilteredSelected : allCurrentSelected;
  const isHeaderIndeterminate = selectAllAcrossPages ? someFilteredSelected : (someCurrentSelected || (allCurrentSelected && !allFilteredSelected && filteredData.length > paginatedData.length));

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    if (selectAllAcrossPages) {
      if (allFilteredSelected) {
        onSelectionChange([]);
      } else {
        onSelectionChange(filteredData.map(r => keyExtractor(r)));
      }
    } else {
      if (allCurrentSelected) {
        const currentIds = paginatedData.map(r => keyExtractor(r));
        onSelectionChange(selectedIds.filter(id => !currentIds.includes(id)));
      } else {
        const newIds = Array.from(new Set([...selectedIds, ...paginatedData.map(r => keyExtractor(r))]));
        onSelectionChange(newIds);
      }
    }
  };

  const toggleRowSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortKey(undefined);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    if (exportFilename && data.length > 0) {
      downloadCSV(exportFilename, data);
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/40">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {searchable && (
            <div className="relative min-w-[220px] max-w-sm flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder || t('common.search')}
                className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-1.5 text-xs rounded-lg border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          )}

          {filtersSlot}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Column Visibility Menu */}
          <div className="relative">
            <button
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              title="Columns"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            {showColumnPicker && (
              <div className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-30 animate-in fade-in zoom-in-95">
                <div className="text-[11px] font-semibold text-slate-500 uppercase px-2 py-1">
                  Toggle Columns
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {columns.map(col => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumnKeys.includes(col.key)}
                        onChange={e => {
                          if (e.target.checked) {
                            setVisibleColumnKeys([...visibleColumnKeys, col.key]);
                          } else {
                            if (visibleColumnKeys.length > 1) {
                              setVisibleColumnKeys(visibleColumnKeys.filter(k => k !== col.key));
                            }
                          }
                        }}
                        className="rounded text-brand-600 focus:ring-brand-500"
                      />
                      <span className="truncate">{col.header}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {exportFilename && (
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('common.export')}</span>
            </button>
          )}

          {actionsSlot}
        </div>
      </div>

      {/* Bulk actions banner */}
      {selectable && selectedIds.length > 0 && bulkActions && (
        <div className="px-4 py-2.5 bg-brand-50 border-b border-brand-100 flex flex-wrap items-center justify-between gap-3 text-xs text-brand-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {allFilteredSelected
                ? `تم تحديد جميع العناصر (${filteredData.length})`
                : `تم تحديد ${selectedIds.length} من أصل ${filteredData.length}`}
            </span>
            {!allFilteredSelected && filteredData.length > paginatedData.length && (
              <button
                type="button"
                onClick={() => onSelectionChange?.(filteredData.map(r => keyExtractor(r)))}
                className="text-brand-700 underline font-semibold hover:text-brand-900 cursor-pointer"
              >
                تحديد جميع الـ {filteredData.length} سجل
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {bulkActions(selectedIds, () => onSelectionChange?.([]))}
          </div>
        </div>
      )}

      {/* Main Table view */}
      <div className="overflow-x-auto min-h-[300px] flex-1">
        <table className="w-full text-left rtl:text-right border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              {selectable && (
                <th className="w-10 px-4 py-3 text-center">
                  <button
                    onClick={toggleSelectAll}
                    type="button"
                    title={
                      selectAllAcrossPages
                        ? (allFilteredSelected ? t('common.clearSelection', 'إلغاء التحديد') : `تحديد الكل (${filteredData.length})`)
                        : (allCurrentSelected ? t('common.clearSelection', 'إلغاء التحديد') : 'تحديد الكل')
                    }
                    className="text-slate-500 hover:text-slate-900 focus:outline-none transition-colors cursor-pointer"
                  >
                    {isHeaderChecked ? (
                      <CheckSquare className="w-4 h-4 text-brand-600" />
                    ) : isHeaderIndeterminate ? (
                      <MinusSquare className="w-4 h-4 text-brand-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
              )}

              {activeColumns.map(col => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key, col.sortable)}
                    style={{ width: col.width }}
                    className={cn(
                      'px-4 py-3 whitespace-nowrap transition-colors select-none',
                      col.sortable && 'cursor-pointer hover:bg-slate-100/70',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right'
                    )}
                  >
                    <div
                      className={cn(
                        'inline-flex items-center gap-1.5',
                        col.align === 'right' && 'justify-end w-full',
                        col.align === 'center' && 'justify-center w-full'
                      )}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-brand-600" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-brand-600" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 opacity-60" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-normal">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="hover:bg-transparent">
                  {selectable && (
                    <td className="px-4 py-3.5">
                      <Skeleton className="w-4 h-4 rounded" />
                    </td>
                  )}
                  {activeColumns.map((col, cIdx) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <Skeleton className={cn('h-4', cIdx === 0 ? 'w-24' : 'w-36')} />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={activeColumns.length + (selectable ? 1 : 0)} className="py-12">
                  <div className="text-center text-rose-600 text-sm">{error}</div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={activeColumns.length + (selectable ? 1 : 0)} className="py-10">
                  <EmptyState
                    title={emptyTitle || t('common.noRecords')}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => {
                const rowId = keyExtractor(row);
                const isSelected = selectedIds.includes(rowId);

                return (
                  <tr
                    key={rowId}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'hover:bg-slate-50/70 transition-colors',
                      onRowClick && 'cursor-pointer',
                      isSelected && 'bg-brand-50/40'
                    )}
                  >
                    {selectable && (
                      <td className="w-10 px-4 py-3 text-center" onClick={e => toggleRowSelect(rowId, e)}>
                        <button className="text-slate-400 hover:text-slate-700">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-brand-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    )}

                    {activeColumns.map(col => {
                      const cellContent = col.render
                        ? col.render(row, rIdx)
                        : col.accessor
                        ? col.accessor(row)
                        : row[col.key];

                      return (
                        <td
                          key={col.key}
                          style={{ width: col.width, minWidth: col.width }}
                          className={cn(
                            'px-4 py-3.5 align-middle',
                            col.align === 'center' && 'text-center',
                            col.align === 'right' && 'text-right'
                          )}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination component */}
      {!isLoading && !error && totalRecords > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={pageSize}
          onPageChange={page => setCurrentPage(page)}
          onPageSizeChange={size => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
}
