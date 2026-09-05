import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // In production, error logs can be piped to monitoring service
    console.error('PeoplePay360 caught render error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-dropdown text-center">
            <div className="h-14 w-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Something went wrong
            </h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              An unexpected interface error occurred. You can retry the current action or reload the application.
            </p>

            {this.state.error?.message && (
              <div className="mb-6 p-3 bg-slate-50 rounded-lg text-left border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Error Details
                </div>
                <div className="text-xs font-mono text-rose-700 break-words">
                  {this.state.error.message}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                leftIcon={Home}
                onClick={() => (window.location.href = '/')}
              >
                Go Home
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={RefreshCw}
                onClick={this.handleReset}
              >
                Reload App
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
