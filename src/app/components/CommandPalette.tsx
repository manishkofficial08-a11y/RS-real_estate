import { useState, useEffect, useRef } from "react";
import { Search, LayoutDashboard, Sparkles, BarChart3, Users2, Calendar, FileBarChart, Bot, Settings, ArrowRight, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const commands = [
  { id: "dashboard", icon: LayoutDashboard, label: "Go to Dashboard", category: "Navigate", shortcut: "G D" },
  { id: "ai-studio", icon: Sparkles, label: "Open AI Studio", category: "Navigate", shortcut: "G A" },
  { id: "analytics", icon: BarChart3, label: "View Analytics", category: "Navigate", shortcut: "G N" },
  { id: "crm", icon: Users2, label: "Open CRM", category: "Navigate", shortcut: "G C" },
  { id: "scheduler", icon: Calendar, label: "View Scheduler", category: "Navigate", shortcut: "G S" },
  { id: "reports", icon: FileBarChart, label: "Open Reports", category: "Navigate", shortcut: "G R" },
  { id: "team", icon: Users2, label: "Manage Team", category: "Navigate", shortcut: "G T" },
  { id: "billing", icon: CreditCard, label: "Open Billing", category: "Navigate", shortcut: "G B" },
  { id: "ai-manager", icon: Bot, label: "Chat with AI Manager", category: "Navigate", shortcut: "G M" },
  { id: "settings", icon: Settings, label: "Settings", category: "Navigate", shortcut: "G ," },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  darkMode: boolean;
}

export function CommandPalette({ open, onClose, onNavigate, darkMode }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = commands.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setSelected(s => Math.min(s + 1, filtered.length - 1));
      if (e.key === "ArrowUp") setSelected(s => Math.max(s - 1, 0));
      if (e.key === "Enter" && filtered[selected]) {
        onNavigate(filtered[selected].id);
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, selected, onClose, onNavigate]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: darkMode ? "rgba(2,2,15,0.8)" : "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-xl rounded-2xl border overflow-hidden pointer-events-auto"
              style={{
                background: darkMode ? "rgba(15,23,42,0.97)" : "#ffffff",
                borderColor: darkMode ? "rgba(29,78,216,0.25)" : "rgba(15,23,42,0.1)",
                boxShadow: darkMode
                  ? "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(29,78,216,0.1)"
                  : "0 24px 80px rgba(0,0,0,0.15)",
                backdropFilter: "blur(24px)",
              }}
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.06)" }}>
                <Search size={16} style={{ color: darkMode ? "#94A3B8" : "#94a3b8", flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelected(0); }}
                  placeholder="Search commands, pages, actions..."
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                />
                <kbd className="text-xs px-2 py-1 rounded" style={{ background: darkMode ? "rgba(29,78,216,0.1)" : "rgba(29,78,216,0.06)", color: darkMode ? "#60A5FA" : "#1D4ED8" }}>
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="py-2 max-h-80 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>No commands found for "{query}"</p>
                  </div>
                ) : (
                  <div className="px-2">
                    <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}>
                      Navigate
                    </p>
                    {filtered.map((cmd, i) => (
                      <button
                        key={cmd.id}
                        onClick={() => { onNavigate(cmd.id); onClose(); }}
                        onMouseEnter={() => setSelected(i)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                        style={{
                          background: selected === i
                            ? darkMode ? "rgba(29,78,216,0.15)" : "rgba(29,78,216,0.08)"
                            : "transparent",
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: selected === i ? "rgba(29,78,216,0.2)" : "rgba(29,78,216,0.08)" }}
                        >
                          <cmd.icon size={13} style={{ color: darkMode ? "#60A5FA" : "#1D4ED8" }} />
                        </div>
                        <span className="flex-1 text-sm" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>{cmd.label}</span>
                        <div className="flex items-center gap-1">
                          {cmd.shortcut.split(" ").map((key, ki) => (
                            <kbd key={ki} className="text-xs px-1.5 py-0.5 rounded" style={{ background: darkMode ? "rgba(29,78,216,0.1)" : "rgba(15,23,42,0.06)", color: darkMode ? "#94A3B8" : "#94a3b8" }}>
                              {key}
                            </kbd>
                          ))}
                        </div>
                        {selected === i && <ArrowRight size={12} style={{ color: "#1D4ED8" }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t flex items-center gap-4" style={{ borderColor: darkMode ? "rgba(29,78,216,0.08)" : "rgba(15,23,42,0.04)" }}>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}>
                  <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: darkMode ? "rgba(29,78,216,0.08)" : "rgba(15,23,42,0.04)" }}>↑↓</kbd>
                  <span>navigate</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}>
                  <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: darkMode ? "rgba(29,78,216,0.08)" : "rgba(15,23,42,0.04)" }}>↵</kbd>
                  <span>open</span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
