import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layers, Lock, Mail, ArrowRight, Info, ShieldCheck, KeyRound } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from './authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { handleApiError } from '@/utils/handleApiError';
import { toast } from '@/components/ui/Toast';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await authApi.login(data);
      const { accessToken, user } = response.data;

      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.employee?.fullName || user.email}!`);

      // Determine redirect destination based on role and location state
      const from = location.state?.from?.pathname;
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else if (user.role === 'EMPLOYEE') {
        navigate('/profile', { replace: true });
      } else {
        navigate('/employees', { replace: true });
      }
    } catch (err) {
      handleApiError(err, setError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (email, password) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo and Brand */}
        <div className="inline-flex h-12 w-12 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 items-center justify-center text-white shadow-lg shadow-brand-500/30 mb-4">
          <Layers className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          PeoplePay360
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Integrated HR, Attendance &amp; Payroll Operations Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-2xl shadow-dropdown border border-slate-200/80 text-slate-800">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Sign in to your account
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter your corporate credentials to access the workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              placeholder="name@company.com"
              leftIcon={Mail}
              error={errors.email?.message}
              required
              {...register('email')}
            />

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                leftIcon={Lock}
                error={errors.password?.message}
                required
                {...register('password')}
              />
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              rightIcon={ArrowRight}
              className="w-full mt-2"
            >
              Sign in
            </Button>
          </form>

          {/* Fast Credentials Bar for Testing */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 mb-2.5">
              <KeyRound className="h-3.5 w-3.5 text-brand-600" />
              <span>Demo Quick-Fill:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  fillCredentials('admin@peoplepay360.com', 'Password123!')
                }
                className="p-2 text-left rounded-lg border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 transition-colors group"
              >
                <div className="font-semibold text-slate-800 group-hover:text-brand-700">
                  Admin
                </div>
                <div className="text-[10px] text-slate-500">Full HR &amp; Config</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  fillCredentials('employee@peoplepay360.com', 'Password123!')
                }
                className="p-2 text-left rounded-lg border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 transition-colors group"
              >
                <div className="font-semibold text-slate-800 group-hover:text-brand-700">
                  Employee
                </div>
                <div className="text-[10px] text-slate-500">Self-Service Portal</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security Banner */}
        <div className="mt-6 text-center flex items-center justify-center space-x-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Secured with stateless JWT &amp; rotating refresh cookies</span>
        </div>
      </div>

      {/* Forgot Password Modal Notice */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Password Reset Assistance"
        description="Notice regarding credential management"
        footer={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setForgotModalOpen(false)}
          >
            Understood
          </Button>
        }
      >
        <div className="flex items-start space-x-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs leading-relaxed">
          <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-1">
              Automated Self-Reset Currently Blocked:
            </span>
            Self-service password reset endpoints have not been exposed on the
            backend API yet. To reset your corporate password, please reach out to
            your system administrator at{' '}
            <strong className="underline">admin@peoplepay360.com</strong>.
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default LoginPage;
