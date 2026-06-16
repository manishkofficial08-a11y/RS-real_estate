import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Image,
  Sparkles,
  Calendar,
  BarChart3,
  Users2,
  Building2,
  FileBarChart,
  UserSquare2,
  Zap,
  Puzzle,
  CreditCard,
  Settings,
  Bot,
  ChevronRight,
  Bell,
  Search,
  LogOut,
  Moon,
  Sun,
  Command,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { ClientProfile } from "../lib/clientApi";

const navItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", badge: null },
  { id: "content", icon: FileText, label: "Content", badge: "12" },
  { id: "media", icon: Image, label: "Media Library", badge: null },
  { id: "ai-studio", icon: Sparkles, label: "AI Studio", badge: "New" },
  { id: "scheduler", icon: Calendar, label: "Scheduler", badge: null },
  { id: "analytics", icon: BarChart3, label: "Analytics", badge: null },
  { id: "crm", icon: Users2, label: "CRM", badge: "3" },
  { id: "properties", icon: Building2, label: "Properties", badge: null },
  { id: "reports", icon: FileBarChart, label: "Reports", badge: null },
  { id: "team", icon: UserSquare2, label: "Team", badge: null },
  { id: "automation", icon: Zap, label: "Automation", badge: null },
  { id: "integrations", icon: Puzzle, label: "Integrations", badge: null },
  { id: "billing", icon: CreditCard, label: "Billing", badge: null },
  { id: "settings", icon: Settings, label: "Settings", badge: null },
  { id: "ai-manager", icon: Bot, label: "AI Manager", badge: "●" },
];

interface SidebarProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  darkMode: boolean;
  onToggleDark: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCommandPalette: () => void;
  onLogout: () => void;
  profile: ClientProfile | null;
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const businessName = profile?.business_name || "RS Real Estate OS";
  const userName = profile?.full_name || "MMe-AI";
  const userEmail = profile?.email || "client@rsrealestate.com";
  const initials =
    userName
      .trim()
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "RS";
  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex flex-col h-full border-r border-border overflow-hidden flex-shrink-0"
      style={{
        background: darkMode
          ? "rgba(5, 5, 20, 0.97)"
          : "rgba(255, 255, 255, 0.97)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Aurora glow top */}
      {darkMode && (
        <div
          className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.15) 0%, transparent 70%)",
          }}
        />
      )}

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border flex-shrink-0">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)",
            boxShadow: "0 0 20px rgba(99,102,241,0.4)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)",
            }}
          />
          <Sparkles size={14} className="text-white relative z-10" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="min-w-0"
            >
              <div
                className="text-sm font-semibold tracking-tight"
                style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
              >
                AI Growth OS
              </div>
              <div
                className="text-xs"
                style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}
              >
                Enterprise
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={onToggleCollapse}
          className="ml-auto p-1 rounded-lg transition-all hover:bg-primary/10"
          style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}
        >
          <motion.div
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronRight size={14} />
          </motion.div>
        </button>
      </div>

      {/* Search / Command */}
      {!collapsed && (
        <div className="px-3 py-3 flex-shrink-0">
          <button
            onClick={onCommandPalette}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all border"
            style={{
              background: darkMode
                ? "rgba(99,102,241,0.06)"
                : "rgba(99,102,241,0.04)",
              borderColor: darkMode
                ? "rgba(99,102,241,0.12)"
                : "rgba(99,102,241,0.08)",
              color: darkMode ? "#64748b" : "#94a3b8",
            }}
          >
            <Search size={12} />
            <span>Search...</span>
            <div className="ml-auto flex items-center gap-1">
              <kbd
                className="px-1 py-0.5 rounded text-xs"
                style={{
                  background: darkMode
                    ? "rgba(99,102,241,0.1)"
                    : "rgba(99,102,241,0.06)",
                  color: darkMode ? "#818cf8" : "#6366f1",
                }}
              >
                ⌘K
              </kbd>
            </div>
          </button>
        </div>
      )}

      {collapsed && (
        <div className="px-3 py-3 flex-shrink-0">
          <button
            onClick={onCommandPalette}
            className="w-full flex items-center justify-center p-2 rounded-xl transition-all"
            style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
          >
            <Command size={14} />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = activeScreen === item.id;
          const isHovered = hoveredItem === item.id;

          return (
            <div key={item.id} className="relative">
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: darkMode
                      ? "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.1) 100%)"
                      : "rgba(99,102,241,0.08)",
                    border: `1px solid ${darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.12)"}`,
                  }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                />
              )}
              <button
                onClick={() => onNavigate(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group"
                style={{
                  color: isActive
                    ? darkMode
                      ? "#818cf8"
                      : "#6366f1"
                    : darkMode
                      ? "#4a5568"
                      : "#64748b",
                }}
              >
                <item.icon
                  size={16}
                  className="flex-shrink-0 transition-transform"
                  style={{
                    transform:
                      isHovered && !isActive ? "scale(1.1)" : "scale(1)",
                  }}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm flex-1 text-left"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!collapsed && item.badge && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{
                      background:
                        item.badge === "New"
                          ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                          : item.badge === "●"
                            ? "transparent"
                            : darkMode
                              ? "rgba(99,102,241,0.2)"
                              : "rgba(99,102,241,0.1)",
                      color:
                        item.badge === "●"
                          ? "#22c55e"
                          : item.badge === "New"
                            ? "#ffffff"
                            : darkMode
                              ? "#818cf8"
                              : "#6366f1",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* User + controls */}
      <div className="flex-shrink-0 border-t border-border p-3 space-y-1">
        <button
          onClick={onToggleDark}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all hover:bg-primary/5"
          style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          {!collapsed && (
            <span className="text-xs">
              {darkMode ? "Light mode" : "Dark mode"}
            </span>
          )}
        </button>

        <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#ffffff",
            }}
          >
            JD
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <div
                  className="text-xs font-medium truncate"
                  style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                >
                  Jane Doe
                </div>
                <div
                  className="text-xs truncate"
                  style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}
                >
                  jane@company.com
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <button
              onClick={onLogout}
              className="p-1 rounded-lg transition-all hover:bg-destructive/10"
              style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}
            >
              <LogOut size={13} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
