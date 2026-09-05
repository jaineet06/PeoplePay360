import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner';

export const toast = {
  success: (message, options = {}) => {
    return sonnerToast.success(message, {
      duration: 3500,
      ...options,
    });
  },
  error: (message, options = {}) => {
    return sonnerToast.error(message, {
      duration: 5000,
      ...options,
    });
  },
  info: (message, options = {}) => {
    return sonnerToast.info(message, {
      duration: 3500,
      ...options,
    });
  },
  warning: (message, options = {}) => {
    return sonnerToast.warning(message, {
      duration: 4000,
      ...options,
    });
  },
  loading: (message, options = {}) => {
    return sonnerToast.loading(message, options);
  },
  dismiss: (id) => sonnerToast.dismiss(id),
};

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        className: 'text-sm font-medium border shadow-dropdown',
      }}
    />
  );
}
