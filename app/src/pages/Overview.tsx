import { useEffect, useState, type ReactNode } from 'react';
import TopographyHero from '@/components/TopographyHero';
import { activities, platformStatuses } from '@/data/mock';
import { getAdminDashboardStats, type AdminDashboardStats } from '@/lib/adminApi';
import {
  Building2,
  UserPlus,
  CreditCard,
  Ticket,
  Zap,
  Database,
  Server,
  Layers,
  HardDrive,
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

const quickActions = [
  { label: 'Add Company', icon: Building2 },
  { label: 'Add Team Member', icon: UserPlus },
  { label: 'Create Subscription', icon: CreditCard },
  { label: 'Open Support', icon: Ticket },
];

const statusIcons: Record<string, ReactNode> = {
  Backend: <Server size={14} />,
  Database: <Database size={14} />,
  'AI Services': <Zap size={14} />,
  Queue: <Layers size={14} />,
  Storage: <HardDrive size={14} />,
};

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
    <div className="p-8" style={{ maxWidth: '100%' }}>
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

        <div className="relative z-[1] grid grid-cols-4 gap-5 px-0">
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

      <div className="grid grid-cols-2 gap-6 mt-8">
        <div className="surface-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2
              className="font-display text-section font-medium tracking-[-0.03em]"
              style={{ color: '#F0EDE6' }}
            >
              Recent Activity
            </h2>

            <button className="text-sm" style={{ color: '#6B8AFF' }}>
              View all
            </button>
          </div>

          <div className="space-y-0">
            {activities.map((activity, idx) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 py-4 transition-colors duration-200 rounded-lg px-2 -mx-2"
                style={{
                  borderBottom:
                    idx < activities.length - 1
                      ? '1px solid rgba(255, 255, 255, 0.04)'
                      : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                  style={{
                    background: activity.color + '20',
                    color: activity.color,
                  }}
                >
                  {activity.initial}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: '#F0EDE6' }}>
                    {activity.text}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#55555C' }}>
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface-card p-6">
            <h2
              className="font-display text-section font-medium tracking-[-0.03em] mb-5"
              style={{ color: '#F0EDE6' }}
            >
              Quick Actions
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.label}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200"
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#6B8AFF';
                      e.currentTarget.style.background = 'rgba(107, 138, 255, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Icon size={20} style={{ color: '#6B8AFF' }} />
                    <span className="text-xs" style={{ color: '#F0EDE6' }}>
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="surface-card p-6">
            <h2
              className="font-display text-section font-medium tracking-[-0.03em] mb-5"
              style={{ color: '#F0EDE6' }}
            >
              Platform Status
            </h2>

            <div className="space-y-3">
              {platformStatuses.map((status) => (
                <div
                  key={status.name}
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex items-center gap-3">
                    <span style={{ color: '#8A8A93' }}>
                      {statusIcons[status.name]}
                    </span>
                    <span className="text-sm" style={{ color: '#F0EDE6' }}>
                      {status.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        background:
                          status.status === 'Operational'
                            ? '#4ADE80'
                            : status.status === 'Degraded'
                              ? '#FF8A5C'
                              : '#FF5A5A',
                      }}
                    />
                    <span className="text-xs font-mono" style={{ color: '#8A8A93' }}>
                      {status.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-between mt-8 pt-4"
        style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}
      >
        <span className="text-xs" style={{ color: '#55555C' }}>
          AI Growth OS v2.0
        </span>
        <span className="text-xs font-mono" style={{ color: '#55555C' }}>
          Last synced: live backend
        </span>
      </div>
    </div>
  );
}