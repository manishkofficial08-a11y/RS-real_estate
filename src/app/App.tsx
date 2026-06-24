import "./styles/sidebar.css";
import { Properties } from "./components/Properties";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
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
  "ai-studio": ({ darkMode, onNavigate }) => (
    <AIStudio darkMode={darkMode} onNavigate={onNavigate} />
  ),
  media: ({ darkMode, onNavigate }) => (
    <MediaLibrary darkMode={darkMode} onNavigate={onNavigate} />
  ),
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
  dashboard: "Overview",
  media: "Media Library",
  "ai-studio": "AI Content Studio",
  scheduler: "Campaign Scheduler",
  analytics: "Analytics",
  crm: "Leads",
  properties: "Properties",
  reports: "Business Reports",
  team: "Team Access",
  automation: "Social Accounts",
  billing: "Billing",
  support: "Support",
  settings: "Settings",
  "ai-manager": "AI Assistant",
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
    if (!notifOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotifOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [notifOpen]);

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


  useEffect(() => {
    if (!notifOpen) return;

    const handleNotificationEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotifOpen(false);
      }
    };

    window.addEventListener("keydown", handleNotificationEscape);
    return () => window.removeEventListener("keydown", handleNotificationEscape);
  }, [notifOpen]);

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
        background: darkMode ? "#07111F" : "#f8fafc",
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
                "radial-gradient(circle, rgba(29,78,216,0.08) 0%, transparent 70%)",
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
                "radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)",
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
              ? "rgba(29,78,216,0.1)"
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
              Ridhi Sidhi Real Estate
            </span>
            <span style={{ color: darkMode ? "#2d3748" : "#cbd5e1" }}>/</span>
            <span
              className="text-sm font-medium"
              style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
            >
              {screenTitles[activeScreen] ||
                screenTitles.media ||
                "Media Library" ||
                activeScreen}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all hover:border-primary/20"
              style={{
                background: darkMode
                  ? "rgba(29,78,216,0.06)"
                  : "rgba(29,78,216,0.03)",
                borderColor: darkMode
                  ? "rgba(29,78,216,0.1)"
                  : "rgba(29,78,216,0.06)",
                color: darkMode ? "#94A3B8" : "#94a3b8",
              }}
            >
              <Search size={12} />
              <span>Search</span>
              <kbd
                className="px-1.5 py-0.5 rounded text-xs"
                style={{
                  background: darkMode
                    ? "rgba(29,78,216,0.1)"
                    : "rgba(29,78,216,0.06)",
                  color: darkMode ? "#60A5FA" : "#1D4ED8",
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
                background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
                color: "#ffffff",
                boxShadow: "0 2px 8px rgba(29,78,216,0.3)",
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
                onClick={(event) => {
                  event.stopPropagation();
                  setNotifOpen((open) => !open);
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-2xl border transition-all hover:-translate-y-0.5"
                style={{
                  background: notifOpen
                    ? darkMode
                      ? "#102A5C"
                      : "#EAF2FF"
                    : darkMode
                      ? "#0F172A"
                      : "#FFFFFF",
                  borderColor: notifOpen
                    ? "#60A5FA"
                    : darkMode
                      ? "rgba(203,213,225,0.18)"
                      : "rgba(15,23,42,0.12)",
                  color: notifOpen
                    ? darkMode
                      ? "#93C5FD"
                      : "#1D4ED8"
                    : darkMode
                      ? "#CBD5E1"
                      : "#475569",
                  boxShadow: notifOpen
                    ? "0 12px 30px rgba(29,78,216,0.28)"
                    : "none",
                }}
                aria-label={
                  unreadCount > 0
                    ? `${unreadCount} unread business updates`
                    : "Open business updates"
                }
                aria-expanded={notifOpen}
                title="Business updates"
              >
                <Bell size={17} />

                {unreadCount > 0 && (
                  <span
                    className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                    style={{
                      background: "#DC2626",
                      color: "#FFFFFF",
                      boxShadow: darkMode
                        ? "0 0 0 3px #07111F"
                        : "0 0 0 3px #FFFFFF",
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
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

      {/* Business updates portal */}
      {notifOpen &&
        createPortal(
          <>
            <motion.div
              className="fixed inset-0"
              style={{
                zIndex: 2147483646,
                background: "rgba(2,6,23,0.28)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotifOpen(false)}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Business updates"
              initial={{ opacity: 0, scale: 0.96, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -12 }}
              transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
              className="fixed right-5 top-[72px] w-[420px] max-w-[calc(100vw-24px)] overflow-hidden rounded-3xl border"
              style={{
                zIndex: 2147483647,
                background: darkMode ? "#08111F" : "#FFFFFF",
                borderColor: darkMode
                  ? "rgba(96,165,250,0.38)"
                  : "rgba(15,23,42,0.12)",
                boxShadow: darkMode
                  ? "0 30px 100px rgba(0,0,0,0.92)"
                  : "0 30px 90px rgba(15,23,42,0.24)",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className="flex items-start justify-between gap-4 border-b px-5 py-4"
                style={{
                  background: darkMode ? "#0F172A" : "#F8FAFC",
                  borderColor: darkMode
                    ? "rgba(148,163,184,0.16)"
                    : "rgba(15,23,42,0.08)",
                }}
              >
                <div>
                  <p
                    className="text-sm font-bold"
                    style={{ color: darkMode ? "#F8FAFC" : "#0F172A" }}
                  >
                    Business Updates
                  </p>

                  <p
                    className="mt-1 text-xs"
                    style={{ color: darkMode ? "#CBD5E1" : "#64748B" }}
                  >
                    {notificationsLoading
                      ? "Checking latest updates..."
                      : unreadCount > 0
                        ? `${unreadCount} update${unreadCount > 1 ? "s" : ""} need attention`
                        : "No urgent updates right now"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setNotifOpen(false)}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80"
                  style={{
                    color: darkMode ? "#CBD5E1" : "#475569",
                    background: darkMode ? "#172033" : "#E2E8F0",
                  }}
                >
                  Close
                </button>
              </div>

              {notifications.length === 0 ? (
                <div
                  className="px-5 py-7 text-center"
                  style={{ background: darkMode ? "#08111F" : "#FFFFFF" }}
                >
                  <div
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{
                      background: darkMode ? "#102A5C" : "#EAF2FF",
                      color: darkMode ? "#93C5FD" : "#1D4ED8",
                    }}
                  >
                    <Bell size={20} />
                  </div>

                  <p
                    className="mt-4 text-sm font-bold"
                    style={{ color: darkMode ? "#F8FAFC" : "#0F172A" }}
                  >
                    No business updates yet
                  </p>

                  <p
                    className="mx-auto mt-2 max-w-[300px] text-xs leading-relaxed"
                    style={{ color: darkMode ? "#CBD5E1" : "#64748B" }}
                  >
                    Lead alerts, support replies, campaign activity, and important portal updates will appear here.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveScreen("support");
                      setNotifOpen(false);
                    }}
                    className="mt-5 rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:opacity-90"
                    style={{
                      background:
                        "linear-gradient(135deg, #1D4ED8, #2563EB)",
                      color: "#FFFFFF",
                      boxShadow: "0 10px 24px rgba(29,78,216,0.28)",
                    }}
                  >
                    Open Support Center
                  </button>
                </div>
              ) : (
                <div
                  className="max-h-[430px] overflow-y-auto p-3"
                  style={{ background: darkMode ? "#08111F" : "#FFFFFF" }}
                >
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className="flex w-full gap-3 rounded-2xl border px-4 py-3 text-left transition-all hover:-translate-y-0.5"
                        style={{
                          background: darkMode ? "#0F172A" : "#F8FAFC",
                          borderColor: notification.is_read
                            ? darkMode
                              ? "rgba(148,163,184,0.16)"
                              : "rgba(15,23,42,0.08)"
                            : "rgba(220,38,38,0.48)",
                        }}
                      >
                        <span
                          className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                          style={{
                            background: notification.is_read
                              ? "#64748B"
                              : "#DC2626",
                            boxShadow: notification.is_read
                              ? "none"
                              : "0 0 10px rgba(220,38,38,0.85)",
                          }}
                        />

                        <span className="min-w-0 flex-1">
                          <span
                            className="block text-sm font-bold"
                            style={{
                              color: darkMode ? "#F8FAFC" : "#0F172A",
                            }}
                          >
                            {notification.title}
                          </span>

                          <span
                            className="mt-1 block text-xs leading-relaxed"
                            style={{
                              color: darkMode ? "#CBD5E1" : "#475569",
                            }}
                          >
                            {notification.message}
                          </span>

                          <span
                            className="mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold"
                            style={{
                              background: notification.is_read
                                ? darkMode
                                  ? "#172033"
                                  : "#E2E8F0"
                                : darkMode
                                  ? "#102A5C"
                                  : "#EAF2FF",
                              color: notification.is_read
                                ? darkMode
                                  ? "#94A3B8"
                                  : "#64748B"
                                : darkMode
                                  ? "#93C5FD"
                                  : "#1D4ED8",
                            }}
                          >
                            {notification.is_read ? "Read" : "New update"}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </>,
          document.body,
        )}
      {/* End business updates portal */}


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
