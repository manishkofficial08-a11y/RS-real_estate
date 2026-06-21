import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileText,
  Rocket,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import {
  createAdminClientOnboardingWorkspace,
  getAdminDashboardStats,
  getAdminTenants,
  type AdminClientOnboardingResponse,
  type AdminDashboardStats,
  type AdminTenant,
} from '../lib/adminApi';

const checklist = [
  'Create client company',
  'Add owner details',
  'Assign plan',
  'Generate temporary password',
  'Handover portal access',
];

type BusinessTypeOption = 'real_estate' | 'retail' | 'healthcare' | 'other';
type PlanOption = 'free' | 'pro' | 'enterprise';

const businessTypeLabels: Record<BusinessTypeOption, string> = {
  real_estate: 'Real Estate',
  retail: 'Retail',
  healthcare: 'Healthcare',
  other: 'Other',
};

const planLabels: Record<PlanOption, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

function formatBusinessType(value: string) {
  return businessTypeLabels[value as BusinessTypeOption] || value.replace(/_/g, ' ');
}

function formatPlan(value: string) {
  return planLabels[value as PlanOption] || value;
}

function getErrorMessage(err: unknown, fallback: string) {
  if (!(err instanceof Error)) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(err.message);
    return parsed.detail || fallback;
  } catch {
    return err.message || fallback;
  }
}

export default function ClientOnboarding() {
  const [message, setMessage] = useState('Ready to create an invite-only client workspace.');
  const [error, setError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [onboardingResult, setOnboardingResult] = useState<AdminClientOnboardingResponse | null>(null);
  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    ownerEmail: '',
    businessType: 'real_estate' as BusinessTypeOption,
    plan: 'pro' as PlanOption,
    notes: '',
  });

  const loadFounderData = async () => {
    try {
      setPageLoading(true);
      setDashboardError(null);

      const [statsResult, tenantsResult] = await Promise.all([
        getAdminDashboardStats(),
        getAdminTenants(),
      ]);

      setDashboardStats(statsResult);
      setTenants(tenantsResult);
    } catch (err) {
      setDashboardError(getErrorMessage(err, 'Could not load live founder data.'));
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    void loadFounderData();
  }, []);

  const derivedStats = useMemo(() => {
    const totalClients = dashboardStats?.total_tenants ?? tenants.length;
    const activeWorkspaces = tenants.filter((tenant) => tenant.is_active).length;
    const paidPlans = tenants.filter((tenant) => ['pro', 'enterprise'].includes(String(tenant.plan).toLowerCase())).length;
    const pendingSetup = tenants.filter((tenant) => !tenant.is_active).length;

    return [
      {
        label: 'Total Clients',
        value: pageLoading ? '...' : String(totalClients),
        sub: 'Live tenant count from backend',
        icon: Building2,
        color: '#6B8AFF',
      },
      {
        label: 'Active Workspaces',
        value: pageLoading ? '...' : String(activeWorkspaces),
        sub: 'Currently enabled client portals',
        icon: ShieldCheck,
        color: '#4ADE80',
      },
      {
        label: 'Paid Plans',
        value: pageLoading ? '...' : String(paidPlans),
        sub: 'Pro + Enterprise tenants',
        icon: Rocket,
        color: '#A78BFA',
      },
      {
        label: 'Pending Setup',
        value: pageLoading ? '...' : String(pendingSetup),
        sub: pendingSetup > 0 ? 'Inactive tenants need follow-up' : 'No inactive tenants',
        icon: ClipboardCheck,
        color: '#FF8A5C',
      },
    ];
  }, [dashboardStats, tenants, pageLoading]);

  const recentTenants = useMemo(() => tenants.slice(0, 6), [tenants]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const prepareWorkspace = async () => {
    setError(null);
    setOnboardingResult(null);

    const businessName = form.businessName.trim();
    const ownerName = form.ownerName.trim();
    const ownerEmail = form.ownerEmail.trim();

    if (!businessName || !ownerName || !ownerEmail) {
      setError('Business name, owner name, and owner email are required.');
      return;
    }

    if (!ownerEmail.includes('@')) {
      setError('Please enter a valid owner email.');
      return;
    }

    try {
      setLoading(true);
      setMessage('Creating client workspace...');

      const result = await createAdminClientOnboardingWorkspace({
        business_name: businessName,
        owner_name: ownerName,
        owner_email: ownerEmail,
        business_type: form.businessType,
        plan: form.plan,
        notes: form.notes.trim() || null,
      });

      setOnboardingResult(result);
      setMessage(result.message);
      await loadFounderData();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create client workspace.'));
      setMessage('Workspace creation failed.');
    } finally {
      setLoading(false);
    }
  };

  const copyTemporaryPassword = async () => {
    if (!onboardingResult?.temporary_password) {
      return;
    }

    try {
      await navigator.clipboard.writeText(onboardingResult.temporary_password);
      setMessage('Temporary password copied. Share it securely and ask the client to change it after first login.');
    } catch {
      setError('Could not copy temporary password. Copy it manually from the result card.');
    }
  };

  const handleLocalAction = (client: string) => {
    setMessage(`Open Companies page to review ${client} workspace details.`);
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
            Create invite-only client workspaces with tenant, owner account, subscription plan, and temporary password.
          </p>
        </div>

        <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(107, 138, 255, 0.08)', border: '1px solid rgba(107, 138, 255, 0.16)' }}>
          <p className="text-xs font-mono" style={{ color: '#8A8A93' }}>Access model</p>
          <p className="text-sm font-medium mt-1" style={{ color: '#F0EDE6' }}>Founder-only client setup</p>
        </div>
      </div>

      {dashboardError && (
        <p className="mb-5 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(248, 113, 113, 0.1)', color: '#FCA5A5', border: '1px solid rgba(248, 113, 113, 0.18)' }}>
          {dashboardError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 mb-8 md:grid-cols-2 xl:grid-cols-4">
        {derivedStats.map((card) => {
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
                    {index === 3 ? 'Temporary password is generated after successful backend onboarding.' : 'Prepare this step before portal access is handed over.'}
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
              <h2 className="font-display text-xl font-medium" style={{ color: '#F0EDE6' }}>Create client workspace</h2>
              <p className="text-sm" style={{ color: '#8A8A93' }}>Creates tenant, owner user, subscription, and temporary password.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', color: '#F0EDE6', border: '1px solid rgba(255,255,255,0.08)' }} placeholder="Business Name" value={form.businessName} onChange={(event) => updateField('businessName', event.target.value)} />
            <input className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', color: '#F0EDE6', border: '1px solid rgba(255,255,255,0.08)' }} placeholder="Owner Name" value={form.ownerName} onChange={(event) => updateField('ownerName', event.target.value)} />
            <input className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', color: '#F0EDE6', border: '1px solid rgba(255,255,255,0.08)' }} placeholder="Owner Email" value={form.ownerEmail} onChange={(event) => updateField('ownerEmail', event.target.value)} />
            <select className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', color: '#F0EDE6', border: '1px solid rgba(255,255,255,0.08)' }} value={form.businessType} onChange={(event) => updateField('businessType', event.target.value as BusinessTypeOption)}>
              {Object.entries(businessTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', color: '#F0EDE6', border: '1px solid rgba(255,255,255,0.08)' }} value={form.plan} onChange={(event) => updateField('plan', event.target.value as PlanOption)}>
              {Object.entries(planLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <input className="rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'rgba(255,255,255,0.04)', color: '#F0EDE6', border: '1px solid rgba(255,255,255,0.08)' }} placeholder="Notes" value={form.notes} onChange={(event) => updateField('notes', event.target.value)} />
          </div>

          <button
            type="button"
            onClick={prepareWorkspace}
            disabled={loading}
            className="mt-5 rounded-xl px-5 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: '#6B8AFF', color: '#050510' }}
          >
            {loading ? 'Creating Workspace...' : 'Create Client Workspace'}
          </button>

          {error && (
            <p className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(248, 113, 113, 0.1)', color: '#FCA5A5', border: '1px solid rgba(248, 113, 113, 0.18)' }}>
              {error}
            </p>
          )}

          <p className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(255,255,255,0.03)', color: '#F0EDE6', border: '1px solid rgba(255,255,255,0.06)' }}>
            {message}
          </p>

          {onboardingResult && (
            <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(74, 222, 128, 0.08)', border: '1px solid rgba(74, 222, 128, 0.18)' }}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.18em]" style={{ color: '#4ADE80' }}>Workspace Created</p>
                  <h3 className="mt-1 text-base font-medium" style={{ color: '#F0EDE6' }}>{onboardingResult.business_name}</h3>
                  <p className="mt-1 text-sm" style={{ color: '#8A8A93' }}>{onboardingResult.owner_name} · {onboardingResult.owner_email}</p>
                  <p className="mt-1 text-sm" style={{ color: '#8A8A93' }}>Plan: {onboardingResult.plan} · Role: {onboardingResult.role}</p>
                </div>
                <button
                  type="button"
                  onClick={copyTemporaryPassword}
                  className="rounded-lg px-3 py-2 text-xs"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#F0EDE6', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <Copy size={13} className="inline mr-1" /> Copy Temporary Password
                </button>
              </div>
              <p className="mt-3 rounded-lg px-3 py-2 font-mono text-sm" style={{ background: 'rgba(0,0,0,0.24)', color: '#F0EDE6', border: '1px solid rgba(255,255,255,0.08)' }}>
                {onboardingResult.temporary_password}
              </p>
              <p className="mt-2 text-xs" style={{ color: '#8A8A93' }}>
                Share this password securely. Ask the client owner to change it immediately from Settings after first login.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="font-display text-xl font-medium" style={{ color: '#F0EDE6' }}>Live client workspaces</h2>
          <p className="text-sm mt-1" style={{ color: '#8A8A93' }}>Backend-connected tenant records. No hardcoded demo onboarding rows.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['Client', 'Business Type', 'Plan', 'Status', 'Actions'].map((heading) => (
                  <th key={heading} className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageLoading && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-sm" style={{ color: '#8A8A93' }}>Loading live client workspaces...</td>
                </tr>
              )}

              {!pageLoading && recentTenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-sm" style={{ color: '#8A8A93' }}>No client workspaces found yet.</td>
                </tr>
              )}

              {!pageLoading && recentTenants.map((tenant) => (
                <tr key={tenant.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-5 py-4 text-sm font-medium" style={{ color: '#F0EDE6' }}>{tenant.name}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: '#8A8A93' }}>{formatBusinessType(tenant.business_type)}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: '#F0EDE6' }}>{formatPlan(tenant.plan)}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: tenant.is_active ? '#4ADE80' : '#FCA5A5' }}>
                    {tenant.is_active ? 'Active' : 'Inactive'}
                  </td>
                  <td className="px-5 py-4">
                    <button type="button" onClick={() => handleLocalAction(tenant.name)} className="rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(107,138,255,0.12)', color: '#6B8AFF', border: '1px solid rgba(107,138,255,0.2)' }}>
                      <FileText size={13} className="inline mr-1" /> Review
                    </button>
                  </td>
                </tr>
              ))}

              {onboardingResult && (
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-5 py-4 text-sm font-medium" style={{ color: '#F0EDE6' }}>{onboardingResult.business_name}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: '#8A8A93' }}>{formatBusinessType(onboardingResult.business_type)}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: '#F0EDE6' }}>{formatPlan(onboardingResult.plan)}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: '#4ADE80' }}>Created now</td>
                  <td className="px-5 py-4 text-sm" style={{ color: '#8A8A93' }}>Copy password above</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-xs" style={{ color: '#55555C' }}>
            Client counts and workspace records are loaded from founder backend APIs. Test tenants should be cleaned from database, not hidden with fake UI values.
          </p>
        </div>
      </div>
    </div>
  );
}
