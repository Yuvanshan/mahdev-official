/**
 * Admin Notification Center (Phase 35)
 * Live operational alerts feed for orders, bookings, payments, stock alerts, and inquiries.
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  Trash2,
  ExternalLink,
  ShoppingBag,
  Calendar,
  DollarSign,
  UserPlus,
  AlertTriangle,
  Mail,
  FileText,
  Clock,
  X,
} from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { AppNotification } from '../../types/notification';

interface AdminNotificationCenterProps {
  onNavigate?: (path: string) => void;
}

export const AdminNotificationCenter: React.FC<AdminNotificationCenterProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = () => {
    const list = notificationService.getNotifications(undefined, 'admin');
    setNotifications(list);
    setUnreadCount(notificationService.getUnreadCount(undefined, 'admin'));
  };

  useEffect(() => {
    refresh();
    const unsub = notificationService.subscribe(refresh);
    return unsub;
  }, []);

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead(undefined, 'admin');
    refresh();
  };

  const handleItemClick = (n: AppNotification) => {
    notificationService.markAsRead(n.id);
    refresh();
    if (n.actionUrl && onNavigate) {
      onNavigate(n.actionUrl);
      setIsOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'admin_new_order':
      case 'order_confirmation':
        return <ShoppingBag className="w-4 h-4 text-blue-500" />;
      case 'admin_new_booking':
      case 'booking_confirmation':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'admin_payment_received':
      case 'payment_confirmation':
        return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case 'admin_new_customer':
      case 'registration':
        return <UserPlus className="w-4 h-4 text-cyan-500" />;
      case 'admin_low_inventory':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'admin_contact_inquiry':
        return <Mail className="w-4 h-4 text-indigo-500" />;
      case 'admin_quote_request':
        return <FileText className="w-4 h-4 text-pink-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        aria-label="Admin Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Live System Alerts</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 font-mono px-1.5 py-0.5 rounded border border-rose-500/30">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-blue-300 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"
                    title="Mark all as read"
                  >
                    <Check className="w-3 h-3" />
                    <span>Read all</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Bell className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="text-xs font-medium">No alerts at this moment</p>
                  <p className="text-[11px] text-slate-400">All systems operating within nominal parameters.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                      !n.readAt ? 'bg-blue-50/40 font-medium' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-0.5 shrink-0">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500 font-mono">
              Mahdev Enterprise Event Dispatcher • TLS Protected
            </div>
          </div>
        </>
      )}
    </div>
  );
};
