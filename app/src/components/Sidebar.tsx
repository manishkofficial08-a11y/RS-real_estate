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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import CubeLogo from './CubeLogo';

type SidebarProps = {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
};

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/admin/overview' },
  { label: 'Companies', icon: Building2, path: '/admin/companies' },
  { label: 'Client Onboarding', icon: Users, path: '/admin/client-onboarding' },
  { label: 'Leads', icon: Rocket, path: '/admin/leads' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { label: 'AI Jobs', icon: Bot, path: '/admin/ai-jobs' },
  { label: 'Subscriptions', icon: CreditCard, path: '/admin/subscriptions' },
  { label: 'Support', icon: Ticket, path: '/admin/support' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

export default function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  function handleNavigate(path: string) {
    navigate(path);
    onClose();
  }

  return (
    <aside
      className={[
        'fixed left-0 top-0 z-50 flex h-screen flex-col transition-all duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      ].join(' ')}
      style={{
        width: isCollapsed ? 84 : 240,
        background: 'rgba(255, 255, 255, 0.02)',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(24px)',
      }}
      aria-label="Founder dashboard navigation"
    >
      <button
        type="button"
        className="absolute -right-3 top-7 z-[60] hidden h-7 w-7 items-center justify-center rounded-full lg:flex"
        style={{
          background: 'rgba(10, 10, 15, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#8A8A93',
        }}
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
      </button>

      <div className={`flex items-center gap-3 px-5 py-6 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <CubeLogo />

          {!isCollapsed && (
            <span
              className="font-display text-base font-medium tracking-[-0.02em]"
              style={{ color: '#F0EDE6' }}
            >
              RS Real Estate
            </span>
          )}
        </div>

        {!isCollapsed && (
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
        )}
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
              title={isCollapsed ? item.label : undefined}
              className={[
                'flex w-full items-center rounded-lg py-2.5 text-left transition-all duration-200',
                isCollapsed ? 'justify-center px-2' : 'gap-3 px-3',
              ].join(' ')}
              style={{
                background: isActive ? 'rgba(107, 138, 255, 0.12)' : 'transparent',
                color: isActive ? '#6B8AFF' : '#8A8A93',
                borderLeft: isActive && !isCollapsed ? '2px solid #6B8AFF' : '2px solid transparent',
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
              <Icon size={17} strokeWidth={isActive ? 2 : 1.5} />

              {!isCollapsed && (
                <span className="text-sm font-normal">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div
        className={[
          'mx-3 mb-4 flex items-center rounded-xl p-3',
          isCollapsed ? 'justify-center' : 'gap-3',
        ].join(' ')}
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium"
          style={{
            background: 'linear-gradient(135deg, #6B8AFF, #4A6BFF)',
            color: '#F0EDE6',
          }}
        >
          F
        </div>

        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium" style={{ color: '#F0EDE6' }}>
              Founder
            </p>
            <p className="truncate text-xs" style={{ color: '#55555C' }}>
              founder@aigrowthos.com
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

