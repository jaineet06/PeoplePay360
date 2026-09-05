import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Home, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/features/auth/authStore';

export function NotFoundPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const homePath = user?.role === 'EMPLOYEE' ? '/profile' : '/dashboard';

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto h-20 w-20 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-sm">
          <HelpCircle className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <div className="text-4xl font-black text-slate-900 tracking-tight">404</div>
          <h2 className="text-lg font-bold text-slate-800">Page Not Found</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            The page you are trying to access does not exist, has been removed, or has had its address changed.
          </p>
        </div>

        <div className="flex items-center justify-center space-x-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={ArrowLeft}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={Home}
            onClick={() => navigate(homePath)}
          >
            {user?.role === 'EMPLOYEE' ? 'My Profile' : 'Dashboard'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
