import {
  AlertCircle,
  ArrowRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileBarChart,
  Image,
  Link2,
  Mail,
  Megaphone,
  Play,
  RefreshCcw,
  Settings,
  Share2,
  Sparkles,
  Upload,
  Video,
  Wand2,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";

interface AutomationCenterProps {
  darkMode: boolean;
  onNavigate?: (screen: string) => void;
}

const automationAgents = [
  {
    name: "Upload Agent",
    status: "Ready",
    description: "Media upload and asset preparation pipeline.",
    icon: Upload,
    color: "#6366f1",
    action: "Open Media Library",
    screen: "media",
  },
  {
    name: "Caption Agent",
    status: "Ready",
    description: "Generate real estate captions from assets and property context.",
    icon: Wand2,
    color: "#8b5cf6",
    action: "Open Campaign Studio",
    screen: "ai-studio",
  },
  {
    name: "Hashtag Agent",
    status: "Ready",
    description: "Suggest clean platform-specific hashtag sets.",
    icon: Sparkles,
    color: "#06b6d4",
    action: "Open Campaign Studio",
    screen: "ai-studio",
  },
  {
    name: "Scheduler Agent",
    status: "Live",
    description: "Schedule generated posts and manage publishing windows.",
    icon: CalendarClock,
    color: "#10b981",
    action: "Open Scheduler",
    screen: "scheduler",
  },
  {
    name: "Publisher Agent",
    status: "Demo mode",
    description: "Publishes campaigns in safe demo mode until social accounts are connected.",
    icon: Megaphone,
    color: "#f59e0b",
    action: "Review readiness",
    screen: "automation",
  },
  {
    name: "Report Email Agent",
    status: "Ready",
    description: "Send report summaries to stakeholders when SMTP is configured.",
    icon: Mail,
    color: "#ec4899",
    action: "Open Reports",
    screen: "reports",
  },
];

const socialAccounts = [
  {
    name: "YouTube Shorts",
    platform: "Google",
    connectionStatus: "Not connected",
    publishMode: "Demo mode",
    liveRequirement: "Google OAuth + YouTube upload scope",
    usedFor: "Short-form property video publishing.",
    icon: Play,
    color: "#ef4444",
    checklist: [
      "Connect Google account",
      "Choose YouTube channel",
      "Enable video upload scope",
      "Switch campaign publishing from demo to live",
    ],
  },
  {
    name: "Instagram Reels",
    platform: "Meta",
    connectionStatus: "Not connected",
    publishMode: "Demo mode",
    liveRequirement: "Meta OAuth + Instagram business permissions",
    usedFor: "Property reels, walkthrough videos, and short campaign hooks.",
    icon: Video,
    color: "#ec4899",
    checklist: [
      "Connect Meta account",
      "Select Instagram business profile",
      "Enable reel publishing permission",
      "Switch campaign publishing from demo to live",
    ],
  },
  {
    name: "Facebook Video",
    platform: "Meta",
    connectionStatus: "Not connected",
    publishMode: "Demo mode",
    liveRequirement: "Meta OAuth + Facebook page permissions",
    usedFor: "Local awareness videos and property campaign posts.",
    icon: Share2,
    color: "#3b82f6",
    checklist: [
      "Connect Facebook account",
      "Select Facebook page",
      "Verify page video publishing permission",
      "Switch campaign publishing from demo to live",
    ],
  },
  {
    name: "LinkedIn",
    platform: "LinkedIn",
    connectionStatus: "Not connected",
    publishMode: "Demo mode",
    liveRequirement: "LinkedIn OAuth + profile/page posting permission",
    usedFor: "Professional real estate updates, investor posts, and property launches.",
    icon: Link2,
    color: "#0ea5e9",
    checklist: [
      "Connect LinkedIn account",
      "Choose profile or company page",
      "Enable posting permission",
      "Switch campaign publishing from demo to live",
    ],
  },
];

const setupChecklist = [
  {
    title: "Client login",
    description: "Client enters the portal and gets access to the publishing workflow.",
    screen: "dashboard",
    icon: Bot,
  },
  {
    title: "Upload or select video",
    description: "Client uploads a property video or selects an existing Media Library asset.",
    screen: "media",
    icon: Image,
  },
  {
    title: "Create campaign drafts",
    description: "Campaign Studio creates platform-specific drafts from the same video.",
    screen: "ai-studio",
    icon: Sparkles,
  },
  {
    title: "Connect social accounts",
    description: "Live publishing requires YouTube, Meta, and LinkedIn account connections.",
    screen: "automation",
    icon: Settings,
  },
  {
    title: "Publish or schedule",
    description: "Client selects platforms and publishes now or schedules posts.",
    screen: "scheduler",
    icon: CalendarClock,
  },
  {
    title: "Review reports",
    description: "Client checks reports and AI Manager recommendations after publishing.",
    screen: "reports",
    icon: FileBarChart,
  },
];

function getStatusStyle(status: string) {
  const lower = status.toLowerCase();

  if (lower.includes("ready") || lower.includes("live") || lower.includes("connected")) {
    return {
      background: "rgba(16, 185, 129, 0.12)",
      border: "1px solid rgba(16, 185, 129, 0.22)",
      color: "#10b981",
    };
  }

  if (
    lower.includes("required") ||
    lower.includes("token") ||
    lower.includes("oauth") ||
    lower.includes("pending") ||
    lower.includes("not connected") ||
    lower.includes("demo")
  ) {
    return {
      background: "rgba(245, 158, 11, 0.12)",
      border: "1px solid rgba(245, 158, 11, 0.22)",
      color: "#f59e0b",
    };
  }

  return {
    background: "rgba(99, 102, 241, 0.10)",
    border: "1px solid rgba(99, 102, 241, 0.18)",
    color: "#818cf8",
  };
}

export function AutomationCenter({ darkMode, onNavigate }: AutomationCenterProps) {
  const surfaceStyle = {
    background: darkMode ? "rgba(13,13,40,0.82)" : "#ffffff",
    borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
  };

  const mutedColor = darkMode ? "#94a3b8" : "#64748b";
  const faintColor = darkMode ? "#4a5568" : "#94a3b8";
  const textColor = darkMode ? "#e2e8f0" : "#0f172a";

  const connectedCount = 0;
  const totalSocialAccounts = socialAccounts.length;
  const demoModeCount = socialAccounts.filter((account) => account.publishMode === "Demo mode").length;

  const navigate = (screen: string) => {
    if (onNavigate) {
      onNavigate(screen);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div
              className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1"
              style={{
                background: "rgba(99,102,241,0.10)",
                border: "1px solid rgba(99,102,241,0.18)",
                color: "#818cf8",
              }}
            >
              <Zap size={14} />
              <span className="text-xs font-mono">Automation Control Center</span>
            </div>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                letterSpacing: "-0.035em",
                color: textColor,
              }}
            >
              Connected Social Accounts
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: mutedColor }}>
              Manage the client journey from login to campaign creation, social account readiness,
              safe demo publishing, and final live posting.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Accounts", value: `${connectedCount}/${totalSocialAccounts}`, color: "#6366f1" },
              { label: "Mode", value: "Demo-safe", color: "#f59e0b" },
              { label: "Live Pending", value: `${demoModeCount}`, color: "#f59e0b" },
              { label: "Flow", value: "Login → Publish", color: "#06b6d4" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border px-4 py-3"
                style={surfaceStyle}
              >
                <p className="text-[11px] font-mono" style={{ color: faintColor }}>
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-semibold" style={{ color: item.color }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-2xl border p-5"
          style={{
            background: darkMode
              ? "linear-gradient(135deg, rgba(245,158,11,0.13), rgba(99,102,241,0.06))"
              : "linear-gradient(135deg, rgba(245,158,11,0.10), rgba(99,102,241,0.04))",
            borderColor: "rgba(245,158,11,0.24)",
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="rounded-2xl p-3"
                style={{
                  background: "rgba(245,158,11,0.16)",
                  color: "#f59e0b",
                }}
              >
                <ClipboardCheck size={22} />
              </div>
              <div>
                <h2 className="text-base font-semibold" style={{ color: textColor }}>
                  Live publishing requires connected social accounts
                </h2>
                <p className="mt-1 text-sm leading-6" style={{ color: mutedColor }}>
                  Until YouTube, Meta, and LinkedIn accounts are connected, the client can still
                  create drafts, schedule campaigns, and use safe demo/mock publishing results.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate("media")}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
                style={{ background: "#6366f1", color: "#ffffff" }}
              >
                <Upload size={13} />
                Start with media
              </button>
              <button
                onClick={() => navigate("ai-studio")}
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium"
                style={{
                  borderColor: darkMode ? "rgba(99,102,241,0.24)" : "rgba(99,102,241,0.16)",
                  color: darkMode ? "#818cf8" : "#6366f1",
                }}
              >
                <Sparkles size={13} />
                Open Campaign Studio
              </button>
            </div>
          </div>
        </div>

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold" style={{ color: textColor }}>
                Social account readiness
              </h2>
              <p className="mt-1 text-xs" style={{ color: mutedColor }}>
                These accounts must be connected before the client can publish live to social media.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {socialAccounts.map((account) => {
              const Icon = account.icon;

              return (
                <motion.div
                  key={account.name}
                  className="rounded-2xl border p-5"
                  style={surfaceStyle}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.16 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="rounded-2xl p-3"
                      style={{
                        background: `${account.color}16`,
                        color: account.color,
                        border: `1px solid ${account.color}24`,
                      }}
                    >
                      <Icon size={20} />
                    </div>

                    <span
                      className="rounded-full px-2.5 py-1 text-[11px]"
                      style={getStatusStyle(account.connectionStatus)}
                    >
                      {account.connectionStatus}
                    </span>
                  </div>

                  <h3 className="mt-4 text-sm font-semibold" style={{ color: textColor }}>
                    {account.name}
                  </h3>
                  <p className="text-xs" style={{ color: faintColor }}>
                    {account.platform}
                  </p>

                  <p className="mt-3 min-h-12 text-xs leading-5" style={{ color: mutedColor }}>
                    {account.usedFor}
                  </p>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span style={{ color: faintColor }}>Publishing mode</span>
                      <span className="rounded-full px-2 py-1" style={getStatusStyle(account.publishMode)}>
                        {account.publishMode}
                      </span>
                    </div>
                    <div className="text-xs leading-5" style={{ color: mutedColor }}>
                      <span style={{ color: faintColor }}>Live requirement: </span>
                      {account.liveRequirement}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {account.checklist.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs" style={{ color: mutedColor }}>
                        <AlertCircle size={12} style={{ color: account.color }} />
                        {item}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium opacity-70 cursor-not-allowed"
                    style={{
                      borderColor: `${account.color}33`,
                      color: account.color,
                      background: `${account.color}0F`,
                    }}
                    title="OAuth connection will be added in the backend integration phase."
                  >
                    Connect account
                    <RefreshCcw size={12} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold" style={{ color: textColor }}>
                Automation agents
              </h2>
              <p className="mt-1 text-xs" style={{ color: mutedColor }}>
                Client-facing automation modules currently available in the product.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {automationAgents.map((agent) => {
              const Icon = agent.icon;

              return (
                <motion.div
                  key={agent.name}
                  className="rounded-2xl border p-5"
                  style={surfaceStyle}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.16 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="rounded-2xl p-3"
                      style={{
                        background: `${agent.color}18`,
                        color: agent.color,
                        border: `1px solid ${agent.color}24`,
                      }}
                    >
                      <Icon size={20} />
                    </div>

                    <span className="rounded-full px-2.5 py-1 text-[11px]" style={getStatusStyle(agent.status)}>
                      {agent.status}
                    </span>
                  </div>

                  <h3 className="mt-4 text-sm font-semibold" style={{ color: textColor }}>
                    {agent.name}
                  </h3>
                  <p className="mt-2 min-h-10 text-xs leading-5" style={{ color: mutedColor }}>
                    {agent.description}
                  </p>

                  <button
                    onClick={() => navigate(agent.screen)}
                    className="mt-4 inline-flex items-center gap-2 text-xs font-medium"
                    style={{ color: agent.color }}
                  >
                    {agent.action}
                    <ArrowRight size={12} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_0.75fr]">
          <div>
            <div className="mb-4">
              <h2 className="text-base font-semibold" style={{ color: textColor }}>
                Client handover flow
              </h2>
              <p className="mt-1 text-xs" style={{ color: mutedColor }}>
                This is the exact workflow clients will follow once account connection is live.
              </p>
            </div>

            <div className="rounded-2xl border p-5" style={surfaceStyle}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {setupChecklist.map((step, index) => {
                  const Icon = step.icon;

                  return (
                    <button
                      key={step.title}
                      onClick={() => navigate(step.screen)}
                      className="w-full rounded-2xl p-3 text-left transition-all hover:bg-primary/5"
                      style={{
                        border: "1px solid rgba(99,102,241,0.10)",
                        background: darkMode ? "rgba(99,102,241,0.035)" : "rgba(99,102,241,0.025)",
                      }}
                    >
                      <div className="flex gap-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            background: "rgba(99,102,241,0.12)",
                            color: "#818cf8",
                          }}
                        >
                          <Icon size={15} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono" style={{ color: faintColor }}>
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <h3 className="text-sm font-medium" style={{ color: textColor }}>
                              {step.title}
                            </h3>
                          </div>
                          <p className="mt-1 text-xs leading-5" style={{ color: mutedColor }}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4">
              <h2 className="text-base font-semibold" style={{ color: textColor }}>
                Publish readiness
              </h2>
              <p className="mt-1 text-xs" style={{ color: mutedColor }}>
                Current handover status for client publishing.
              </p>
            </div>

            <div className="rounded-2xl border p-5" style={surfaceStyle}>
              <div className="space-y-4">
                {[
                  { label: "Client can login", ready: true },
                  { label: "Client can upload/select video", ready: true },
                  { label: "Client can create campaign drafts", ready: true },
                  { label: "Client can schedule drafts", ready: true },
                  { label: "Social OAuth connected", ready: false },
                  { label: "Live platform tokens stored", ready: false },
                  { label: "True live publishing enabled", ready: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    {item.ready ? (
                      <CheckCircle2 size={15} style={{ color: "#10b981" }} />
                    ) : (
                      <AlertCircle size={15} style={{ color: "#f59e0b" }} />
                    )}
                    <span className="text-xs" style={{ color: mutedColor }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="mt-4 rounded-2xl border p-4"
              style={{
                background: "rgba(245,158,11,0.08)",
                borderColor: "rgba(245,158,11,0.18)",
              }}
            >
              <div className="flex items-start gap-3">
                <AlertCircle size={17} style={{ color: "#f59e0b" }} />
                <p className="text-xs leading-5" style={{ color: darkMode ? "#fbbf24" : "#92400e" }}>
                  The full client publishing journey is ready in demo-safe mode. True live publishing
                  will be enabled after OAuth connection and secure token storage are added.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
