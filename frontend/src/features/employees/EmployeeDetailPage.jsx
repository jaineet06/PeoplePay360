import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  Landmark,
  ShieldCheck,
  FileSpreadsheet,
  CalendarCheck2,
  PieChart,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useEmployee } from './hooks/useEmployee';
import { useDeleteEmployee } from './hooks/useEmployeeMutations';
import {
  useEmployeeContracts,
  useEmployeeAttendance,
  useEmployeeTimeOff,
  useEmployeeAllocations,
} from './hooks/useEmployeeRelations';
import { ContractsTable } from '@/features/contracts/components/ContractsTable';
import { AttendanceTable } from '@/features/attendance/components/AttendanceTable';
import { TimeOffAllocationsTable } from '@/features/timeOff/components/TimeOffAllocationsTable';
import { TimeOffRequestsTable } from '@/features/timeOff/components/TimeOffRequestsTable';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardBody, CardDescription } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { ProfileSkeleton } from '@/components/ui/Skeleton';
import { formatDate, formatCurrency, getInitials, formatTimeFromMinutes } from '@/utils/formatters';

export function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Queries
  const { data: employee, isLoading, error } = useEmployee(id);
  const deleteMutation = useDeleteEmployee();

  // Related data queries for counts and highlights
  const { data: contractsData } = useEmployeeContracts(id, { limit: 5 });
  const { data: attendanceData } = useEmployeeAttendance(id, { limit: 5 });
  const { data: timeOffData } = useEmployeeTimeOff(id, { limit: 5 });
  const { data: allocationsData } = useEmployeeAllocations(id, { limit: 5 });

  const contractsCount = contractsData?.meta?.total ?? 0;
  const attendanceCount = attendanceData?.meta?.total ?? 0;
  const timeOffCount = timeOffData?.meta?.total ?? 0;
  const allocationsCount = allocationsData?.meta?.total ?? 0;

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !employee) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">
          Employee Not Found
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The requested employee record could not be loaded or may have been deleted.
        </p>
        <Button
          variant="outline"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={() => navigate('/employees')}
        >
          Back to Directory
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(employee.id);
      setDeleteModalOpen(false);
      navigate('/employees');
    } catch {
      // Handled by mutation toast
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'contracts', label: 'Contracts', badge: contractsCount },
    { id: 'attendance', label: 'Attendance', badge: attendanceCount },
    { id: 'time-off', label: 'Time Off & Balances', badge: timeOffCount },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/employees')}
          className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Employees Directory
        </button>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={Edit2}
            onClick={() => navigate(`/employees/${employee.id}/edit`)}
          >
            Edit Profile
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            leftIcon={Trash2}
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Avatar & Identifiers */}
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
              {getInitials(employee.fullName)}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {employee.fullName}
                </h2>
                <StatusPill status={employee.status} size="sm" />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {employee.employeeCode}
                </span>
                {employee.jobPosition?.title && (
                  <span className="flex items-center">
                    <Briefcase className="h-3.5 w-3.5 mr-1 text-slate-400" />
                    {employee.jobPosition.title}
                  </span>
                )}
                {employee.department?.name && (
                  <span className="flex items-center">
                    <Building2 className="h-3.5 w-3.5 mr-1 text-slate-400" />
                    {employee.department.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Contact Chips */}
          <div className="flex flex-col sm:items-end space-y-1 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <a
                href={`mailto:${employee.workEmail}`}
                className="hover:text-brand-600 underline-offset-2 hover:underline"
              >
                {employee.workEmail}
              </a>
            </div>
            {employee.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{employee.phone}</span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
              <Calendar className="h-3.5 w-3.5" />
              <span>Joined {formatDate(employee.dateOfJoining)}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 pt-2">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Work & Organization */}
          <Card>
            <CardHeader>
              <CardTitle>Work &amp; Organization</CardTitle>
              <CardDescription>Department, position, and schedule details</CardDescription>
            </CardHeader>
            <CardBody className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold text-slate-800">
                  {employee.department?.name || 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Job Position</span>
                <span className="font-semibold text-slate-800">
                  {employee.jobPosition?.title || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Direct Manager</span>
                <span className="font-semibold text-slate-800">
                  {employee.manager ? (
                    <Link
                      to={`/employees/${employee.manager.id}`}
                      className="text-brand-600 hover:underline"
                    >
                      {employee.manager.fullName} ({employee.manager.employeeCode})
                    </Link>
                  ) : (
                    'No manager assigned'
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Working Schedule</span>
                <span className="font-semibold text-slate-800">
                  {employee.workingSchedule?.name || 'Standard Full Time'} (
                  {employee.workingSchedule?.hoursPerWeek || 40} hrs/week)
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Timezone</span>
                <span className="font-mono text-slate-800">
                  {employee.workingSchedule?.timezone || 'UTC'}
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Active Contract Snapshot */}
          <Card>
            <CardHeader
              action={
                <Link
                  to={`/contracts?employeeId=${employee.id}`}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center"
                >
                  View All Contracts <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              }
            >
              <CardTitle>Active Contract Snapshot</CardTitle>
              <CardDescription>Current compensation and salary structure</CardDescription>
            </CardHeader>
            <CardBody className="space-y-3 text-xs">
              {employee.activeContract ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                    <div>
                      <div className="text-[11px] text-emerald-800 font-medium">
                        Wage Base / Rate
                      </div>
                      <div className="text-lg font-bold text-emerald-900">
                        {formatCurrency(
                          employee.activeContract.wage,
                          employee.activeContract.currency || 'USD'
                        )}
                        <span className="text-xs font-normal text-emerald-700 ml-1">
                          /{employee.activeContract.wageType?.toLowerCase() || 'month'}
                        </span>
                      </div>
                    </div>
                    <Badge variant="emerald">ACTIVE CONTRACT</Badge>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Salary Structure</span>
                    <span className="font-semibold text-slate-800">
                      {employee.activeContract.salaryStructure?.name || 'Default'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Contract Period</span>
                    <span className="text-slate-800">
                      {formatDate(employee.activeContract.startDate)} &rarr;{' '}
                      {employee.activeContract.endDate
                        ? formatDate(employee.activeContract.endDate)
                        : 'Permanent / Open'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Reference</span>
                    <span className="font-mono text-slate-700">
                      {employee.activeContract.reference || '—'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center text-slate-500 space-y-2">
                  <p>No active contract found for this employee.</p>
                  <Link
                    to={`/contracts?employeeId=${employee.id}`}
                    className="inline-block text-xs text-brand-600 font-medium hover:underline"
                  >
                    Draft or assign a contract &rarr;
                  </Link>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Banking Details */}
          <Card>
            <CardHeader>
              <CardTitle>Banking &amp; Direct Deposit</CardTitle>
              <CardDescription>Disbursement routing details</CardDescription>
            </CardHeader>
            <CardBody className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Bank Name</span>
                <span className="font-semibold text-slate-800">
                  {employee.bankName || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Account Holder</span>
                <span className="text-slate-800">
                  {employee.bankAccountName || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Account Number</span>
                <span className="font-mono text-slate-800">
                  {employee.bankAccountNumber || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">IFSC / Routing</span>
                <span className="font-mono text-slate-800">
                  {employee.bankIfscCode || '—'}
                </span>
              </div>
            </CardBody>
          </Card>

          {/* User Account Access */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Login &amp; Role</CardTitle>
              <CardDescription>Authentication credentials</CardDescription>
            </CardHeader>
            <CardBody className="space-y-3 text-xs">
              {employee.login ? (
                <>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Account Status</span>
                    <span className="flex items-center text-emerald-700 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                      Active User
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Login Email</span>
                    <span className="font-mono text-slate-800">
                      {employee.login.email}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Assigned Role</span>
                    <Badge variant="brand">{employee.login.role}</Badge>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center text-slate-500">
                  <p>No login user account provisioned for this employee.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tab 2: Contracts */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Contract Records</h3>
              <p className="text-xs text-slate-500">
                Legal agreements, wage history, and assigned salary structures.
              </p>
            </div>
            <Link
              to={`/contracts?employeeId=${employee.id}`}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center"
            >
              Open in Contracts Module <ExternalLink className="h-3 w-3 ml-1" />
            </Link>
          </div>
          <ContractsTable employeeId={employee.id} hideEmployeeColumn={true} />
        </div>
      )}

      {/* Tab 3: Attendance */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Attendance History</h3>
              <p className="text-xs text-slate-500">
                Daily check-in/out timestamps, hours computed, and manager corrections.
              </p>
            </div>
            <Link
              to={`/attendance?employeeId=${employee.id}`}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center"
            >
              Open in Attendance Module <ExternalLink className="h-3 w-3 ml-1" />
            </Link>
          </div>
          <AttendanceTable employeeId={employee.id} hideEmployeeColumn={true} />
        </div>
      )}

      {/* Tab 4: Time Off & Allocations */}
      {activeTab === 'time-off' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Leave Allocations</h3>
                <p className="text-xs text-slate-500">
                  Assigned quotas and balance deductions for this employee.
                </p>
              </div>
              <Link
                to={`/time-off?employeeId=${employee.id}`}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center"
              >
                Open in Time Off Module <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </div>
            <TimeOffAllocationsTable employeeId={employee.id} hideEmployeeColumn={true} />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Time Off Requests</h3>
              <p className="text-xs text-slate-500">
                Past and pending leave requests, approvals, and cancellations.
              </p>
            </div>
            <TimeOffRequestsTable employeeId={employee.id} hideEmployeeColumn={true} />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Employee Record"
        description="Soft delete confirmation"
        footer={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={handleDelete}
            >
              Confirm Delete
            </Button>
          </div>
        }
      >
        <p className="text-xs text-slate-600 leading-relaxed">
          Are you sure you want to remove <strong>{employee.fullName}</strong>?
          If this employee has an active contract, the operation will be rejected until the contract is terminated.
        </p>
      </Modal>
    </div>
  );
}

export default EmployeeDetailPage;
