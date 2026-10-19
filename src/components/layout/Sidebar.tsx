import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDirection } from '../../context/DirectionContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileText,
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

  const navGroups: NavGroup[] = [
    {
      id: 'people',
      labelKey: 'nav.people',
      items: [
        { to: '/employees', labelKey: 'nav.employees', icon: <Users className="w-4 h-4" />, module: 'employees' },
        { to: '/departments', labelKey: 'nav.departments', icon: <Building2 className="w-4 h-4" /> },
        { to: '/positions', labelKey: 'nav.positions', icon: <Briefcase className="w-4 h-4" /> },
      ],
    },
    {
      id: 'documents',
      labelKey: 'nav.documents',
      items: [
        { to: '/documents', labelKey: 'nav.employeeDocuments', icon: <FileText className="w-4 h-4" />, module: 'documents' },
        { to: '/insurance', labelKey: 'nav.insurance', icon: <ShieldCheck className="w-4 h-4" />, module: 'insurance' },
      ],
    },
    {
      id: 'employment',
      labelKey: 'nav.employment',
      items: [
        { to: '/contracts', labelKey: 'nav.contracts', icon: <FileCheck className="w-4 h-4" />, module: 'contracts' },
        { to: '/employment-history', labelKey: 'nav.history', icon: <History className="w-4 h-4" /> },
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
          'fixed inset-y-0 z-40 flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out border-slate-800 shadow-xl lg:static',
          isRtl ? 'right-0 border-l' : 'left-0 border-r',
          isCollapsed ? 'w-20' : 'w-64',
          isOpen ? 'translate-x-0' : isRtl ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20 font-bold">
              <Building className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="block text-sm font-bold text-white tracking-tight">ApexHR</span>
                <span className="block text-[10px] text-slate-400 font-medium">Enterprise Suite</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Dashboard item */}
          <div>
            <NavLink
              to="/dashboard"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                )
              }
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>{t('nav.dashboard')}</span>}
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
                    className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
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
                  <div className="h-px bg-slate-800 my-2" />
                )}

                {(isExpanded || isCollapsed) && (
                  <div className="space-y-1">
                    {visibleItems.map(item => {
                      const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={onClose}
                          title={isCollapsed ? t(item.labelKey) : undefined}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                            isActive
                              ? 'bg-brand-600 text-white shadow-sm'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          )}
                        >
                          <span className="shrink-0">{item.icon}</span>
                          {!isCollapsed && <span className="truncate">{t(item.labelKey)}</span>}
                          {!isCollapsed && item.badge && (
                            <span className="ml-auto rtl:ml-0 rtl:mr-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-700 text-slate-200">
                              {item.badge}
                            </span>
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
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t('nav.workflow')}
              </div>
            )}
            <NavLink
              to="/approvals"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <CheckSquare className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>{t('nav.approvals')}</span>}
            </NavLink>
            <NavLink
              to="/reports"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>{t('nav.reports')}</span>}
            </NavLink>
          </div>
        </div>

        {/* Footer info in sidebar */}
        {!isCollapsed && (
          <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
            <div>
              <span className="block font-semibold text-slate-300">Apex Enterprise Co.</span>
              <span className="text-[10px] text-slate-500">v2.4.0 (Frontend Only)</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Operational" />
          </div>
        )}
      </aside>
    </>
  );
};
