/**
 * Customer Account Notifications Tab (Phase 35)
 * Displays transactional receipts, schedule changes, and security alerts.
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  ShoppingBag,
  Calendar,
  DollarSign,
  ShieldCheck,
  Clock,
  Trash2,
  ExternalLink,
  Info,
} from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { AppNotification } from '../../types/notification';
import { Button } from '../../components/ui/Button';

interface AccountNotificationsTabProps {
  userEmail: string;
  onNavigate: (path: string) => void;
}

export const AccountNotificationsTab: React.FC<AccountNotificationsTabProps> = ({
  userEmail,
  onNavigate,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const refresh = () => {
    const list = notificationService.getNotifications(userEmail, 'customer');
    setNotifications(list);
  };

  useEffect(() => {
    refresh();
    const unsub = notificationService.subscribe(refresh);
    return unsub;
  }, [userEmail]);

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead(userEmail, 'customer');
    refresh();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_confirmation':
        return <ShoppingBag className="w-5 h-5 text-blue-600" />;
      case 'booking_confirmation':
      case 'booking_update':
      case 'booking_cancellation':
        return <Calendar className="w-5 h-5 text-purple-600" />;
      case 'payment_confirmation':
      case 'payment_failure':
        return <DollarSign className="w-5 h-5 text-emerald-600" />;
      case 'registration':
      case 'password_reset':
        return <ShieldCheck className="w-5 h-5 text-amber-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <span>Account Notifications & Alerts</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time confirmations, schedule updates, tax invoice alerts, and security notifications.
          </p>
        </div>

        {notifications.some((n) => !n.readAt) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="text-xs font-bold gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Mark All as Read</span>
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Bell className="w-12 h-12 mx-auto text-slate-300 stroke-[1.2]" />
            <h3 className="text-sm font-bold text-slate-700">No Notifications</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When you place orders, book services, or receive payment receipts, notifications will appear here.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                notificationService.markAsRead(n.id);
                refresh();
                if (n.actionUrl) onNavigate(n.actionUrl);
              }}
              className={`p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-start gap-4 ${
                !n.readAt ? 'bg-blue-50/20' : 'bg-white'
              }`}
            >
              <div className="p-2.5 rounded-2xl bg-slate-100 shrink-0">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{n.title}</span>
                    {!n.readAt && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>

                {n.actionUrl && (
                  <div className="pt-1.5">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                      <span>View Details</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
