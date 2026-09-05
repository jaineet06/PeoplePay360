import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/features/auth/authStore';

export function UnauthorizedPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const homePath = user?.role === 'EMPLOYEE' ? '/profile' : '/dashboard';
  const roleLabel = user?.role ? user.role.replace(/_/g, ' ') : 'Guest';

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="mx-auto h-20 w-20 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-xs">
          <ShieldAlert className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 uppercase tracking-wider">
            HTTP 403 Forbidden
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Restricted Access Area
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Your current account role (<strong className="text-slate-800">{roleLabel}</strong>) does not have authorization to view this module.
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1">
          <div className="flex items-center space-x-2 text-slate-600 font-semibold">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <span>Role-Based Access Control</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Contact your administrator if you believe your user account requires access to this system feature.
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
            {user?.role === 'EMPLOYEE' ? 'My Profile' : 'Return to Dashboard'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedPage;
