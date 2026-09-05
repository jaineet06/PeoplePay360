import React, { useState } from 'react';
import { Play, Sparkles, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/utils/formatters';
import { useSimulateSalary } from '../hooks/usePayroll';

export function SalarySimulatorModal({ isOpen, onClose, structure }) {
  const [contractWage, setContractWage] = useState('60000');
  const [periodDays, setPeriodDays] = useState('30');
  const [workedDays, setWorkedDays] = useState('30');
  const [unpaidLeaveDays, setUnpaidLeaveDays] = useState('0');

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const simulateMutation = useSimulateSalary();

  const handleSimulate = async () => {
    if (!structure) return;
    setError(null);
    try {
      const res = await simulateMutation.mutateAsync({
        structureId: structure.id,
        data: {
          contractWage: Number(contractWage),
          periodDays: Number(periodDays),
          workedDays: Number(workedDays),
          unpaidLeaveDays: Number(unpaidLeaveDays),
        },
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Calculation error in formula evaluation.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setResult(null);
        setError(null);
        onClose();
      }}
      title={`Salary Simulator: ${structure?.name || ''}`}
      description="Live sandbox testing of salary rules engine"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={Play}
            isLoading={simulateMutation.isPending}
            onClick={handleSimulate}
          >
            Run Simulation
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Test Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <Input
            label="Contract Wage"
            value={contractWage}
            onChange={(e) => setContractWage(e.target.value)}
          />
          <Input
            label="Period Days"
            value={periodDays}
            onChange={(e) => setPeriodDays(e.target.value)}
          />
          <Input
            label="Worked Days"
            value={workedDays}
            onChange={(e) => setWorkedDays(e.target.value)}
          />
          <Input
            label="Unpaid Leaves"
            value={unpaidLeaveDays}
            onChange={(e) => setUnpaidLeaveDays(e.target.value)}
          />
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Engine Evaluation Failed</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div>
                <div className="text-[11px] text-emerald-800 font-medium">Computed Gross</div>
                <div className="text-base font-bold text-emerald-900">
                  {formatCurrency(result.grossAmount, structure?.currency || 'INR')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-emerald-800 font-medium">Computed Net Salary</div>
                <div className="text-lg font-bold text-emerald-950">
                  {formatCurrency(result.netAmount, structure?.currency || 'INR')}
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 font-semibold text-slate-700 flex justify-between">
                <span>Rule Breakdown</span>
                <span>Amount</span>
              </div>
              {result.lines?.map((line) => (
                <div key={line.code} className="px-3 py-2 flex items-center justify-between text-slate-700">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{line.label}</span>
                    <span className="font-mono text-[10px] text-slate-400">({line.code})</span>
                    <Badge variant="slate" size="xs">{line.category}</Badge>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(line.amount, structure?.currency || 'INR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
