import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CircleDollarSign,
  Plus,
  ArrowUpDown,
  Play,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileText,
  Users,
  ChevronRight,
  Calculator,
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { StatusPill } from '@/components/ui/StatusPill';
import { Badge } from '@/components/ui/Badge';
import { usePagination } from '@/hooks/usePagination';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  usePayruns,
  useSalaryStructures,
  useSalaryRules,
  useReorderSalaryRules,
  useDeleteSalaryRule,
  useDeleteSalaryStructure,
} from './hooks/usePayroll';
import { PayrunWizardModal } from './components/PayrunWizardModal';
import { SalaryStructureModal } from './components/SalaryStructureModal';
import { SalaryRuleModal } from './components/SalaryRuleModal';
import { SalarySimulatorModal } from './components/SalarySimulatorModal';

export function PayrollPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('payruns');
  const { page, limit, onPageChange, onLimitChange } = usePagination(1, 10);

  // Modals state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [structureModalOpen, setStructureModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);

  const [selectedStructureId, setSelectedStructureId] = useState(null);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  // Queries
  const { data: payrunsData, isLoading: isPayrunsLoading } = usePayruns({
    page,
    limit,
    sortBy: 'createdAt',
    order: 'desc',
  });

  const { data: structuresData, isLoading: isStructuresLoading } = useSalaryStructures({
    page: 1,
    limit: 100,
  });

  const currentStructure = (structuresData?.data || []).find((s) => s.id === selectedStructureId)
    || structuresData?.data?.[0];

  const effectiveStructureId = currentStructure?.id;

  const { data: rulesData, isLoading: isRulesLoading } = useSalaryRules(effectiveStructureId);
  const reorderMutation = useReorderSalaryRules();
  const deleteRuleMutation = useDeleteSalaryRule();
  const deleteStructureMutation = useDeleteSalaryStructure();

  const handleMoveRule = async (index, direction) => {
    if (!rulesData || !effectiveStructureId) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= rulesData.length) return;

    const reordered = [...rulesData];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    const payload = reordered.map((r, i) => ({
      id: r.id,
      sequence: (i + 1) * 10,
    }));

    await reorderMutation.mutateAsync({
      structureId: effectiveStructureId,
      rules: payload,
    });
  };

  const tabs = [
    { id: 'payruns', label: 'Payrun Batches', badge: payrunsData?.meta?.total },
    { id: 'structures', label: 'Salary Structures & Rules' },
  ];

  const payrunColumns = [
    {
      key: 'reference',
      header: 'Reference',
      render: (ref, row) => (
        <div>
          <div className="font-mono font-semibold text-slate-800">{ref}</div>
          <div className="text-[11px] text-slate-500 font-medium">{row.name}</div>
        </div>
      ),
    },
    {
      key: 'periodLabel',
      header: 'Pay Period',
      render: (pl, row) => (
        <div>
          <div className="font-semibold text-slate-800">{pl}</div>
          <div className="text-[10px] text-slate-400">
            {formatDate(row.periodStart)} &rarr; {formatDate(row.periodEnd)}
          </div>
        </div>
      ),
    },
    {
      key: 'employeeCount',
      header: 'Employees',
      render: (count) => (
        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          {count || 0}
        </span>
      ),
    },
    {
      key: 'totalGross',
      header: 'Total Gross',
      render: (tg, row) => (
        <span className="font-semibold text-slate-800">
          {formatCurrency(tg, row.currency || 'INR')}
        </span>
      ),
    },
    {
      key: 'totalNet',
      header: 'Total Net Payable',
      render: (tn, row) => (
        <span className="font-bold text-slate-900 font-mono">
          {formatCurrency(tn, row.currency || 'INR')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (st) => <StatusPill status={st} size="xs" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (_, row) => (
        <Button
          variant="primary"
          size="xs"
          rightIcon={ChevronRight}
          onClick={() => navigate(`/payroll/payruns/${row.id}`)}
        >
          Process Payrun
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl flex items-center gap-2">
            <CircleDollarSign className="h-6 w-6 text-brand-600" />
            Payroll Processing Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Execute batch payruns, compute salary rules, generate payslips, and dispatch emails
          </p>
        </div>

        {activeTab === 'payruns' ? (
          <Button variant="primary" size="sm" leftIcon={Plus} onClick={() => setWizardOpen(true)}>
            New Payrun Wizard
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={Calculator}
              onClick={() => setSimulatorOpen(true)}
              disabled={!effectiveStructureId}
            >
              Simulate Engine
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={() => {
                setEditingStructure(null);
                setStructureModalOpen(true);
              }}
            >
              New Structure
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab 1: Payruns List */}
      {activeTab === 'payruns' && (
        <DataTable
          columns={payrunColumns}
          data={payrunsData?.data || []}
          isLoading={isPayrunsLoading}
          meta={payrunsData?.meta}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          emptyTitle="No payruns recorded"
          emptyDescription="Start by launching the two-step Payrun Wizard."
          emptyAction={
            <Button variant="primary" size="sm" leftIcon={Plus} onClick={() => setWizardOpen(true)}>
              Launch Payrun Wizard
            </Button>
          }
          onRowClick={(row) => navigate(`/payroll/payruns/${row.id}`)}
        />
      )}

      {/* Tab 2: Salary Structures & Rules */}
      {activeTab === 'structures' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Structures List Sidebar */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Salary Structures
              </span>
              <Button
                variant="ghost"
                size="xs"
                leftIcon={Plus}
                onClick={() => {
                  setEditingStructure(null);
                  setStructureModalOpen(true);
                }}
              >
                Add
              </Button>
            </div>

            <div className="space-y-1.5">
              {(structuresData?.data || []).map((s) => {
                const isSelected = s.id === effectiveStructureId;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStructureId(s.id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{s.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {s.code} &bull; {s.currency}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="xs"
                        leftIcon={Edit2}
                        onClick={() => {
                          setEditingStructure(s);
                          setStructureModalOpen(true);
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rules Scoped to Selected Structure */}
          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {currentStructure?.name || 'Salary Structure Rules'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Rules execute strictly in sequence order. Formulas can reference previous rule codes.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="xs"
                  leftIcon={Calculator}
                  onClick={() => setSimulatorOpen(true)}
                >
                  Test Formula
                </Button>
                <Button
                  variant="primary"
                  size="xs"
                  leftIcon={Plus}
                  onClick={() => {
                    setEditingRule(null);
                    setRuleModalOpen(true);
                  }}
                >
                  Add Rule
                </Button>
              </div>
            </div>

            {/* Rules List */}
            <div className="space-y-2">
              {rulesData?.length > 0 ? (
                rulesData.map((rule, idx) => (
                  <div
                    key={rule.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      {/* Sequence Badge */}
                      <span className="font-mono font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
                        #{rule.sequence}
                      </span>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-900">{rule.name}</span>
                          <span className="font-mono text-[11px] text-slate-400">({rule.code})</span>
                          <Badge variant="brand" size="xs">{rule.category}</Badge>
                          <Badge variant="slate" size="xs">{rule.computationMethod}</Badge>
                        </div>

                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {rule.computationMethod === 'FIXED' && (
                            <span>
                              {rule.useContractWage
                                ? 'Evaluates Contract Wage'
                                : `Fixed ${formatCurrency(rule.amount, currentStructure?.currency || 'INR')}`}
                            </span>
                          )}
                          {rule.computationMethod === 'PERCENTAGE' && (
                            <span>
                              {rule.percentage}% of {rule.percentageOfCode}
                            </span>
                          )}
                          {rule.computationMethod === 'FORMULA' && (
                            <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                              {rule.formula}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reorder and Edit Actions */}
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        disabled={idx === 0 || reorderMutation.isPending}
                        onClick={() => handleMoveRule(idx, 'up')}
                        leftIcon={ArrowUp}
                      />
                      <Button
                        variant="ghost"
                        size="xs"
                        disabled={idx === rulesData.length - 1 || reorderMutation.isPending}
                        onClick={() => handleMoveRule(idx, 'down')}
                        leftIcon={ArrowDown}
                      />
                      <Button
                        variant="ghost"
                        size="xs"
                        leftIcon={Edit2}
                        onClick={() => {
                          setEditingRule(rule);
                          setRuleModalOpen(true);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-rose-600 hover:bg-rose-50"
                        leftIcon={Trash2}
                        onClick={async () => {
                          if (window.confirm(`Delete rule ${rule.code}?`)) {
                            await deleteRuleMutation.mutateAsync({
                              structureId: effectiveStructureId,
                              ruleId: rule.id,
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No rules configured for this structure. Click "Add Rule" to begin defining compensation items.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payrun Wizard */}
      <PayrunWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />

      {/* Structure Modal */}
      <SalaryStructureModal
        isOpen={structureModalOpen}
        onClose={() => setStructureModalOpen(false)}
        structure={editingStructure}
      />

      {/* Rule Modal */}
      <SalaryRuleModal
        isOpen={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        structureId={effectiveStructureId}
        rule={editingRule}
        existingRulesCount={rulesData?.length || 0}
      />

      {/* Simulator Modal */}
      <SalarySimulatorModal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        structure={currentStructure}
      />
    </div>
  );
}

export default PayrollPage;
