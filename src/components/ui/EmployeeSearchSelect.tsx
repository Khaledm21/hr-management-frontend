import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, User, Check, Building2, IdCard, Hash } from 'lucide-react';
import { Employee } from '../../types';
import { Avatar } from './Avatar';

export interface EmployeeSearchSelectProps {
  employees: Employee[];
  selectedEmployeeId: string;
  onSelectEmployee: (employee: Employee | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export const EmployeeSearchSelect: React.FC<EmployeeSearchSelectProps> = ({
  employees,
  selectedEmployeeId,
  onSelectEmployee,
  label,
  placeholder = 'ابحث بالاسم، الرقم القومي، الرقم الوظيفي، أو القسم...',
  required = false,
  disabled = false,
  error,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find currently selected employee
  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmployeeId) || null;
  }, [employees, selectedEmployeeId]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Multi-field smart filtering
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) {
      return employees.slice(0, 15);
    }
    const q = searchTerm.trim().toLowerCase();
    return employees
      .filter(emp => {
        const arabic = (emp.arabicName || '').toLowerCase();
        const english = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
        const empId = (emp.employeeId || '').toLowerCase();
        const nid = (emp.nationalId || '').toLowerCase();
        const dept = (emp.departmentName || '').toLowerCase();
        const pos = (emp.positionTitle || '').toLowerCase();
        const phone = (emp.phone || '').toLowerCase();

        return (
          arabic.includes(q) ||
          english.includes(q) ||
          empId.includes(q) ||
          nid.includes(q) ||
          dept.includes(q) ||
          pos.includes(q) ||
          phone.includes(q)
        );
      })
      .slice(0, 30);
  }, [employees, searchTerm]);

  return (
    <div className="space-y-1.5 text-xs" ref={containerRef}>
      {label && (
        <label className="block font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* If employee is selected and not currently searching */}
      {selectedEmployee && !isOpen ? (
        <div className="border border-brand-200 dark:border-brand-800/60 bg-brand-50/40 dark:bg-brand-950/20 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs transition-all hover:border-brand-300">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              src={selectedEmployee.avatar}
              name={selectedEmployee.arabicName || `${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
              size="md"
              className="shrink-0 ring-2 ring-brand-500/30"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                  {selectedEmployee.arabicName || `${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-300">
                  <Hash className="w-2.5 h-2.5 text-brand-600" />
                  {selectedEmployee.employeeId}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <IdCard className="w-3 h-3 text-slate-400" />
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                    {selectedEmployee.nationalId}
                  </span>
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span>{selectedEmployee.departmentName}</span>
                </span>
                {selectedEmployee.positionTitle && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400">{selectedEmployee.positionTitle}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setIsOpen(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="px-2.5 py-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 hover:bg-brand-100/60 dark:hover:bg-brand-900/40 rounded-lg transition-colors cursor-pointer"
            >
              تغيير
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectEmployee(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              title="إلغاء التحديد"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Search Combobox Input */
        <div className="relative">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              disabled={disabled}
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className={`w-full text-xs rounded-xl border py-2.5 pr-9 pl-9 rtl:pr-9 rtl:pl-9 text-slate-900 dark:text-[#F8FAFC] bg-white dark:bg-[#0B0F19] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-2xs ${
                error
                  ? 'border-rose-400 focus:ring-rose-500'
                  : 'border-slate-300 dark:border-[#1E293B] focus:border-brand-500'
              }`}
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 pointer-events-none" />
            
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  inputRef.current?.focus();
                }}
                className="absolute left-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Floating Dropdown Results */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#151D2E] border border-slate-200 dark:border-[#1E293B] rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-[#1E293B] animate-in fade-in zoom-in-95">
              <div className="p-2 bg-slate-50/90 dark:bg-[#111827]/90 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-b border-slate-100 dark:border-[#1E293B] sticky top-0 backdrop-blur-xs">
                <span>
                  نتائج البحث ({filteredEmployees.length} من {employees.length})
                </span>
                <span className="text-[10px] text-brand-600 dark:text-[#38BDF8] font-medium">
                  اختر موظفاً لربطه بالمستند
                </span>
              </div>

              {filteredEmployees.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  <User className="w-6 h-6 mx-auto mb-1 text-slate-300 opacity-60" />
                  لم يتم العثور على أي موظف يطابق &quot;{searchTerm}&quot;
                </div>
              ) : (
                filteredEmployees.map(emp => {
                  const isSelected = emp.id === selectedEmployeeId;
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => {
                        onSelectEmployee(emp);
                        setSearchTerm('');
                        setIsOpen(false);
                      }}
                      className={`w-full text-right rtl:text-right ltr:text-left p-2.5 transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer group ${
                        isSelected
                          ? 'bg-brand-50/80 dark:bg-brand-950/50'
                          : 'hover:bg-slate-50 dark:hover:bg-[#1E293B]/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          src={emp.avatar}
                          name={emp.arabicName || `${emp.firstName} ${emp.lastName}`}
                          size="sm"
                          className="shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-[#F8FAFC] group-hover:text-brand-600 dark:group-hover:text-[#38BDF8] transition-colors truncate">
                              {emp.arabicName || `${emp.firstName} ${emp.lastName}`}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="font-mono text-slate-600 dark:text-slate-300">
                              الرقم القومي: {emp.nationalId}
                            </span>
                            <span>•</span>
                            <span>{emp.departmentName}</span>
                            {emp.positionTitle && (
                              <>
                                <span>•</span>
                                <span className="text-slate-400">{emp.positionTitle}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-left rtl:text-left ltr:text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 group-hover:bg-brand-100 group-hover:text-brand-800 transition-colors">
                          {emp.employeeId}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
    </div>
  );
};
