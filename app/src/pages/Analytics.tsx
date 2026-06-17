import { useState, type ReactNode } from 'react';
import { analyticsData, companies } from '@/data/mock';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
} from 'recharts';
import {
  Activity,
  BarChart3,
  Building2,
  DollarSign,
  Headphones,
  MousePointerClick,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

const timeRanges = ['7d', '30d', '90d'];

const founderInsights = [
  { label: 'Expansion signal', value: 'Enterprise accounts drive 54% of AI usage', color: '#6B8AFF' },
  { label: 'Conversion signal', value: 'Lead conversion is strongest for Pro-plan clients', color: '#4ADE80' },
  { label: 'Support signal', value: 'Support volume is stable but needs SLA tracking next', color: '#FF8A5C' },
];

const activityItems = [
  { label: 'CRM lead updates', value: '2,418', sub: '+14% this month' },
  { label: 'Property sync events', value: '934', sub: 'Healthy data flow' },
  { label: 'Report exports', value: '186', sub: 'Founder + client usage' },
  { label: 'Support interactions', value: '42', sub: 'Across active companies' },
];

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const [range, setRange] = useState('30d');

  return (
    <div className="surface-card p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{title}</h3>
          <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>{subtitle}</p>
        </div>

        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          {timeRanges.map((rangeOption) => (
            <button
              key={rangeOption}
              onClick={() => setRange(rangeOption)}
              className="rounded-md px-2.5 py-1 text-xs transition-all"
              style={{
                background: range === rangeOption ? 'rgba(107, 138, 255, 0.12)' : 'transparent',
                color: range === rangeOption ? '#6B8AFF' : '#55555C',
              }}
            >
              {rangeOption}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: 240 }}>
        {children}
      </div>
    </div>
  );
}

export default function Analytics() {
  const topCompanies = [...companies]
    .sort((a, b) => b.aiUsage - a.aiUsage)
    .slice(0, 5);

  const maxUsage = Math.max(...topCompanies.map((company) => company.aiUsage), 1);
  const latestRevenue = analyticsData.revenue[analyticsData.revenue.length - 1]?.value ?? 0;
  const latestAiUsage = analyticsData.aiUsage[analyticsData.aiUsage.length - 1]?.value ?? 0;
  const latestActiveUsers = analyticsData.activeUsers[analyticsData.activeUsers.length - 1]?.value ?? 0;

  const summaryCards = [
    {
      label: 'Monthly Revenue',
      value: `$${(latestRevenue / 1000).toFixed(1)}K`,
      sub: '+12.8% from last month',
      icon: DollarSign,
      color: '#FF8A5C',
    },
    {
      label: 'Active Companies',
      value: companies.length.toString(),
      sub: 'Live real estate workspaces',
      icon: Building2,
      color: '#6B8AFF',
    },
    {
      label: 'Total Users',
      value: latestActiveUsers.toLocaleString(),
      sub: 'Across client teams',
      icon: Users,
      color: '#4ADE80',
    },
    {
      label: 'Lead Conversion',
      value: '18.6%',
      sub: '+3.1% vs previous period',
      icon: MousePointerClick,
      color: '#6B8AFF',
    },
    {
      label: 'Open Support Tickets',
      value: '14',
      sub: 'Founder review queue',
      icon: Headphones,
      color: '#FF8A5C',
    },
    {
      label: 'AI Automation Usage',
      value: latestAiUsage.toLocaleString(),
      sub: 'AI ops this month',
      icon: Zap,
      color: '#4ADE80',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ background: 'rgba(107, 138, 255, 0.08)', border: '1px solid rgba(107, 138, 255, 0.16)' }}>
            <BarChart3 size={14} style={{ color: '#6B8AFF' }} />
            <span className="text-xs font-mono" style={{ color: '#6B8AFF' }}>Founder Intelligence</span>
          </div>

          <h1 className="font-display text-hero font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
            Analytics
          </h1>
          <p className="mt-1 max-w-2xl text-sm" style={{ color: '#8A8A93' }}>
            Track revenue, client growth, AI automation usage, lead conversion, support activity, and product adoption across the real estate OS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
            style={{ background: 'rgba(255, 255, 255, 0.04)', color: '#F0EDE6', border: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <Activity size={15} />
            Live Snapshot
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
            style={{ background: '#6B8AFF', color: '#FFFFFF' }}
          >
            <Sparkles size={15} />
            Generate Report
          </button>
        </div>
      </div>

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
              <p className="font-mono text-data font-medium" style={{ color: '#F0EDE6' }}>{card.value}</p>
              <p className="mt-2 text-xs" style={{ color: '#55555C' }}>{card.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Revenue Growth" subtitle="Monthly recurring revenue across active client companies">
          <ResponsiveContainer>
            <AreaChart data={analyticsData.revenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF8A5C" stopOpacity={0.34} />
                  <stop offset="100%" stopColor="#FF8A5C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#55555C', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#55555C', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${(Number(value) / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#0F0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#F0EDE6', fontSize: 12 }}
                itemStyle={{ color: '#F0EDE6' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="value" stroke="#FF8A5C" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Client Growth" subtitle="Total real estate companies using the platform">
          <ResponsiveContainer>
            <LineChart data={analyticsData.clients}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#55555C', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#55555C', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0F0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#F0EDE6', fontSize: 12 }}
                formatter={(value: number) => [value.toLocaleString(), 'Companies']}
              />
              <Line type="monotone" dataKey="value" stroke="#6B8AFF" strokeWidth={2} dot={{ fill: '#6B8AFF', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="AI Automation Usage" subtitle="AI jobs, recommendations, reports, and automation operations">
          <ResponsiveContainer>
            <BarChart data={analyticsData.aiUsage}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#55555C', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#55555C', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#0F0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#F0EDE6', fontSize: 12 }}
                formatter={(value: number) => [value.toLocaleString(), 'AI Operations']}
              />
              <Bar dataKey="value" fill="#6B8AFF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Active Users" subtitle="Client-side team members active across dashboards">
          <ResponsiveContainer>
            <AreaChart data={analyticsData.activeUsers}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ADE80" stopOpacity={0.34} />
                  <stop offset="100%" stopColor="#4ADE80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#55555C', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#55555C', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0F0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#F0EDE6', fontSize: 12 }}
                formatter={(value: number) => [value.toLocaleString(), 'Active Users']}
              />
              <Area type="monotone" dataKey="value" stroke="#4ADE80" strokeWidth={2} fill="url(#userGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="surface-card p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-medium" style={{ color: '#F0EDE6' }}>Top Companies by AI Usage</h3>
              <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>Highest automation consumption across client workspaces</p>
            </div>
            <span className="text-xs font-mono" style={{ color: '#55555C' }}>Mock leaderboard</span>
          </div>

          {topCompanies.length > 0 ? (
            <div className="space-y-4">
              {topCompanies.map((company, index) => (
                <div key={company.id} className="flex items-center gap-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-mono" style={{ background: 'rgba(255, 255, 255, 0.04)', color: '#8A8A93' }}>
                    #{index + 1}
                  </div>
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xs font-medium"
                    style={{ background: 'rgba(107, 138, 255, 0.15)', color: '#6B8AFF' }}
                  >
                    {company.logo}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium" style={{ color: '#F0EDE6' }}>{company.name}</span>
                      <span className="text-xs font-mono" style={{ color: '#8A8A93' }}>{company.aiUsage.toLocaleString()} ops</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(company.aiUsage / maxUsage) * 100}%`,
                          background: 'linear-gradient(90deg, #6B8AFF, #4A6BFF)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <TrendingUp size={30} style={{ color: '#55555C' }} />
              <h3 className="mt-4 text-base font-medium" style={{ color: '#F0EDE6' }}>No analytics data yet</h3>
              <p className="mt-2 max-w-md text-sm" style={{ color: '#8A8A93' }}>
                Company usage metrics will appear once clients start using AI automation features.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="surface-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium" style={{ color: '#F0EDE6' }}>Platform Activity</h3>
                <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>Operational signals</p>
              </div>
              <Activity size={18} style={{ color: '#6B8AFF' }} />
            </div>

            <div className="space-y-3">
              {activityItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 rounded-xl p-3" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{item.label}</p>
                    <p className="mt-1 text-xs" style={{ color: '#55555C' }}>{item.sub}</p>
                  </div>
                  <span className="text-sm font-mono" style={{ color: '#8A8A93' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-5">
            <p className="mb-3 text-xs font-mono" style={{ color: '#8A8A93' }}>Founder Notes</p>
            <div className="space-y-3">
              {founderInsights.map((insight) => (
                <div key={insight.label} className="rounded-xl p-3" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: insight.color }} />
                    <p className="text-xs font-mono" style={{ color: '#8A8A93' }}>{insight.label}</p>
                  </div>
                  <p className="text-sm leading-6" style={{ color: '#F0EDE6' }}>{insight.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <span className="text-xs" style={{ color: '#55555C' }}>RS Real Estate v2.0</span>
        <span className="text-xs font-mono" style={{ color: '#55555C' }}>Last synced: 2 min ago</span>
      </div>
    </div>
  );
}
