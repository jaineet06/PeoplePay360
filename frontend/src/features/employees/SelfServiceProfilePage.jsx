import React, { useState } from 'react';
import {
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Landmark,
  FileSpreadsheet,
  CalendarCheck2,
  PieChart,
  User,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useEmployeeMe } from './hooks/useEmployee';
import {
  useEmployeeContracts,
  useEmployeeAttendance,
  useEmployeeTimeOff,
  useEmployeeAllocations,
} from './hooks/useEmployeeRelations';
import { StatusPill } from '@/components/ui/StatusPill';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardBody, CardDescription } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { ProfileSkeleton } from '@/components/ui/Skeleton';
import { formatDate, formatCurrency, getInitials } from '@/utils/formatters';

export function SelfServiceProfilePage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Query employee's own profile via /employees/me
  const { data: employee, isLoading, error } = useEmployeeMe();

  const empId = employee?.id;

  // Related data queries
  const { data: contractsData } = useEmployeeContracts(empId, { limit: 5 });
  const { data: attendanceData } = useEmployeeAttendance(empId, { limit: 5 });
  const { data: timeOffData } = useEmployeeTimeOff(empId, { limit: 5 });
  const { data: allocationsData } = useEmployeeAllocations(empId, { limit: 5 });

  const contractsCount = contractsData?.meta?.total ?? 0;
  const attendanceCount = attendanceData?.meta?.total ?? 0;
  const timeOffCount = timeOffData?.meta?.total ?? 0;
  const allocationsCount = allocationsData?.meta?.total ?? 0;

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !employee) {
    return (
      <div className="p-8 text-center max-w-md mx-auto bg-white rounded-xl border border-slate-200 mt-6 shadow-card">
        <User className="h-10 w-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800">
          No Employee Profile Linked
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Your user account is not currently linked to an active employee profile.
          Please contact your HR administrator.
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'My Details' },
    { id: 'contracts', label: 'My Contracts', badge: contractsCount },
    { id: 'attendance', label: 'My Attendance', badge: attendanceCount },
    { id: 'time-off', label: 'Leave & Balances', badge: timeOffCount },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Self-service Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-700 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
              {getInitials(employee.fullName)}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {employee.fullName}
                </h2>
                <StatusPill status={employee.status} size="sm" />
                <Badge variant="brand">Self-Service</Badge>
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

          <div className="flex flex-col sm:items-end space-y-1 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <span>{employee.workEmail}</span>
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
              <CardTitle>My Work &amp; Reporting</CardTitle>
              <CardDescription>Official role and organization details</CardDescription>
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
                <span className="text-slate-500">Reporting Manager</span>
                <span className="font-semibold text-slate-800">
                  {employee.manager?.fullName || 'Not assigned'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Schedule Pattern</span>
                <span className="font-semibold text-slate-800">
                  {employee.workingSchedule?.name || 'Standard Full Time'} (
                  {employee.workingSchedule?.hoursPerWeek || 40}h/week)
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Active Compensation */}
          <Card>
            <CardHeader>
              <CardTitle>Active Compensation</CardTitle>
              <CardDescription>Wage information snapshot</CardDescription>
            </CardHeader>
            <CardBody className="space-y-3 text-xs">
              {employee.activeContract ? (
                <>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="text-[11px] text-emerald-700">Wage Base</div>
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
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Structure</span>
                    <span className="font-semibold text-slate-800">
                      {employee.activeContract.salaryStructure?.name || 'Standard'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Contract Period</span>
                    <span className="text-slate-800">
                      {formatDate(employee.activeContract.startDate)} &rarr;{' '}
                      {employee.activeContract.endDate
                        ? formatDate(employee.activeContract.endDate)
                        : 'Permanent'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center text-slate-500">
                  No active contract on file.
                </div>
              )}
            </CardBody>
          </Card>

          {/* Bank Account */}
          <Card>
            <CardHeader>
              <CardTitle>Salary Deposit Bank Account</CardTitle>
              <CardDescription>Where payslips are disbursed</CardDescription>
            </CardHeader>
            <CardBody className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Bank Name</span>
                <span className="font-semibold text-slate-800">
                  {employee.bankName || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Account Name</span>
                <span className="text-slate-800">
                  {employee.bankAccountName || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Account Number</span>
                <span className="font-mono text-slate-800">
                  {employee.bankAccountNumber
                    ? `••••${String(employee.bankAccountNumber).slice(-4)}`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Routing / IFSC</span>
                <span className="font-mono text-slate-800">
                  {employee.bankIfscCode || '—'}
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Account & Security */}
          <Card>
            <CardHeader>
              <CardTitle>My Portal Account</CardTitle>
              <CardDescription>Authentication security</CardDescription>
            </CardHeader>
            <CardBody className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Login Email</span>
                <span className="font-mono text-slate-800">
                  {employee.login?.email || employee.workEmail}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Account Status</span>
                <span className="flex items-center text-emerald-700 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                  Active Portal Access
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tab 2: Contracts */}
      {activeTab === 'contracts' && (
        <Card>
          <CardHeader>
            <CardTitle>My Employment Contracts</CardTitle>
            <CardDescription>Contract terms and compensation records</CardDescription>
          </CardHeader>
          <CardBody>
            {contractsData?.data && contractsData.data.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {contractsData.data.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {c.reference || 'Contract'} — {c.salaryStructure?.name}
                      </div>
                      <div className="text-slate-500">
                        {formatDate(c.startDate)} to {c.endDate ? formatDate(c.endDate) : 'Open'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(c.wage, c.currency)}
                      </span>
                      <StatusPill status={c.status} size="xs" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No contract history recorded.
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Tab 3: Attendance */}
      {activeTab === 'attendance' && (
        <Card>
          <CardHeader>
            <CardTitle>My Recent Attendance</CardTitle>
            <CardDescription>Daily clock-in and attendance history</CardDescription>
          </CardHeader>
          <CardBody>
            {attendanceData?.data && attendanceData.data.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {attendanceData.data.map((att) => (
                  <div key={att.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">
                        {formatDate(att.date)}
                      </span>
                      <span className="text-slate-500 ml-3">
                        {att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        {' - '}
                        {att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-600 font-medium">
                        {att.workedHours ? `${Number(att.workedHours).toFixed(1)} hrs` : '—'}
                      </span>
                      <StatusPill status={att.status} size="xs" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No attendance logs found.
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Tab 4: Time Off & Balances */}
      {activeTab === 'time-off' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Leave Quotas &amp; Balances</CardTitle>
              <CardDescription>Real-time leave balance calculations</CardDescription>
            </CardHeader>
            <CardBody>
              {allocationsData?.data && allocationsData.data.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allocationsData.data.map((alloc) => (
                    <div
                      key={alloc.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>{alloc.timeOffType?.name || 'Leave'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {alloc.timeOffType?.unit}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <div className="text-xl font-bold text-brand-600">
                            {alloc.remainingUnits !== undefined
                              ? Number(alloc.remainingUnits).toFixed(1)
                              : '—'}
                          </div>
                          <div className="text-[10px] text-slate-500">Remaining Balance</div>
                        </div>
                        <div className="text-right text-[11px] text-slate-500">
                          <div>Allocated: {Number(alloc.allocatedUnits).toFixed(1)}</div>
                          <div>Taken: {Number(alloc.takenUnits).toFixed(1)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  No active leave quotas assigned.
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Leave Requests</CardTitle>
              <CardDescription>Pending and approved requests</CardDescription>
            </CardHeader>
            <CardBody>
              {timeOffData?.data && timeOffData.data.length > 0 ? (
                <div className="divide-y divide-slate-100 text-xs">
                  {timeOffData.data.map((req) => (
                    <div key={req.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800">
                          {req.timeOffType?.name}
                        </span>
                        <span className="text-slate-500 ml-2">
                          ({formatDate(req.startDate)} to {formatDate(req.endDate)})
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-slate-600">
                          {req.duration} {req.timeOffType?.unit?.toLowerCase()}
                        </span>
                        <StatusPill status={req.status} size="xs" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  No leave requests submitted yet.
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

export default SelfServiceProfilePage;
