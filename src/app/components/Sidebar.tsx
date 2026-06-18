import { useMemo } from "react";
import {
  LayoutDashboard,
  Image,
  Sparkles,
  Calendar,
  BarChart3,
  Users2,
  Building2,
  FileBarChart,
  UserSquare2,
  Zap,
  CreditCard,
  LifeBuoy,
  Settings,
  Bot,
  ChevronRight,
  Search,
  LogOut,
  Moon,
  Sun,
  Command,
} from "lucide-react";
import { motion } from "motion/react";
import type { ClientProfile } from "../lib/clientApi";

type FloorItem = {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  floor: string;
  badge?: string | null;
};

const floors: FloorItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", floor: "F01" },
  { id: "media", icon: Image, label: "Media Library", floor: "F02" },
  { id: "ai-studio", icon: Sparkles, label: "AI Studio", floor: "F03", badge: "New" },
  { id: "scheduler", icon: Calendar, label: "Scheduler", floor: "F04" },
  { id: "analytics", icon: BarChart3, label: "Analytics", floor: "F05" },
  { id: "crm", icon: Users2, label: "CRM", floor: "F06", badge: "3" },
  { id: "properties", icon: Building2, label: "Properties", floor: "F07" },
  { id: "reports", icon: FileBarChart, label: "Reports", floor: "F08" },
  { id: "team", icon: UserSquare2, label: "Team", floor: "F09" },
  { id: "automation", icon: Zap, label: "Automation", floor: "F10" },
  { id: "billing", icon: CreditCard, label: "Billing", floor: "F11" },
  { id: "support", icon: LifeBuoy, label: "Support", floor: "F12" },
  { id: "settings", icon: Settings, label: "Settings", floor: "F13" },
  { id: "ai-manager", icon: Bot, label: "AI Manager", floor: "F14", badge: "●" },
];

interface SidebarProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  darkMode: boolean;
  onToggleDark: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCommandPalette: () => void;
  profile: ClientProfile | null;
  onLogout: () => void;
}

export function Sidebar({
  activeScreen,
  onNavigate,
  darkMode,
  onToggleDark,
  collapsed,
  onToggleCollapse,
  onCommandPalette,
  profile,
  onLogout,
}: SidebarProps) {
  const activeIndex = Math.max(
    0,
    floors.findIndex((item) => item.id === activeScreen),
  );

  const activeFloor = floors[activeIndex] || floors[0];

  const businessName = profile?.business_name || "RS Real Estate";
  const userName = profile?.full_name || profile?.business_name || "RS Client";
  const userEmail = profile?.email || "Email not available";

  const initials = useMemo(() => {
    return (
      userName
        .trim()
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "RS"
    );
  }, [userName]);

  return (
    <motion.aside
      animate={{ width: collapsed ? 78 : 284 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={`rs-elevator-sidebar ${darkMode ? "rs-elevator-dark" : "rs-elevator-light"} ${
        collapsed ? "rs-elevator-collapsed" : ""
      }`}
      aria-label="RS Real Estate floor navigation"
    >
      <div className="rs-building-glow" aria-hidden="true" />

      <div className="rs-building-header">
        <div className="rs-building-logo">
          <div className="rs-building-logo-mark">
            <Building2 size={17} />
          </div>

          {!collapsed && (
            <div className="rs-building-brand-copy">
              <p>{businessName}</p>
              <span>Building Command OS</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="rs-building-icon-btn"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.span
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.25 }}
            className="rs-building-icon-span"
          >
            <ChevronRight size={15} />
          </motion.span>
        </button>
      </div>

      <div className="rs-building-tools">
        <button
          type="button"
          onClick={onCommandPalette}
          className="rs-building-tool"
          aria-label="Open command palette"
        >
          {collapsed ? <Command size={15} /> : <Search size={14} />}
          {!collapsed && (
            <>
              <span>Search floors</span>
              <kbd>Ctrl K</kbd>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleDark}
          className="rs-building-tool rs-theme-tool"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          {!collapsed && <span>{darkMode ? "Light mode" : "Dark mode"}</span>}
        </button>
      </div>

      <div className="rs-elevator-status" title={activeFloor.label}>
        <span className="rs-elevator-status-dot" />
        {!collapsed && (
          <>
            <span className="rs-elevator-current">{activeFloor.floor}</span>
            <span className="rs-elevator-current-label">{activeFloor.label}</span>
          </>
        )}
      </div>

      <nav className="rs-floor-shaft" role="tablist" aria-label="Client dashboard floors">
        <div className="rs-shaft-rail" aria-hidden="true" />

        <motion.div
          className="rs-lift-cabin"
          animate={{ y: activeIndex * 45 }}
          transition={{ type: "spring", stiffness: 260, damping: 28, mass: 0.9 }}
          aria-hidden="true"
        >
          <div className="rs-lift-door rs-lift-door-left" />
          <div className="rs-lift-door rs-lift-door-right" />
          <div className="rs-lift-light" />
          {!collapsed && <span>{activeFloor.floor}</span>}
        </motion.div>

        <div className="rs-floor-list">
          {floors.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`rs-floor-button ${isActive ? "rs-floor-active" : ""}`}
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? "page" : undefined}
                title={collapsed ? `${item.floor} • ${item.label}` : undefined}
              >
                <span className="rs-floor-number">{item.floor}</span>
                <span className="rs-floor-icon">
                  <Icon size={17} />
                </span>

                {!collapsed && (
                  <>
                    <span className="rs-floor-label">{item.label}</span>

                    {item.badge && (
                      <span
                        className={`rs-floor-badge ${
                          item.badge === "●" ? "rs-floor-badge-live" : ""
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="rs-building-footer">
        <div className="rs-building-profile">
          <div className="rs-building-avatar">{initials}</div>

          {!collapsed && (
            <div className="rs-building-profile-copy">
              <p>{userName}</p>
              <span>{userEmail}</span>
            </div>
          )}

          {!collapsed && (
            <button
              type="button"
              onClick={onLogout}
              className="rs-logout-button"
              aria-label="Log out"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
