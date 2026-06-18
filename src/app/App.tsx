import "./styles/sidebar.css";
import { Properties } from "./components/Properties";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { AIStudio } from "./components/AIStudio";
import { Analytics } from "./components/Analytics";
import { CRM } from "./components/CRM";
import { Scheduler } from "./components/Scheduler";
import { Settings } from "./components/Settings";
import { Support } from "./components/Support";
import { MediaLibrary } from "./components/MediaLibrary";
import { Reports } from "./components/Reports";
import { TeamManagement } from "./components/TeamManagement";
import { Billing } from "./components/Billing";
import { AIManager } from "./components/AIManager";
import { AutomationCenter } from "./components/AutomationCenter";
import { Background3D } from "./components/Background3D";
import { CommandPalette } from "./components/CommandPalette";
import { GenericScreen } from "./components/GenericScreen";
import { Bell, Search, Sparkles } from "lucide-react";
import { ClientLogin } from "./components/ClientLogin";
import { ResetPassword } from "./components/ResetPassword";
import {
  clearClientSession,
  getClientNotificationUnreadCount,
  getClientNotifications,
  getClientProfile,
  isClientLoggedIn,
  markClientNotificationRead,
  type ClientNotification,
  type ClientProfile,
} from "./lib/clientApi";

const screenComponents: Record<
  string,
  React.ComponentType<{ darkMode: boolean; onNavigate?: (s: string) => void }>
> = {
  dashboard: ({ darkMode, onNavigate }) => (
    <Dashboard darkMode={darkMode} onNavigate={onNavigate!} />
  ),
  "ai-studio": ({ darkMode }) => <AIStudio darkMode={darkMode} />,
  media: ({ darkMode }) => <MediaLibrary darkMode={darkMode} />,
  analytics: ({ darkMode }) => <Analytics darkMode={darkMode} />,
  crm: ({ darkMode }) => <CRM darkMode={darkMode} />,
  properties: ({ darkMode }) => <Properties darkMode={darkMode} />,
  scheduler: ({ darkMode }) => <Scheduler darkMode={darkMode} />,
  reports: ({ darkMode }) => <Reports darkMode={darkMode} />,
  team: ({ darkMode }) => <TeamManagement darkMode={darkMode} />,
  billing: ({ darkMode }) => <Billing darkMode={darkMode} />,
  support: ({ darkMode }) => <Support darkMode={darkMode} />,
  "ai-manager": ({ darkMode }) => <AIManager darkMode={darkMode} />,
  automation: ({ darkMode, onNavigate }) => (
    <AutomationCenter darkMode={darkMode} onNavigate={onNavigate} />
  ),
  integrations: ({ darkMode, onNavigate }) => (
    <AutomationCenter darkMode={darkMode} onNavigate={onNavigate} />
  ),
  settings: ({ darkMode }) => <Settings darkMode={darkMode} />,
};

const screenTitles: Record<string, string> = {
  dashboard: "Dashboard",
  media: "Media Library",
  "ai-studio": "AI Studio",
  scheduler: "Scheduler",
  analytics: "Analytics",
  crm: "CRM",
  properties: "Properties",
  reports: "Reports",
  team: "Team",
  automation: "Automation",
  billing: "Billing",
  support: "Support",
  settings: "Settings",
  "ai-manager": "AI Manager",
};

export default function App() {
  const [activeScreen, setActiveScreen] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(true);
  const [clientLoggedIn, setClientLoggedIn] = useState(isClientLoggedIn());
  const [passwordResetToken, setPasswordResetToken] = useState(() =>
    new URLSearchParams(window.location.search).get("token"),
  );
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(
    null,
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!clientLoggedIn) {
      setClientProfile(null);
      return;
    }

    getClientProfile()
      .then(setClientProfile)
      .catch(() => {
        clearClientSession();
        setClientLoggedIn(false);
        setClientProfile(null);
      });
  }, [clientLoggedIn]);

  function handleBackToLoginFromReset() {
    setPasswordResetToken(null);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    if (!clientLoggedIn) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let alive = true;

    async function loadNotifications() {
      try {
        setNotificationsLoading(true);

        const [items, count] = await Promise.all([
          getClientNotifications(),
          getClientNotificationUnreadCount(),
        ]);

        if (!alive) return;

        setNotifications(items);
        setUnreadCount(count.unread_count);
      } catch (error) {
        console.error("Failed to load client notifications", error);
      } finally {
        if (alive) {
          setNotificationsLoading(false);
        }
      }
    }

    loadNotifications();

    const intervalId = window.setInterval(loadNotifications, 30000);

    return () => {
      alive = false;
      window.clearInterval(intervalId);
    };
  }, [clientLoggedIn]);

  if (passwordResetToken && !clientLoggedIn) {
    return (
      <ResetPassword
        darkMode={darkMode}
        token={passwordResetToken}
        onBackToLogin={handleBackToLoginFromReset}
      />
    );
  }

  if (!clientLoggedIn) {
    return (
      <ClientLogin
        darkMode={darkMode}
        onLoginSuccess={() => setClientLoggedIn(true)}
      />
    );
  }

  const ScreenComponent = screenComponents[activeScreen];
  const handleNotificationClick = async (notification: ClientNotification) => {
    try {
      if (!notification.is_read) {
        await markClientNotificationRead(notification.id);

        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item,
          ),
        );

        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      if (notification.link === "/support") {
        setActiveScreen("support");
      }

      setNotifOpen(false);
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  return (
    <div
      className="fixed inset-0 flex overflow-hidden"
      style={{
        background: darkMode ? "#02020f" : "#f8fafc",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Animated 3D background */}
      <Background3D darkMode={darkMode} />

      {/* 3D floating orbs — dark mode only */}
      {darkMode && (
        <div
          className="fixed inset-0 pointer-events-none overflow-hidden"
          style={{ zIndex: 0 }}
        >
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 600,
              height: 600,
              top: "-20%",
              left: "-10%",
              background:
                "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 500,
              height: 500,
              bottom: "-10%",
              right: "-5%",
              background:
                "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 400,
              height: 400,
              top: "30%",
              right: "20%",
              background:
                "radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4,
            }}
          />
        </div>
      )}

      {/* Sidebar */}
      <div className="relative z-10 h-full">
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={setActiveScreen}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(!darkMode)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onCommandPalette={() => setCommandOpen(true)}
          profile={clientProfile}
          onLogout={() => {
            clearClientSession();
            setClientProfile(null);
            setClientLoggedIn(false);
          }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top bar */}
        <div
          className="flex items-center gap-4 px-5 py-3 border-b flex-shrink-0"
          style={{
            background: darkMode
              ? "rgba(5,5,20,0.7)"
              : "rgba(255,255,255,0.85)",
            borderColor: darkMode
              ? "rgba(99,102,241,0.1)"
              : "rgba(15,23,42,0.06)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <span
              className="text-xs"
              style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}
            >
              {clientProfile?.business_name || "RS Real Estate"}
            </span>
            <span style={{ color: darkMode ? "#2d3748" : "#cbd5e1" }}>/</span>
            <span
              className="text-sm font-medium"
              style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
            >
              {(screenTitles[activeScreen] || screenTitles.media || "Media Library") || activeScreen}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all hover:border-primary/20"
              style={{
                background: darkMode
                  ? "rgba(99,102,241,0.06)"
                  : "rgba(99,102,241,0.03)",
                borderColor: darkMode
                  ? "rgba(99,102,241,0.1)"
                  : "rgba(99,102,241,0.06)",
                color: darkMode ? "#4a5568" : "#94a3b8",
              }}
            >
              <Search size={12} />
              <span>Search</span>
              <kbd
                className="px-1.5 py-0.5 rounded text-xs"
                style={{
                  background: darkMode
                    ? "rgba(99,102,241,0.1)"
                    : "rgba(99,102,241,0.06)",
                  color: darkMode ? "#818cf8" : "#6366f1",
                }}
              >
                ⌘K
              </kbd>
            </button>

            {/* AI create button */}
            <motion.button
              onClick={() => setActiveScreen("ai-studio")}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "#ffffff",
                boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles size={11} />
              Create with AI
            </motion.button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2 rounded-xl transition-all hover:bg-primary/5"
                style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full text-[10px] font-semibold flex items-center justify-center"
                    style={{
                      background: "#ef4444",
                      color: "#ffffff",
                      boxShadow: "0 0 8px rgba(239,68,68,0.65)",
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setNotifOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-80 rounded-2xl border z-30 overflow-hidden"
                      style={{
                        background: darkMode
                          ? "rgba(10,10,30,0.97)"
                          : "#ffffff",
                        borderColor: darkMode
                          ? "rgba(99,102,241,0.2)"
                          : "rgba(15,23,42,0.08)",
                        boxShadow: darkMode
                          ? "0 16px 48px rgba(0,0,0,0.5)"
                          : "0 16px 48px rgba(0,0,0,0.12)",
                        backdropFilter: "blur(24px)",
                      }}
                    >
                      <div
                        className="px-4 py-3 border-b"
                        style={{
                          borderColor: darkMode
                            ? "rgba(99,102,241,0.1)"
                            : "rgba(15,23,42,0.06)",
                        }}
                      >
                        <p
                          className="text-sm font-semibold"
                          style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                        >
                          Notifications
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}
                        >
                          {notificationsLoading
                            ? "Loading..."
                            : `${unreadCount} unread`}
                        </p>
                      </div>
                      <div
                        className="divide-y"
                        style={{
                          borderColor: darkMode
                            ? "rgba(99,102,241,0.06)"
                            : "rgba(15,23,42,0.04)",
                        }}
                      >
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center">
                            <p
                              className="text-xs"
                              style={{
                                color: darkMode ? "#64748b" : "#94a3b8",
                              }}
                            >
                              No notifications yet
                            </p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() =>
                                handleNotificationClick(notification)
                              }
                              className="w-full flex gap-3 px-4 py-3 text-left transition-all hover:bg-primary/5 cursor-pointer"
                            >
                              <div
                                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                                style={{
                                  background: notification.is_read
                                    ? "#64748b"
                                    : "#ef4444",
                                  boxShadow: notification.is_read
                                    ? "none"
                                    : "0 0 6px rgba(239,68,68,0.8)",
                                }}
                              />
                              <div className="min-w-0">
                                <p
                                  className="text-xs font-medium"
                                  style={{
                                    color: darkMode ? "#e2e8f0" : "#0f172a",
                                  }}
                                >
                                  {notification.title}
                                </p>
                                <p
                                  className="text-xs mt-1 line-clamp-2"
                                  style={{
                                    color: darkMode ? "#94a3b8" : "#475569",
                                  }}
                                >
                                  {notification.message}
                                </p>
                                <p
                                  className="text-[11px] mt-1"
                                  style={{
                                    color: darkMode ? "#4a5568" : "#94a3b8",
                                  }}
                                >
                                  {notification.is_read ? "Read" : "Unread"}
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Screen content */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
            >
              {ScreenComponent ? (
                <ScreenComponent
                  darkMode={darkMode}
                  onNavigate={setActiveScreen}
                />
              ) : (
                <GenericScreen screen={activeScreen} darkMode={darkMode} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigate={(screen) => {
          setActiveScreen(screen);
          setCommandOpen(false);
        }}
        darkMode={darkMode}
      />
    </div>
  );
}

