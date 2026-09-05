import React from 'react';
import { cn } from '@/utils/cn';

export function Badge({ children, variant = 'slate', size = 'sm', className }) {
  const variants = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded border font-medium whitespace-nowrap',
        variants[variant] || variants.slate,
        sizes[size] || sizes.sm,
        className
      )}
    >
      {children}
    </span>
  );
}
