import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Check,
  Clock,
  CalendarCheck,
  CalendarX,
  CircleDollarSign,
  FileText,
  AlertTriangle,
  Info,
  ExternalLink,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/cn';
import {
  useNotifications,
  useUnreadCount,
  useMarkRead,
  useMarkAllRead,
} from '@/features/notifications/useNotifications';

const TYPE_CONFIG = {
  TIME_OFF_REQUEST:  { icon: Clock,            color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800', label: 'Time Off' },
  TIME_OFF_APPROVED: { icon: CalendarCheck,    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', label: 'Approved' },
  TIME_OFF_REFUSED:  { icon: CalendarX,        color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800', label: 'Refused' },
  PAYRUN_COMPUTED:   { icon: CircleDollarSign, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', label: 'Payroll' },
  PAYRUN_VALIDATED:  { icon: CircleDollarSign, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800', label: 'Payroll' },
  PAYRUN_PAID:       { icon: CircleDollarSign, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', label: 'Payroll' },
  PAYSLIP_READY:     { icon: FileText,         color: 'text-brand-500 bg-brand-50 dark:bg-brand-950/40 border-brand-200 dark:border-brand-800', label: 'Payslip' },
  CONTRACT_EXPIRING: { icon: AlertTriangle,    color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800', label: 'Contract' },
  GENERAL:           { icon: Info,             color: 'text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700', label: 'Notice' },
};

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  const { data: unreadCount = 0 } = useUnreadCount();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const isReadParam = activeTab === 'unread' ? 'false' : undefined;

  const { data, isLoading } = useNotifications({
    page,
    limit,
    ...(isReadParam !== undefined ? { isRead: isReadParam } : {}),
  });

  const notifications = data?.data ?? [];
  const meta = data?.meta ?? { page, limit, total: 0, totalPages: 1 };

  const tabs = [
    { id: 'all', label: 'All' },
    {
      id: 'unread',
      label: 'Unread',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPage(1);
  };

  const handleRowClick = (item) => {
    if (!item.isRead) {
      markRead.mutate(item.id);
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Notifications
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Stay informed about your leave requests, payroll activity, and contracts.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            isLoading={markAllRead.isPending}
            leftIcon={CheckCheck}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Main Container */}
      <Card>
        <CardHeader className="pb-0 border-b-0">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
        </CardHeader>

        <CardBody className="p-0">
          {isLoading ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 pt-4 first:pt-0">
                  <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={Bell}
                title={activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
                description={
                  activeTab === 'unread'
                    ? "You're all caught up! There are no unread notifications."
                    : 'You have no notifications in your history yet.'
                }
                className="border-none shadow-none"
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.GENERAL;
                const Icon = cfg.icon;

                return (
                  <div
                    key={n.id}
                    className={cn(
                      'group flex items-start gap-3.5 sm:gap-4 p-4 sm:p-5 transition-colors',
                      n.isRead
                        ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        : 'bg-brand-50/40 dark:bg-brand-950/20 hover:bg-brand-50/70 dark:hover:bg-brand-950/30'
                    )}
                  >
                    {/* Unread indicator */}
                    <div className="pt-2">
                      <span
                        className={cn(
                          'block h-2 w-2 rounded-full shrink-0',
                          n.isRead ? 'bg-transparent' : 'bg-brand-600 dark:bg-brand-400 ring-2 ring-brand-200 dark:ring-brand-900'
                        )}
                      />
                    </div>

                    {/* Icon container */}
                    <div
                      className={cn(
                        'flex items-center justify-center h-9 w-9 rounded-lg border shrink-0',
                        cfg.color
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Notification content */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleRowClick(n)}
                    >
                      <div className="flex flex-wrap items-baseline gap-2 mb-1">
                        <span
                          className={cn(
                            'text-sm leading-snug',
                            n.isRead
                              ? 'font-medium text-slate-700 dark:text-slate-300'
                              : 'font-semibold text-slate-900 dark:text-slate-100'
                          )}
                        >
                          {n.title}
                        </span>
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-400">
                          • {cfg.label}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                        {n.message}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-400">
                        <span>{formatTime(n.createdAt)}</span>
                        {n.link && (
                          <span className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline font-medium">
                            <span>Open</span>
                            <ExternalLink className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Row action: Mark read button */}
                    {!n.isRead && (
                      <div className="shrink-0 pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markRead.mutate(n.id);
                          }}
                          disabled={markRead.isPending}
                          title="Mark as read"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white dark:hover:bg-slate-800 transition-colors focus:outline-none"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>

        {meta.totalPages > 1 && (
          <Pagination
            meta={meta}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
          />
        )}
      </Card>
    </div>
  );
}
