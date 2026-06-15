import { useEffect, useMemo, useState } from 'react';
import { getAdminUsers, type AdminUser } from '@/lib/adminApi';
import { Search, Lock, UserX, RefreshCw } from 'lucide-react';

const roleStyles: Record<string, { bg: string; color: string; border: string }> = {
  superadmin: { bg: 'rgba(255, 138, 92, 0.1)', color: '#FF8A5C', border: 'rgba(255, 138, 92, 0.2)' },
  admin: { bg: 'rgba(107, 138, 255, 0.1)', color: '#6B8AFF', border: 'rgba(107, 138, 255, 0.2)' },
  client: { bg: 'rgba(74, 222, 128, 0.08)', color: '#4ADE80', border: 'rgba(74, 222, 128, 0.16)' },
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-hero font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
            Users
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8A8A93' }}>Manage platform users across all companies</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadUsers}
            className="p-2.5 rounded-lg transition-colors"
            style={{
              color: '#8A8A93',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#55555C' }} />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-dark pl-9 pr-4 py-2.5 text-sm w-64"
            />
          </div>
        </div>
      </div>

      {error && (
        <div
          className="mb-4 rounded-xl px-4 py-3 text-sm"
          style={{
            color: '#FF8A5C',
            background: 'rgba(255, 138, 92, 0.08)',
            border: '1px solid rgba(255, 138, 92, 0.18)',
          }}
        >
          {error}
        </div>
      )}

      <div className="surface-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Avatar</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Name</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Email</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Company</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Role</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Status</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>User ID</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm" style={{ color: '#8A8A93' }}>
                  Loading users from backend...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm" style={{ color: '#8A8A93' }}>
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((user, idx) => {
                const roleStyle = roleStyles[user.role] || roleStyles.staff;

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
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                        style={{ background: avatarColors[idx % avatarColors.length] + '20', color: avatarColors[idx % avatarColors.length] }}
                      >
                        {getInitials(user.full_name) || 'U'}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{user.full_name}</span>
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
                        className="text-xs px-2.5 py-1 rounded-full"
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
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1.5 rounded-md transition-colors"
                          style={{ color: '#8A8A93' }}
                          title="Disable placeholder"
                          onClick={() => alert('User disable API will be connected later.')}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#FF5A5A'; e.currentTarget.style.background = 'rgba(255, 90, 90, 0.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A93'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <UserX size={14} />
                        </button>

                        <button
                          className="p-1.5 rounded-md transition-colors"
                          style={{ color: '#8A8A93' }}
                          title="Reset password placeholder"
                          onClick={() => alert('Password reset flow will be connected later.')}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#FF8A5C'; e.currentTarget.style.background = 'rgba(255, 138, 92, 0.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A93'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Lock size={14} />
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

      <div className="flex items-center justify-between mt-8 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <span className="text-xs" style={{ color: '#55555C' }}>AI Growth OS v2.0</span>
        <span className="text-xs font-mono" style={{ color: '#55555C' }}>
          {loading ? 'Syncing...' : `Showing ${filtered.length} of ${users.length} users`}
        </span>
      </div>
    </div>
  );
}