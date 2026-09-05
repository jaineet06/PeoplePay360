import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Clock,
  CalendarCheck,
  CalendarX,
  CircleDollarSign,
  FileText,
  AlertTriangle,
  Info,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  useUnreadCount,
  useNotifications,
  useMarkRead,
  useMarkAllRead,
} from '@/features/notifications/useNotifications';
import { NotifSkeleton } from '@/components/ui/Skeleton';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatRelativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const TYPE_CONFIG = {
  TIME_OFF_REQUEST:  { icon: Clock,             color: 'text-amber-500' },
  TIME_OFF_APPROVED: { icon: CalendarCheck,     color: 'text-emerald-500' },
  TIME_OFF_REFUSED:  { icon: CalendarX,         color: 'text-rose-500' },
  PAYRUN_COMPUTED:   { icon: CircleDollarSign,  color: 'text-blue-500' },
  PAYRUN_VALIDATED:  { icon: CircleDollarSign,  color: 'text-indigo-500' },
  PAYRUN_PAID:       { icon: CircleDollarSign,  color: 'text-emerald-500' },
  PAYSLIP_READY:     { icon: FileText,          color: 'text-brand-500' },
  CONTRACT_EXPIRING: { icon: AlertTriangle,     color: 'text-orange-500' },
  GENERAL:           { icon: Info,              color: 'text-slate-400' },
};

function NotifIcon({ type, className }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.GENERAL;
  const Icon = cfg.icon;
  return <Icon className={cn('h-4 w-4 shrink-0', cfg.color, className)} />;
}

// ---------------------------------------------------------------------------
// Single notification row
// ---------------------------------------------------------------------------
function NotifRow({ notif, onRead, onNavigate }) {
  function handleClick() {
    if (!notif.isRead) onRead(notif.id);
    if (notif.link) onNavigate(notif.link);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60',
        !notif.isRead && 'bg-brand-50/50 dark:bg-brand-950/20'
      )}
    >
      {/* Unread dot */}
      <span
        className={cn(
          'mt-1.5 h-1.5 w-1.5 rounded-full shrink-0',
          notif.isRead ? 'bg-transparent' : 'bg-brand-500'
        )}
      />

      {/* Type icon */}
      <NotifIcon type={notif.type} className="mt-0.5" />

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-xs leading-snug truncate',
            notif.isRead
              ? 'font-normal text-slate-600 dark:text-slate-400'
              : 'font-semibold text-slate-800 dark:text-slate-100'
          )}
        >
          {notif.title}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
          {notif.message}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-1">
          {formatRelativeTime(notif.createdAt)}
        </p>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main bell component
// ---------------------------------------------------------------------------
export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data: count = 0 } = useUnreadCount();
  const { data, isLoading } = useNotifications({ limit: 10 });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications = data?.data ?? [];
  const unread = Number(count);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function handleMarkAllRead() {
    markAllRead.mutate();
  }

  function handleNavigate(link) {
    setOpen(false);
    navigate(link);
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        id="notification-bell-btn"
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative flex items-center justify-center h-9 w-9 rounded-lg transition-colors focus:outline-none',
          open
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
        )}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
      >
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-bold leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-dropdown z-50 overflow-hidden animate-in fade-in-0 slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              Notifications
              {unread > 0 && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold">
                  {unread} new
                </span>
              )}
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markAllRead.isPending}
                className="flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <NotifSkeleton rows={4} />
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Bell className="h-8 w-8 text-slate-300 dark:text-slate-400 mb-2" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-300">All caught up!</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotifRow
                  key={n.id}
                  notif={n}
                  onRead={(id) => markRead.mutate(id)}
                  onNavigate={handleNavigate}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <button
                type="button"
                onClick={() => { setOpen(false); navigate('/notifications'); }}
                className="w-full flex items-center justify-center gap-1.5 text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors py-0.5"
              >
                View all notifications
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
