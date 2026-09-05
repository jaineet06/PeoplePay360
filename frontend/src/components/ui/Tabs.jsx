import React from 'react';
import { cn } from '@/utils/cn';

export function Tabs({ tabs = [], activeTab, onChange, className }) {
  return (
    <div className={cn('border-b border-slate-200 dark:border-slate-800', className)}>
      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              type="button"
              className={cn(
                'group inline-flex items-center py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150',
                isActive
                  ? 'border-brand-600 dark:border-brand-400 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    'mr-2 h-4 w-4',
                    isActive
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300'
                  )}
                />
              )}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'ml-2 py-0.5 px-1.5 rounded-full text-[10px] font-semibold',
                    isActive
                      ? 'bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
