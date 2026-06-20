import { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Eye,
  FileText,
  Mail,
  Rocket,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';

const stats = [
  { label: 'Total Clients', value: '0', sub: 'Ready for first onboarding', icon: Building2, color: '#6B8AFF' },
  { label: 'Active Workspaces', value: '0', sub: 'Client portals live', icon: ShieldCheck, color: '#4ADE80' },
  { label: 'Pending Setup', value: '0', sub: 'Awaiting backend connection', icon: ClipboardCheck, color: '#FF8A5C' },
  { label: 'Subscription Ready', value: '0', sub: 'Plan selected and prepared', icon: Rocket, color: '#A78BFA' },
];

const checklist = [
  'Create client company',
  'Add owner details',
  'Assign plan',
  'Prepare password setup link',
  'Handover portal access',
];

const recentClients = [
  {
    client: 'ABC Realty',
    owner: 'Amit Sharma',
    email: 'amit@abcrealty.demo',
    plan: 'Growth',
    status: 'Draft workspace',
    updated: 'Local demo',
  },
  {
    client: 'Skyline Estates',
    owner: 'Priya Mehta',
    email: 'priya@skyline.demo',
    plan: 'Premium',
    status: 'Pending setup link',
    updated: 'Local demo',
  },
  {
    client: 'Metro Homes',
    owner: 'Rohan Verma',
    email: 'rohan@metrohomes.demo',
    plan: 'Base',
    status: 'Ready for handover',
    updated: 'Local demo',
  },
];

export default function ClientOnboarding() {
  const [message, setMessage] = useState('No backend action has been triggered yet.');
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    ownerEmail: '',
    businessType: 'Real Estate',
    plan: 'Base',
    notes: '',
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const prepareWorkspace = () => {
    if (!form.businessName || !form.ownerName || !form.ownerEmail) {
      setMessage('Local demo: business name, owner name, and owner email are required before preparing a workspace.');
      return;
    }

    // TODO: Connect this to founder-only backend onboarding API later.
    setMessage(`Local demo: workspace prepared for ${form.businessName} on the ${form.plan} plan. Backend connection pending.`);
  };

  const handleLocalAction = (action: string, client: string) => {
    // TODO: Replace local action state with backend-backed onboarding actions later.
    setMessage(`Local demo: "${action}" selected for ${client}. Backend connection pending.`);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.24em] mb-2" style={{ color: '#8A8A93' }}>
            MMe AI Founder Operations
          </p>
          <h1 className="font-display text-hero font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
            Client Onboarding Center
          </h1>
          <p className="text-sm mt-2 max-w-3xl" style={{ color: '#8A8A93' }}>
            Create and prepare invite-only client workspaces for MMe AI managed clients.
          </p>
        </div>

        <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(107, 138, 255, 0.08)', border: '1px solid rgba(107, 138, 255, 0.16)' }}>
          <p className="text-xs font-mono" style={{ color: '#8A8A93' }}>Access model</p>
          <p className="text-sm font-medium mt-1" style={{ color: '#F0EDE6' }}>Invite-only client setup</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 mb-8 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className="surface-card p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-mono mb-1" style={{ color: '#8A8A93' }}>{card.label}</p>
                  <p className="font-mono text-data font-medium" style={{ color: '#F0EDE6' }}>{card.value}</p>
                  <p className="text-xs mt-1" style={{ color: '#55555C' }}>{card.sub}</p>
                </div>
                <div
                  className="rounded-xl p-2.5"
                  style={{ background: card.color + '14', color: card.color, border: '1px solid ' + card.color + '26' }}
                >
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 xl:grid-cols-[0.9fr_1.3fr]">
        <div className="surface-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-xl p-2.5" style={{ background: 'rgba(74, 222, 128, 0.12)', color: '#4ADE80' }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h2 className="font-display text-xl font-medium" style={{ color: '#F0EDE6' }}>Onboarding checklist</h2>
              <p className="text-sm" style={{ color: '#8A8A93' }}>Founder workflow before client handover.</p>
            </div>
          </div>

          <div className="space-y-4">
            {checklist.map((step, index) => (
              <div key={step} className="flex items-start gap-3">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-mono"
                  style={{ background: 'rgba(107, 138, 255, 0.12)', color: '#6B8AFF', border: '1px solid rgba(107, 138, 255, 0.2)' }}
                >
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{step}</p>
                  <p className="text-xs mt-1" style={{ color: '#55555C' }}>
                    {index === 3 ? 'Password setup will connect after backend integration.' : 'Prepare this step before portal access is handed over.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-xl p-2.5" style={{ background: 'rgba(255, 138, 92, 0.12)', color: '#FF8A5C' }}>
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="font-display text-xl font-medium" style={{ color: '#F0EDE6' }}>Prepare client workspace</h2>
              <p className="text-sm" style={{ color: '#8A8A93' }}>UI-only form. Backend connection will be added later.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', color: '#F0EDE6', border: '1px solid rgba(255,255,255,0.08)' }} placeholder="Business Name" value={form.businessName} onChange={(event) => updateField('businessName', event.target.value)} />
            <input className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', color: '#F0EDE6', border: '1px solid rgba(255,255,255,0.08)' }} placeholder="Owner Name" value={form.ownerName} onChange={(event) => updateField('ownerName', event.target.value)} />
            <input className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', color: '#F0EDE6', border: '1px solid rgba(255,255,255,0.08)' }} placeholder="Owner Email" value={form.ownerEmail} onChange={(event) => updateField('ownerEmail', event.target.value)} />
            <select className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', color: '#F0EDE6', border: '1px solid rgba(255,255,255,0.08)' }} value={form.businessType} onChange={(event) => updateField('businessType', event.target.value)}>
              <option>Real Estate</option>
              <option>Property Consulting</option>
              <option>Brokerage</option>
              <option>Builder / Developer</option>
            </select>
            <select className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', color: '#F0EDE6', border: '1px solid rgba(255,255,255,0.08)' }} value={form.plan} onChange={(event) => updateField('plan', event.target.value)}>
              <option>Base</option>
              <option>Growth</option>
              <option>Premium</option>
            </select>
            <input className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', color: '#F0EDE6', border: '1px solid rgba(255,255,255,0.08)' }} placeholder="Notes" value={form.notes} onChange={(event) => updateField('notes', event.target.value)} />
          </div>

          <button
            type="button"
            onClick={prepareWorkspace}
            className="mt-5 rounded-xl px-5 py-3 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: '#6B8AFF', color: '#050510' }}
          >
            Prepare Client Workspace
          </button>

          <p className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(255,255,255,0.03)', color: '#F0EDE6', border: '1px solid rgba(255,255,255,0.06)' }}>
            {message}
          </p>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="font-display text-xl font-medium" style={{ color: '#F0EDE6' }}>Recent onboarding</h2>
          <p className="text-sm mt-1" style={{ color: '#8A8A93' }}>Local placeholder records for future backend integration.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['Client', 'Owner', 'Email', 'Plan', 'Status', 'Last Updated', 'Actions'].map((heading) => (
                  <th key={heading} className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentClients.map((client) => (
                <tr key={client.email} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-5 py-4 text-sm font-medium" style={{ color: '#F0EDE6' }}>{client.client}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: '#F0EDE6' }}>{client.owner}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: '#8A8A93' }}>{client.email}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: '#F0EDE6' }}>{client.plan}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: '#4ADE80' }}>{client.status}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: '#8A8A93' }}>{client.updated}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => handleLocalAction('View Workspace', client.client)} className="rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(255,255,255,0.04)', color: '#F0EDE6', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Eye size={13} className="inline mr-1" /> View
                      </button>
                      <button type="button" onClick={() => handleLocalAction('Copy Setup Link', client.client)} className="rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(255,255,255,0.04)', color: '#F0EDE6', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Copy size={13} className="inline mr-1" /> Copy Link
                      </button>
                      <button type="button" onClick={() => handleLocalAction('Mark Ready', client.client)} className="rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(107,138,255,0.12)', color: '#6B8AFF', border: '1px solid rgba(107,138,255,0.2)' }}>
                        <Mail size={13} className="inline mr-1" /> Mark Ready
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-start gap-3">
          <FileText size={18} style={{ color: '#8A8A93' }} />
          <p className="text-sm leading-6" style={{ color: '#F0EDE6' }}>
            TODO: Connect this page to founder-only backend APIs for tenant creation, owner invite preparation, plan assignment, and password setup handover.
          </p>
        </div>
      </div>
    </div>
  );
}
