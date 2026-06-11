import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Rocket,
  Users,
  BarChart3,
  Bot,
  CreditCard,
  Ticket,
  Settings,
} from 'lucide-react';
import CubeLogo from './CubeLogo';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/admin/overview' },
  { label: 'Companies', icon: Building2, path: '/admin/companies' },
  { label: 'Leads', icon: Rocket, path: '/admin/leads' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { label: 'AI Jobs', icon: Bot, path: '/admin/ai-jobs' },
  { label: 'Subscriptions', icon: CreditCard, path: '/admin/subscriptions' },
  { label: 'Support', icon: Ticket, path: '/admin/support' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside
      className="fixed left-0 top-0 h-screen z-50 flex flex-col"
      style={{
        width: 240,
        background: 'rgba(255, 255, 255, 0.02)',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6">
        <CubeLogo />
        <span className="font-display text-base font-medium tracking-[-0.02em]" style={{ color: '#F0EDE6' }}>
          AI Growth OS
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200"
              style={{
                background: isActive ? 'rgba(107, 138, 255, 0.12)' : 'transparent',
                color: isActive ? '#6B8AFF' : '#8A8A93',
                borderLeft: isActive ? '2px solid #6B8AFF' : '2px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(107, 138, 255, 0.08)';
                  e.currentTarget.style.color = '#6B8AFF';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#8A8A93';
                }
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-sm font-normal">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div
        className="mx-3 mb-4 p-3 rounded-xl flex items-center gap-3"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
          style={{ background: 'linear-gradient(135deg, #6B8AFF, #4A6BFF)', color: '#F0EDE6' }}
        >
          F
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: '#F0EDE6' }}>Founder</p>
          <p className="text-xs truncate" style={{ color: '#55555C' }}>admin@aigrowth.os</p>
        </div>
      </div>
    </aside>
  );
}
