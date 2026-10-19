import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDirection, LanguageCode } from '../../context/DirectionContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { demoAccounts } from '../../services/authService';
import { RoleType } from '../../types';
import {
  Menu,
  Search,
  Bell,
  Globe,
  ShieldAlert,
  LogOut,
  ChevronDown,
  UserCheck,
  Check,
} from 'lucide-react';
import { GlobalSearchModal } from './GlobalSearchModal';
import { NotificationsDrawer } from './NotificationsDrawer';
import { Avatar } from '../ui/Avatar';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useDirection();
  const { user, role, switchRole, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const languages: { code: LanguageCode; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ar', label: 'العربية (RTL)', flag: '🇸🇦' },
    { code: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  ];

  const handleRoleSelect = (newRole: RoleType) => {
    switchRole(newRole);
    setIsRoleMenuOpen(false);
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left side: Hamburger & Global Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search trigger bar */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-xs transition-colors w-48 sm:w-72"
        >
          <Search className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{t('common.globalSearch')}</span>
          <kbd className="hidden sm:inline-block ml-auto rtl:ml-0 rtl:mr-auto px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-400">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right side: Language, Demo Role Switcher, Notifications, User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => {
              setIsLangMenuOpen(!isLangMenuOpen);
              setIsRoleMenuOpen(false);
              setIsUserMenuOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="uppercase font-semibold">{language}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isLangMenuOpen && (
            <div className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-40 animate-in fade-in zoom-in-95">
              {languages.map(l => (
                <button
                  key={l.code}
                  onClick={() => {
                    changeLanguage(l.code);
                    setIsLangMenuOpen(false);
                  }}
                  className={`w-full text-left rtl:text-right px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    language === l.code ? 'font-bold text-brand-600 bg-brand-50/50' : 'text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </span>
                  {language === l.code && <Check className="w-3.5 h-3.5 text-brand-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Demo Role Switcher (Crucial for testing mock permissions) */}
        <div className="relative">
          <button
            onClick={() => {
              setIsRoleMenuOpen(!isRoleMenuOpen);
              setIsLangMenuOpen(false);
              setIsUserMenuOpen(false);
            }}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-xs font-semibold text-indigo-800 transition-colors"
            title="Switch demo persona to test RBAC"
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span className="capitalize">{role.replace('_', ' ')}</span>
            <ChevronDown className="w-3 h-3 text-indigo-400" />
          </button>

          {isRoleMenuOpen && (
            <div className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-40 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Demo Role Switcher (RBAC)
              </div>
              {demoAccounts.map(demo => (
                <button
                  key={demo.role}
                  onClick={() => handleRoleSelect(demo.role)}
                  className={`w-full text-left rtl:text-right p-2 rounded-lg text-xs transition-colors flex flex-col ${
                    role === demo.role ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{demo.label}</span>
                    {role === demo.role && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal mt-0.5">{demo.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Icon with Badge */}
        <button
          onClick={() => setIsNotifOpen(true)}
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 rtl:right-auto rtl:left-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
              setIsLangMenuOpen(false);
              setIsRoleMenuOpen(false);
            }}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Avatar name={user?.name || 'User'} src={user?.avatar} size="sm" />
            <div className="hidden lg:block text-left rtl:text-right">
              <span className="block text-xs font-semibold text-slate-900 leading-tight">
                {user?.name}
              </span>
              <span className="block text-[10px] text-slate-500 capitalize">
                {user?.role.replace('_', ' ')}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden lg:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <p className="text-[10px] text-brand-600 font-medium capitalize mt-0.5">
                  {user?.department}
                </p>
              </div>

              {/* Mobile Role Switcher Item */}
              <div className="md:hidden px-3 py-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Role:</span>
                <span className="ml-1 text-xs font-semibold text-indigo-700 capitalize">
                  {role.replace('_', ' ')}
                </span>
              </div>

              <button
                onClick={logout}
                className="w-full text-left rtl:text-right px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Notification Drawer */}
      <NotificationsDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </header>
  );
};
