import { useState } from 'react';
import { subscriptions } from '@/data/mock';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  CalendarClock,
  CreditCard,
  Download,
  FileText,
  MoreHorizontal,
  ReceiptText,
  Search,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

const planColors: Record<string, { bg: string; color: string; border: string }> = {
  Starter: { bg: 'rgba(255, 255, 255, 0.06)', color: '#8A8A93', border: 'rgba(255, 255, 255, 0.1)' },
  Pro: { bg: 'rgba(107, 138, 255, 0.1)', color: '#6B8AFF', border: 'rgba(107, 138, 255, 0.2)' },
  Enterprise: { bg: 'rgba(255, 138, 92, 0.1)', color: '#FF8A5C', border: 'rgba(255, 138, 92, 0.2)' },
};

const summaryCards = [
  {
    label: 'Monthly Revenue',
    value: '$12,960',
    sub: '+8% from last month',
    icon: TrendingUp,
    color: '#6B8AFF',
  },
  {
    label: 'Annual Run Rate',
    value: '$155,520',
    sub: 'Projected from active plans',
    icon: CreditCard,
    color: '#4ADE80',
  },
  {
    label: 'Active Plans',
    value: '9',
    sub: '2 Enterprise · 4 Pro · 3 Starter',
    icon: ShieldCheck,
    color: '#FF8A5C',
  },
  {
    label: 'Trial Users',
    value: '1',
    sub: '1 account needs conversion',
    icon: CalendarClock,
    color: '#8A8A93',
  },
];

const planMix = [
  { plan: 'Enterprise', count: 2, revenue: '$7,000', width: '72%' },
  { plan: 'Pro', count: 4, revenue: '$4,760', width: '54%' },
  { plan: 'Starter', count: 3, revenue: '$1,200', width: '28%' },
];

export default function SubscriptionsPage() {
  const [showInvoice, setShowInvoice] = useState<string | null>(null);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ background: 'rgba(107, 138, 255, 0.08)', border: '1px solid rgba(107, 138, 255, 0.16)' }}>
            <ReceiptText size={14} style={{ color: '#6B8AFF' }} />
            <span className="text-xs font-mono" style={{ color: '#6B8AFF' }}>Billing Control Center</span>
          </div>
          <h1 className="font-display text-hero font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
            Subscriptions
          </h1>
          <p className="text-sm mt-1 max-w-2xl" style={{ color: '#8A8A93' }}>
            Monitor plan health, renewals, invoices, and subscription actions across all real estate clients.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
            style={{ background: 'rgba(255, 255, 255, 0.04)', color: '#F0EDE6', border: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <Download size={15} />
            Export
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
            style={{ background: '#6B8AFF', color: '#FFFFFF' }}
          >
            <CreditCard size={15} />
            New Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 mb-8 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className="surface-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-mono mb-2" style={{ color: '#8A8A93' }}>{card.label}</p>
                  <p className="font-mono text-data font-medium" style={{ color: '#F0EDE6' }}>{card.value}</p>
                  <p className="text-xs mt-2" style={{ color: '#55555C' }}>{card.sub}</p>
                </div>
                <div className="rounded-xl p-2.5" style={{ background: `${card.color}14`, color: card.color, border: `1px solid ${card.color}26` }}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 xl:grid-cols-[1.7fr_1fr]">
        <div className="surface-card overflow-hidden">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div>
              <h2 className="text-base font-medium" style={{ color: '#F0EDE6' }}>Client Billing Overview</h2>
              <p className="text-xs mt-1" style={{ color: '#8A8A93' }}>Mock data for founder dashboard review</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <Search size={14} style={{ color: '#8A8A93' }} />
              <span className="text-xs" style={{ color: '#55555C' }}>Search billing records</span>
            </div>
          </div>

          {subscriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px]">
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                    <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Company</th>
                    <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Plan</th>
                    <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Renewal</th>
                    <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Amount</th>
                    <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Status</th>
                    <th className="text-right px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub, idx) => (
                    <tr
                      key={sub.id}
                      className="transition-colors duration-200"
                      style={{ borderBottom: idx < subscriptions.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <Building2 size={16} style={{ color: '#8A8A93' }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{sub.company}</p>
                            <p className="text-xs font-mono mt-0.5" style={{ color: '#55555C' }}>ID: SUB-{sub.id.padStart(4, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="text-xs px-2.5 py-1 rounded-full"
                          style={{
                            background: planColors[sub.plan].bg,
                            color: planColors[sub.plan].color,
                            border: `1px solid ${planColors[sub.plan].border}`,
                          }}
                        >
                          {sub.plan}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-mono" style={{ color: '#8A8A93' }}>{sub.renewalDate}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-mono font-medium" style={{ color: '#F0EDE6' }}>{sub.amount}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full ${sub.status === 'Active' ? 'badge-green' : sub.status === 'Past Due' ? 'badge-red' : 'badge-neutral'}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-1.5 rounded-md transition-colors" style={{ color: '#8A8A93' }} title="Upgrade">
                            <ArrowUpCircle size={15} />
                          </button>
                          <button className="p-1.5 rounded-md transition-colors" style={{ color: '#8A8A93' }} title="Downgrade">
                            <ArrowDownCircle size={15} />
                          </button>
                          <button
                            className="p-1.5 rounded-md transition-colors"
                            style={{ color: showInvoice === sub.id ? '#6B8AFF' : '#8A8A93', background: showInvoice === sub.id ? 'rgba(107, 138, 255, 0.08)' : 'transparent' }}
                            title="View Invoice"
                            onClick={() => setShowInvoice(showInvoice === sub.id ? null : sub.id)}
                          >
                            <FileText size={15} />
                          </button>
                          <button className="p-1.5 rounded-md transition-colors" style={{ color: '#8A8A93' }} title="More actions">
                            <MoreHorizontal size={15} />
                          </button>
                        </div>
                        {showInvoice === sub.id && (
                          <div
                            className="mt-3 ml-auto max-w-xs rounded-xl p-4 text-xs"
                            style={{ background: 'rgba(107, 138, 255, 0.06)', border: '1px solid rgba(107, 138, 255, 0.14)' }}
                          >
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <p className="font-medium" style={{ color: '#F0EDE6' }}>Invoice Preview</p>
                              <span className="badge-green text-[10px]">Paid</span>
                            </div>
                            <div className="space-y-1.5" style={{ color: '#8A8A93' }}>
                              <p>Invoice #: INV-2026-{sub.id.padStart(4, '0')}</p>
                              <p>Billing date: Jun 01, 2026</p>
                              <p>Amount: {sub.amount}</p>
                              <p>Payment method: Card ending 4242</p>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 rounded-2xl p-4" style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
                <ReceiptText size={28} style={{ color: '#8A8A93' }} />
              </div>
              <h3 className="text-base font-medium" style={{ color: '#F0EDE6' }}>No subscriptions yet</h3>
              <p className="mt-2 max-w-md text-sm" style={{ color: '#8A8A93' }}>
                New client plans and billing records will appear here once companies start subscribing.
              </p>
            </div>
          )}
        </div>

        <div className="surface-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-medium" style={{ color: '#F0EDE6' }}>Plan Mix</h2>
              <p className="text-xs mt-1" style={{ color: '#8A8A93' }}>Revenue distribution by plan</p>
            </div>
            <span className="text-xs font-mono" style={{ color: '#55555C' }}>MRR</span>
          </div>

          <div className="space-y-5">
            {planMix.map((item) => (
              <div key={item.plan}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{item.plan}</p>
                    <p className="text-xs" style={{ color: '#55555C' }}>{item.count} clients</p>
                  </div>
                  <span className="text-sm font-mono" style={{ color: '#8A8A93' }}>{item.revenue}</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div className="h-2 rounded-full" style={{ width: item.width, background: planColors[item.plan].color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl p-4" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <p className="text-xs font-mono mb-2" style={{ color: '#8A8A93' }}>Founder note</p>
            <p className="text-sm leading-6" style={{ color: '#F0EDE6' }}>
              Billing actions are visual-only for now. Keep this page mock/static until backend subscription APIs are assigned.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-8 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <span className="text-xs" style={{ color: '#55555C' }}>MMe-AI v2.0</span>
        <span className="text-xs font-mono" style={{ color: '#55555C' }}>Last synced: 2 min ago</span>
      </div>
    </div>
  );
}
