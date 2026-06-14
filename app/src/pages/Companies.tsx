import { useState } from 'react';
import { companies } from '@/data/mock';
import { Search, Eye, Edit, Pause, ArrowUpCircle } from 'lucide-react';

const planColors: Record<string, { bg: string; color: string; border: string }> = {
  Starter: { bg: 'rgba(255, 255, 255, 0.06)', color: '#8A8A93', border: 'rgba(255, 255, 255, 0.1)' },
  Pro: { bg: 'rgba(107, 138, 255, 0.1)', color: '#6B8AFF', border: 'rgba(107, 138, 255, 0.2)' },
  Enterprise: { bg: 'rgba(255, 138, 92, 0.1)', color: '#FF8A5C', border: 'rgba(255, 138, 92, 0.2)' },
};

export default function Companies() {
  const [search, setSearch] = useState('');

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.industry.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-hero font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
            Companies
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8A8A93' }}>Manage all your client companies</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#55555C' }} />
            <input
              type="text"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-dark pl-9 pr-4 py-2.5 text-sm w-64"
            />
          </div>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Logo</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Company Name</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Industry</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Plan</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Users</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Status</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Created</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((company, idx) => (
              <tr
                key={company.id}
                className="transition-colors duration-200"
                style={{
                  borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <td className="px-5 py-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium"
                    style={{ background: 'rgba(107, 138, 255, 0.15)', color: '#6B8AFF' }}
                  >
                    {company.logo}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{company.name}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm" style={{ color: '#8A8A93' }}>{company.industry}</span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{
                      background: planColors[company.plan].bg,
                      color: planColors[company.plan].color,
                      border: `1px solid ${planColors[company.plan].border}`,
                    }}
                  >
                    {company.plan}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-mono" style={{ color: '#F0EDE6' }}>{company.users}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${
                    company.status === 'Active' ? 'badge-green' :
                    company.status === 'Trial' ? 'badge-blue' : 'badge-red'
                  }`}>
                    {company.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-mono" style={{ color: '#8A8A93' }}>{company.createdDate}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-md transition-colors" style={{ color: '#8A8A93' }} title="View"
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#6B8AFF'; e.currentTarget.style.background = 'rgba(107, 138, 255, 0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A93'; e.currentTarget.style.background = 'transparent'; }}>
                      <Eye size={14} />
                    </button>
                    <button className="p-1.5 rounded-md transition-colors" style={{ color: '#8A8A93' }} title="Edit"
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#6B8AFF'; e.currentTarget.style.background = 'rgba(107, 138, 255, 0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A93'; e.currentTarget.style.background = 'transparent'; }}>
                      <Edit size={14} />
                    </button>
                    <button className="p-1.5 rounded-md transition-colors" style={{ color: '#8A8A93' }} title="Suspend"
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#FF5A5A'; e.currentTarget.style.background = 'rgba(255, 90, 90, 0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A93'; e.currentTarget.style.background = 'transparent'; }}>
                      <Pause size={14} />
                    </button>
                    <button className="p-1.5 rounded-md transition-colors" style={{ color: '#8A8A93' }} title="Upgrade"
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#4ADE80'; e.currentTarget.style.background = 'rgba(74, 222, 128, 0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A93'; e.currentTarget.style.background = 'transparent'; }}>
                      <ArrowUpCircle size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className="flex items-center justify-between mt-8 pt-4"
        style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}
      >
        <span className="text-xs" style={{ color: '#55555C' }}>MMe-AI v2.0</span>
        <span className="text-xs font-mono" style={{ color: '#55555C' }}>Last synced: 2 min ago</span>
      </div>
    </div>
  );
}

