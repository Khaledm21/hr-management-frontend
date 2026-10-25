import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDirection, LanguageCode } from '../../context/DirectionContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Menu,
  Search,
  Bell,
  Globe,
  LogOut,
  ChevronDown,
  Check,
  User,
} from 'lucide-react';
import { GlobalSearchModal } from './GlobalSearchModal';
import { NotificationsPopover } from './NotificationsPopover';
import { UserProfileModal } from '../../features/auth/UserProfileModal';
import { Avatar } from '../ui/Avatar';

import { ThemeToggle } from '../ui/ThemeToggle';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useDirection();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const languages: { code: LanguageCode; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ar', label: 'العربية (RTL)', flag: '🇸🇦' },
    { code: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  ];

  return (
    <header className="h-16 border-b border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 transition-colors duration-200">
      {/* Left side: Hamburger & Global Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0878D1] dark:hover:text-[#38BDF8] hover:bg-[#F0F7FF] dark:hover:bg-[#1E293B] rounded-xl lg:hidden transition-colors cursor-pointer"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search trigger bar */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F1F5F9]/80 dark:bg-[#1E293B] hover:bg-[#F0F7FF] dark:hover:bg-[#334155] hover:border-[#BFDBFE] dark:hover:border-[#38BDF8]/40 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0878D1] dark:hover:text-[#38BDF8] text-xs transition-all w-48 sm:w-72 cursor-pointer shadow-2xs group"
        >
          <Search className="w-3.5 h-3.5 shrink-0 text-[#94A3B8] group-hover:text-[#0878D1] dark:group-hover:text-[#38BDF8] transition-colors" />
          <span className="truncate">{t('common.globalSearch')}</span>
          <kbd className="hidden sm:inline-block ml-auto rtl:ml-0 rtl:mr-auto px-1.5 py-0.5 text-[10px] font-mono text-[#94A3B8] dark:text-[#64748B] bg-white dark:bg-[#0B0F19] border border-[#E2E8F0] dark:border-[#334155] rounded-md shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right side: Theme Toggle, Language, Notifications, User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Reusable Theme Toggle Switcher */}
        <ThemeToggle variant="icon" />

        {/* Language Picker Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsLangMenuOpen(!isLangMenuOpen);
              setIsUserMenuOpen(false);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F0F7FF] dark:hover:bg-[#334155] hover:border-[#BFDBFE] dark:hover:border-[#38BDF8]/40 hover:text-[#0878D1] dark:hover:text-[#38BDF8] text-xs text-[#172033] dark:text-[#F8FAFC] transition-all cursor-pointer shadow-2xs"
          >
            <Globe className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span className="uppercase font-bold">{language}</span>
            <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
          </button>

          {isLangMenuOpen && (
            <div className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-1.5 w-44 bg-white dark:bg-[#151D2E] rounded-2xl shadow-xl border border-[#E2E8F0] dark:border-[#1E293B] py-1.5 z-40 animate-in fade-in zoom-in-95">
              {languages.map(l => (
                <button
                  key={l.code}
                  onClick={() => {
                    changeLanguage(l.code);
                    setIsLangMenuOpen(false);
                  }}
                  className={`w-full text-left rtl:text-right px-3 py-2 text-xs flex items-center justify-between hover:bg-[#F0F7FF] dark:hover:bg-[#1E293B] transition-colors cursor-pointer ${
                    language === l.code ? 'font-bold text-[#0878D1] dark:text-[#38BDF8] bg-[#E8F3FF] dark:bg-[#1E293B]/70' : 'text-[#172033] dark:text-[#F8FAFC]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </span>
                  {language === l.code && <Check className="w-3.5 h-3.5 text-[#0878D1] dark:text-[#38BDF8]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Icon with Badge & Popover */}
        <div className="relative">
          <button
            id="notifications-bell-btn"
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsLangMenuOpen(false);
              setIsUserMenuOpen(false);
            }}
            className={`relative p-2 rounded-xl transition-all cursor-pointer border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-2xs ${
              isNotifOpen
                ? 'text-[#0878D1] dark:text-[#38BDF8] bg-[#E8F3FF] dark:bg-[#1E293B] ring-1 ring-[#BFDBFE] dark:ring-[#38BDF8]/40'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0878D1] dark:hover:text-[#38BDF8] hover:bg-[#F0F7FF] dark:hover:bg-[#334155]'
            }`}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 rtl:right-auto rtl:left-1.5 w-2 h-2 rounded-full bg-[#E11D48] ring-2 ring-white dark:ring-[#0F172A] animate-pulse" />
            )}
          </button>

          {/* Floating Notifications Popover */}
          <NotificationsPopover
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
          />
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setIsUserMenuOpen(!isUserMenuOpen);
              setIsLangMenuOpen(false);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#F0F7FF] dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
          >
            <Avatar name={user?.name || 'User'} src={user?.avatar} size="sm" />
            <div className="hidden lg:block text-left rtl:text-right">
              <span className="block text-xs font-bold text-[#172033] dark:text-[#F8FAFC] leading-tight">
                {user?.name}
              </span>
              <span className="block text-[10px] text-[#0878D1] dark:text-[#38BDF8] font-bold uppercase">
                {user?.role.replace('_', ' ')}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-[#94A3B8] hidden lg:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-1.5 w-56 bg-white dark:bg-[#151D2E] rounded-2xl shadow-xl border border-[#E2E8F0] dark:border-[#1E293B] py-1.5 z-40 animate-in fade-in zoom-in-95">
              <div className="px-3.5 py-2.5 border-b border-[#E2E8F0] dark:border-[#1E293B]">
                <p className="text-xs font-bold text-[#172033] dark:text-[#F8FAFC]">{user?.name}</p>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F3FF] dark:bg-[#1E293B] text-[#0878D1] dark:text-[#38BDF8] uppercase border border-[#BFDBFE] dark:border-[#334155]">
                    {user?.role.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-[#94A3B8] dark:text-[#64748B]">
                    {user?.department}
                  </span>
                </div>
              </div>

              <div className="py-1 border-b border-[#E2E8F0] dark:border-[#1E293B]">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full text-left rtl:text-right px-3.5 py-2 text-xs text-[#172033] dark:text-[#F8FAFC] hover:bg-[#F0F7FF] dark:hover:bg-[#1E293B] hover:text-[#0878D1] dark:hover:text-[#38BDF8] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#0878D1] dark:text-[#38BDF8]" />
                  <span className="font-semibold">{t('profile.myProfile', 'الملف الشخصي وإعدادات الحساب')}</span>
                </button>
              </div>

              <button
                onClick={logout}
                className="w-full text-left rtl:text-right px-3.5 py-2 text-xs text-[#E11D48] hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('auth.signOut', 'تسجيل الخروج')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* User Profile & Account Settings Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </header>
  );
};
