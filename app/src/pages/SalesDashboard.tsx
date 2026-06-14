import { TrendingUp, Target, DollarSign, UserCheck, Calendar, Award } from 'lucide-react';

export default function SalesDashboard() {
  const salesMetrics = [
    {
      label: 'Total Revenue',
      value: '$1,24,580',
      trend: '+18%',
      trendUp: true,
      icon: DollarSign,
      color: '#6B8AFF'
    },
    {
      label: 'Deals Closed',
      value: '47',
      trend: '+23%',
      trendUp: true,
      icon: Target,
      color: '#4ADE80'
    },
    {
      label: 'Pipeline Value',
      value: '$3,45,000',
      trend: '+45%',
      trendUp: true,
      icon: TrendingUp,
      color: '#FF8A5C'
    },
    {
      label: 'Close Rate',
      value: '42.5%',
      trend: '+5.2%',
      trendUp: true,
      icon: Award,
      color: '#A78BFA'
    },
  ];

  const salesReps = [
    {
      id: 1,
      name: 'Alex Johnson',
      target: 150000,
      achieved: 128500,
      deals: 18,
      conversion: '45%',
      progress: 85
    },
    {
      id: 2,
      name: 'Sarah Smith',
      target: 150000,
      achieved: 142300,
      deals: 22,
      conversion: '52%',
      progress: 95
    },
    {
      id: 3,
      name: 'Mike Davis',
      target: 150000,
      achieved: 98750,
      deals: 12,
      conversion: '35%',
      progress: 65
    },
  ];

  const topDeals = [
    { id: 1, name: 'Premium SaaS Package', value: '$125,000', stage: 'Negotiation', daysOpen: 14 },
    { id: 2, name: 'Enterprise License', value: '$98,500', stage: 'Demo', daysOpen: 7 },
    { id: 3, name: 'Annual Contract', value: '$72,300', stage: 'Proposal', daysOpen: 21 },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#F0EDE6' }}>Sales Dashboard</h1>
        <p style={{ color: '#8A8A93' }}>Your exclusive sales performance metrics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {salesMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="surface-card p-6"
              style={{ backdropFilter: 'blur(24px)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: `${metric.color}20` }}
                >
                  <Icon size={20} style={{ color: metric.color }} />
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{
                  background: metric.trendUp ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 90, 90, 0.15)',
                  color: metric.trendUp ? '#4ADE80' : '#FF5A5A',
                }}>
                  {metric.trend}
                </span>
              </div>
              <p className="text-sm mb-1" style={{ color: '#8A8A93' }}>{metric.label}</p>
              <p className="text-2xl font-bold" style={{ color: '#F0EDE6' }}>{metric.value}</p>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Sales Rep Performance */}
        <div className="surface-card p-6">
          <h2 className="text-lg font-bold mb-6" style={{ color: '#F0EDE6' }}>Sales Rep Performance</h2>
          <div className="space-y-6">
            {salesReps.map((rep) => (
              <div key={rep.id}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium" style={{ color: '#F0EDE6' }}>{rep.name}</h3>
                    <p className="text-xs mt-1" style={{ color: '#8A8A93' }}>
                      ${rep.achieved.toLocaleString()} / ${rep.target.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm" style={{ color: '#6B8AFF' }}>{rep.deals} deals</p>
                    <p className="text-xs" style={{ color: '#8A8A93' }}>{rep.conversion} conversion</p>
                  </div>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255, 255, 255, 0.08)' }}
                >
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${rep.progress}%`,
                      background: `linear-gradient(90deg, #6B8AFF, #4ADE80)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Deals */}
        <div className="surface-card p-6">
          <h2 className="text-lg font-bold mb-6" style={{ color: '#F0EDE6' }}>Top Deals in Pipeline</h2>
          <div className="space-y-4">
            {topDeals.map((deal) => (
              <div
                key={deal.id}
                className="p-4 rounded-lg border transition-all duration-200"
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.01)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm" style={{ color: '#F0EDE6' }}>{deal.name}</h3>
                  <p className="font-mono text-sm" style={{ color: '#6B8AFF' }}>{deal.value}</p>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div
                    className="px-2 py-1 rounded"
                    style={{
                      background: 'rgba(167, 139, 250, 0.15)',
                      color: '#A78BFA',
                    }}
                  >
                    {deal.stage}
                  </div>
                  <p style={{ color: '#8A8A93' }}>
                    <Calendar size={12} className="inline mr-1" />
                    {deal.daysOpen} days open
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Forecast */}
      <div className="surface-card p-6">
        <h2 className="text-lg font-bold mb-6" style={{ color: '#F0EDE6' }}>Monthly Forecast</h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { month: 'Jan', forecast: '₹95K', actual: '₹88K', percentage: 92 },
            { month: 'Feb', forecast: '₹110K', actual: '₹105K', percentage: 95 },
            { month: 'Mar', forecast: '₹125K', actual: '₹128K', percentage: 102 },
            { month: 'Apr (Projected)', forecast: '₹140K', actual: '-', percentage: 0 },
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <p className="text-sm font-medium mb-2" style={{ color: '#F0EDE6' }}>{item.month}</p>
              <p className="text-xs mb-3" style={{ color: '#8A8A93' }}>
                Forecast: {item.forecast}
              </p>
              {item.actual !== '-' && (
                <>
                  <p className="text-xs mb-2" style={{ color: '#8A8A93' }}>
                    Actual: {item.actual}
                  </p>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255, 255, 255, 0.08)' }}
                  >
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.min(item.percentage, 100)}%`,
                        background: item.percentage >= 100 ? '#4ADE80' : '#6B8AFF',
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

