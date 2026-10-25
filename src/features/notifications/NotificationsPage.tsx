import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { useDirection } from '../../context/DirectionContext';
import { NotificationItem } from '../../types';
import {
  Bell,
  CheckCheck,
  Filter,
  CheckCircle2,
  Truck,
  ShieldAlert,
  FileCheck,
  Calendar,
  Shield,
  ArrowRight,
  ArrowLeft,
  X,
  Trash2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';

export const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { language, direction } = useDirection();
  const isRTL = direction === 'rtl';
  const navigate = useNavigate();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    unreadCount,
    dismissNotification,
    clearAllNotifications,
    restoreAllDismissed,
  } = useNotifications();
  const { success } = useToast();

  const [filterType, setFilterType] = useState<string>('all');

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
      return <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
    }
    if (category === 'reminder' || type === 'driver_payout') {
      return <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    }
    if (type === 'contract_expiring') {
      return <FileCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    }
    if (type === 'leave_pending') {
      return <Calendar className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
    }
    return <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
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

  const filtered = notifications.filter(n => {
    if (filterType === 'unread') return !n.isRead;
    if (filterType === 'warning') return n.category === 'warning' || n.priority === 'high';
    if (filterType === 'reminder') return n.category === 'reminder' || n.type === 'driver_payout';
    if (filterType === 'all') return true;
    return n.type === filterType;
  });

  const handleMarkAll = async () => {
    await markAllAsRead();
    success(
      language === 'ar'
        ? 'تم تحديد كافة التنبيهات كمقروءة.'
        : language === 'zh-CN'
        ? '已将所有通知标记为已读'
        : 'All alerts marked as read.'
    );
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
    success(
      language === 'ar'
        ? 'تم مسح كافة التنبيهات من القائمة.'
        : 'All alerts cleared.'
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>{language === 'ar' ? 'سجل التنبيهات والتحذيرات الرقابية' : 'Live Alerts & Reminders Center'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ar'
              ? 'تنبيهات حقيقية محسوبة ديناميكياً من قاعدة البيانات (نواقص ملفات التأمينات، دفعات السائقين، والرقابة)'
              : 'Live dynamic alerts and deadlines calculated directly from real database records'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Trash2 className="w-4 h-4 text-rose-500" />}
              onClick={handleClearAll}
            >
              {language === 'ar' ? 'مسح كافة التنبيهات' : 'Clear All'}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            leftIcon={<CheckCheck className="w-4 h-4" />}
            onClick={handleMarkAll}
            disabled={unreadCount === 0}
          >
            {language === 'ar'
              ? `تحديد كمقروء (${unreadCount})`
              : `Mark All Read (${unreadCount})`}
          </Button>
        </div>
      </div>

      <Card className="bg-white dark:bg-[#151D2E] border-slate-200 dark:border-[#1E293B]">
        <CardHeader className="py-3.5 px-5 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0B0F19]/50 border-b border-slate-100 dark:border-[#1E293B]">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-300 dark:border-[#1E293B] bg-white dark:bg-[#0B0F19] px-3 py-1.5 text-slate-700 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer shadow-xs [&>option]:bg-white [&>option]:dark:bg-[#151D2E]"
            >
              <option value="all">
                {language === 'ar' ? 'كافة التنبيهات' : 'All Alerts'}
              </option>
              <option value="warning">
                {language === 'ar' ? 'تحذيرات ونواقص قانونية' : 'Warnings'}
              </option>
              <option value="reminder">
                {language === 'ar' ? 'تذكيرات بمواعيد ودفعات' : 'Reminders'}
              </option>
              <option value="unread">
                {language === 'ar' ? 'غير المقروءة فقط' : 'Unread Only'}
              </option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {language === 'ar' ? 'إجمالي المعروض:' : 'Showing:'}{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{filtered.length}</span>{' '}
              {language === 'ar' ? 'تنبيه' : 'notices'}
            </span>

            {notifications.length === 0 && (
              <button
                onClick={restoreAllDismissed}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'إعادة الفحص من قاعدة البيانات' : 'Re-check DB'}</span>
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 divide-y divide-slate-100 dark:divide-[#1E293B]">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mx-auto flex items-center justify-center mb-3">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                {language === 'ar' ? 'لا توجد أي تحذيرات أو تنبيهات معلقة حالياً' : 'All clear! No pending alerts'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[320px] mx-auto leading-relaxed">
                {language === 'ar'
                  ? 'كافة ملفات الموظفين والتأمينات ودورات السائقين منتظمة بنجاح، أو تم استبعاد تنبيهاتها.'
                  : 'All employee compliance files and driver cycles are in order or have been dismissed.'}
              </p>
              <button
                onClick={restoreAllDismissed}
                className="mt-4 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer bg-brand-50 dark:bg-brand-950/40 px-3 py-1.5 rounded-lg border border-brand-200 dark:border-brand-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'إعادة فحص قاعدة البيانات الآن' : 'Re-check database now'}</span>
              </button>
            </div>
          ) : (
            filtered.map(item => {
              const isUnread = !item.isRead;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    markAsRead(item.id);
                    if (item.link) navigate(item.link);
                  }}
                  className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors cursor-pointer group ${
                    isUnread
                      ? 'bg-brand-50/30 dark:bg-brand-950/20 hover:bg-brand-50/60 dark:hover:bg-brand-950/40'
                      : 'hover:bg-slate-50/80 dark:hover:bg-[#1E293B]/40 bg-white dark:bg-[#151D2E]'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl border shrink-0 mt-0.5 shadow-xs ${getTypeBackground(
                        item.type,
                        item.category
                      )}`}
                    >
                      {getTypeIcon(item.type, item.category)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-brand-600 dark:bg-brand-400 ring-2 ring-brand-200 dark:ring-brand-900/50" />
                        )}
                        <h3
                          className={`text-sm truncate ${
                            isUnread ? 'font-bold text-slate-900 dark:text-[#F8FAFC]' : 'font-semibold text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {getLocalizedTitle(item)}
                        </h3>

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
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                        {getLocalizedMessage(item)}
                      </p>

                      <div className="mt-3 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {getLocalizedTimestamp(item)}
                        </span>
                        {item.link && (
                          <span className="text-brand-600 dark:text-brand-400 font-semibold inline-flex items-center gap-1 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                            <span>
                              {language === 'ar'
                                ? 'الانتقال للحل والمعالجة'
                                : language === 'zh-CN'
                                ? '前往处理'
                                : 'Take Action'}
                            </span>
                            {isRTL ? (
                              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                            ) : (
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side item actions: Dismiss ✕ and Mark as read */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isUnread && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          markAsRead(item.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors cursor-pointer"
                        title={language === 'ar' ? 'تحديد كمقروء' : 'Mark as read'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        dismissNotification(item.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-300 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title={language === 'ar' ? 'استبعاد / إغلاق هذا التنبيه' : 'Dismiss notification'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default NotificationsPage;
