import {
  Image, Zap, Puzzle, CreditCard, Settings, UserSquare2,
  Plus, Upload, Link, Slack, Figma, Github, Chrome,
  Check, ArrowRight, Shield, Bell, Palette, Globe,
  Key, Users, Lock, Mail, Smartphone, Monitor, CreditCardIcon
} from "lucide-react";
import { motion } from "motion/react";

interface GenericScreenProps {
  screen: string;
  darkMode: boolean;
}

const cardBase = (darkMode: boolean) => ({
  background: darkMode ? "rgba(13,13,40,0.8)" : "#ffffff",
  borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
});

function MediaLibrary({ darkMode }: { darkMode: boolean }) {
  const photos = [
    { id: 1, name: "Product hero shot", size: "2.4 MB", type: "image" },
    { id: 2, name: "Team photo Q1", size: "3.1 MB", type: "image" },
    { id: 3, name: "Launch video 2026", size: "124 MB", type: "video" },
    { id: 4, name: "Brand logo pack", size: "0.8 MB", type: "design" },
    { id: 5, name: "AI Growth thumbnail", size: "1.2 MB", type: "image" },
    { id: 6, name: "Customer story B-roll", size: "89 MB", type: "video" },
  ];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: darkMode ? "#e2e8f0" : "#0f172a" }}>Media Library</h1>
            <p className="text-sm mt-0.5" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>284 files Ã‚Â· 4.2 GB used of 10 GB</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#ffffff", boxShadow: "0 4px 14px rgba(99,102,241,0.3)" }}>
            <Upload size={14} /> Upload Files
          </button>
        </div>

        {/* Upload zone */}
        <div
          className="border-2 border-dashed rounded-2xl p-12 text-center transition-all hover:border-primary/40 cursor-pointer"
          style={{ borderColor: darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.15)", background: darkMode ? "rgba(99,102,241,0.03)" : "rgba(99,102,241,0.02)" }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(99,102,241,0.1)" }}>
            <Upload size={20} style={{ color: "#6366f1" }} />
          </div>
          <p className="text-sm font-medium" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>Drag & drop files here</p>
          <p className="text-xs mt-1" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>PNG, JPG, MP4, MOV up to 500MB Ã‚Â· AI auto-analysis on upload</p>
        </div>

        {/* Files grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {photos.map((file) => (
            <motion.div
              key={file.id}
              className="rounded-2xl border overflow-hidden group cursor-pointer"
              style={cardBase(darkMode)}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
            >
              <div className="h-36 flex items-center justify-center" style={{ background: darkMode ? "rgba(99,102,241,0.05)" : "rgba(99,102,241,0.03)" }}>
                <Image size={28} style={{ color: darkMode ? "#2d3748" : "#cbd5e1" }} />
              </div>
              <div className="p-3">
                <p className="text-xs font-medium truncate" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>{file.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>{file.size}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded capitalize" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8" }}>{file.type}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Team({ darkMode }: { darkMode: boolean }) {
  const members = [
    { name: "Account Owner", role: "Owner", email: "Email from profile", avatar: "JD", color: "#6366f1", status: "online" },
    { name: "Alex Kim", role: "Admin", email: "alex@company.com", avatar: "AK", color: "#8b5cf6", status: "online" },
    { name: "Maria Santos", role: "Editor", email: "maria@company.com", avatar: "MS", color: "#06b6d4", status: "away" },
    { name: "Tom Walker", role: "Analyst", email: "tom@company.com", avatar: "TW", color: "#10b981", status: "offline" },
    { name: "Priya Patel", role: "Editor", email: "priya@company.com", avatar: "PP", color: "#f59e0b", status: "online" },
  ];

  const statusColors: Record<string, string> = { online: "#10b981", away: "#f59e0b", offline: "#475569" };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: darkMode ? "#e2e8f0" : "#0f172a" }}>Team</h1>
            <p className="text-sm mt-0.5" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>5 members Ã‚Â· 2 seats remaining</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#ffffff" }}>
            <Plus size={14} /> Invite Member
          </button>
        </div>

        <div className="rounded-2xl border divide-y overflow-hidden" style={{ ...cardBase(darkMode), divideColor: darkMode ? "rgba(99,102,241,0.08)" : "rgba(15,23,42,0.04)" }}>
          {members.map((member) => (
            <div key={member.name} className="flex items-center gap-4 p-4 transition-all hover:bg-primary/5">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm" style={{ background: `${member.color}20`, color: member.color }}>
                  {member.avatar}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: statusColors[member.status], borderColor: darkMode ? "#020210" : "#ffffff" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>{member.name}</p>
                <p className="text-xs" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>{member.email}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${member.color}15`, color: member.color }}>{member.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Integrations({ darkMode }: { darkMode: boolean }) {
  const integrations = [
    { icon: Slack, name: "Slack", desc: "Team notifications & alerts", connected: true, color: "#4a154b" },
    { icon: Github, name: "GitHub", desc: "Auto-post from commits & releases", connected: false, color: "#24292e" },
    { icon: Chrome, name: "Google Analytics", desc: "Import website traffic data", connected: true, color: "#4285f4" },
    { icon: Figma, name: "HubSpot CRM", desc: "Sync contacts & deal pipeline", connected: true, color: "#ff7a59" },
    { icon: Link, name: "Zapier", desc: "Connect 5000+ apps via automation", connected: false, color: "#ff4a00" },
    { icon: Globe, name: "Webflow", desc: "Publish AI blogs to your website", connected: false, color: "#4353ff" },
  ];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: darkMode ? "#e2e8f0" : "#0f172a" }}>Integrations</h1>
            <p className="text-sm mt-0.5" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>3 connected Ã‚Â· 60+ available</p>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs border transition-all" style={{ borderColor: darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)", color: darkMode ? "#818cf8" : "#6366f1" }}>
            Browse all
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {integrations.map((intg, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border transition-all hover:border-primary/20" style={cardBase(darkMode)}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${intg.color}15` }}>
                <intg.icon size={20} style={{ color: intg.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>{intg.name}</p>
                <p className="text-xs" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>{intg.desc}</p>
              </div>
              <button
                className="text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1 transition-all"
                style={intg.connected
                  ? { background: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.2)", color: "#10b981" }
                  : { borderColor: darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)", color: darkMode ? "#818cf8" : "#6366f1" }
                }
              >
                {intg.connected ? <><Check size={11} /> Connected</> : <>Connect</>}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Billing({ darkMode }: { darkMode: boolean }) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: darkMode ? "#e2e8f0" : "#0f172a" }}>Billing</h1>

        {/* Current plan */}
        <div className="rounded-2xl border p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)", borderColor: "rgba(99,102,241,0.2)" }}>
          <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none" style={{ background: "radial-gradient(circle at 80% 20%, rgba(99,102,241,0.15) 0%, transparent 60%)" }} />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs px-2 py-0.5 rounded-full mb-2 inline-block" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#ffffff" }}>Enterprise Plan</span>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: darkMode ? "#e2e8f0" : "#0f172a", letterSpacing: "-0.03em" }}>$499<span className="text-sm font-normal" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>/mo</span></div>
              <p className="text-xs mt-1" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>Next billing: July 1, 2026 Ã‚Â· Auto-renew enabled</p>
            </div>
            <button className="px-4 py-2 rounded-xl border text-sm transition-all" style={{ borderColor: darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)", color: darkMode ? "#818cf8" : "#6366f1" }}>
              Manage Plan
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "AI Generations", value: "Unlimited" },
              { label: "Team Members", value: "7 / 10" },
              { label: "Storage", value: "4.2 / 10 GB" },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl" style={{ background: darkMode ? "rgba(13,13,40,0.6)" : "rgba(255,255,255,0.6)" }}>
                <p className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>{item.value}</p>
                <p className="text-xs" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment method */}
        <div className="rounded-2xl border p-5" style={cardBase(darkMode)}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>Payment Method</h3>
          <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)" }}>
            <CreditCardIcon size={20} style={{ color: "#6366f1" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>Visa ending in 4242</p>
              <p className="text-xs" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>Expires 09/28</p>
            </div>
            <button className="ml-auto text-xs" style={{ color: darkMode ? "#818cf8" : "#6366f1" }}>Update</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsScreen({ darkMode }: { darkMode: boolean }) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: darkMode ? "#e2e8f0" : "#0f172a" }}>Settings</h1>

        {[
          {
            section: "Account", icon: UserSquare2, items: [
              { label: "Profile Information", desc: "Name, email, avatar", icon: UserSquare2 },
              { label: "Password & Security", desc: "2FA, password change", icon: Lock },
              { label: "Notifications", desc: "Email, push, in-app alerts", icon: Bell },
              { label: "API Keys", desc: "Manage API access tokens", icon: Key },
            ]
          },
          {
            section: "Portal", icon: Settings, items: [
              { label: "Brand Settings", desc: "Logo, colors, fonts", icon: Palette },
              { label: "Custom Domain", desc: "White-label your portal", icon: Globe },
              { label: "Team Permissions", desc: "Role-based access control", icon: Shield },
              { label: "Email Templates", desc: "Customize automated emails", icon: Mail },
            ]
          },
        ].map((group) => (
          <div key={group.section} className="rounded-2xl border overflow-hidden" style={cardBase(darkMode)}>
            <div className="px-5 py-3 border-b" style={{ borderColor: darkMode ? "rgba(99,102,241,0.08)" : "rgba(15,23,42,0.04)" }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>{group.section}</h3>
            </div>
            <div className="divide-y" style={{ borderColor: darkMode ? "rgba(99,102,241,0.08)" : "rgba(15,23,42,0.04)" }}>
              {group.items.map((item) => (
                <button key={item.label} className="w-full flex items-center gap-4 p-4 transition-all hover:bg-primary/5 text-left">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.08)" }}>
                    <item.icon size={14} style={{ color: "#6366f1" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>{item.label}</p>
                    <p className="text-xs" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>{item.desc}</p>
                  </div>
                  <ArrowRight size={13} style={{ color: darkMode ? "#2d3748" : "#cbd5e1" }} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AutomationScreen({ darkMode }: { darkMode: boolean }) {
  const automations = [
    { name: "Auto-reply to comments", trigger: "New comment on post", status: "active", runs: 284 },
    { name: "Lead nurture sequence", trigger: "New lead added to CRM", status: "active", runs: 67 },
    { name: "Content repurposing", trigger: "Post reaches 1K reach", status: "active", runs: 42 },
    { name: "Weekly performance email", trigger: "Every Monday 9:00 AM", status: "paused", runs: 18 },
    { name: "AI competitor analysis", trigger: "Daily at 6:00 AM", status: "active", runs: 180 },
  ];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: darkMode ? "#e2e8f0" : "#0f172a" }}>Automation</h1>
            <p className="text-sm mt-0.5" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>4 active automations Ã‚Â· 591 total runs</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#ffffff" }}>
            <Plus size={14} /> New Automation
          </button>
        </div>

        <div className="space-y-3">
          {automations.map((auto, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border transition-all hover:border-primary/20" style={cardBase(darkMode)}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: auto.status === "active" ? "rgba(16,185,129,0.1)" : "rgba(99,102,241,0.08)" }}>
                <Zap size={16} style={{ color: auto.status === "active" ? "#10b981" : "#6366f1" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>{auto.name}</p>
                <p className="text-xs mt-0.5" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>Trigger: {auto.trigger}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>{auto.runs} runs</p>
                <span className="text-xs" style={{ color: auto.status === "active" ? "#10b981" : "#f59e0b" }}>Ã¢â€”Â {auto.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GenericScreen({ screen, darkMode }: GenericScreenProps) {
  if (screen === "media") return <MediaLibrary darkMode={darkMode} />;
  if (screen === "team") return <Team darkMode={darkMode} />;
  if (screen === "integrations") return <Integrations darkMode={darkMode} />;
  if (screen === "billing") return <Billing darkMode={darkMode} />;
  if (screen === "settings") return <SettingsScreen darkMode={darkMode} />;
  if (screen === "automation") return <AutomationScreen darkMode={darkMode} />;

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: "rgba(99,102,241,0.1)" }}>
          <Settings size={24} style={{ color: "#6366f1" }} />
        </div>
        <h2 className="capitalize" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>{screen.replace("-", " ")}</h2>
        <p className="text-sm mt-1" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>This module is under active development</p>
      </div>
    </div>
  );
}
