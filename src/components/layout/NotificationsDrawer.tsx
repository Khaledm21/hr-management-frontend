import React from 'react';
import { Drawer } from '../ui/Drawer';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Bell, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (id: string, link?: string) => {
    markAsRead(id);
    if (link) {
      navigate(link);
      onClose();
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-600" />
          <span>Notification Center</span>
          {unreadCount > 0 && (
            <Badge variant="danger">{unreadCount} New</Badge>
          )}
        </div>
      }
      subtitle="Operational alerts, pending approvals, and document notices"
      width="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
          >
            Mark All as Read
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              navigate('/notifications');
              onClose();
            }}
          >
            View All History
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No notifications at this time.
          </div>
        ) : (
          notifications.map(item => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item.id, item.link)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                item.isRead
                  ? 'bg-white border-slate-200/80 hover:bg-slate-50'
                  : 'bg-brand-50/50 border-brand-200 hover:bg-brand-50/80 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                  )}
                  <h4 className="text-xs font-semibold text-slate-900">{item.title}</h4>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {item.timestamp}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
              {item.link && (
                <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-brand-600">
                  <span>Open record</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Drawer>
  );
};
