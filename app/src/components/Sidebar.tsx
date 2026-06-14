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
  X,
} from 'lucide-react';
import CubeLogo from './CubeLogo';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

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

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  function handleNavigate(path: string) {
    navigate(path);
    onClose();
  }

  return (
    <aside
      className={[
        'fixed left-0 top-0 z-50 flex h-screen flex-col transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      ].join(' ')}
      style={{
        width: 240,
        background: 'rgba(255, 255, 255, 0.02)',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(24px)',
      }}
      aria-label="Founder dashboard navigation"
    >
      <div className="flex items-center justify-between gap-3 px-5 py-6">
        <div className="flex items-center gap-3">
          <CubeLogo />
          <span
            className="font-display text-base font-medium tracking-[-0.02em]"
            style={{ color: '#F0EDE6' }}
          >
            MMe-AI
          </span>
        </div>

        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg lg:hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#F0EDE6',
          }}
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => handleNavigate(item.path)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200"
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

      <div
        className="mx-3 mb-4 flex items-center gap-3 rounded-xl p-3"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium"
          style={{
            background: 'linear-gradient(135deg, #6B8AFF, #4A6BFF)',
            color: '#F0EDE6',
          }}
        >
          F
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" style={{ color: '#F0EDE6' }}>
            Founder
          </p>
          <p className="truncate text-xs" style={{ color: '#55555C' }}>
            admin@aigrowth.os
          </p>
        </div>
      </div>
    </aside>
  );
}

