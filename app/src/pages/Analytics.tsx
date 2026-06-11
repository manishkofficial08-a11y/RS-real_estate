import { useState } from 'react';
import { analyticsData, companies } from '@/data/mock';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar,
} from 'recharts';

const timeRanges = ['7d', '30d', '90d'];

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  const [range, setRange] = useState('30d');
  return (
    <div className="surface-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{title}</h3>
        <div className="flex items-center gap-1">
          {timeRanges.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="text-xs px-2.5 py-1 rounded-md transition-all"
              style={{
                background: range === r ? 'rgba(107, 138, 255, 0.12)' : 'transparent',
                color: range === r ? '#6B8AFF' : '#55555C',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div style={{ width: '100%', height: 220 }}>
        {children}
      </div>
    </div>
  );
}

export default function Analytics() {
  const topCompanies = [...companies]
    .sort((a, b) => b.aiUsage - a.aiUsage)
    .slice(0, 5);

  const maxUsage = Math.max(...topCompanies.map(c => c.aiUsage));

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display text-hero font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
          Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8A8A93' }}>Platform growth and usage metrics</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Revenue Growth */}
        <ChartCard title="Revenue Growth">
          <ResponsiveContainer>
            <AreaChart data={analyticsData.revenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF8A5C" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#FF8A5C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#55555C', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#55555C', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#0F0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#F0EDE6', fontSize: 12 }}
                itemStyle={{ color: '#F0EDE6' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="value" stroke="#FF8A5C" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Client Growth */}
        <ChartCard title="Client Growth">
          <ResponsiveContainer>
            <LineChart data={analyticsData.clients}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#55555C', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#55555C', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0F0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#F0EDE6', fontSize: 12 }}
                formatter={(value: number) => [value.toLocaleString(), 'Companies']}
              />
              <Line type="monotone" dataKey="value" stroke="#6B8AFF" strokeWidth={2} dot={{ fill: '#6B8AFF', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* AI Usage */}
        <ChartCard title="AI Usage">
          <ResponsiveContainer>
            <BarChart data={analyticsData.aiUsage}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#55555C', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#55555C', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#0F0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#F0EDE6', fontSize: 12 }}
                formatter={(value: number) => [value.toLocaleString(), 'AI Operations']}
              />
              <Bar dataKey="value" fill="#6B8AFF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Active Users */}
        <ChartCard title="Active Users">
          <ResponsiveContainer>
            <AreaChart data={analyticsData.activeUsers}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ADE80" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4ADE80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#55555C', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#55555C', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0F0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#F0EDE6', fontSize: 12 }}
                formatter={(value: number) => [value.toLocaleString(), 'Active Users']}
              />
              <Area type="monotone" dataKey="value" stroke="#4ADE80" strokeWidth={2} fill="url(#userGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top Companies */}
      <div className="surface-card p-6">
        <h3 className="text-sm font-medium mb-5" style={{ color: '#F0EDE6' }}>Top Companies by AI Usage</h3>
        <div className="space-y-4">
          {topCompanies.map((company) => (
            <div key={company.id} className="flex items-center gap-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0"
                style={{ background: 'rgba(107, 138, 255, 0.15)', color: '#6B8AFF' }}
              >
                {company.logo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{company.name}</span>
                  <span className="text-xs font-mono" style={{ color: '#8A8A93' }}>{company.aiUsage.toLocaleString()} ops</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
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
      </div>

      <div className="flex items-center justify-between mt-8 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <span className="text-xs" style={{ color: '#55555C' }}>AI Growth OS v2.0</span>
        <span className="text-xs font-mono" style={{ color: '#55555C' }}>Last synced: 2 min ago</span>
      </div>
    </div>
  );
}
