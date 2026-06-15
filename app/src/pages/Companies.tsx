import { useEffect, useMemo, useState } from 'react';
import { getAdminTenants, toggleAdminTenant, type AdminTenant } from '@/lib/adminApi';
import { Search, Eye, Pause, ArrowUpCircle, RefreshCw } from 'lucide-react';

const planColors: Record<string, { bg: string; color: string; border: string }> = {
  free: { bg: 'rgba(255, 255, 255, 0.06)', color: '#8A8A93', border: 'rgba(255, 255, 255, 0.1)' },
  pro: { bg: 'rgba(107, 138, 255, 0.1)', color: '#6B8AFF', border: 'rgba(107, 138, 255, 0.2)' },
  enterprise: { bg: 'rgba(255, 138, 92, 0.1)', color: '#FF8A5C', border: 'rgba(255, 138, 92, 0.2)' },
};

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

function formatBusinessType(type: string) {
  return type
    .split('_')
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
}

function formatPlan(plan: string) {
  return plan[0]?.toUpperCase() + plan.slice(1);
}

export default function Companies() {
  const [search, setSearch] = useState('');
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadTenants() {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminTenants();
      setTenants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenants();
  }, []);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return tenants;

    return tenants.filter((company) =>
      company.name.toLowerCase().includes(query) ||
      company.business_type.toLowerCase().includes(query) ||
      company.plan.toLowerCase().includes(query)
    );
  }, [search, tenants]);

  async function handleToggleTenant(tenantId: string) {
    try {
      setActionLoadingId(tenantId);
      setError(null);
      await toggleAdminTenant(tenantId);
      await loadTenants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update company');
    } finally {
      setActionLoadingId(null);
    }
  }

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
          <button
            onClick={loadTenants}
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
              placeholder="Search companies..."
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
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Logo</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Company Name</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Industry</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Plan</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Status</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Tenant ID</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: '#8A8A93' }}>
                  Loading companies from backend...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: '#8A8A93' }}>
                  No companies found.
                </td>
              </tr>
            ) : (
              filtered.map((company, idx) => {
                const planStyle = planColors[company.plan] || planColors.free;

                return (
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
                        {getInitials(company.name) || 'CO'}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{company.name}</span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-sm" style={{ color: '#8A8A93' }}>{formatBusinessType(company.business_type)}</span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{
                          background: planStyle.bg,
                          color: planStyle.color,
                          border: `1px solid ${planStyle.border}`,
                        }}
                      >
                        {formatPlan(company.plan)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${company.is_active ? 'badge-green' : 'badge-red'}`}>
                        {company.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs font-mono" style={{ color: '#8A8A93' }}>
                        {company.id.slice(0, 8)}...
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1.5 rounded-md transition-colors"
                          style={{ color: '#8A8A93' }}
                          title={`View ${company.name}`}
                          onClick={() => alert(`Company: ${company.name}\nTenant ID: ${company.id}\nPlan: ${company.plan}\nStatus: ${company.is_active ? 'Active' : 'Suspended'}`)}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#6B8AFF'; e.currentTarget.style.background = 'rgba(107, 138, 255, 0.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A93'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          className="p-1.5 rounded-md transition-colors disabled:opacity-50"
                          style={{ color: '#8A8A93' }}
                          title={company.is_active ? 'Suspend' : 'Activate'}
                          disabled={actionLoadingId === company.id}
                          onClick={() => handleToggleTenant(company.id)}
                          onMouseEnter={(e) => { e.currentTarget.style.color = company.is_active ? '#FF5A5A' : '#4ADE80'; e.currentTarget.style.background = company.is_active ? 'rgba(255, 90, 90, 0.08)' : 'rgba(74, 222, 128, 0.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A93'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Pause size={14} />
                        </button>

                        <button
                          className="p-1.5 rounded-md transition-colors"
                          style={{ color: '#8A8A93' }}
                          title="Upgrade placeholder"
                          onClick={() => alert('Upgrade flow will be connected later.')}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#4ADE80'; e.currentTarget.style.background = 'rgba(74, 222, 128, 0.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A93'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <ArrowUpCircle size={14} />
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

      <div
        className="flex items-center justify-between mt-8 pt-4"
        style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}
      >
        <span className="text-xs" style={{ color: '#55555C' }}>AI Growth OS v2.0</span>
        <span className="text-xs font-mono" style={{ color: '#55555C' }}>
          {loading ? 'Syncing...' : `Showing ${filtered.length} of ${tenants.length} companies`}
        </span>
      </div>
    </div>
  );
}