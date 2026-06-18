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
import { Bell, CheckCircle2, Inbox, RefreshCw, Search, Sparkles } from "lucide-react";
import { ClientLogin } from "./components/ClientLogin";
import { ResetPassword } from "./components/ResetPassword";
import {
  CLIENT_SESSION_EXPIRED_EVENT,
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
    const handleClientSessionExpired = () => {
      setClientProfile(null);
      setNotifications([]);
      setUnreadCount(0);
      setNotifOpen(false);
      setClientLoggedIn(false);
    };

    window.addEventListener(
      CLIENT_SESSION_EXPIRED_EVENT,
      handleClientSessionExpired,
    );

    return () => {
      window.removeEventListener(
        CLIENT_SESSION_EXPIRED_EVENT,
        handleClientSessionExpired,
      );
    };
  }, []);

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
  async function loadClientNotifications() {
    if (!clientLoggedIn) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setNotificationsLoading(true);

      const [items, count] = await Promise.all([
        getClientNotifications(),
        getClientNotificationUnreadCount(),
      ]);

      setNotifications(items);
      setUnreadCount(count.unread_count);
    } catch (error) {
      console.error("Failed to load client notifications", error);
    } finally {
      setNotificationsLoading(false);
    }
  }

  useEffect(() => {
    if (!clientLoggedIn) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    loadClientNotifications();

    const intervalId = window.setInterval(loadClientNotifications, 30000);

    return () => {
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

      await loadClientNotifications();

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
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                className="relative h-9 w-9 rounded-xl border transition-all flex items-center justify-center"
                style={{
                  color: unreadCount > 0 ? "#ffffff" : darkMode ? "#cbd5e1" : "#475569",
                  background: unreadCount > 0
                    ? "linear-gradient(135deg, #ef4444 0%, #f97316 100%)"
                    : darkMode
                      ? "rgba(99,102,241,0.08)"
                      : "rgba(15,23,42,0.04)",
                  borderColor: unreadCount > 0
                    ? "rgba(248,113,113,0.45)"
                    : darkMode
                      ? "rgba(99,102,241,0.14)"
                      : "rgba(15,23,42,0.08)",
                  boxShadow: unreadCount > 0
                    ? "0 0 18px rgba(239,68,68,0.45)"
                    : "none",
                }}
                aria-label={`Open notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
                aria-expanded={notifOpen}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{
                      background: "#ef4444",
                      color: "#ffffff",
                      border: darkMode
                        ? "2px solid #05051a"
                        : "2px solid #ffffff",
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[80]"
                      onClick={() => setNotifOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -8 }}
                      transition={{ duration: 0.16 }}
                      className="fixed right-4 top-[70px] w-[min(420px,calc(100vw-32px))] rounded-3xl border z-[90] overflow-hidden"
                      style={{
                        background: darkMode
                          ? "linear-gradient(180deg, rgba(10,10,30,0.98) 0%, rgba(5,5,18,0.98) 100%)"
                          : "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                        borderColor: darkMode
                          ? "rgba(99,102,241,0.26)"
                          : "rgba(15,23,42,0.08)",
                        boxShadow: darkMode
                          ? "0 28px 90px rgba(0,0,0,0.68), 0 0 0 1px rgba(255,255,255,0.03)"
                          : "0 28px 90px rgba(15,23,42,0.16)",
                        backdropFilter: "blur(28px)",
                      }}
                    >
                      <div
                        className="px-5 py-4 border-b"
                        style={{
                          borderColor: darkMode
                            ? "rgba(99,102,241,0.12)"
                            : "rgba(15,23,42,0.06)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p
                              className="text-sm font-bold"
                              style={{ color: darkMode ? "#f8fafc" : "#0f172a" }}
                            >
                              Notifications
                            </p>
                            <p
                              className="text-xs mt-0.5"
                              style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                            >
                              {notificationsLoading
                                ? "Refreshing latest updates..."
                                : unreadCount > 0
                                  ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                                  : "All caught up"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={loadClientNotifications}
                            disabled={notificationsLoading}
                            className="h-8 w-8 rounded-xl border flex items-center justify-center transition-all disabled:opacity-60"
                            style={{
                              color: darkMode ? "#cbd5e1" : "#475569",
                              background: darkMode
                                ? "rgba(99,102,241,0.08)"
                                : "rgba(15,23,42,0.04)",
                              borderColor: darkMode
                                ? "rgba(99,102,241,0.14)"
                                : "rgba(15,23,42,0.08)",
                            }}
                            title="Refresh notifications"
                            aria-label="Refresh notifications"
                          >
                            <RefreshCw
                              size={14}
                              className={notificationsLoading ? "animate-spin" : ""}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="max-h-[420px] overflow-y-auto p-3">
                        {notificationsLoading && notifications.length === 0 ? (
                          <div className="px-4 py-10 text-center">
                            <RefreshCw
                              size={22}
                              className="mx-auto mb-3 animate-spin"
                              style={{ color: darkMode ? "#818cf8" : "#6366f1" }}
                            />
                            <p
                              className="text-sm font-medium"
                              style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                            >
                              Loading notifications
                            </p>
                            <p
                              className="text-xs mt-1"
                              style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                            >
                              Checking latest support and account updates...
                            </p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-10 text-center">
                            <div
                              className="mx-auto mb-3 h-12 w-12 rounded-2xl flex items-center justify-center"
                              style={{
                                background: darkMode
                                  ? "rgba(99,102,241,0.10)"
                                  : "rgba(99,102,241,0.08)",
                                color: darkMode ? "#a5b4fc" : "#6366f1",
                              }}
                            >
                              <Inbox size={22} />
                            </div>
                            <p
                              className="text-sm font-semibold"
                              style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                            >
                              No notifications yet
                            </p>
                            <p
                              className="text-xs mt-1 max-w-[260px] mx-auto"
                              style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                            >
                              Support replies, billing alerts, and important workspace updates will appear here.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {notifications.map((notification) => (
                              <button
                                key={notification.id}
                                type="button"
                                onClick={() =>
                                  handleNotificationClick(notification)
                                }
                                className="w-full text-left rounded-2xl border p-3 transition-all hover:-translate-y-0.5"
                                style={{
                                  background: notification.is_read
                                    ? darkMode
                                      ? "rgba(15,23,42,0.46)"
                                      : "rgba(248,250,252,0.9)"
                                    : darkMode
                                      ? "linear-gradient(135deg, rgba(99,102,241,0.16), rgba(14,165,233,0.08))"
                                      : "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(14,165,233,0.05))",
                                  borderColor: notification.is_read
                                    ? darkMode
                                      ? "rgba(148,163,184,0.10)"
                                      : "rgba(15,23,42,0.06)"
                                    : darkMode
                                      ? "rgba(129,140,248,0.28)"
                                      : "rgba(99,102,241,0.16)",
                                  boxShadow: notification.is_read
                                    ? "none"
                                    : "0 12px 34px rgba(99,102,241,0.12)",
                                }}
                              >
                                <div className="flex gap-3">
                                  <div
                                    className="mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{
                                      background: notification.is_read
                                        ? darkMode
                                          ? "rgba(148,163,184,0.10)"
                                          : "rgba(15,23,42,0.05)"
                                        : "rgba(99,102,241,0.16)",
                                      color: notification.is_read
                                        ? darkMode
                                          ? "#94a3b8"
                                          : "#64748b"
                                        : "#818cf8",
                                    }}
                                  >
                                    {notification.is_read ? (
                                      <CheckCircle2 size={16} />
                                    ) : (
                                      <Bell size={16} />
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <p
                                        className="text-sm font-semibold leading-snug break-words"
                                        style={{
                                          color: darkMode ? "#f8fafc" : "#0f172a",
                                        }}
                                      >
                                        {notification.title || "Workspace update"}
                                      </p>

                                      {!notification.is_read && (
                                        <span
                                          className="mt-1 h-2 w-2 rounded-full flex-shrink-0"
                                          style={{
                                            background: "#ef4444",
                                            boxShadow:
                                              "0 0 8px rgba(239,68,68,0.75)",
                                          }}
                                        />
                                      )}
                                    </div>

                                    <p
                                      className="text-xs mt-1.5 leading-relaxed break-words"
                                      style={{
                                        color: darkMode ? "#cbd5e1" : "#475569",
                                      }}
                                    >
                                      {notification.message || "Open this update for more details."}
                                    </p>

                                    <div className="flex items-center justify-between gap-2 mt-3">
                                      <span
                                        className="text-[11px] font-medium px-2 py-1 rounded-full"
                                        style={{
                                          color: notification.is_read
                                            ? darkMode
                                              ? "#94a3b8"
                                              : "#64748b"
                                            : "#ffffff",
                                          background: notification.is_read
                                            ? darkMode
                                              ? "rgba(148,163,184,0.10)"
                                              : "rgba(15,23,42,0.06)"
                                            : "rgba(99,102,241,0.95)",
                                        }}
                                      >
                                        {notification.is_read ? "Read" : "Unread"}
                                      </span>

                                      {notification.link && (
                                        <span
                                          className="text-[11px] font-semibold"
                                          style={{
                                            color: darkMode ? "#a5b4fc" : "#6366f1",
                                          }}
                                        >
                                          Open
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
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

