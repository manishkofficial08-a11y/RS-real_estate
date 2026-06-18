import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Database,
  Globe2,
  KeyRound,
  LockKeyhole,
  MailCheck,
  RefreshCcw,
  Server,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  ToggleLeft,
  WalletCards,
} from 'lucide-react';

type StatusTone = 'ready' | 'warning' | 'planned' | 'neutral';

type InfoCard = {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone: StatusTone;
};

type ChecklistItem = {
  label: string;
  status: 'ready' | 'pending';
};

const toneStyles: Record<
  StatusTone,
  { color: string; background: string; border: string; badge: string }
> = {
  ready: {
    color: '#4ADE80',
    background: 'rgba(74, 222, 128, 0.08)',
    border: 'rgba(74, 222, 128, 0.18)',
    badge: 'Ready',
  },
  warning: {
    color: '#FF8A5C',
    background: 'rgba(255, 138, 92, 0.08)',
    border: 'rgba(255, 138, 92, 0.18)',
    badge: 'Pending',
  },
  planned: {
    color: '#6B8AFF',
    background: 'rgba(107, 138, 255, 0.08)',
    border: 'rgba(107, 138, 255, 0.18)',
    badge: 'Planned',
  },
  neutral: {
    color: '#8A8A93',
    background: 'rgba(255, 255, 255, 0.04)',
    border: 'rgba(255, 255, 255, 0.08)',
    badge: 'Configured',
  },
};

const platformConfiguration: InfoCard[] = [
  {
    label: 'Platform Name',
    value: 'RS Real Estate',
    description: 'Founder dashboard branding is aligned with the current SaaS identity.',
    icon: Globe2,
    tone: 'ready',
  },
  {
    label: 'Environment',
    value: 'Local / Demo',
    description: 'Safe founder workspace for local development and demo validation.',
    icon: Server,
    tone: 'neutral',
  },
  {
    label: 'API Base URL',
    value: 'Configured in frontend env',
    description: 'Client and admin API endpoints are consumed through existing app configuration.',
    icon: Database,
    tone: 'ready',
  },
  {
    label: 'Version Label',
    value: 'RS Real Estate v2.0',
    description: 'Version label shown across the founder dashboard footer.',
    icon: Settings2,
    tone: 'neutral',
  },
  {
    label: 'Maintenance Mode',
    value: 'Off',
    description: 'Placeholder status only. No backend maintenance switch is connected yet.',
    icon: ToggleLeft,
    tone: 'ready',
  },
  {
    label: 'Data Region',
    value: 'Region placeholder',
    description: 'Production hosting region will be finalized during deployment planning.',
    icon: Globe2,
    tone: 'planned',
  },
];

const securityAccess: InfoCard[] = [
  {
    label: 'Founder Access',
    value: 'Enabled',
    description: 'Founder dashboard access is active for superadmin operations.',
    icon: ShieldCheck,
    tone: 'ready',
  },
  {
    label: 'Admin Role Management',
    value: 'Available in admin flows',
    description: 'Role-aware founder/admin workflows are represented in the control layer.',
    icon: KeyRound,
    tone: 'ready',
  },
  {
    label: 'Client Tenant Isolation',
    value: 'Enabled',
    description: 'Client data remains separated by tenant-aware backend architecture.',
    icon: LockKeyhole,
    tone: 'ready',
  },
  {
    label: 'Password Reset',
    value: 'Enabled',
    description: 'Password reset and email delivery work are handled in the auth flow.',
    icon: RefreshCcw,
    tone: 'ready',
  },
  {
    label: 'SMTP Status',
    value: 'Configured',
    description: 'Email delivery readiness is tracked here for founder visibility.',
    icon: MailCheck,
    tone: 'ready',
  },
  {
    label: 'Audit Logging',
    value: 'Planned',
    description: 'Audit trails are planned for future compliance and operator review.',
    icon: AlertTriangle,
    tone: 'planned',
  },
];

const operationalPreferences: InfoCard[] = [
  {
    label: 'Support SLA Target',
    value: '24 business hours',
    description: 'Operational target for first support response during early launch.',
    icon: Clock,
    tone: 'neutral',
  },
  {
    label: 'AI Job Retry Policy',
    value: 'Manual retry first',
    description: 'Founder can review failed AI jobs before retrying queued automation.',
    icon: RefreshCcw,
    tone: 'planned',
  },
  {
    label: 'Publisher Fallback Mode',
    value: 'Safe manual review',
    description: 'Publishing remains conservative until live platform credentials are verified.',
    icon: ShieldCheck,
    tone: 'warning',
  },
  {
    label: 'Default Client Plan',
    value: 'Free / Starter',
    description: 'Default onboarding plan for early client tenant creation.',
    icon: WalletCards,
    tone: 'neutral',
  },
  {
    label: 'Trial Duration',
    value: 'Placeholder',
    description: 'Trial rules will be finalized after billing workflow hardening.',
    icon: Clock,
    tone: 'planned',
  },
  {
    label: 'Notification Preference',
    value: 'Email-first placeholder',
    description: 'Founder notifications will prioritize operational emails in production.',
    icon: Bell,
    tone: 'planned',
  },
];

const launchReadiness: ChecklistItem[] = [
  { label: 'Client auth ready', status: 'ready' },
  { label: 'Media Library ready', status: 'ready' },
  { label: 'Campaign Studio ready', status: 'ready' },
  { label: 'Scheduler ready', status: 'ready' },
  { label: 'Reports ready', status: 'ready' },
  { label: 'Social account connection pending', status: 'pending' },
  { label: 'Live publishing tokens pending', status: 'pending' },
  { label: 'Production deployment pending', status: 'pending' },
];

const dangerActions = [
  {
    label: 'Disable Platform',
    description: 'Placeholder only. No platform shutdown action is connected.',
  },
  {
    label: 'Reset Demo Data',
    description: 'Placeholder only. No demo data reset endpoint is connected.',
  },
  {
    label: 'Export Audit Report',
    description: 'Placeholder only. Audit export will be added after audit logging exists.',
  },
];

function StatusBadge({ tone }: { tone: StatusTone }) {
  const style = toneStyles[tone];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-mono"
      style={{
        color: style.color,
        background: style.background,
        border: `1px solid ${style.border}`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.color }} />
      {style.badge}
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-xs font-mono uppercase tracking-[0.18em]" style={{ color: '#6B8AFF' }}>
          {eyebrow}
        </p>
        <h2 className="font-display text-section font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
          {title}
        </h2>
      </div>
      <p className="max-w-xl text-sm leading-6" style={{ color: '#8A8A93' }}>
        {description}
      </p>
    </div>
  );
}

function InfoCardGrid({ items }: { items: InfoCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        const tone = toneStyles[item.tone];

        return (
          <div key={`${item.label}-${item.value}`} className="surface-card p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div
                className="rounded-xl p-2.5"
                style={{
                  background: tone.background,
                  color: tone.color,
                  border: `1px solid ${tone.border}`,
                }}
              >
                <Icon size={18} />
              </div>
              <StatusBadge tone={item.tone} />
            </div>
            <p className="text-xs font-mono" style={{ color: '#8A8A93' }}>
              {item.label}
            </p>
            <p className="mt-2 text-base font-medium" style={{ color: '#F0EDE6' }}>
              {item.value}
            </p>
            <p className="mt-3 text-sm leading-6" style={{ color: '#55555C' }}>
              {item.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function Settings() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div
            className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1"
            style={{
              background: 'rgba(107, 138, 255, 0.08)',
              border: '1px solid rgba(107, 138, 255, 0.16)',
            }}
          >
            <SlidersHorizontal size={14} style={{ color: '#6B8AFF' }} />
            <span className="text-xs font-mono" style={{ color: '#6B8AFF' }}>
              Founder Control Center
            </span>
          </div>

          <h1 className="font-display text-hero font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
            Settings
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6" style={{ color: '#8A8A93' }}>
            Manage platform readiness, security posture, operational defaults, and safe founder controls for RS Real Estate.
          </p>
        </div>

        <div
          className="rounded-2xl px-4 py-3"
          style={{
            background: 'rgba(74, 222, 128, 0.08)',
            border: '1px solid rgba(74, 222, 128, 0.18)',
          }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} style={{ color: '#4ADE80' }} />
            <span className="text-sm font-medium" style={{ color: '#F0EDE6' }}>
              Control center online
            </span>
          </div>
          <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>
            Frontend readiness view only
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <SectionHeader
            eyebrow="Configuration"
            title="Platform Configuration"
            description="High-level platform settings and deployment placeholders for the founder dashboard. These cards are informational and do not store secrets."
          />
          <InfoCardGrid items={platformConfiguration} />
        </section>

        <section>
          <SectionHeader
            eyebrow="Access"
            title="Security & Access"
            description="Current access posture for founder operations, tenant isolation, password reset, SMTP readiness, and future audit controls."
          />
          <InfoCardGrid items={securityAccess} />
        </section>

        <section>
          <SectionHeader
            eyebrow="Operations"
            title="Operational Preferences"
            description="Default operating assumptions for support, AI jobs, publisher fallback behavior, trial planning, and notification posture."
          />
          <InfoCardGrid items={operationalPreferences} />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="surface-card p-6">
            <SectionHeader
              eyebrow="Launch"
              title="Launch Readiness"
              description="Founder checklist for what is ready now and what still needs production configuration before full launch."
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {launchReadiness.map((item) => {
                const ready = item.status === 'ready';

                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-xl p-3"
                    style={{
                      background: ready
                        ? 'rgba(74, 222, 128, 0.06)'
                        : 'rgba(255, 138, 92, 0.06)',
                      border: ready
                        ? '1px solid rgba(74, 222, 128, 0.14)'
                        : '1px solid rgba(255, 138, 92, 0.14)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {ready ? (
                        <CheckCircle2 size={16} style={{ color: '#4ADE80' }} />
                      ) : (
                        <Clock size={16} style={{ color: '#FF8A5C' }} />
                      )}
                      <span className="text-sm" style={{ color: '#F0EDE6' }}>
                        {item.label}
                      </span>
                    </div>
                    <span
                      className="text-xs font-mono"
                      style={{ color: ready ? '#4ADE80' : '#FF8A5C' }}
                    >
                      {ready ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="surface-card p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(255,90,90,0.08), rgba(255,138,92,0.05))',
            }}
          >
            <div className="mb-5 flex items-start gap-3">
              <div
                className="rounded-xl p-2.5"
                style={{
                  background: 'rgba(255, 90, 90, 0.10)',
                  color: '#FF5A5A',
                  border: '1px solid rgba(255, 90, 90, 0.20)',
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.18em]" style={{ color: '#FF8A5C' }}>
                  Disabled Controls
                </p>
                <h2 className="mt-2 font-display text-section font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
                  Danger Zone
                </h2>
                <p className="mt-2 text-sm leading-6" style={{ color: '#8A8A93' }}>
                  These controls are placeholders only and are not connected to destructive backend actions.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {dangerActions.map((action) => (
                <div
                  key={action.label}
                  className="rounded-xl p-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#F0EDE6' }}>
                        {action.label}
                      </p>
                      <p className="mt-1 text-xs leading-5" style={{ color: '#8A8A93' }}>
                        {action.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled
                      className="rounded-lg px-3 py-2 text-xs font-medium opacity-50"
                      style={{
                        background: 'rgba(255, 90, 90, 0.12)',
                        color: '#FF5A5A',
                        cursor: 'not-allowed',
                      }}
                    >
                      Disabled
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="mt-8 flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <span className="text-xs" style={{ color: '#55555C' }}>RS Real Estate v2.0</span>
        <span className="text-xs font-mono" style={{ color: '#55555C' }}>Last synced: readiness snapshot</span>
      </div>
    </div>
  );
}
