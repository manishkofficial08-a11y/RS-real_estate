import { useEffect, useState } from 'react';
import TopographyHero from '@/components/TopographyHero';
import { getAdminDashboardStats, type AdminDashboardStats } from '@/lib/adminApi';
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Database,
  HardDrive,
  Layers,
  Mail,
  Server,
  Ticket,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';

function Sparkline({
  color,
  variant,
}: {
  color: string;
  variant: 'up' | 'down' | 'mixed';
}) {
  const points =
    variant === 'up'
      ? '0,20 10,16 20,18 30,12 40,14 50,8 60,10'
      : variant === 'down'
        ? '0,8 10,12 20,10 30,14 40,16 50,18 60,20'
        : '0,15 10,10 20,14 30,8 40,12 50,16 60,10';

  return (
    <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
      <path
        d={`M${points}`}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const platformHealth = [
  {
    label: 'Backend API',
    status: 'Operational',
    note: 'Core admin and client APIs are available from the live backend.',
    icon: Server,
    color: '#4ADE80',
  },
  {
    label: 'Database',
    status: 'Connected',
    note: 'Tenant, user, CRM, property, and content data are backed by Postgres.',
    icon: Database,
    color: '#4ADE80',
  },
  {
    label: 'AI jobs queue',
    status: 'Monitoring',
    note: 'AI Jobs page tracks queued, running, completed, and failed jobs.',
    icon: Layers,
    color: '#6B8AFF',
  },
  {
    label: 'Publisher worker',
    status: 'Setup pending',
    note: 'Publishing workers are being prepared for campaign deployment.',
    icon: Zap,
    color: '#FF8A5C',
  },
  {
    label: 'Email/SMTP',
    status: 'Operational',
    note: 'Password reset and account email flow are ready for client access.',
    icon: Mail,
    color: '#4ADE80',
  },
];

const founderActivities = [
  {
    label: 'New company onboarded',
    detail: 'Preview: tenant workspace created and ready for client setup.',
    time: 'Today',
    icon: Building2,
    color: '#6B8AFF',
  },
  {
    label: 'User created',
    detail: 'Preview: client user access added to a company workspace.',
    time: 'Today',
    icon: UserPlus,
    color: '#4ADE80',
  },
  {
    label: 'Support ticket opened',
    detail: 'Preview: client request waiting for founder/admin review.',
    time: '1h ago',
    icon: Ticket,
    color: '#FF8A5C',
  },
  {
    label: 'AI job completed',
    detail: 'Preview: generated content job completed from AI Studio.',
    time: '2h ago',
    icon: CheckCircle2,
    color: '#4ADE80',
  },
  {
    label: 'Publisher worker ran',
    detail: 'Preview: publishing readiness check completed; credentials still pending.',
    time: '3h ago',
    icon: Zap,
    color: '#6B8AFF',
  },
];

const quickActions = [
  { label: 'Review Companies', icon: Building2, hint: 'Audit tenant accounts' },
  { label: 'Review Users', icon: Users, hint: 'Check user access' },
  { label: 'Open Support', icon: Ticket, hint: 'Review client tickets' },
  { label: 'Check AI Jobs', icon: Zap, hint: 'Monitor automation queue' },
  { label: 'View Subscriptions', icon: CreditCard, hint: 'Review plan status' },
];

const launchReadiness = [
  { label: 'Auth working', status: 'Ready', ready: true },
  { label: 'Media Library ready', status: 'Ready', ready: true },
  { label: 'Generated Posts ready', status: 'Ready', ready: true },
  { label: 'Scheduler ready', status: 'Ready', ready: true },
  { label: 'Publisher setup pending', status: 'Pending', ready: false },
  { label: 'Social tokens pending', status: 'Pending', ready: false },
];

function getStatusBadgeStyle(status: string, color: string) {
  const isPending = status.toLowerCase().includes('pending');

  return {
    background: isPending ? 'rgba(255, 138, 92, 0.12)' : `${color}18`,
    color: isPending ? '#FF8A5C' : color,
    border: `1px solid ${
      isPending ? 'rgba(255, 138, 92, 0.24)' : `${color}30`
    }`,
  };
}


export default function Overview() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    getAdminDashboardStats()
      .then((data) => {
        setStats(data);
        setFetchError(null);
      })
      .catch((error) => {
        setFetchError(
          error instanceof Error
            ? error.message
            : 'Failed to load dashboard stats'
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const kpis = [
    {
      label: 'Total Companies',
      value: isLoading ? '...' : String(stats?.total_tenants ?? 0),
      trend: '+12%',
      trendUp: true,
      color: '#6B8AFF',
      sparkline: 'mixed' as const,
    },
    {
      label: 'Total Users',
      value: isLoading ? '...' : String(stats?.total_users ?? 0),
      trend: '+8%',
      trendUp: true,
      color: '#4ADE80',
      sparkline: 'up' as const,
    },
    {
      label: 'Total Properties',
      value: isLoading ? '...' : String(stats?.total_properties ?? 0),
      trend: '+23%',
      trendUp: true,
      color: '#FF8A5C',
      sparkline: 'up' as const,
    },
    {
      label: 'Total Leads',
      value: isLoading ? '...' : String(stats?.total_leads ?? 0),
      trend: '+156',
      trendUp: true,
      color: '#6B8AFF',
      sparkline: 'up' as const,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8" style={{ maxWidth: '100%' }}>
      <TopographyHero />

      {fetchError && (
        <div className="surface-card p-4 mt-4" style={{ color: '#FF8A5C' }}>
          {fetchError}
        </div>
      )}

      <div
        className="relative overflow-hidden mt-0 mx-0 rounded-[24px]"
        style={{ padding: '48px 0', marginTop: '-24px' }}
      >
        <div
          className="absolute inset-0 z-0 overflow-hidden rounded-[24px]"
          style={{ background: '#0A0A0F' }}
        >
          <div
            className="absolute rounded-full animate-orbFloat"
            style={{
              width: 400,
              height: 400,
              background: 'radial-gradient(circle, #6B8AFF 0%, transparent 70%)',
              top: -100,
              left: -100,
              filter: 'blur(80px)',
              opacity: 0.4,
              animationDelay: '0s',
            }}
          />

          <div
            className="absolute rounded-full animate-orbFloat-slow"
            style={{
              width: 500,
              height: 500,
              background: 'radial-gradient(circle, #FF8A5C 0%, transparent 70%)',
              bottom: -150,
              right: -100,
              filter: 'blur(80px)',
              opacity: 0.4,
              animationDelay: '-7s',
            }}
          />

          <div
            className="absolute rounded-full animate-orbFloat-medium"
            style={{
              width: 350,
              height: 350,
              background: 'radial-gradient(circle, #4ADE80 0%, transparent 70%)',
              top: '50%',
              left: '50%',
              filter: 'blur(80px)',
              opacity: 0.4,
              animationDelay: '-14s',
            }}
          />
        </div>

        <div className="relative z-[1] grid grid-cols-1 gap-5 px-0 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="surface-card surface-card-hover p-6"
              style={{ backdropFilter: 'blur(24px)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs" style={{ color: '#8A8A93' }}>
                  {kpi.label}
                </span>

                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-full"
                  style={{
                    background: kpi.trendUp
                      ? 'rgba(74, 222, 128, 0.15)'
                      : 'rgba(255, 90, 90, 0.15)',
                    color: kpi.trendUp ? '#4ADE80' : '#FF5A5A',
                  }}
                >
                  {kpi.trend}
                </span>
              </div>

              <div
                className="font-mono text-data font-medium mb-2"
                style={{ color: '#F0EDE6' }}
              >
                {kpi.value}
              </div>

              <Sparkline color={kpi.color} variant={kpi.sparkline} />
            </div>
          ))}
        </div>
      </div>

      <section className="surface-card mt-8 p-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p
              className="mb-2 text-xs font-mono uppercase tracking-[0.2em]"
              style={{ color: '#6B8AFF' }}
            >
              Operations Snapshot
            </p>
            <h2
              className="font-display text-section font-medium tracking-[-0.03em]"
              style={{ color: '#F0EDE6' }}
            >
              Platform Health
            </h2>
            <p className="mt-1 max-w-2xl text-sm" style={{ color: '#8A8A93' }}>
              Founder readiness view for core SaaS systems. Values are a clean
              operations snapshot and avoid storing secrets or touching backend services.
            </p>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-mono"
            style={{
              background: 'rgba(107, 138, 255, 0.10)',
              color: '#6B8AFF',
              border: '1px solid rgba(107, 138, 255, 0.18)',
            }}
          >
            Founder preview
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {platformHealth.map((item) => {
            const Icon = item.icon;
            const badgeStyle = getStatusBadgeStyle(item.status, item.color);

            return (
              <div
                key={item.label}
                className="rounded-2xl p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div
                    className="rounded-xl p-2.5"
                    style={{
                      background: `${item.color}14`,
                      color: item.color,
                      border: `1px solid ${item.color}26`,
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-mono"
                    style={badgeStyle}
                  >
                    {item.status}
                  </span>
                </div>
                <h3 className="text-sm font-medium" style={{ color: '#F0EDE6' }}>
                  {item.label}
                </h3>
                <p className="mt-2 text-xs leading-5" style={{ color: '#8A8A93' }}>
                  {item.note}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 mt-8 xl:grid-cols-[1.3fr_1fr]">
        <section className="surface-card p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2
                className="font-display text-section font-medium tracking-[-0.03em]"
                style={{ color: '#F0EDE6' }}
              >
                Recent Founder Activity
              </h2>
              <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>
                Preview of platform actions founders should monitor.
              </p>
            </div>

            <span
              className="rounded-full px-3 py-1 text-xs font-mono"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#8A8A93',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              Demo activity
            </span>
          </div>

          <div className="space-y-0">
            {founderActivities.map((activity, idx) => {
              const Icon = activity.icon;

              return (
                <div
                  key={activity.label}
                  className="flex items-start gap-4 rounded-lg px-2 py-4 transition-colors duration-200 -mx-2"
                  style={{
                    borderBottom:
                      idx < founderActivities.length - 1
                        ? '1px solid rgba(255, 255, 255, 0.04)'
                        : 'none',
                  }}
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: `${activity.color}18`,
                      color: activity.color,
                      border: `1px solid ${activity.color}26`,
                    }}
                  >
                    <Icon size={16} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium" style={{ color: '#F0EDE6' }}>
                        {activity.label}
                      </p>
                      <span className="text-xs font-mono" style={{ color: '#55555C' }}>
                        {activity.time}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5" style={{ color: '#8A8A93' }}>
                      {activity.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="surface-card p-6">
          <h2
            className="font-display text-section font-medium tracking-[-0.03em] mb-2"
            style={{ color: '#F0EDE6' }}
          >
            Founder Quick Actions
          </h2>
          <p className="mb-5 text-xs" style={{ color: '#8A8A93' }}>
            Shortcuts for daily SaaS operations review.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.label}
                  className="flex items-start gap-3 rounded-xl p-4 text-left transition-all duration-200"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.02)',
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.borderColor = '#6B8AFF';
                    event.currentTarget.style.background = 'rgba(107, 138, 255, 0.05)';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    event.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  }}
                >
                  <Icon size={18} style={{ color: '#6B8AFF' }} />
                  <span>
                    <span className="block text-sm font-medium" style={{ color: '#F0EDE6' }}>
                      {action.label}
                    </span>
                    <span className="mt-1 block text-xs" style={{ color: '#55555C' }}>
                      {action.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <section className="surface-card mt-8 p-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2
              className="font-display text-section font-medium tracking-[-0.03em]"
              style={{ color: '#F0EDE6' }}
            >
              Client Launch Readiness
            </h2>
            <p className="mt-1 text-sm" style={{ color: '#8A8A93' }}>
              Founder checklist for moving client workspaces from setup to live launch.
            </p>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-mono"
            style={{
              background: 'rgba(74, 222, 128, 0.10)',
              color: '#4ADE80',
              border: '1px solid rgba(74, 222, 128, 0.18)',
            }}
          >
            4 / 6 ready
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {launchReadiness.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 rounded-xl p-4"
              style={{
                background: item.ready
                  ? 'rgba(74, 222, 128, 0.05)'
                  : 'rgba(255, 138, 92, 0.06)',
                border: item.ready
                  ? '1px solid rgba(74, 222, 128, 0.12)'
                  : '1px solid rgba(255, 138, 92, 0.14)',
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{
                    background: item.ready
                      ? 'rgba(74, 222, 128, 0.12)'
                      : 'rgba(255, 138, 92, 0.12)',
                    color: item.ready ? '#4ADE80' : '#FF8A5C',
                  }}
                >
                  {item.ready ? <CheckCircle2 size={15} /> : <HardDrive size={15} />}
                </span>
                <span className="text-sm font-medium" style={{ color: '#F0EDE6' }}>
                  {item.label}
                </span>
              </div>
              <span
                className="rounded-full px-2.5 py-1 text-xs font-mono"
                style={{
                  background: item.ready
                    ? 'rgba(74, 222, 128, 0.12)'
                    : 'rgba(255, 138, 92, 0.12)',
                  color: item.ready ? '#4ADE80' : '#FF8A5C',
                }}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div
        className="flex items-center justify-between mt-8 pt-4"
        style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}
      >
        <span className="text-xs" style={{ color: '#55555C' }}>
          RS Real Estate v2.0
        </span>
        <span className="text-xs font-mono" style={{ color: '#55555C' }}>
          Last synced: live backend
        </span>
      </div>
    </div>
  );
}
