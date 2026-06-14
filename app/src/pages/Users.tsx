import { useState } from 'react';
import { users } from '@/data/mock';
import { Search, Edit, Lock, UserX } from 'lucide-react';

const roleStyles: Record<string, { bg: string; color: string; border: string }> = {
  Admin: { bg: 'rgba(107, 138, 255, 0.1)', color: '#6B8AFF', border: 'rgba(107, 138, 255, 0.2)' },
  Editor: { bg: 'rgba(107, 138, 255, 0.06)', color: '#6B8AFF', border: 'rgba(107, 138, 255, 0.15)' },
  Viewer: { bg: 'rgba(255, 255, 255, 0.06)', color: '#8A8A93', border: 'rgba(255, 255, 255, 0.1)' },
};

const avatarColors = ['#6B8AFF', '#FF8A5C', '#4ADE80', '#FF5A5A', '#A78BFA', '#22D3EE'];

export default function UsersPage() {
  const [search, setSearch] = useState('');

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-hero font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
            Users
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8A8A93' }}>Manage platform users across all companies</p>
        </div>
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
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Last Login</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, idx) => (
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
                    {user.avatar}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{user.name}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm" style={{ color: '#8A8A93' }}>{user.email}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm" style={{ color: '#8A8A93' }}>{user.company}</span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{
                      background: roleStyles[user.role].bg,
                      color: roleStyles[user.role].color,
                      border: `1px solid ${roleStyles[user.role].border}`,
                    }}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${user.status === 'Active' ? 'badge-green' : 'badge-neutral'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-mono" style={{ color: '#8A8A93' }}>{user.lastLogin}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-md transition-colors" style={{ color: '#8A8A93' }} title="Edit"
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#6B8AFF'; e.currentTarget.style.background = 'rgba(107, 138, 255, 0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A93'; e.currentTarget.style.background = 'transparent'; }}>
                      <Edit size={14} />
                    </button>
                    <button className="p-1.5 rounded-md transition-colors" style={{ color: '#8A8A93' }} title="Disable"
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#FF5A5A'; e.currentTarget.style.background = 'rgba(255, 90, 90, 0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A93'; e.currentTarget.style.background = 'transparent'; }}>
                      <UserX size={14} />
                    </button>
                    <button className="p-1.5 rounded-md transition-colors" style={{ color: '#8A8A93' }} title="Reset Password"
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#FF8A5C'; e.currentTarget.style.background = 'rgba(255, 138, 92, 0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A93'; e.currentTarget.style.background = 'transparent'; }}>
                      <Lock size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-8 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <span className="text-xs" style={{ color: '#55555C' }}>MMe-AI v2.0</span>
        <span className="text-xs font-mono" style={{ color: '#55555C' }}>Last synced: 2 min ago</span>
      </div>
    </div>
  );
}

