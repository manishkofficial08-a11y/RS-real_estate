import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  WalletCards,
} from 'lucide-react';
import {
  getAdminSubscriptions,
  updateAdminSubscription,
  type AdminBillingCycle,
  type AdminBillingPlan,
  type AdminBillingStatus,
  type AdminSubscriptionRow,
} from '@/lib/adminApi';

const plans: AdminBillingPlan[] = ['free', 'pro', 'enterprise'];
const statuses: AdminBillingStatus[] = ['active', 'trialing', 'past_due', 'cancelled', 'inactive'];
const cycles: AdminBillingCycle[] = ['monthly', 'yearly'];

function label(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function money(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function date(value: string) {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function statusTone(status: AdminBillingStatus) {
  if (status === 'active') return { color: '#4ADE80', background: 'rgba(74,222,128,.10)' };
  if (status === 'trialing') return { color: '#8EA4FF', background: 'rgba(107,138,255,.12)' };
  if (status === 'past_due') return { color: '#FF8A5C', background: 'rgba(255,138,92,.12)' };
  return { color: '#9B9BA4', background: 'rgba(255,255,255,.06)' };
}

export default function SubscriptionsPage() {
  const [rows, setRows] = useState<AdminSubscriptionRow[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminBillingStatus>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const data = await getAdminSubscriptions();
      setRows(data);
      setSelectedId((current) => current || data[0]?.tenant_id || '');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Subscriptions load nahi hui.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => rows.filter((row) => {
    const matchesQuery = `${row.company} ${row.business_type} ${row.subscription.plan}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'all' || row.subscription.status === statusFilter;
    return matchesQuery && matchesStatus;
  }), [query, rows, statusFilter]);

  const selected = rows.find((row) => row.tenant_id === selectedId) || null;
  const metrics = useMemo(() => ({
    mrr: rows.reduce((sum, row) => sum + (row.subscription.status === 'active' ? row.monthly_value : 0), 0),
    active: rows.filter((row) => row.subscription.status === 'active').length,
    attention: rows.filter((row) => ['past_due', 'cancelled'].includes(row.subscription.status)).length,
    outstanding: rows.reduce((sum, row) => sum + row.outstanding_amount, 0),
  }), [rows]);

  async function update(payload: Parameters<typeof updateAdminSubscription>[1]) {
    if (!selected) return;
    try {
      setSaving(true);
      setError('');
      setNotice('');
      const updated = await updateAdminSubscription(selected.tenant_id, payload);
      setRows((current) => current.map((row) => row.tenant_id === updated.tenant_id ? updated : row));
      setNotice(`${updated.company} subscription updated.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Subscription update failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[.18em]" style={{ color: '#7F96F4' }}>Revenue operations</p>
          <h1 className="text-3xl font-semibold tracking-[-.035em]" style={{ color: '#F2F0EA' }}>Client subscriptions</h1>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: '#8E8E98' }}>Every current and future client workspace appears here automatically. Manage access, renewal state and plan visibility from one place.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="inline-flex w-fit items-center gap-2 rounded-xl px-4 py-2.5 text-sm" style={{ color: '#D8D6CF', border: '1px solid rgba(255,255,255,.09)', background: 'rgba(255,255,255,.035)' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </header>

      {(error || notice) && <div className="rounded-xl border px-4 py-3 text-sm" style={{ color: error ? '#FF9B78' : '#63E494', background: error ? 'rgba(255,138,92,.08)' : 'rgba(74,222,128,.07)', borderColor: error ? 'rgba(255,138,92,.2)' : 'rgba(74,222,128,.18)' }}>{error || notice}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Monthly run rate', value: money(metrics.mrr), icon: WalletCards, color: '#8EA4FF' },
          { label: 'Active workspaces', value: metrics.active, icon: CheckCircle2, color: '#4ADE80' },
          { label: 'Needs attention', value: metrics.attention, icon: AlertTriangle, color: '#FF8A5C' },
          { label: 'Outstanding', value: money(metrics.outstanding), icon: CreditCard, color: '#D7B46A' },
        ].map((item) => <div key={item.label} className="surface-card flex items-center justify-between p-5"><div><p className="text-xs" style={{ color: '#777780' }}>{item.label}</p><p className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: '#F2F0EA' }}>{loading ? '—' : item.value}</p></div><span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ color: item.color, background: `${item.color}14` }}><item.icon size={18} /></span></div>)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="surface-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3" style={{ background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}>
              <Search size={14} style={{ color: '#707079' }} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company or industry" className="w-full bg-transparent py-2.5 text-sm outline-none" style={{ color: '#E6E3DC' }} />
            </label>
            <label className="flex items-center gap-2"><SlidersHorizontal size={14} style={{ color: '#707079' }} /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="input-dark rounded-xl px-3 py-2.5 text-sm"><option value="all">All status</option>{statuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead><tr>{['Company', 'Plan', 'Status', 'Renews', 'MRR', 'Invoices'].map((item) => <th key={item} className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-[.12em]" style={{ color: '#666670' }}>{item}</th>)}</tr></thead>
              <tbody>{loading ? <tr><td colSpan={6} className="px-5 py-14 text-center"><LoaderCircle className="mx-auto animate-spin" size={20} style={{ color: '#8EA4FF' }} /></td></tr> : filtered.map((row) => {
                const active = row.tenant_id === selectedId;
                return <tr key={row.tenant_id} onClick={() => setSelectedId(row.tenant_id)} className="cursor-pointer border-t transition-colors" style={{ borderColor: 'rgba(255,255,255,.05)', background: active ? 'rgba(107,138,255,.075)' : 'transparent' }}>
                  <td className="px-5 py-4"><p className="text-sm font-medium" style={{ color: '#EAE7E0' }}>{row.company}</p><p className="mt-1 text-xs" style={{ color: '#666670' }}>{label(row.business_type)}</p></td>
                  <td className="px-5 py-4 text-sm" style={{ color: '#B5B2AB' }}>{row.plan.name}</td>
                  <td className="px-5 py-4"><span className="rounded-full px-2.5 py-1 text-xs" style={statusTone(row.subscription.status)}>{label(row.subscription.status)}</span></td>
                  <td className="px-5 py-4 text-xs" style={{ color: '#85858E' }}>{date(row.subscription.current_period_end)}</td>
                  <td className="px-5 py-4 text-sm font-medium" style={{ color: '#EAE7E0' }}>{money(row.monthly_value)}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: row.outstanding_amount ? '#FF9B78' : '#85858E' }}>{row.invoice_count} · {money(row.outstanding_amount)}</td>
                </tr>;
              })}</tbody>
            </table>
          </div>
          {!loading && !filtered.length && <div className="px-6 py-14 text-center text-sm" style={{ color: '#777780' }}>No matching client subscriptions.</div>}
        </div>

        <aside className="surface-card h-fit p-5 xl:sticky xl:top-6">
          {selected ? <div className="space-y-5">
            <div><p className="text-xs uppercase tracking-[.14em]" style={{ color: '#73737D' }}>Workspace controls</p><h2 className="mt-2 text-xl font-semibold" style={{ color: '#F2F0EA' }}>{selected.company}</h2><p className="mt-1 text-xs" style={{ color: '#777780' }}>{label(selected.business_type)} · {selected.subscription.provider} billing</p></div>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-2"><span className="text-xs" style={{ color: '#85858E' }}>Plan</span><select value={selected.subscription.plan} onChange={(event) => void update({ plan: event.target.value as AdminBillingPlan })} disabled={saving} className="input-dark w-full rounded-xl px-3 py-2.5 text-sm">{plans.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label>
              <label className="space-y-2"><span className="text-xs" style={{ color: '#85858E' }}>Cycle</span><select value={selected.subscription.billing_cycle} onChange={(event) => void update({ billing_cycle: event.target.value as AdminBillingCycle })} disabled={saving} className="input-dark w-full rounded-xl px-3 py-2.5 text-sm">{cycles.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label>
            </div>
            <label className="block space-y-2"><span className="text-xs" style={{ color: '#85858E' }}>Account status</span><select value={selected.subscription.status} onChange={(event) => void update({ status: event.target.value as AdminBillingStatus })} disabled={saving} className="input-dark w-full rounded-xl px-3 py-2.5 text-sm">{statuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label>
            <button type="button" onClick={() => void update({ cancel_at_period_end: !selected.subscription.cancel_at_period_end })} disabled={saving} className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm disabled:opacity-50" style={{ borderColor: selected.subscription.cancel_at_period_end ? 'rgba(255,138,92,.25)' : 'rgba(255,255,255,.08)', background: selected.subscription.cancel_at_period_end ? 'rgba(255,138,92,.07)' : 'rgba(255,255,255,.025)', color: '#C8C5BE' }}><span><span className="block font-medium">Cancel at period end</span><span className="mt-1 block text-xs" style={{ color: '#73737D' }}>{selected.subscription.cancel_at_period_end ? 'Cancellation scheduled' : 'Renewal remains active'}</span></span><span className="h-5 w-9 rounded-full p-0.5" style={{ background: selected.subscription.cancel_at_period_end ? '#FF8A5C' : '#3B3B43' }}><span className="block h-4 w-4 rounded-full bg-white transition-transform" style={{ transform: selected.subscription.cancel_at_period_end ? 'translateX(16px)' : 'none' }} /></span></button>
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)' }}><div className="flex items-center gap-2 text-xs" style={{ color: '#85858E' }}><CalendarDays size={13} /> Current period</div><p className="mt-2 text-sm" style={{ color: '#D7D4CC' }}>{date(selected.subscription.current_period_start)} → {date(selected.subscription.current_period_end)}</p></div>
            {saving && <p className="flex items-center gap-2 text-xs" style={{ color: '#8EA4FF' }}><LoaderCircle size={13} className="animate-spin" /> Syncing with client dashboard…</p>}
          </div> : <p className="py-12 text-center text-sm" style={{ color: '#777780' }}>Select a client to manage its subscription.</p>}
        </aside>
      </section>
    </div>
  );
}
