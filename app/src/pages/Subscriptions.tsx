import { useState } from 'react';
import { subscriptions } from '@/data/mock';
import { ArrowUpCircle, ArrowDownCircle, FileText } from 'lucide-react';

const planColors: Record<string, { bg: string; color: string; border: string }> = {
  Starter: { bg: 'rgba(255, 255, 255, 0.06)', color: '#8A8A93', border: 'rgba(255, 255, 255, 0.1)' },
  Pro: { bg: 'rgba(107, 138, 255, 0.1)', color: '#6B8AFF', border: 'rgba(107, 138, 255, 0.2)' },
  Enterprise: { bg: 'rgba(255, 138, 92, 0.1)', color: '#FF8A5C', border: 'rgba(255, 138, 92, 0.2)' },
};

const summaryCards = [
  { label: 'Monthly Revenue', value: '$12,960', sub: '+8% from last month', color: '#6B8AFF' },
  { label: 'Annual Revenue', value: '$155,520', sub: 'Projected', color: '#4ADE80' },
  { label: 'Active Plans', value: '9', sub: '2 Enterprise, 4 Pro, 3 Starter', color: '#FF8A5C' },
  { label: 'Trial Users', value: '1', sub: 'TechStart Inc', color: '#8A8A93' },
];

export default function SubscriptionsPage() {
  const [showInvoice, setShowInvoice] = useState<string | null>(null);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display text-hero font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
          Subscriptions
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8A8A93' }}>Manage plans, billing, and renewals</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {summaryCards.map((card) => (
          <div key={card.label} className="surface-card p-5">
            <p className="text-xs font-mono mb-1" style={{ color: '#8A8A93' }}>{card.label}</p>
            <p className="font-mono text-data font-medium" style={{ color: '#F0EDE6' }}>{card.value}</p>
            <p className="text-xs mt-1" style={{ color: '#55555C' }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="surface-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Company</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Plan</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Renewal Date</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Amount</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Status</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Actions</th>
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
                  <span className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{sub.company}</span>
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
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-md transition-colors" style={{ color: '#8A8A93' }} title="Upgrade"
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#4ADE80'; e.currentTarget.style.background = 'rgba(74, 222, 128, 0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A93'; e.currentTarget.style.background = 'transparent'; }}>
                      <ArrowUpCircle size={14} />
                    </button>
                    <button className="p-1.5 rounded-md transition-colors" style={{ color: '#8A8A93' }} title="Downgrade"
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#FF8A5C'; e.currentTarget.style.background = 'rgba(255, 138, 92, 0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A93'; e.currentTarget.style.background = 'transparent'; }}>
                      <ArrowDownCircle size={14} />
                    </button>
                    <button
                      className="p-1.5 rounded-md transition-colors"
                      style={{ color: '#8A8A93' }}
                      title="View Invoice"
                      onClick={() => setShowInvoice(showInvoice === sub.id ? null : sub.id)}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#6B8AFF'; e.currentTarget.style.background = 'rgba(107, 138, 255, 0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A93'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <FileText size={14} />
                    </button>
                  </div>
                  {showInvoice === sub.id && (
                    <div
                      className="mt-3 p-4 rounded-lg text-xs"
                      style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                    >
                      <p className="font-medium mb-2" style={{ color: '#F0EDE6' }}>Invoice Preview</p>
                      <div className="space-y-1" style={{ color: '#8A8A93' }}>
                        <p>Invoice #: INV-2025-{sub.id.padStart(4, '0')}</p>
                        <p>Date: Jun 01, 2025</p>
                        <p>Amount: {sub.amount}</p>
                        <p>Status: Paid</p>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-8 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <span className="text-xs" style={{ color: '#55555C' }}>AI Growth OS v2.0</span>
        <span className="text-xs font-mono" style={{ color: '#55555C' }}>Last synced: 2 min ago</span>
      </div>
    </div>
  );
}
