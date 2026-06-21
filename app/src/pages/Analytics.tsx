import { useEffect, useMemo, useState } from 'react';
import {
  getAdminDashboardStats,
  getAdminLeads,
  getAdminTenants,
  getAdminUsers,
  getSupportTickets,
  getAIJobs,
  type AdminAIJob,
  type AdminDashboardStats,
  type AdminLead,
  type AdminSupportTicket,
  type AdminTenant,
  type AdminUser,
} from '@/lib/adminApi';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Building2,
  Headphones,
  MousePointerClick,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';

type AnalyticsSnapshot = {
  stats: AdminDashboardStats;
  tenants: AdminTenant[];
  users: AdminUser[];
  leads: AdminLead[];
  tickets: AdminSupportTicket[];
  aiJobs: AdminAIJob[];
};

const leadStages = ['new', 'contacted', 'qualified', 'won', 'lost'];

const stageLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
};

function formatLabel(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
}

function getErrorMessage(err: unknown, fallback: string) {
  if (!(err instanceof Error)) return fallback;

  try {
    const parsed = JSON.parse(err.message);
    return parsed.detail || fallback;
  } catch {
    return err.message || fallback;
  }
}

export default function Analytics() {
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError(null);

      const [stats, tenants, users, leads, tickets, aiJobs] = await Promise.all([
        getAdminDashboardStats(),
        getAdminTenants(),
        getAdminUsers(),
        getAdminLeads(),
        getSupportTickets({ status: 'all', priority: 'all' }),
        getAIJobs({ status: 'all', job_type: 'all' }),
      ]);

      setSnapshot({ stats, tenants, users, leads, tickets, aiJobs });
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load founder analytics.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalytics();
  }, []);

  const tenants = snapshot?.tenants ?? [];
  const users = snapshot?.users ?? [];
  const leads = snapshot?.leads ?? [];
  const tickets = snapshot?.tickets ?? [];
  const aiJobs = snapshot?.aiJobs ?? [];

  const activeCompanies = tenants.filter((tenant) => tenant.is_active).length;
  const openSupportTickets = tickets.filter((ticket) =>
    ['open', 'in_progress'].includes(String(ticket.status).toLowerCase())
  ).length;

  const wonLeads = leads.filter((lead) => lead.status === 'won').length;
  const lostLeads = leads.filter((lead) => lead.status === 'lost').length;
  const closedLeads = wonLeads + lostLeads;
  const conversionRate = closedLeads > 0 ? Math.round((wonLeads / closedLeads) * 100) : 0;

  const completedAIJobs = aiJobs.filter((job) => job.status === 'completed').length;
  const aiSuccessRate = aiJobs.length > 0 ? Math.round((completedAIJobs / aiJobs.length) * 100) : 0;

  const avgLeadScore = leads.length > 0
    ? Math.round(leads.reduce((sum, lead) => sum + (Number(lead.score) || 0), 0) / leads.length)
    : 0;

  const summaryCards = [
    {
      label: 'Active Companies',
      value: activeCompanies,
      sub: `${tenants.length} total client workspaces`,
      icon: Building2,
      color: '#6B8AFF',
    },
    {
      label: 'Total Users',
      value: users.length,
      sub: 'Founder + client accounts',
      icon: Users,
      color: '#4ADE80',
    },
    {
      label: 'CRM Records',
      value: leads.length,
      sub: 'Aggregate only, no private lead detail',
      icon: Target,
      color: '#A78BFA',
    },
    {
      label: 'Lead Conversion',
      value: `${conversionRate}%`,
      sub: closedLeads > 0 ? 'Won / closed CRM records' : 'No closed records yet',
      icon: MousePointerClick,
      color: '#FF8A5C',
    },
    {
      label: 'Open Support',
      value: openSupportTickets,
      sub: 'Tickets needing action',
      icon: Headphones,
      color: '#FF5A5A',
    },
    {
      label: 'AI Job Success',
      value: `${aiSuccessRate}%`,
      sub: `${completedAIJobs} completed of ${aiJobs.length}`,
      icon: Bot,
      color: '#4ADE80',
    },
  ];

  const pipelineData = leadStages.map((stage) => ({
    stage: stageLabels[stage],
    count: leads.filter((lead) => lead.status === stage).length,
  }));

  const clientUsageRows = useMemo(() => {
    return tenants.map((tenant) => {
      const tenantLeads = leads.filter((lead) => lead.tenant_id === tenant.id);
      const tenantTickets = tickets.filter((ticket) => ticket.tenant_id === tenant.id);
      const tenantJobs = aiJobs.filter((job) => job.tenant_id === tenant.id);

      const tenantWon = tenantLeads.filter((lead) => lead.status === 'won').length;
      const tenantLost = tenantLeads.filter((lead) => lead.status === 'lost').length;
      const tenantClosed = tenantWon + tenantLost;
      const tenantConversion = tenantClosed > 0 ? Math.round((tenantWon / tenantClosed) * 100) : 0;

      return {
        id: tenant.id,
        name: tenant.name,
        plan: formatLabel(tenant.plan),
        businessType: formatLabel(tenant.business_type),
        isActive: tenant.is_active,
        crmRecords: tenantLeads.length,
        aiJobs: tenantJobs.length,
        supportTickets: tenantTickets.length,
        conversion: tenantConversion,
      };
    });
  }, [tenants, leads, tickets, aiJobs]);

  const usageChartData = clientUsageRows.map((row) => ({
    client: row.name.length > 16 ? `${row.name.slice(0, 16)}...` : row.name,
    crm: row.crmRecords,
    ai: row.aiJobs,
    support: row.supportTickets,
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div
            className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1"
            style={{ background: 'rgba(107, 138, 255, 0.08)', border: '1px solid rgba(107, 138, 255, 0.16)' }}
          >
            <BarChart3 size={14} style={{ color: '#6B8AFF' }} />
            <span className="text-xs font-mono" style={{ color: '#6B8AFF' }}>Live Founder Intelligence</span>
          </div>

          <h1 className="font-display text-hero font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
            Analytics
          </h1>
          <p className="mt-1 max-w-3xl text-sm" style={{ color: '#8A8A93' }}>
            Live platform snapshot from backend: companies, users, CRM records, support activity, and AI job performance. No mock revenue or fake user numbers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadAnalytics}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
            style={{ background: 'rgba(255, 255, 255, 0.04)', color: '#F0EDE6', border: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh Snapshot
          </button>

          <button
            type="button"
            onClick={() => setNotice('Report generation should be connected to the Report Agent next. Current analytics are live read-only metrics.')}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
            style={{ background: '#6B8AFF', color: '#FFFFFF' }}
          >
            <Sparkles size={15} />
            Generate Report
          </button>
        </div>
      </div>

      <div
        className="mb-6 flex items-start gap-3 rounded-2xl p-4"
        style={{ background: 'rgba(74, 222, 128, 0.08)', border: '1px solid rgba(74, 222, 128, 0.16)' }}
      >
        <ShieldCheck size={18} style={{ color: '#4ADE80' }} />
        <div>
          <p className="text-sm font-medium" style={{ color: '#F0EDE6' }}>Live backend-connected analytics</p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: '#8A8A93' }}>
            Fake revenue, fake client growth, and mock leaderboard values have been removed from this founder view.
          </p>
        </div>
      </div>

      {notice && (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-sm"
          style={{ color: '#6B8AFF', background: 'rgba(107, 138, 255, 0.08)', border: '1px solid rgba(107, 138, 255, 0.18)' }}
        >
          {notice}
        </div>
      )}

      {error && (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-sm"
          style={{ color: '#FF8A5C', background: 'rgba(255, 138, 92, 0.08)', border: '1px solid rgba(255, 138, 92, 0.18)' }}
        >
          {error}
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
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
              <p className="font-mono text-data font-medium" style={{ color: '#F0EDE6' }}>
                {loading ? '—' : card.value}
              </p>
              <p className="mt-2 text-xs" style={{ color: '#55555C' }}>{card.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="surface-card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium" style={{ color: '#F0EDE6' }}>CRM pipeline status mix</h3>
              <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>Aggregate status counts across client workspaces.</p>
            </div>
            <Activity size={18} style={{ color: '#6B8AFF' }} />
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={pipelineData}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis dataKey="stage" tick={{ fill: '#55555C', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#55555C', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0F0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#F0EDE6', fontSize: 12 }}
                  formatter={(value: number) => [value.toLocaleString(), 'Records']}
                />
                <Bar dataKey="count" fill="#6B8AFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium" style={{ color: '#F0EDE6' }}>Client usage mix</h3>
              <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>CRM, AI job, and support volume by client.</p>
            </div>
            <Building2 size={18} style={{ color: '#4ADE80' }} />
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={usageChartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis dataKey="client" tick={{ fill: '#55555C', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#55555C', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0F0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#F0EDE6', fontSize: 12 }}
                />
                <Bar dataKey="crm" fill="#6B8AFF" radius={[6, 6, 0, 0]} />
                <Bar dataKey="ai" fill="#4ADE80" radius={[6, 6, 0, 0]} />
                <Bar dataKey="support" fill="#FF8A5C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="p-5" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <h3 className="text-sm font-medium" style={{ color: '#F0EDE6' }}>Client analytics table</h3>
          <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>Backend-connected aggregate rows. No individual lead PII shown.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                {['Client', 'Industry', 'Plan', 'CRM Records', 'AI Jobs', 'Support', 'Conversion', 'Status'].map((heading) => (
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
                    Loading live analytics...
                  </td>
                </tr>
              ) : clientUsageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm" style={{ color: '#8A8A93' }}>
                    No client analytics available yet.
                  </td>
                </tr>
              ) : (
                clientUsageRows.map((row, index) => (
                  <tr key={row.id} style={{ borderBottom: index < clientUsageRows.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none' }}>
                    <td className="px-5 py-4 text-sm font-medium" style={{ color: '#F0EDE6' }}>{row.name}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: '#8A8A93' }}>{row.businessType}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: '#F0EDE6' }}>{row.plan}</td>
                    <td className="px-5 py-4 text-sm font-mono" style={{ color: '#F0EDE6' }}>{row.crmRecords}</td>
                    <td className="px-5 py-4 text-sm font-mono" style={{ color: '#F0EDE6' }}>{row.aiJobs}</td>
                    <td className="px-5 py-4 text-sm font-mono" style={{ color: '#F0EDE6' }}>{row.supportTickets}</td>
                    <td className="px-5 py-4 text-sm font-mono" style={{ color: '#F0EDE6' }}>{row.conversion}%</td>
                    <td className="px-5 py-4">
                      <span
                        className="rounded-full px-3 py-1 text-xs font-mono"
                        style={{
                          color: row.isActive ? '#4ADE80' : '#FF5A5A',
                          background: row.isActive ? 'rgba(74, 222, 128, 0.08)' : 'rgba(255, 90, 90, 0.08)',
                          border: row.isActive ? '1px solid rgba(74, 222, 128, 0.16)' : '1px solid rgba(255, 90, 90, 0.16)',
                        }}
                      >
                        {row.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && tenants.length === 0 && (
        <div
          className="mt-6 flex items-start gap-3 rounded-xl p-4"
          style={{ background: 'rgba(255, 138, 92, 0.08)', border: '1px solid rgba(255, 138, 92, 0.16)' }}
        >
          <AlertTriangle size={17} style={{ color: '#FF8A5C' }} />
          <p className="text-xs leading-relaxed" style={{ color: '#8A8A93' }}>
            Analytics will become useful once at least one client workspace exists.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <span className="text-xs" style={{ color: '#55555C' }}>MMe-AI Founder Portal</span>
        <span className="text-xs font-mono" style={{ color: '#55555C' }}>
          {loading ? 'Syncing...' : `Live snapshot · ${snapshot?.stats.total_tenants ?? 0} companies · ${snapshot?.stats.total_users ?? 0} users`}
        </span>
      </div>
    </div>
  );
}
