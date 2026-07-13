import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  Building2,
  CircleDollarSign,
  Headphones,
  LoaderCircle,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  getAdminDashboardStats,
  getAdminLeads,
  getAdminSubscriptions,
  getAdminTenants,
  getAIJobs,
  getSupportTickets,
  type AdminAIJob,
  type AdminDashboardStats,
  type AdminLead,
  type AdminSubscriptionRow,
  type AdminSupportTicket,
  type AdminTenant,
} from '@/lib/adminApi';

type DashboardData = {
  stats: AdminDashboardStats;
  tenants: AdminTenant[];
  leads: AdminLead[];
  tickets: AdminSupportTicket[];
  subscriptions: AdminSubscriptionRow[];
  jobs: AdminAIJob[];
};

const emptyStats: AdminDashboardStats = { total_tenants: 0, total_users: 0, total_properties: 0, total_leads: 0 };

function label(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function relativeDate(value?: string | null) {
  if (!value) return 'Recently';
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Overview() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>({ stats: emptyStats, tenants: [], leads: [], tickets: [], subscriptions: [], jobs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const [stats, tenants, leads, tickets, subscriptions, jobs] = await Promise.all([
        getAdminDashboardStats(),
        getAdminTenants(),
        getAdminLeads(),
        getSupportTickets(),
        getAdminSubscriptions(),
        getAIJobs(),
      ]);
      setData({ stats, tenants, leads, tickets, subscriptions, jobs });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Dashboard data unavailable.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const insight = useMemo(() => {
    const openTickets = data.tickets.filter((ticket) => !['resolved', 'closed'].includes(ticket.status));
    const urgentTickets = openTickets.filter((ticket) => ['urgent', 'high'].includes(ticket.priority));
    const activeRevenue = data.subscriptions.filter((item) => item.subscription.status === 'active').reduce((sum, item) => sum + item.monthly_value, 0);
    const runningJobs = data.jobs.filter((job) => ['queued', 'running'].includes(job.status));
    const qualityLeads = data.leads.filter((lead) => lead.score >= 70);
    return { openTickets, urgentTickets, activeRevenue, runningJobs, qualityLeads };
  }, [data]);

  const actions = [
    { label: 'Generate leads', detail: 'Discover a fresh prospect list', icon: Search, path: '/admin/lead-generation', tone: '#8EA4FF' },
    { label: 'Support inbox', detail: `${insight.openTickets.length} conversations need review`, icon: Headphones, path: '/admin/support', tone: '#FF9B78' },
    { label: 'Subscriptions', detail: 'Review access and renewals', icon: CircleDollarSign, path: '/admin/subscriptions', tone: '#63E494' },
  ];

  return (
    <div className="space-y-7 p-4 md:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[.18em]" style={{ color: '#7F96F4' }}><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Founder workspace</div>
          <h1 className="text-3xl font-semibold tracking-[-.04em] md:text-4xl" style={{ color: '#F1EEE7' }}>Good evening, Manish.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: '#85858E' }}>A live operating view of MMe-AI clients, revenue, support and automation—not a demo dashboard.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full px-3 py-2 text-xs" style={{ background: 'rgba(74,222,128,.08)', color: '#63E494', border: '1px solid rgba(74,222,128,.16)' }}>Live backend</span>
          <button onClick={() => void load()} disabled={loading} className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,.035)', color: '#9999A3', border: '1px solid rgba(255,255,255,.08)' }} title="Refresh dashboard"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
        </div>
      </header>

      {error && <div className="rounded-xl border px-4 py-3 text-sm" style={{ background: 'rgba(255,138,92,.08)', borderColor: 'rgba(255,138,92,.2)', color: '#FF9B78' }}>{error}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Client workspaces', value: data.stats.total_tenants, note: `${data.tenants.filter((item) => item.is_active).length} active`, icon: Building2, color: '#8EA4FF' },
          { label: 'Team members', value: data.stats.total_users, note: 'Across all clients', icon: Users, color: '#C7A8FF' },
          { label: 'Qualified leads', value: insight.qualityLeads.length, note: `${data.stats.total_leads} total in CRM`, icon: Sparkles, color: '#D7B46A' },
          { label: 'Monthly run rate', value: `$${Math.round(insight.activeRevenue).toLocaleString('en-IN')}`, note: `${data.subscriptions.filter((item) => item.subscription.status === 'active').length} paying/active`, icon: CircleDollarSign, color: '#63E494' },
        ].map((item) => <article key={item.label} className="surface-card p-5"><div className="flex items-start justify-between"><div><p className="text-xs" style={{ color: '#72727C' }}>{item.label}</p><p className="mt-2 text-3xl font-semibold tracking-[-.04em]" style={{ color: '#F1EEE7' }}>{loading ? '—' : item.value}</p><p className="mt-2 text-xs" style={{ color: '#606069' }}>{item.note}</p></div><span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ color: item.color, background: `${item.color}12` }}><item.icon size={17} /></span></div></article>)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'rgba(255,255,255,.06)' }}><div><h2 className="text-base font-semibold" style={{ color: '#E9E6DF' }}>Operations queue</h2><p className="mt-1 text-xs" style={{ color: '#71717A' }}>What needs founder attention right now</p></div><span className="rounded-full px-2.5 py-1 text-xs" style={{ color: insight.urgentTickets.length ? '#FF9B78' : '#63E494', background: insight.urgentTickets.length ? 'rgba(255,138,92,.1)' : 'rgba(74,222,128,.08)' }}>{insight.urgentTickets.length ? `${insight.urgentTickets.length} urgent` : 'Clear'}</span></div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,.05)' }}>
            {insight.openTickets.slice(0, 5).map((ticket) => <button key={ticket.id} onClick={() => navigate('/admin/support')} className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[.025]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: ['urgent', 'high'].includes(ticket.priority) ? 'rgba(255,138,92,.1)' : 'rgba(107,138,255,.1)', color: ['urgent', 'high'].includes(ticket.priority) ? '#FF9B78' : '#8EA4FF' }}><Headphones size={16} /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate text-sm font-medium" style={{ color: '#DCD9D2' }}>{ticket.subject}</span><span className="rounded-full px-2 py-0.5 text-[10px]" style={{ color: '#85858E', background: 'rgba(255,255,255,.05)' }}>{label(ticket.priority)}</span></span><span className="mt-1 block truncate text-xs" style={{ color: '#6F6F78' }}>{ticket.business_name} · {ticket.created_by_name}</span></span><span className="text-xs" style={{ color: '#5F5F68' }}>{relativeDate(ticket.updated_at || ticket.created_at)}</span><ArrowRight size={14} style={{ color: '#606069' }} /></button>)}
            {!loading && !insight.openTickets.length && <div className="px-5 py-14 text-center"><Headphones className="mx-auto" size={22} style={{ color: '#4B4B53' }} /><p className="mt-3 text-sm" style={{ color: '#81818A' }}>Support queue is clear.</p></div>}
            {loading && <div className="py-14"><LoaderCircle className="mx-auto animate-spin" size={20} style={{ color: '#8EA4FF' }} /></div>}
          </div>
        </div>

        <div className="space-y-3">
          {actions.map((action) => <button key={action.path} onClick={() => navigate(action.path)} className="surface-card group flex w-full items-center gap-4 p-4 text-left transition-transform hover:-translate-y-0.5"><span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${action.tone}12`, color: action.tone }}><action.icon size={17} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium" style={{ color: '#DEDBD4' }}>{action.label}</span><span className="mt-1 block truncate text-xs" style={{ color: '#6E6E77' }}>{action.detail}</span></span><ArrowRight size={15} style={{ color: '#606069' }} className="transition-transform group-hover:translate-x-1" /></button>)}
          <div className="surface-card p-5"><div className="flex items-center gap-2"><Bot size={15} style={{ color: '#8EA4FF' }} /><p className="text-sm font-medium" style={{ color: '#DEDBD4' }}>Automation pulse</p></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,.025)' }}><p className="text-2xl font-semibold" style={{ color: '#F1EEE7' }}>{insight.runningJobs.length}</p><p className="mt-1 text-xs" style={{ color: '#696972' }}>Queued / running</p></div><div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,.025)' }}><p className="text-2xl font-semibold" style={{ color: '#F1EEE7' }}>{data.jobs.filter((job) => job.status === 'failed').length}</p><p className="mt-1 text-xs" style={{ color: '#696972' }}>Failed jobs</p></div></div></div>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'rgba(255,255,255,.06)' }}><div><h2 className="text-base font-semibold" style={{ color: '#E9E6DF' }}>Client portfolio</h2><p className="mt-1 text-xs" style={{ color: '#71717A' }}>Plan and account health across every workspace</p></div><button onClick={() => navigate('/admin/subscriptions')} className="flex items-center gap-1.5 text-xs" style={{ color: '#8EA4FF' }}>Manage all <ArrowRight size={12} /></button></div>
        <div className="grid gap-px bg-white/[.05] md:grid-cols-2 xl:grid-cols-3">{data.subscriptions.slice(0, 6).map((item) => <button key={item.tenant_id} onClick={() => navigate('/admin/subscriptions')} className="bg-[#111117] p-5 text-left transition-colors hover:bg-[#15151c]"><div className="flex items-start justify-between"><span><span className="block text-sm font-medium" style={{ color: '#DEDBD4' }}>{item.company}</span><span className="mt-1 block text-xs" style={{ color: '#666670' }}>{label(item.business_type)}</span></span><span className="rounded-full px-2.5 py-1 text-[10px]" style={{ color: item.subscription.status === 'active' ? '#63E494' : '#FF9B78', background: item.subscription.status === 'active' ? 'rgba(74,222,128,.08)' : 'rgba(255,138,92,.09)' }}>{label(item.subscription.status)}</span></div><div className="mt-5 flex items-end justify-between"><span><span className="block text-xl font-semibold" style={{ color: '#F1EEE7' }}>${Math.round(item.monthly_value)}</span><span className="text-[10px] uppercase tracking-wider" style={{ color: '#5F5F68' }}>monthly value</span></span><span className="text-xs" style={{ color: '#777780' }}>{item.plan.name}</span></div></button>)}</div>
      </section>
    </div>
  );
}
