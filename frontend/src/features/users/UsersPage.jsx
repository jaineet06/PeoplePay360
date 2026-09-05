import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Search, UserCog, AlertCircle, RefreshCw } from 'lucide-react';
import { usersApi } from '@/api/users.api';
import { useAuthStore } from '@/features/auth/authStore';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { handleApiError } from '@/utils/handleApiError';
import { formatDate } from '@/utils/formatters';

// Hierarchy map — must mirror backend ROLE_LEVEL
const ROLE_LEVEL = {
  EMPLOYEE: 0,
  HR_MANAGER: 1,
  HR_PAYROLL_USER: 2,
  HR_PAYROLL_MANAGER: 3,
  ADMIN: 4,
};

const ROLE_LABELS = {
  EMPLOYEE: 'Employee',
  HR_MANAGER: 'HR Manager',
  HR_PAYROLL_USER: 'Payroll User',
  HR_PAYROLL_MANAGER: 'Payroll Manager',
  ADMIN: 'Administrator',
};

const ROLE_BADGE_VARIANT = {
  EMPLOYEE: 'slate',
  HR_MANAGER: 'green',
  HR_PAYROLL_USER: 'blue',
  HR_PAYROLL_MANAGER: 'purple',
  ADMIN: 'rose',
};

const ALL_ROLES = ['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'];

// Returns roles strictly below the caller's level (what they're allowed to assign)
function assignableRoles(callerRole) {
  const callerLevel = ROLE_LEVEL[callerRole] ?? -1;
  return ALL_ROLES.filter((r) => ROLE_LEVEL[r] < callerLevel);
}

// ─── Role Change Modal ────────────────────────────────────────────────────────
function RoleChangeModal({ isOpen, onClose, targetUser, callerUser, onSuccess }) {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: ({ id, role }) => usersApi.changeRole(id, role),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`Role updated to ${ROLE_LABELS[data.data?.user?.role] ?? selectedRole}`);
      onSuccess?.();
    },
    onError: (err) => {
      const msg = handleApiError(err);
      setError(msg);
    },
  });

  const allowedRoles = assignableRoles(callerUser?.role);

  const roleOptions = allowedRoles.map((r) => ({
    value: r,
    label: ROLE_LABELS[r],
  }));

  const handleOpen = () => {
    setSelectedRole('');
    setError('');
  };

  const handleSubmit = () => {
    if (!selectedRole) {
      setError('Please select a new role.');
      return;
    }
    if (selectedRole === targetUser?.role) {
      setError('The user already has this role.');
      return;
    }
    setError('');
    mutation.mutate({ id: targetUser.id, role: selectedRole });
  };

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) handleOpen();
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change User Role"
      maxWidth="max-w-sm"
      description={`Reassign the system role for ${targetUser?.email ?? 'this user'}`}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={mutation.isPending}
            leftIcon={ShieldCheck}
          >
            Confirm Change
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Current state */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">User</span>
            <span className="font-medium text-slate-800 truncate max-w-[180px]">{targetUser?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Current Role</span>
            <Badge variant={ROLE_BADGE_VARIANT[targetUser?.role] || 'slate'} size="xs">
              {ROLE_LABELS[targetUser?.role] ?? targetUser?.role}
            </Badge>
          </div>
        </div>

        {/* Role selector */}
        <Select
          label="New Role"
          id="new-role-select"
          value={selectedRole}
          onChange={(e) => { setSelectedRole(e.target.value); setError(''); }}
          options={roleOptions}
          placeholder="Select a role…"
          required
        />

        {/* Info about what will change */}
        {selectedRole && selectedRole !== targetUser?.role && (
          <div className="rounded-lg bg-brand-50 border border-brand-200 p-3 text-brand-800 space-y-1">
            <p className="font-semibold">Role change summary</p>
            <p className="text-[11px] leading-relaxed">
              {targetUser?.email} will be moved from{' '}
              <strong>{ROLE_LABELS[targetUser?.role]}</strong> →{' '}
              <strong>{ROLE_LABELS[selectedRole]}</strong>. This change takes effect immediately.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-start gap-2 text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="text-[11px] leading-relaxed">{error}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Users Page ───────────────────────────────────────────────────────────────
export default function UsersPage() {
  const callerUser = useAuthStore((s) => s.user);
  const callerLevel = ROLE_LEVEL[callerUser?.role] ?? -1;

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [roleFilter, setRoleFilter] = useState('');
  const { page, limit, onPageChange, onLimitChange } = usePagination(1, 15);

  const [changeRoleTarget, setChangeRoleTarget] = useState(null); // user object

  const queryKey = ['users', { page, limit, search: debouncedSearch, role: roleFilter }];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await usersApi.list({
        page,
        limit,
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        sortBy: 'createdAt',
        order: 'asc',
      });
      return res;
    },
    staleTime: 30_000,
  });

  const users = data?.data ?? [];
  const meta = data?.meta;

  const roleFilterOptions = [
    { value: '', label: 'All Roles' },
    ...ALL_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
  ];

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
    onPageChange(1);
  }, [onPageChange]);

  const handleRoleFilterChange = useCallback((e) => {
    setRoleFilter(e.target.value);
    onPageChange(1);
  }, [onPageChange]);

  const columns = [
    {
      key: 'email',
      header: 'Account',
      render: (email, row) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-slate-900">{email}</div>
          {row.employee?.fullName && (
            <div className="text-[11px] text-slate-400">
              {row.employee.fullName}
              {row.employee.employeeCode ? ` · ${row.employee.employeeCode}` : ''}
            </div>
          )}
          {!row.employee && (
            <div className="text-[11px] text-slate-400 italic">No linked employee profile</div>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (role) => (
        <Badge variant={ROLE_BADGE_VARIANT[role] || 'slate'} size="xs">
          {ROLE_LABELS[role] ?? role}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (isActive) => (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
            isActive ? 'text-emerald-700' : 'text-slate-400'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
          />
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Last Login',
      render: (v) => (
        <span className="text-slate-500">{v ? formatDate(v) : 'Never'}</span>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      render: (_, row) => {
        const rowLevel = ROLE_LEVEL[row.role] ?? -1;
        const isSelf = row.id === callerUser?.id;
        // Show button only when: not self AND caller is strictly higher than this row's role
        const canAct = !isSelf && callerLevel > rowLevel;

        if (!canAct) return null;

        return (
          <Button
            id={`change-role-${row.id}`}
            variant="outline"
            size="xs"
            leftIcon={UserCog}
            onClick={() => setChangeRoleTarget(row)}
          >
            Change Role
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-brand-600" />
            User & Role Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Promote or demote system users. You can only act on roles below your own level.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
          <span>
            You are logged in as{' '}
            <strong className="text-slate-800">{ROLE_LABELS[callerUser?.role]}</strong>
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            id="users-search"
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by email…"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-slate-400"
          />
        </div>
        <Select
          id="users-role-filter"
          value={roleFilter}
          onChange={handleRoleFilterChange}
          options={roleFilterOptions}
          dense
          className="sm:w-44"
        />
      </div>

      {/* Hierarchy Legend */}
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-[11px] text-slate-500 font-medium mb-2 uppercase tracking-wide">Role Hierarchy</p>
        <div className="flex flex-wrap items-center gap-2">
          {ALL_ROLES.map((role, i) => (
            <React.Fragment key={role}>
              <Badge
                variant={ROLE_BADGE_VARIANT[role]}
                size="xs"
                className={role === callerUser?.role ? 'ring-2 ring-offset-1 ring-brand-400' : ''}
              >
                {ROLE_LABELS[role]}
                {role === callerUser?.role && ' (you)'}
              </Badge>
              {i < ALL_ROLES.length - 1 && (
                <span className="text-slate-300 text-[10px] font-bold">{'<'}</span>
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">
          The <strong className="text-slate-600">Change Role</strong> button appears only on rows below your level.
        </p>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No users found"
          description="Adjust your search or role filter to see results."
        />
      ) : (
        <DataTable
          columns={columns}
          data={users}
          keyField="id"
          emptyMessage="No users match your search."
        />
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={limit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      )}

      {/* Role Change Modal */}
      <RoleChangeModal
        isOpen={Boolean(changeRoleTarget)}
        onClose={() => setChangeRoleTarget(null)}
        targetUser={changeRoleTarget}
        callerUser={callerUser}
        onSuccess={() => setChangeRoleTarget(null)}
      />
    </div>
  );
}
