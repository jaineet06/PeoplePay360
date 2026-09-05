import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-lg',
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose?.();
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          className={cn(
            'relative transform overflow-hidden rounded-xl bg-white dark:bg-slate-900 text-left shadow-dropdown transition-all sm:my-8 w-full border border-slate-200 dark:border-slate-800',
            maxWidth
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-semibold leading-6 text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              {description && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 text-slate-700 dark:text-slate-300">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="bg-slate-50 dark:bg-slate-950/60 px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
