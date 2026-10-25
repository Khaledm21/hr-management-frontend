import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDirection } from '../../context/DirectionContext';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileText,
  Files,
  ShieldCheck,
  FileCheck,
  History,
  Clock,
  CalendarDays,
  Scale,
  CreditCard,
  Banknote,
  Truck,
  CheckSquare,
  BarChart3,
  UserCheck,
  KeyRound,
  Settings,
  ScrollText,
  ChevronDown,
  Building,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  to: string;
  labelKey: string;
  icon: React.ReactNode;
  module?: string;
  badge?: string | number;
}

interface NavGroup {
  id: string;
  labelKey: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { isRtl } = useDirection();
  const { can } = useAuth();
  const { companyName, logo } = useCompany();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    people: true,
    documents: true,
    employment: true,
    attendanceLeave: true,
    payroll: true,
    admin: true,
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleNavClick = () => {
    onClose();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  };

  const navGroups: NavGroup[] = [
    {
      id: 'people',
      labelKey: 'nav.people',
      items: [
        { to: '/employees', labelKey: 'nav.employees', icon: <Users className="w-4 h-4" />, module: 'employees' },
        { to: '/departments', labelKey: 'nav.departments', icon: <Building2 className="w-4 h-4" />, module: 'employees' },
        { to: '/positions', labelKey: 'nav.positions', icon: <Briefcase className="w-4 h-4" />, module: 'employees' },
      ],
    },
    {
      id: 'documents',
      labelKey: 'nav.documents',
      items: [
        { to: '/documents', labelKey: 'nav.employeeDocuments', icon: <FileText className="w-4 h-4" />, module: 'documents' },
        { to: '/forms-templates', labelKey: 'nav.formTemplates', icon: <Files className="w-4 h-4" />, module: 'documents' },
        { to: '/insurance', labelKey: 'nav.insurance', icon: <ShieldCheck className="w-4 h-4" />, module: 'insurance' },
      ],
    },
    {
      id: 'employment',
      labelKey: 'nav.employment',
      items: [
        { to: '/contracts', labelKey: 'nav.contracts', icon: <FileCheck className="w-4 h-4" />, module: 'contracts' },
        { to: '/employment-history', labelKey: 'nav.history', icon: <History className="w-4 h-4" />, module: 'contracts' },
      ],
    },
    {
      id: 'attendanceLeave',
      labelKey: 'nav.attendanceLeave',
      items: [
        { to: '/attendance', labelKey: 'nav.attendance', icon: <Clock className="w-4 h-4" />, module: 'attendance' },
        { to: '/leave', labelKey: 'nav.leaveRequests', icon: <CalendarDays className="w-4 h-4" />, module: 'leave' },
        { to: '/leave/balances', labelKey: 'nav.leaveBalances', icon: <Scale className="w-4 h-4" />, module: 'leave' },
      ],
    },
    {
      id: 'payroll',
      labelKey: 'nav.payrollSection',
      items: [
        { to: '/payroll', labelKey: 'nav.payroll', icon: <CreditCard className="w-4 h-4" />, module: 'payroll' },
        { to: '/advances', labelKey: 'nav.advances', icon: <Banknote className="w-4 h-4" />, module: 'advances' },
        { to: '/driver-payouts', labelKey: 'nav.drivers', icon: <Truck className="w-4 h-4" />, module: 'payroll' },
      ],
    },
    {
      id: 'admin',
      labelKey: 'nav.admin',
      items: [
        { to: '/users', labelKey: 'nav.users', icon: <UserCheck className="w-4 h-4" />, module: 'users' },
        { to: '/roles', labelKey: 'nav.roles', icon: <KeyRound className="w-4 h-4" />, module: 'users' },
        { to: '/settings', labelKey: 'nav.settings', icon: <Settings className="w-4 h-4" />, module: 'settings' },
        { to: '/audit-logs', labelKey: 'nav.auditLogs', icon: <ScrollText className="w-4 h-4" />, module: 'audit_logs' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 z-40 flex flex-col bg-white dark:bg-[#0F172A] text-[#172033] dark:text-[#F8FAFC] transition-all duration-300 ease-in-out border-[#E2E8F0] dark:border-[#1E293B] shadow-sm lg:static',
          isRtl ? 'right-0 border-l' : 'left-0 border-r',
          isCollapsed ? 'w-20' : 'w-64',
          isOpen ? 'translate-x-0' : isRtl ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-3.5 border-b border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-[#1E293B] p-1 shadow-2xs border border-[#E2E8F0] dark:border-[#334155] overflow-hidden">
              <img
                src={logo}
                alt="New Hope Logo"
                className="h-full w-full object-contain"
              />
            </div>
            {!isCollapsed && (
              <div className="truncate min-w-0" title={companyName}>
                <span className="block text-xs font-bold text-[#172033] dark:text-[#F8FAFC] tracking-tight truncate leading-tight">
                  {companyName}
                </span>
                <span className="block text-[10px] text-[#0878D1] dark:text-[#38BDF8] font-bold tracking-wide uppercase mt-0.5">
                  {isRtl ? 'إدارة الموارد البشرية' : 'Enterprise HR Suite'}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* Main Dashboard item */}
          <div>
            <NavLink
              to="/dashboard"
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative',
                  isActive
                    ? 'bg-[#E8F3FF] dark:bg-[#1E293B] text-[#0878D1] dark:text-[#38BDF8] shadow-2xs font-bold'
                    : 'text-[#172033] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/60 hover:text-[#0878D1] dark:hover:text-[#F8FAFC]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <LayoutDashboard className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-[#0878D1] dark:text-[#38BDF8]' : 'text-[#94A3B8] dark:text-[#64748B] group-hover:text-[#0878D1] dark:group-hover:text-[#38BDF8]')} />
                  {!isCollapsed && <span>{t('nav.dashboard')}</span>}
                  {isActive && !isCollapsed && (
                    <span className={cn('absolute top-2 bottom-2 w-1 bg-[#0878D1] dark:bg-[#38BDF8] rounded-full', isRtl ? 'right-0' : 'left-0')} />
                  )}
                </>
              )}
            </NavLink>
          </div>

          {/* Grouped sections */}
          {navGroups.map(group => {
            // Filter by permission
            const visibleItems = group.items.filter(
              item => !item.module || can(item.module, 'view')
            );
            if (visibleItems.length === 0) return null;

            const isExpanded = expandedGroups[group.id] !== false;

            return (
              <div key={group.id} className="space-y-1">
                {!isCollapsed ? (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B] hover:text-[#64748B] dark:hover:text-[#94A3B8] transition-colors"
                  >
                    <span>{t(group.labelKey)}</span>
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 transition-transform duration-200',
                        !isExpanded && (isRtl ? 'rotate-90' : '-rotate-90')
                      )}
                    />
                  </button>
                ) : (
                  <div className="h-px bg-[#E2E8F0] dark:bg-[#1E293B] my-2" />
                )}

                {(isExpanded || isCollapsed) && (
                  <div className="space-y-0.5">
                    {visibleItems.map(item => {
                      const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={handleNavClick}
                          title={isCollapsed ? t(item.labelKey) : undefined}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all group relative',
                            isActive
                              ? 'bg-[#E8F3FF] dark:bg-[#1E293B] text-[#0878D1] dark:text-[#38BDF8] font-bold shadow-2xs'
                              : 'text-[#172033] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/60 hover:text-[#0878D1] dark:hover:text-[#F8FAFC] font-medium'
                          )}
                        >
                          <span className={cn('shrink-0 transition-colors', isActive ? 'text-[#0878D1] dark:text-[#38BDF8]' : 'text-[#94A3B8] dark:text-[#64748B] group-hover:text-[#0878D1] dark:group-hover:text-[#38BDF8]')}>
                            {item.icon}
                          </span>
                          {!isCollapsed && <span className="truncate">{t(item.labelKey)}</span>}
                          {!isCollapsed && item.badge && (
                            <span className="ml-auto rtl:ml-0 rtl:mr-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#E8F3FF] dark:bg-[#1E293B] text-[#0878D1] dark:text-[#38BDF8] border border-[#BFDBFE] dark:border-[#334155]">
                              {item.badge}
                            </span>
                          )}
                          {isActive && !isCollapsed && (
                            <span className={cn('absolute top-1.5 bottom-1.5 w-1 bg-[#0878D1] dark:bg-[#38BDF8] rounded-full', isRtl ? 'right-0' : 'left-0')} />
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Workflow & Reports */}
          {(can('approvals', 'view') || can('reports', 'view')) && (
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">
                  {t('nav.workflow')}
                </div>
              )}
              {can('approvals', 'view') && (
                <NavLink
                  to="/approvals"
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all group relative',
                      isActive ? 'bg-[#E8F3FF] dark:bg-[#1E293B] text-[#0878D1] dark:text-[#38BDF8] font-bold shadow-2xs' : 'text-[#172033] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/60 hover:text-[#0878D1] dark:hover:text-[#F8FAFC] font-medium'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <CheckSquare className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-[#0878D1] dark:text-[#38BDF8]' : 'text-[#94A3B8] dark:text-[#64748B] group-hover:text-[#0878D1] dark:group-hover:text-[#38BDF8]')} />
                      {!isCollapsed && <span>{t('nav.approvals')}</span>}
                      {isActive && !isCollapsed && (
                        <span className={cn('absolute top-1.5 bottom-1.5 w-1 bg-[#0878D1] dark:bg-[#38BDF8] rounded-full', isRtl ? 'right-0' : 'left-0')} />
                      )}
                    </>
                  )}
                </NavLink>
              )}
              {can('reports', 'view') && (
                <NavLink
                  to="/reports"
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all group relative',
                      isActive ? 'bg-[#E8F3FF] dark:bg-[#1E293B] text-[#0878D1] dark:text-[#38BDF8] font-bold shadow-2xs' : 'text-[#172033] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/60 hover:text-[#0878D1] dark:hover:text-[#F8FAFC] font-medium'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <BarChart3 className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-[#0878D1] dark:text-[#38BDF8]' : 'text-[#94A3B8] dark:text-[#64748B] group-hover:text-[#0878D1] dark:group-hover:text-[#38BDF8]')} />
                      {!isCollapsed && <span>{t('nav.reports')}</span>}
                      {isActive && !isCollapsed && (
                        <span className={cn('absolute top-1.5 bottom-1.5 w-1 bg-[#0878D1] dark:bg-[#38BDF8] rounded-full', isRtl ? 'right-0' : 'left-0')} />
                      )}
                    </>
                  )}
                </NavLink>
              )}
            </div>
          )}
        </div>

        {/* Footer info in sidebar */}
        {!isCollapsed && (
          <div className="p-3.5 border-t border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#0B0F19] text-[11px] text-[#64748B] dark:text-[#94A3B8] flex items-center justify-between">
            <div>
              <span className="block font-bold text-[#172033] dark:text-[#F8FAFC] truncate" title={companyName}>{companyName}</span>
              <span className="text-[10px] text-[#94A3B8] dark:text-[#64748B]">v2.5.0 (Live Connected)</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Operational" />
          </div>
        )}
      </aside>
    </>
  );
};
