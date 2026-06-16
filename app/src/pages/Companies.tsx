import { useEffect, useMemo, useState } from 'react';
import { getAdminTenants, toggleAdminTenant, type AdminTenant } from '@/lib/adminApi';
import {
  AlertTriangle,
  ArrowUpCircle,
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  MoreHorizontal,
  Pause,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

const planColors: Record<string, { bg: string; color: string; border: string }> = {
  free: { bg: 'rgba(255, 255, 255, 0.06)', color: '#8A8A93', border: 'rgba(255, 255, 255, 0.1)' },
  pro: { bg: 'rgba(107, 138, 255, 0.1)', color: '#6B8AFF', border: 'rgba(107, 138, 255, 0.2)' },
  enterprise: { bg: 'rgba(255, 138, 92, 0.1)', color: '#FF8A5C', border: 'rgba(255, 138, 92, 0.2)' },
};

const businessTypeColors: Record<string, { bg: string; color: string; border: string }> = {
  agency: { bg: 'rgba(107, 138, 255, 0.08)', color: '#6B8AFF', border: 'rgba(107, 138, 255, 0.16)' },
  broker: { bg: 'rgba(74, 222, 128, 0.08)', color: '#4ADE80', border: 'rgba(74, 222, 128, 0.16)' },
  developer: { bg: 'rgba(255, 138, 92, 0.08)', color: '#FF8A5C', border: 'rgba(255, 138, 92, 0.16)' },
  default: { bg: 'rgba(255, 255, 255, 0.05)', color: '#8A8A93', border: 'rgba(255, 255, 255, 0.1)' },
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

function getPlanStyle(plan: string) {
  return planColors[plan] || planColors.free;
}

function getBusinessTypeStyle(type: string) {
  return businessTypeColors[type] || businessTypeColors.default;
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

  const activeCompanies = tenants.filter((company) => company.is_active).length;
  const suspendedCompanies = tenants.length - activeCompanies;
  const paidCompanies = tenants.filter((company) => company.plan === 'pro' || company.plan === 'enterprise').length;
  const trialCompanies = tenants.filter((company) => company.plan === 'free').length;
  const enterpriseCompanies = tenants.filter((company) => company.plan === 'enterprise').length;
  const churnRisk = suspendedCompanies;

  const summaryCards = [
    {
      label: 'Total Companies',
      value: tenants.length,
      sub: 'Client workspaces',
      icon: Building2,
      color: '#6B8AFF',
    },
    {
      label: 'Active Companies',
      value: activeCompanies,
      sub: 'Currently enabled',
      icon: CheckCircle2,
      color: '#4ADE80',
    },
    {
      label: 'Trial Companies',
      value: trialCompanies,
      sub: 'Free plan tenants',
      icon: Clock3,
      color: '#8A8A93',
    },
    {
      label: 'Paid Companies',
      value: paidCompanies,
      sub: 'Pro + Enterprise',
      icon: ShieldCheck,
      color: '#FF8A5C',
    },
    {
      label: 'Churn Risk',
      value: churnRisk,
      sub: 'Suspended tenants',
      icon: AlertTriangle,
      color: '#FF5A5A',
    },
  ];

  const planDistribution = [
    { label: 'Enterprise', value: enterpriseCompanies, color: '#FF8A5C' },
    { label: 'Pro', value: tenants.filter((company) => company.plan === 'pro').length, color: '#6B8AFF' },
    { label: 'Free', value: trialCompanies, color: '#8A8A93' },
  ];

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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ background: 'rgba(107, 138, 255, 0.08)', border: '1px solid rgba(107, 138, 255, 0.16)' }}>
            <Building2 size={14} style={{ color: '#6B8AFF' }} />
            <span className="text-xs font-mono" style={{ color: '#6B8AFF' }}>Tenant Operations</span>
          </div>

          <h1 className="font-display text-hero font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
            Companies
          </h1>
          <p className="mt-1 max-w-2xl text-sm" style={{ color: '#8A8A93' }}>
            Manage real estate client companies, plans, activation state, business type, and platform onboarding health.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={loadTenants}
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
              placeholder="Search companies..."
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
              <h2 className="text-base font-medium" style={{ color: '#F0EDE6' }}>Company Directory</h2>
              <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>
                Backend-connected tenant list with activation controls
              </p>
            </div>
            <span className="text-xs font-mono" style={{ color: '#55555C' }}>
              {loading ? 'Syncing...' : `Showing ${filtered.length} of ${tenants.length}`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Company</th>
                  <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Business Type</th>
                  <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Plan</th>
                  <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Status</th>
                  <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Tenant ID</th>
                  <th className="text-right px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(107, 138, 255, 0.08)', color: '#6B8AFF' }}>
                        <RefreshCw size={20} className="animate-spin" />
                      </div>
                      <p className="text-sm font-medium" style={{ color: '#F0EDE6' }}>Loading companies</p>
                      <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>Fetching tenant records from backend...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(255, 255, 255, 0.04)', color: '#8A8A93' }}>
                        <Search size={20} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: '#F0EDE6' }}>No companies found</p>
                      <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>Try a different company, plan, or business type search.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((company, idx) => {
                    const planStyle = getPlanStyle(company.plan);
                    const businessStyle = getBusinessTypeStyle(company.business_type);

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
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-medium"
                              style={{ background: 'rgba(107, 138, 255, 0.15)', color: '#6B8AFF', border: '1px solid rgba(107, 138, 255, 0.18)' }}
                            >
                              {getInitials(company.name) || 'CO'}
                            </div>
                            <div>
                              <p className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{company.name}</p>
                              <p className="mt-1 text-xs font-mono" style={{ color: '#55555C' }}>Workspace tenant</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs"
                            style={{
                              background: businessStyle.bg,
                              color: businessStyle.color,
                              border: `1px solid ${businessStyle.border}`,
                            }}
                          >
                            {formatBusinessType(company.business_type)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs"
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
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="rounded-md p-1.5 transition-colors"
                              style={{ color: '#8A8A93' }}
                              title={`View ${company.name}`}
                              onClick={() => alert(`Company: ${company.name}\nTenant ID: ${company.id}\nPlan: ${company.plan}\nStatus: ${company.is_active ? 'Active' : 'Suspended'}`)}
                            >
                              <Eye size={15} />
                            </button>

                            <button
                              className="rounded-md p-1.5 transition-colors disabled:opacity-50"
                              style={{ color: '#8A8A93' }}
                              title={company.is_active ? 'Suspend' : 'Activate'}
                              disabled={actionLoadingId === company.id}
                              onClick={() => handleToggleTenant(company.id)}
                            >
                              <Pause size={15} />
                            </button>

                            <button
                              className="rounded-md p-1.5 transition-colors"
                              style={{ color: '#8A8A93' }}
                              title="Upgrade placeholder"
                              onClick={() => alert('Upgrade flow will be connected later.')}
                            >
                              <ArrowUpCircle size={15} />
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
                <h2 className="text-base font-medium" style={{ color: '#F0EDE6' }}>Plan Distribution</h2>
                <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>Paid vs trial tenant mix</p>
              </div>
              <TrendingUp size={18} style={{ color: '#6B8AFF' }} />
            </div>

            <div className="space-y-4">
              {planDistribution.map((item) => {
                const width = tenants.length > 0 ? `${Math.max((item.value / tenants.length) * 100, item.value > 0 ? 8 : 0)}%` : '0%';

                return (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{item.label}</span>
                      <span className="text-xs font-mono" style={{ color: '#8A8A93' }}>{item.value} companies</span>
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
                <h2 className="text-base font-medium" style={{ color: '#F0EDE6' }}>Growth Insights</h2>
                <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>Founder-facing operating notes</p>
              </div>
              <Sparkles size={18} style={{ color: '#FF8A5C' }} />
            </div>

            <div className="space-y-3">
              <div className="rounded-xl p-4" style={{ background: 'rgba(74, 222, 128, 0.06)', border: '1px solid rgba(74, 222, 128, 0.14)' }}>
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle2 size={14} style={{ color: '#4ADE80' }} />
                  <span className="text-xs font-mono" style={{ color: '#4ADE80' }}>Onboarding health</span>
                </div>
                <p className="text-sm leading-6" style={{ color: '#F0EDE6' }}>
                  {loading ? 'Loading tenant health...' : `${activeCompanies} of ${tenants.length} companies are active on the platform.`}
                </p>
              </div>

              <div className="rounded-xl p-4" style={{ background: 'rgba(107, 138, 255, 0.06)', border: '1px solid rgba(107, 138, 255, 0.14)' }}>
                <div className="mb-2 flex items-center gap-2">
                  <Users size={14} style={{ color: '#6B8AFF' }} />
                  <span className="text-xs font-mono" style={{ color: '#6B8AFF' }}>Plan focus</span>
                </div>
                <p className="text-sm leading-6" style={{ color: '#F0EDE6' }}>
                  {paidCompanies} companies are currently on paid plans. Keep trial conversion visible for founder follow-up.
                </p>
              </div>

              <div className="rounded-xl p-4" style={{ background: 'rgba(255, 138, 92, 0.06)', border: '1px solid rgba(255, 138, 92, 0.14)' }}>
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle size={14} style={{ color: '#FF8A5C' }} />
                  <span className="text-xs font-mono" style={{ color: '#FF8A5C' }}>Churn watch</span>
                </div>
                <p className="text-sm leading-6" style={{ color: '#F0EDE6' }}>
                  Suspended tenants should be reviewed before billing and retention workflows are expanded.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="mt-8 flex flex-col gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between"
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
