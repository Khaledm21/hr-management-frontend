import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, FileText, FileCheck, Building2, ArrowRight, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockEmployees } from '../../mocks/employees';
import { mockDepartments } from '../../mocks/departments';
import { mockContracts } from '../../mocks/contracts';
import { mockDocuments } from '../../mocks/documents';
import { driverPayoutService } from '../../services/driverPayoutService';
import { Driver } from '../../types/driverPayouts';
import { useDirection } from '../../context/DirectionContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loadedDrivers, setLoadedDrivers] = useState<Driver[]>([]);
  const navigate = useNavigate();
  const { isRtl } = useDirection();

  useEffect(() => {
    if (isOpen) {
      driverPayoutService.getDrivers().then(setLoadedDrivers);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search across datasets
  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) {
      return { employees: [], departments: [], contracts: [], documents: [], drivers: [] };
    }
    const q = query.toLowerCase().trim();

    const matchedEmployees = mockEmployees
      .filter(
        e =>
          e.firstName.toLowerCase().includes(q) ||
          e.lastName.toLowerCase().includes(q) ||
          e.employeeId.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          (e.arabicName && e.arabicName.includes(q))
      )
      .slice(0, 5);

    const matchedDepartments = mockDepartments
      .filter(
        d =>
          d.name.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q) ||
          d.nameAr.includes(q)
      )
      .slice(0, 3);

    const matchedContracts = mockContracts
      .filter(
        c =>
          c.contractNumber.toLowerCase().includes(q) ||
          c.employeeName.toLowerCase().includes(q)
      )
      .slice(0, 3);

    const matchedDocuments = mockDocuments
      .filter(
        doc =>
          doc.title.toLowerCase().includes(q) ||
          doc.employeeName.toLowerCase().includes(q) ||
          doc.fileName.toLowerCase().includes(q)
      )
      .slice(0, 4);

    const matchedDrivers = loadedDrivers
      .filter(
        d =>
          d.name.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q) ||
          (d.vehicleNumber && d.vehicleNumber.toLowerCase().includes(q)) ||
          q.includes('سائق') ||
          q.includes('قبض')
      )
      .slice(0, 4);

    return {
      employees: matchedEmployees,
      departments: matchedDepartments,
      contracts: matchedContracts,
      documents: matchedDocuments,
      drivers: matchedDrivers,
    };
  }, [query, loadedDrivers]);

  const hasAnyResults =
    results.employees.length > 0 ||
    results.departments.length > 0 ||
    results.contracts.length > 0 ||
    results.documents.length > 0 ||
    results.drivers.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white dark:bg-[#151D2E] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1E293B] z-10 overflow-hidden transform transition-all">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-[#1E293B] flex items-center gap-3 bg-slate-50/50 dark:bg-[#0B0F19]/60">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search employees, IDs, departments, contracts, documents..."
            className="w-full bg-transparent border-none text-sm text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-[#0B0F19] border border-slate-300 dark:border-[#1E293B] rounded">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              Type at least 2 characters to search across workforce, documents, and contracts.
            </div>
          ) : !hasAnyResults ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No results found for <span className="font-semibold text-slate-800 dark:text-slate-200">"{query}"</span>
            </div>
          ) : (
            <>
              {/* Employees Group */}
              {results.employees.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Employees ({results.employees.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.employees.map(emp => (
                      <div
                        key={emp.id}
                        onClick={() => {
                          navigate(`/employees/${emp.id}`);
                          onClose();
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1E293B]/70 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-[#1E293B] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={emp.avatar}
                            alt=""
                            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#0B0F19]"
                          />
                          <div>
                            <div className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                              <span>
                                {emp.firstName} {emp.lastName}
                              </span>
                              <span className="text-[10px] text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-1.5 py-0.5 rounded font-mono">
                                {emp.employeeId}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {emp.positionTitle} • {emp.departmentName}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Departments Group */}
              {results.departments.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Departments ({results.departments.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.departments.map(dept => (
                      <div
                        key={dept.id}
                        onClick={() => {
                          navigate('/departments');
                          onClose();
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1E293B]/70 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-[#1E293B] transition-colors"
                      >
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">{dept.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {dept.code} • {dept.employeeCount} Staff • Manager: {dept.managerName}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contracts Group */}
              {results.contracts.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Contracts ({results.contracts.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.contracts.map(cnt => (
                      <div
                        key={cnt.id}
                        onClick={() => {
                          navigate('/contracts');
                          onClose();
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1E293B]/70 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-[#1E293B] transition-colors"
                      >
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC] font-mono">
                            {cnt.contractNumber} - {cnt.employeeName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {cnt.type.toUpperCase()} • Status: {cnt.status}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents Group */}
              {results.documents.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Documents ({results.documents.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.documents.map(doc => (
                      <div
                        key={doc.id}
                        onClick={() => {
                          navigate('/documents');
                          onClose();
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1E293B]/70 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-[#1E293B] transition-colors"
                      >
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">{doc.title}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {doc.employeeName} • {doc.fileName} • Status: {doc.status}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drivers Group */}
              {results.drivers.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-amber-500" />
                    <span>سجل وقبض السواقين ({results.drivers.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.drivers.map(drv => (
                      <div
                        key={drv.id}
                        onClick={() => {
                          navigate('/driver-payouts');
                          onClose();
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-amber-50/50 dark:hover:bg-amber-950/20 cursor-pointer border border-transparent hover:border-amber-200 dark:hover:border-amber-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-xs">
                            <Truck className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">{drv.name}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {drv.code} • {drv.vehicleType} ({drv.vehicleNumber}) • {drv.defaultCategory === 'management' ? 'إدارة' : 'إنتاج'}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default GlobalSearchModal;
