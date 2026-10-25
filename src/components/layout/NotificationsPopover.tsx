import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../../context/NotificationContext';
import { useDirection } from '../../context/DirectionContext';
import { NotificationItem } from '../../types';
import {
  Bell,
  CheckCheck,
  ExternalLink,
  ShieldAlert,
  Truck,
  FileCheck,
  Calendar,
  Shield,
  X,
  ArrowRight,
  ArrowLeft,
  Trash2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { language, direction } = useDirection();
  const isRTL = direction === 'rtl';
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAllNotifications,
    restoreAllDismissed,
  } = useNotifications();
  const navigate = useNavigate();
  const popoverRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'all' | 'warning' | 'reminder' | 'unread'>('all');

  // Close on click outside or escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getLocalizedTitle = (item: NotificationItem) => {
    if (language === 'ar') return item.titleAr || item.title;
    if (language === 'zh-CN') return item.titleZh || item.title;
    return item.title;
  };

  const getLocalizedMessage = (item: NotificationItem) => {
    if (language === 'ar') return item.messageAr || item.message;
    if (language === 'zh-CN') return item.messageZh || item.message;
    return item.message;
  };

  const getLocalizedTimestamp = (item: NotificationItem) => {
    if (language === 'ar') return item.timestampAr || item.timestamp;
    return item.timestamp;
  };

  const getTypeIcon = (type: NotificationItem['type'], category?: NotificationItem['category']) => {
    if (category === 'warning' || type === 'missing_document') {
      return <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
    }
    if (category === 'reminder' || type === 'driver_payout') {
      return <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
    if (type === 'contract_expiring') {
      return <FileCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
    if (type === 'leave_pending') {
      return <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
    }
    return <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
  };

  const getTypeBackground = (type: NotificationItem['type'], category?: NotificationItem['category']) => {
    if (category === 'warning' || type === 'missing_document') {
      return 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60';
    }
    if (category === 'reminder' || type === 'driver_payout') {
      return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60';
    }
    if (type === 'contract_expiring') {
      return 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60';
    }
    if (type === 'leave_pending') {
      return 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900/60';
    }
    return 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60';
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'warning') return n.category === 'warning' || n.priority === 'high';
    if (activeTab === 'reminder') return n.category === 'reminder' || n.type === 'driver_payout';
    return true;
  });

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.link) {
      navigate(item.link);
      onClose();
    }
  };

  return (
    <div
      id="notifications-popover"
      ref={popoverRef}
      className={`absolute top-full mt-2.5 z-50 w-[360px] sm:w-[440px] max-w-[calc(100vw-24px)] bg-white dark:bg-[#151D2E] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-[#1E293B] overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ${
        isRTL ? 'left-0' : 'right-0'
      }`}
    >
      {/* Top Header */}
      <div className="px-4 py-3.5 border-b border-slate-100 dark:border-[#1E293B] bg-gradient-to-r from-slate-50 via-white to-brand-50/20 dark:from-[#0B0F19] dark:via-[#151D2E] dark:to-[#0B0F19]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-500/20 shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] leading-tight">
                  {language === 'ar' ? 'مركز التنبيهات والتحذيرات' : 'Live Alerts & Reminders'}
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white shadow-xs">
                    {unreadCount} {language === 'ar' ? 'جديد' : 'New'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {language === 'ar'
                  ? 'تحذيرات حقيقية وتذكيرات بمواعيد من قاعدة البيانات'
                  : 'Live calculated alerts & deadlines from database'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
            title={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-[#1E293B] overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E293B] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            {language === 'ar' ? `الكل (${notifications.length})` : `All (${notifications.length})`}
          </button>
          <button
            onClick={() => setActiveTab('warning')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'warning'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E293B] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            {language === 'ar' ? 'تحذيرات ونواقص' : 'Warnings'}
          </button>
          <button
            onClick={() => setActiveTab('reminder')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reminder'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E293B] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            {language === 'ar' ? 'تذكيرات بمواعيد' : 'Reminders'}
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'unread'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E293B] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            {language === 'ar' ? `غير مقروءة (${unreadCount})` : `Unread (${unreadCount})`}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100/80 dark:divide-[#1E293B] p-2 space-y-1.5 custom-scrollbar">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mx-auto flex items-center justify-center mb-2.5">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
              {language === 'ar' ? 'لا توجد تنبيهات أو تحذيرات معلقة حالياً' : 'All clear! No pending alerts'}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[260px] mx-auto leading-relaxed">
              {language === 'ar'
                ? 'كافة ملفات الموظفين والتأمينات ودورات السائقين منتظمة أو تم استبعاد تنبيهاتها.'
                : 'All employee records, insurance files, and driver payouts are up to date.'}
            </p>
            <button
              onClick={restoreAllDismissed}
              className="mt-3 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{language === 'ar' ? 'إعادة فحص قاعدة البيانات' : 'Re-check database'}</span>
            </button>
          </div>
        ) : (
          filteredNotifications.map(item => {
            const isUnread = !item.isRead;
            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                  isUnread
                    ? 'bg-brand-50/35 dark:bg-brand-950/25 border-brand-200/90 dark:border-brand-900/60 shadow-xs hover:bg-brand-50/60 dark:hover:bg-brand-950/40'
                    : 'bg-white dark:bg-[#151D2E] border-slate-100 dark:border-[#1E293B] hover:bg-slate-50/80 dark:hover:bg-[#1E293B]/70 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Type Icon Badge */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${getTypeBackground(
                      item.type,
                      item.category
                    )}`}
                  >
                    {getTypeIcon(item.type, item.category)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-brand-600 dark:bg-brand-400 shrink-0 ring-2 ring-brand-200 dark:ring-brand-900/50" />
                        )}
                        <h4
                          className={`text-xs truncate ${
                            isUnread ? 'font-bold text-slate-900 dark:text-[#F8FAFC]' : 'font-semibold text-slate-700 dark:text-slate-300'
                          }`}
                          title={getLocalizedTitle(item)}
                        >
                          {getLocalizedTitle(item)}
                        </h4>
                      </div>

                      {/* Dismiss (✕) Button */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          dismissNotification(item.id);
                        }}
                        className="p-1 rounded-md text-slate-300 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                        title={language === 'ar' ? 'استبعاد / مسح هذا الإشعار' : 'Dismiss notification'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {getLocalizedMessage(item)}
                    </p>

                    {/* Bottom Metadata & Quick Link */}
                    <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-slate-100/60 dark:border-[#1E293B]">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={
                            item.category === 'warning' || item.priority === 'high'
                              ? 'danger'
                              : item.category === 'reminder'
                              ? 'warning'
                              : 'secondary'
                          }
                        >
                          {item.category === 'warning'
                            ? language === 'ar'
                              ? 'تحذير'
                              : 'Warning'
                            : item.category === 'reminder'
                            ? language === 'ar'
                              ? 'تذكير بموعد'
                              : 'Reminder'
                            : language === 'ar'
                            ? 'أمان'
                            : 'Security'}
                        </Badge>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {getLocalizedTimestamp(item)}
                        </span>
                      </div>

                      {item.link && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                          <span>
                            {language === 'ar'
                              ? 'الانتقال للحل'
                              : language === 'zh-CN'
                              ? '前往处理'
                              : 'Take Action'}
                          </span>
                          {isRTL ? (
                            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                          ) : (
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#0B0F19] border-t border-slate-100 dark:border-[#1E293B] flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>{language === 'ar' ? 'تحديد كمقروء' : 'Mark as read'}</span>
          </button>

          <button
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title={language === 'ar' ? 'مسح كافة التنبيهات من القائمة' : 'Clear all alerts'}
          >
            <Trash2 className="w-3 h-3" />
            <span>{language === 'ar' ? 'مسح الكل' : 'Clear all'}</span>
          </button>
        </div>

        <button
          onClick={() => {
            navigate('/notifications');
            onClose();
          }}
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors cursor-pointer"
        >
          <span>{language === 'ar' ? 'الأرشيف الكامل' : 'All history'}</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
export default NotificationsPopover;
