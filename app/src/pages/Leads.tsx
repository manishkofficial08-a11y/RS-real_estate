import { useEffect, useMemo, useState } from 'react';
import { getAdminLeads, getAdminTenants, type AdminLead, type AdminTenant } from '@/lib/adminApi';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  Database,
  Lock,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react';

const stageLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
};

const stageColors: Record<string, string> = {
  new: '#6B8AFF',
  contacted: '#8A8A93',
  qualified: '#FF8A5C',
  won: '#4ADE80',
  lost: '#FF5A5A',
};

const tenantTypeLabels: Record<string, string> = {
  real_estate: 'Real Estate',
  retail: 'Retail',
  healthcare: 'Healthcare',
  other: 'Other',
};

type ClientHealthRow = {
  tenantId: string;
  company: string;
  businessType: string;
  plan: string;
  isActive: boolean;
  totalLeads: number;
  activePipeline: number;
  won: number;
  lost: number;
  qualified: number;
  avgScore: number;
  conversionRate: number;
  healthScore: number;
  healthLabel: string;
  stageCounts: Record<string, number>;
  topSource: string;
};

function formatLabel(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
}

function getHealthLabel(score: number, totalLeads: number) {
  if (totalLeads === 0) return 'No activity';
  if (score >= 75) return 'Healthy';
  if (score >= 45) return 'Watch';
  return 'Needs attention';
}

function getHealthColor(label: string) {
  if (label === 'Healthy') return '#4ADE80';
  if (label === 'Watch') return '#FF8A5C';
  if (label === 'Needs attention') return '#FF5A5A';
  return '#8A8A93';
}

function getSourceSummary(leads: AdminLead[]) {
  if (leads.length === 0) return 'No source data';

  const counts = leads.reduce<Record<string, number>>((acc, lead) => {
    const source = lead.source || 'unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  const [topSource] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  return formatLabel(topSource);
}

export default function ClientHealth() {
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadClientHealth() {
    try {
      setLoading(true);
      setError(null);

      const [leadData, tenantData] = await Promise.all([
        getAdminLeads(),
        getAdminTenants(),
      ]);

      setLeads(leadData);
      setTenants(tenantData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load client health data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadClientHealth();
  }, []);

  const clientHealthRows = useMemo<ClientHealthRow[]>(() => {
    return tenants.map((tenant) => {
      const tenantLeads = leads.filter((lead) => lead.tenant_id === tenant.id);
      const stageCounts = tenantLeads.reduce<Record<string, number>>((acc, lead) => {
        const status = lead.status || 'new';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const totalLeads = tenantLeads.length;
      const won = stageCounts.won || 0;
      const lost = stageCounts.lost || 0;
      const qualified = stageCounts.qualified || 0;
      const activePipeline =
        (stageCounts.new || 0) +
        (stageCounts.contacted || 0) +
        (stageCounts.qualified || 0);

      const avgScore = totalLeads > 0
        ? Math.round(tenantLeads.reduce((sum, lead) => sum + (Number(lead.score) || 0), 0) / totalLeads)
        : 0;

      const closedCount = won + lost;
      const conversionRate = closedCount > 0 ? Math.round((won / closedCount) * 100) : 0;

      const activityScore = totalLeads > 0 ? 30 : 0;
      const pipelineScore = activePipeline > 0 ? 25 : 0;
      const qualityScore = Math.min(25, Math.round(avgScore / 4));
      const conversionScore = Math.min(20, Math.round(conversionRate / 5));
      const healthScore = Math.min(100, activityScore + pipelineScore + qualityScore + conversionScore);
      const healthLabel = getHealthLabel(healthScore, totalLeads);

      return {
        tenantId: tenant.id,
        company: tenant.name,
        businessType: tenantTypeLabels[tenant.business_type] || formatLabel(tenant.business_type),
        plan: formatLabel(tenant.plan),
        isActive: tenant.is_active,
        totalLeads,
        activePipeline,
        won,
        lost,
        qualified,
        avgScore,
        conversionRate,
        healthScore,
        healthLabel,
        stageCounts,
        topSource: getSourceSummary(tenantLeads),
      };
    });
  }, [leads, tenants]);

  const totalLeads = leads.length;
  const activeClients = clientHealthRows.filter((row) => row.totalLeads > 0).length;
  const totalWon = clientHealthRows.reduce((sum, row) => sum + row.won, 0);
  const totalClosed = clientHealthRows.reduce((sum, row) => sum + row.won + row.lost, 0);
  const platformConversion = totalClosed > 0 ? Math.round((totalWon / totalClosed) * 100) : 0;
  const avgPlatformScore = totalLeads > 0
    ? Math.round(leads.reduce((sum, lead) => sum + (Number(lead.score) || 0), 0) / totalLeads)
    : 0;

  const summaryCards = [
    {
      label: 'Client CRM Records',
      value: totalLeads,
      sub: 'Aggregate only, no private lead details',
      icon: Database,
      color: '#6B8AFF',
    },
    {
      label: 'Active Pipelines',
      value: activeClients,
      sub: 'Clients with CRM activity',
      icon: Activity,
      color: '#4ADE80',
    },
    {
      label: 'Platform Conversion',
      value: `${platformConversion}%`,
      sub: 'Won / closed records',
      icon: TrendingUp,
      color: '#FF8A5C',
    },
    {
      label: 'Avg Lead Score',
      value: avgPlatformScore,
      sub: 'Across all client CRM records',
      icon: Target,
      color: '#A78BFA',
    },
  ];

  const pipelineStageSummary = Object.keys(stageLabels).map((stage) => ({
    key: stage,
    label: stageLabels[stage],
    count: leads.filter((lead) => lead.status === stage).length,
    color: stageColors[stage],
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div
            className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1"
            style={{ background: 'rgba(74, 222, 128, 0.08)', border: '1px solid rgba(74, 222, 128, 0.16)' }}
          >
            <ShieldCheck size={14} style={{ color: '#4ADE80' }} />
            <span className="text-xs font-mono" style={{ color: '#4ADE80' }}>Privacy-safe founder view</span>
          </div>

          <h1 className="font-display text-hero font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
            Client Health
          </h1>
          <p className="mt-1 max-w-3xl text-sm" style={{ color: '#8A8A93' }}>
            Monitor client pipeline health, CRM usage, conversion, and growth signals without exposing individual lead names, phone numbers, emails, or private notes.
          </p>
        </div>

        <button
          onClick={loadClientHealth}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm transition-colors"
          style={{
            color: '#F0EDE6',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div
        className="mb-6 flex items-start gap-3 rounded-2xl p-4"
        style={{
          background: 'rgba(107, 138, 255, 0.08)',
          border: '1px solid rgba(107, 138, 255, 0.16)',
        }}
      >
        <Lock size={18} style={{ color: '#6B8AFF' }} />
        <div>
          <p className="text-sm font-medium" style={{ color: '#F0EDE6' }}>Founder visibility boundary</p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: '#8A8A93' }}>
            This page intentionally shows company-level pipeline health only. Detailed CRM records remain inside the client dashboard.
          </p>
        </div>
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

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className="surface-card p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <p className="text-xs font-mono" style={{ color: '#8A8A93' }}>{card.label}</p>
                <div
                  className="rounded-xl p-2.5"
                  style={{ background: `${card.color}14`, color: card.color, border: `1px solid ${card.color}26` }}
                >
                  <Icon size={17} />
                </div>
              </div>
              <p className="font-mono text-data font-medium" style={{ color: '#F0EDE6' }}>{loading ? '—' : card.value}</p>
              <p className="mt-2 text-xs" style={{ color: '#55555C' }}>{card.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="surface-card overflow-hidden">
          <div className="p-5" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <h2 className="text-base font-medium" style={{ color: '#F0EDE6' }}>Company-level pipeline health</h2>
            <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>
              Aggregate CRM activity by client. No individual lead identity is displayed.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  {['Client', 'Industry', 'Records', 'Pipeline', 'Conversion', 'Avg Score', 'Health', 'Top Source'].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-left text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm" style={{ color: '#8A8A93' }}>
                      Loading client health data...
                    </td>
                  </tr>
                ) : clientHealthRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm" style={{ color: '#8A8A93' }}>
                      No client workspaces found yet.
                    </td>
                  </tr>
                ) : (
                  clientHealthRows.map((row, index) => {
                    const healthColor = getHealthColor(row.healthLabel);

                    return (
                      <tr
                        key={row.tenantId}
                        style={{ borderBottom: index < clientHealthRows.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none' }}
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{row.company}</p>
                          <p className="mt-1 text-xs" style={{ color: '#55555C' }}>{row.isActive ? 'Active workspace' : 'Inactive workspace'}</p>
                        </td>
                        <td className="px-5 py-4 text-sm" style={{ color: '#8A8A93' }}>{row.businessType}</td>
                        <td className="px-5 py-4 text-sm font-mono" style={{ color: '#F0EDE6' }}>{row.totalLeads}</td>
                        <td className="px-5 py-4 text-sm font-mono" style={{ color: '#F0EDE6' }}>{row.activePipeline}</td>
                        <td className="px-5 py-4 text-sm font-mono" style={{ color: '#F0EDE6' }}>{row.conversionRate}%</td>
                        <td className="px-5 py-4 text-sm font-mono" style={{ color: '#F0EDE6' }}>{row.avgScore}</td>
                        <td className="px-5 py-4">
                          <span
                            className="rounded-full px-3 py-1 text-xs font-mono"
                            style={{
                              color: healthColor,
                              background: `${healthColor}14`,
                              border: `1px solid ${healthColor}26`,
                            }}
                          >
                            {row.healthLabel} · {row.healthScore}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm" style={{ color: '#8A8A93' }}>{row.topSource}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-medium" style={{ color: '#F0EDE6' }}>Platform pipeline mix</h2>
              <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>Status distribution across all clients.</p>
            </div>
            <BarChart3 size={18} style={{ color: '#6B8AFF' }} />
          </div>

          <div className="space-y-4">
            {pipelineStageSummary.map((stage) => {
              const percent = totalLeads > 0 ? Math.round((stage.count / totalLeads) * 100) : 0;

              return (
                <div key={stage.key}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: stage.color }} />
                      <span className="text-sm" style={{ color: '#F0EDE6' }}>{stage.label}</span>
                    </div>
                    <span className="text-xs font-mono" style={{ color: '#8A8A93' }}>{stage.count}</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${percent}%`, background: stage.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {!loading && totalLeads === 0 && (
            <div
              className="mt-6 flex items-start gap-3 rounded-xl p-4"
              style={{ background: 'rgba(255, 138, 92, 0.08)', border: '1px solid rgba(255, 138, 92, 0.16)' }}
            >
              <AlertTriangle size={17} style={{ color: '#FF8A5C' }} />
              <p className="text-xs leading-relaxed" style={{ color: '#8A8A93' }}>
                No client CRM activity yet. This is normal for a fresh workspace.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <span className="text-xs" style={{ color: '#55555C' }}>MMe-AI Founder Portal</span>
        <span className="text-xs font-mono" style={{ color: '#55555C' }}>
          {loading ? 'Syncing...' : `Showing ${clientHealthRows.length} client workspaces`}
        </span>
      </div>
    </div>
  );
}
