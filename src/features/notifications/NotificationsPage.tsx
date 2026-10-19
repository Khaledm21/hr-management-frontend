import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, CheckCheck, ExternalLink, Filter, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';

export const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const { success } = useToast();

  const [filterType, setFilterType] = useState<string>('all');

  const filtered = notifications.filter(n => {
    if (filterType === 'unread') return !n.isRead;
    if (filterType === 'all') return true;
    return n.type === filterType;
  });

  const handleMarkAll = async () => {
    await markAllAsRead();
    success('All alerts marked as read.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            System notices, compliance alerts, and pending action items
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<CheckCheck className="w-4 h-4" />}
          onClick={handleMarkAll}
          disabled={unreadCount === 0}
        >
          Mark All as Read ({unreadCount})
        </Button>
      </div>

      <Card>
        <CardHeader className="py-3 px-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="contract_expiring">Contract Expirations</option>
              <option value="approval_required">Approvals Required</option>
              <option value="missing_document">Missing Documents</option>
              <option value="payroll_approval">Payroll Sign-offs</option>
            </select>
          </div>

          <span className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-800">{filtered.length}</span> notices
          </span>
        </CardHeader>

        <CardContent className="p-0 divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No notifications matching the selected filter.
            </div>
          ) : (
            filtered.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  markAsRead(item.id);
                  if (item.link) navigate(item.link);
                }}
                className={`p-4 flex items-start justify-between gap-4 transition-colors cursor-pointer ${
                  item.isRead ? 'hover:bg-slate-50' : 'bg-brand-50/40 hover:bg-brand-50/70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl mt-0.5 ${
                      item.priority === 'high'
                        ? 'bg-rose-50 text-rose-600'
                        : item.priority === 'medium'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-brand-50 text-brand-600'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                      {!item.isRead && <Badge variant="danger">New</Badge>}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                      <span>{item.timestamp}</span>
                      {item.link && (
                        <span className="text-brand-600 font-medium flex items-center gap-1">
                          View details <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!item.isRead && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      markAsRead(item.id);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-slate-600"
                    title="Mark as read"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
