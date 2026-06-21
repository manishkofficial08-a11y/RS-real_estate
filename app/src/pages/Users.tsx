import { useEffect, useMemo, useState } from 'react';
import { getAdminUsers, type AdminUser } from '@/lib/adminApi';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Crown,
  KeyRound,
  Lock,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserCog,
  Users,
  UserX,
} from 'lucide-react';

const roleStyles: Record<string, { bg: string; color: string; border: string }> = {
  superadmin: { bg: 'rgba(255, 138, 92, 0.1)', color: '#FF8A5C', border: 'rgba(255, 138, 92, 0.2)' },
  super_admin: { bg: 'rgba(255, 138, 92, 0.1)', color: '#FF8A5C', border: 'rgba(255, 138, 92, 0.2)' },
  admin: { bg: 'rgba(107, 138, 255, 0.1)', color: '#6B8AFF', border: 'rgba(107, 138, 255, 0.2)' },
  client: { bg: 'rgba(74, 222, 128, 0.08)', color: '#4ADE80', border: 'rgba(74, 222, 128, 0.16)' },
  owner: { bg: 'rgba(74, 222, 128, 0.08)', color: '#4ADE80', border: 'rgba(74, 222, 128, 0.16)' },
  staff: { bg: 'rgba(255, 255, 255, 0.06)', color: '#8A8A93', border: 'rgba(255, 255, 255, 0.1)' },
};

const avatarColors = ['#6B8AFF', '#FF8A5C', '#4ADE80', '#FF5A5A', '#A78BFA', '#22D3EE'];

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

function formatRole(role: string) {
  return role
    .split('_')
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
}

function getRoleStyle(role: string) {
  return roleStyles[role] || roleStyles.staff;
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return users;

    return users.filter((user) =>
      user.full_name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query) ||
      (user.company || 'Founder Platform').toLowerCase().includes(query)
    );
  }, [search, users]);

  const activeUsers = users.filter((user) => user.is_active).length;
  const inactiveUsers = users.length - activeUsers;
  const adminRoles = ['admin', 'superadmin', 'super_admin'];
  const clientRoles = ['owner', 'client'];
  const staffRoles = ['staff', 'marketer', 'sales', 'viewer'];

  const adminUsers = users.filter((user) => adminRoles.includes(user.role)).length;
  const clientUsers = users.filter((user) => clientRoles.includes(user.role)).length;
  const staffUsers = users.filter((user) => staffRoles.includes(user.role)).length;
  const founderUsers = users.filter((user) => !user.company && adminRoles.includes(user.role)).length;

  const summaryCards = [
    {
      label: 'Total Users',
      value: users.length,
      sub: 'Across platform',
      icon: Users,
      color: '#6B8AFF',
    },
    {
      label: 'Active Users',
      value: activeUsers,
      sub: 'Enabled accounts',
      icon: UserCheck,
      color: '#4ADE80',
    },
    {
      label: 'Admins',
      value: adminUsers,
      sub: 'Founder/admin access',
      icon: ShieldCheck,
      color: '#FF8A5C',
    },
    {
      label: 'Clients',
      value: clientUsers,
      sub: 'Client portal users',
      icon: UserCog,
      color: '#6B8AFF',
    },
    {
      label: 'Inactive Users',
      value: inactiveUsers,
      sub: 'Access disabled',
      icon: UserX,
      color: '#FF5A5A',
    },
  ];

  const roleDistribution = [
    { label: 'Admins', value: adminUsers, color: '#FF8A5C' },
    { label: 'Clients', value: clientUsers, color: '#4ADE80' },
    { label: 'Staff', value: staffUsers, color: '#8A8A93' },
    { label: 'Founder Platform', value: founderUsers, color: '#6B8AFF' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ background: 'rgba(255, 138, 92, 0.08)', border: '1px solid rgba(255, 138, 92, 0.16)' }}>
            <Crown size={14} style={{ color: '#FF8A5C' }} />
            <span className="text-xs font-mono" style={{ color: '#FF8A5C' }}>Founder Access Control</span>
          </div>

          <h1 className="font-display text-hero font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
            Users
          </h1>
          <p className="mt-1 max-w-2xl text-sm" style={{ color: '#8A8A93' }}>
            Manage platform users, client seats, admin access, account status, and role visibility across all real estate companies.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={loadUsers}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm transition-colors"
            style={{
              color: '#F0EDE6',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
            title="Refresh"
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#55555C' }} />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-dark w-full pl-9 pr-4 py-2.5 text-sm sm:w-72"
            />
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className="surface-card p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <p className="text-xs font-mono" style={{ color: '#8A8A93' }}>{card.label}</p>
                <div className="rounded-xl p-2.5" style={{ background: `${card.color}14`, color: card.color, border: `1px solid ${card.color}26` }}>
                  <Icon size={17} />
                </div>
              </div>
              <p className="font-mono text-data font-medium" style={{ color: '#F0EDE6' }}>{loading ? '—' : card.value}</p>
              <p className="mt-2 text-xs" style={{ color: '#55555C' }}>{card.sub}</p>
            </div>
          );
        })}
      </div>

      {error && (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-sm"
          style={{
            color: '#FF8A5C',
            background: 'rgba(255, 138, 92, 0.08)',
            border: '1px solid rgba(255, 138, 92, 0.18)',
          }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="surface-card overflow-hidden">
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div>
              <h2 className="text-base font-medium" style={{ color: '#F0EDE6' }}>User Directory</h2>
              <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>
                Backend-connected users list with role and status visibility
              </p>
            </div>
            <span className="text-xs font-mono" style={{ color: '#55555C' }}>
              {loading ? 'Syncing...' : `Showing ${filtered.length} of ${users.length}`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px]">
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>User</th>
                  <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Email</th>
                  <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Company</th>
                  <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Role</th>
                  <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Status</th>
                  <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>User ID</th>
                  <th className="text-right px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(107, 138, 255, 0.08)', color: '#6B8AFF' }}>
                        <RefreshCw size={20} className="animate-spin" />
                      </div>
                      <p className="text-sm font-medium" style={{ color: '#F0EDE6' }}>Loading users</p>
                      <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>Fetching user records from backend...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(255, 255, 255, 0.04)', color: '#8A8A93' }}>
                        <Search size={20} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: '#F0EDE6' }}>No users found</p>
                      <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>Try searching by name, email, role, or company.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((user, idx) => {
                    const roleStyle = getRoleStyle(user.role);
                    const avatarColor = avatarColors[idx % avatarColors.length];

                    return (
                      <tr
                        key={user.id}
                        className="transition-colors duration-200"
                        style={{
                          borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-medium"
                              style={{ background: `${avatarColor}20`, color: avatarColor, border: `1px solid ${avatarColor}30` }}
                            >
                              {getInitials(user.full_name) || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{user.full_name}</p>
                              <p className="mt-1 text-xs" style={{ color: '#55555C' }}>Platform account</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm" style={{ color: '#8A8A93' }}>{user.email}</span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm" style={{ color: '#8A8A93' }}>
                            {user.company || 'Founder Platform'}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs"
                            style={{
                              background: roleStyle.bg,
                              color: roleStyle.color,
                              border: `1px solid ${roleStyle.border}`,
                            }}
                          >
                            {formatRole(user.role)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full ${user.is_active ? 'badge-green' : 'badge-neutral'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-xs font-mono" style={{ color: '#8A8A93' }}>
                            {user.id.slice(0, 8)}...
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="rounded-md p-1.5 transition-colors"
                              style={{ color: '#8A8A93' }}
                              title="Disable placeholder"
                              onClick={() => alert('User disable API will be connected later.')}
                            >
                              <UserX size={15} />
                            </button>

                            <button
                              className="rounded-md p-1.5 transition-colors"
                              style={{ color: '#8A8A93' }}
                              title="Reset password placeholder"
                              onClick={() => alert('Password reset flow will be connected later.')}
                            >
                              <Lock size={15} />
                            </button>

                            <button
                              className="rounded-md p-1.5 transition-colors"
                              style={{ color: '#8A8A93' }}
                              title="More actions"
                            >
                              <MoreHorizontal size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-medium" style={{ color: '#F0EDE6' }}>Role Distribution</h2>
                <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>Access mix across users</p>
              </div>
              <Activity size={18} style={{ color: '#6B8AFF' }} />
            </div>

            <div className="space-y-4">
              {roleDistribution.map((item) => {
                const width = users.length > 0 ? `${Math.max((item.value / users.length) * 100, item.value > 0 ? 8 : 0)}%` : '0%';

                return (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{item.label}</span>
                      <span className="text-xs font-mono" style={{ color: '#8A8A93' }}>{item.value} users</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                      <div className="h-2 rounded-full" style={{ width, background: item.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="surface-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-medium" style={{ color: '#F0EDE6' }}>User Health</h2>
                <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>Founder admin notes</p>
              </div>
              <KeyRound size={18} style={{ color: '#FF8A5C' }} />
            </div>

            <div className="space-y-3">
              <div className="rounded-xl p-4" style={{ background: 'rgba(74, 222, 128, 0.06)', border: '1px solid rgba(74, 222, 128, 0.14)' }}>
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle2 size={14} style={{ color: '#4ADE80' }} />
                  <span className="text-xs font-mono" style={{ color: '#4ADE80' }}>Active access</span>
                </div>
                <p className="text-sm leading-6" style={{ color: '#F0EDE6' }}>
                  {loading ? 'Loading user health...' : `${activeUsers} of ${users.length} users currently have active platform access.`}
                </p>
              </div>

              <div className="rounded-xl p-4" style={{ background: 'rgba(107, 138, 255, 0.06)', border: '1px solid rgba(107, 138, 255, 0.14)' }}>
                <div className="mb-2 flex items-center gap-2">
                  <ShieldCheck size={14} style={{ color: '#6B8AFF' }} />
                  <span className="text-xs font-mono" style={{ color: '#6B8AFF' }}>Admin visibility</span>
                </div>
                <p className="text-sm leading-6" style={{ color: '#F0EDE6' }}>
                  {adminUsers} users have elevated founder/admin style access. Keep this reviewed as the team grows.
                </p>
              </div>

              <div className="rounded-xl p-4" style={{ background: 'rgba(255, 138, 92, 0.06)', border: '1px solid rgba(255, 138, 92, 0.14)' }}>
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle size={14} style={{ color: '#FF8A5C' }} />
                  <span className="text-xs font-mono" style={{ color: '#FF8A5C' }}>Access actions</span>
                </div>
                <p className="text-sm leading-6" style={{ color: '#F0EDE6' }}>
                  Disable and password reset actions remain placeholders until user management APIs are assigned.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <span className="text-xs" style={{ color: '#55555C' }}>RS Real Estate v2.0</span>
        <span className="text-xs font-mono" style={{ color: '#55555C' }}>
          {loading ? 'Syncing...' : `Showing ${filtered.length} of ${users.length} users`}
        </span>
      </div>
    </div>
  );
}
