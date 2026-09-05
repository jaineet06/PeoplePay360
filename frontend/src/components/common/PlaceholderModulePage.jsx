import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PlaceholderModulePage({ moduleName, phaseDescription }) {
  const navigate = useNavigate();
  const location = useLocation();

  const name =
    moduleName ||
    location.pathname
      .replace('/', '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()) ||
    'Module';

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8 space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto border border-brand-100">
          <Clock className="h-7 w-7" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {name} Module
        </h2>

        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          {phaseDescription ||
            `The ${name} module interface is slated for the upcoming frontend phase. The shared components, API client, and authentication layers created in this pass are ready to power this module.`}
        </p>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 max-w-sm mx-auto text-xs text-slate-600 flex items-center justify-center space-x-2">
          <Sparkles className="h-4 w-4 text-brand-500" />
          <span>Backend APIs &amp; Schema already operational</span>
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={ArrowLeft}
            onClick={() => navigate('/employees')}
          >
            Return to Employees
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PlaceholderModulePage;
