import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { AIStudio } from "./components/AIStudio";
import { Analytics } from "./components/Analytics";
import { CRM } from "./components/CRM";
import { Scheduler } from "./components/Scheduler";
import { Reports } from "./components/Reports";
import { AIManager } from "./components/AIManager";
import { Background3D } from "./components/Background3D";
import { CommandPalette } from "./components/CommandPalette";
import { GenericScreen } from "./components/GenericScreen";
import { Bell, Search, Sparkles } from "lucide-react";

const screenComponents: Record<string, React.ComponentType<{ darkMode: boolean; onNavigate?: (s: string) => void }>> = {
  dashboard: ({ darkMode, onNavigate }) => <Dashboard darkMode={darkMode} onNavigate={onNavigate!} />,
  "ai-studio": ({ darkMode }) => <AIStudio darkMode={darkMode} />,
  analytics: ({ darkMode }) => <Analytics darkMode={darkMode} />,
  crm: ({ darkMode }) => <CRM darkMode={darkMode} />,
  scheduler: ({ darkMode }) => <Scheduler darkMode={darkMode} />,
  reports: ({ darkMode }) => <Reports darkMode={darkMode} />,
  "ai-manager": ({ darkMode }) => <AIManager darkMode={darkMode} />,
};

const screenTitles: Record<string, string> = {
  dashboard: "Dashboard",
  content: "Content",
  media: "Media Library",
  "ai-studio": "AI Studio",
  scheduler: "Scheduler",
  analytics: "Analytics",
  crm: "CRM",
  reports: "Reports",
  team: "Team",
  automation: "Automation",
  integrations: "Integrations",
  billing: "Billing",
  settings: "Settings",
  "ai-manager": "AI Manager",
};

export default function App() {
  const [activeScreen, setActiveScreen] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

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

  const ScreenComponent = screenComponents[activeScreen];

  const notifications = [
    { text: "New hot lead: Sarah Chen opened your proposal", time: "2 min ago", color: "#6366f1" },
    { text: "Post scheduled for 3:00 PM reached 10K impressions", time: "1 hr ago", color: "#10b981" },
    { text: "AI analysis complete: 3 optimization suggestions", time: "3 hr ago", color: "#8b5cf6" },
  ];

  return (
    <div
      className="fixed inset-0 flex overflow-hidden"
      style={{
        background: darkMode
          ? "#02020f"
          : "#f8fafc",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Animated 3D background */}
      <Background3D darkMode={darkMode} />

      {/* 3D floating orbs — dark mode only */}
      {darkMode && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 600,
              height: 600,
              top: "-20%",
              left: "-10%",
              background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
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
              background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 400,
              height: 400,
              top: "30%",
              right: "20%",
              background: "radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          />
        </div>
      )}

      {/* Sidebar */}
      <div className="relative z-10 h-full">
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={setActiveScreen}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(d => !d)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(c => !c)}
          onCommandPalette={() => setCommandOpen(true)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top bar */}
        <div
          className="flex items-center gap-4 px-5 py-3 border-b flex-shrink-0"
          style={{
            background: darkMode ? "rgba(5,5,20,0.7)" : "rgba(255,255,255,0.85)",
            borderColor: darkMode ? "rgba(99,102,241,0.1)" : "rgba(15,23,42,0.06)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}>AI Growth OS</span>
            <span style={{ color: darkMode ? "#2d3748" : "#cbd5e1" }}>/</span>
            <span className="text-sm font-medium" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
              {screenTitles[activeScreen] || activeScreen}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all hover:border-primary/20"
              style={{
                background: darkMode ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.03)",
                borderColor: darkMode ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.06)",
                color: darkMode ? "#4a5568" : "#94a3b8",
              }}
            >
              <Search size={12} />
              <span>Search</span>
              <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: darkMode ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.06)", color: darkMode ? "#818cf8" : "#6366f1" }}>⌘K</kbd>
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
                onClick={() => setNotifOpen(o => !o)}
                className="relative p-2 rounded-xl transition-all hover:bg-primary/5"
                style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}
              >
                <Bell size={16} />
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#ef4444", boxShadow: "0 0 6px #ef4444" }} />
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-80 rounded-2xl border z-30 overflow-hidden"
                      style={{
                        background: darkMode ? "rgba(10,10,30,0.97)" : "#ffffff",
                        borderColor: darkMode ? "rgba(99,102,241,0.2)" : "rgba(15,23,42,0.08)",
                        boxShadow: darkMode ? "0 16px 48px rgba(0,0,0,0.5)" : "0 16px 48px rgba(0,0,0,0.12)",
                        backdropFilter: "blur(24px)",
                      }}
                    >
                      <div className="px-4 py-3 border-b" style={{ borderColor: darkMode ? "rgba(99,102,241,0.1)" : "rgba(15,23,42,0.06)" }}>
                        <p className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>Notifications</p>
                        <p className="text-xs" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>3 unread</p>
                      </div>
                      <div className="divide-y" style={{ borderColor: darkMode ? "rgba(99,102,241,0.06)" : "rgba(15,23,42,0.04)" }}>
                        {notifications.map((n, i) => (
                          <div key={i} className="flex gap-3 px-4 py-3 transition-all hover:bg-primary/5 cursor-pointer">
                            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.color, boxShadow: `0 0 6px ${n.color}` }} />
                            <div>
                              <p className="text-xs" style={{ color: darkMode ? "#94a3b8" : "#475569" }}>{n.text}</p>
                              <p className="text-xs mt-0.5" style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}>{n.time}</p>
                            </div>
                          </div>
                        ))}
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
                <ScreenComponent darkMode={darkMode} onNavigate={setActiveScreen} />
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
        onNavigate={(screen) => { setActiveScreen(screen); setCommandOpen(false); }}
        darkMode={darkMode}
      />
    </div>
  );
}
