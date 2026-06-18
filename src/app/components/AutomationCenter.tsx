import {
  AlertCircle,
  ArrowRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
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
    action: "Open AI Studio",
    screen: "ai-studio",
  },
  {
    name: "Hashtag Agent",
    status: "Ready",
    description: "Suggest clean platform-specific hashtag sets.",
    icon: Sparkles,
    color: "#06b6d4",
    action: "Open AI Studio",
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
    status: "Token setup required",
    description: "Publishes campaigns after social platform credentials are configured.",
    icon: Megaphone,
    color: "#f59e0b",
    action: "Open Scheduler",
    screen: "scheduler",
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

const integrations = [
  {
    name: "Instagram Reels",
    platform: "Meta",
    status: "Needs token",
    description: "Publish property reels and campaign videos.",
    icon: Video,
    color: "#ec4899",
    checklist: ["Connect Meta account", "Select Instagram page", "Enable reel publishing"],
  },
  {
    name: "Facebook Video",
    platform: "Meta",
    status: "Needs token",
    description: "Publish local awareness videos to Facebook pages.",
    icon: Share2,
    color: "#3b82f6",
    checklist: ["Connect Facebook page", "Verify page permissions", "Enable video publishing"],
  },
  {
    name: "YouTube Shorts",
    platform: "Google",
    status: "OAuth required",
    description: "Publish short-form property videos to YouTube.",
    icon: Play,
    color: "#ef4444",
    checklist: ["Connect Google account", "Choose YouTube channel", "Enable upload scope"],
  },
  {
    name: "LinkedIn",
    platform: "LinkedIn",
    status: "Campaign-ready soon",
    description: "Publish professional updates and property campaign posts.",
    icon: Link2,
    color: "#0ea5e9",
    checklist: ["Connect LinkedIn", "Choose profile/page", "Enable campaign posting"],
  },
  {
    name: "Website / Other",
    platform: "Custom",
    status: "Planned",
    description: "Push generated content to websites or custom channels.",
    icon: ExternalLink,
    color: "#10b981",
    checklist: ["Add webhook URL", "Map payload fields", "Enable custom publishing"],
  },
];

const setupChecklist = [
  {
    title: "Upload media",
    description: "Add images/videos in Media Library.",
    screen: "media",
    icon: Image,
  },
  {
    title: "Generate draft post",
    description: "Use AI Studio to create platform-ready content.",
    screen: "ai-studio",
    icon: Bot,
  },
  {
    title: "Schedule content",
    description: "Pick date, time, and platform from Scheduler.",
    screen: "scheduler",
    icon: CalendarClock,
  },
  {
    title: "Configure tokens",
    description: "Connect social accounts before real publishing.",
    screen: "settings",
    icon: Settings,
  },
  {
    title: "Review reports",
    description: "Track results and email summaries from Reports.",
    screen: "reports",
    icon: FileBarChart,
  },
];

function getStatusStyle(status: string) {
  const lower = status.toLowerCase();

  if (lower.includes("ready") || lower.includes("live")) {
    return {
      background: "rgba(16, 185, 129, 0.12)",
      border: "1px solid rgba(16, 185, 129, 0.22)",
      color: "#10b981",
    };
  }

  if (lower.includes("required") || lower.includes("token") || lower.includes("oauth")) {
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
              Automation & Integrations
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: mutedColor }}>
              One place for AI agents, publishing readiness, social integrations,
              and the workflow from media upload to scheduled campaign publishing.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "AI Agents", value: "6", color: "#6366f1" },
              { label: "Ready", value: "4", color: "#10b981" },
              { label: "Need Token", value: "3", color: "#f59e0b" },
              { label: "Live Flow", value: "Media → AI → Schedule", color: "#06b6d4" },
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
              ? "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.06))"
              : "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.04))",
            borderColor: "rgba(99,102,241,0.18)",
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="rounded-2xl p-3"
                style={{
                  background: "rgba(99,102,241,0.16)",
                  color: "#818cf8",
                }}
              >
                <ClipboardCheck size={22} />
              </div>
              <div>
                <h2 className="text-base font-semibold" style={{ color: textColor }}>
                  Client automation flow
                </h2>
                <p className="mt-1 text-sm leading-6" style={{ color: mutedColor }}>
                  Upload property media, generate captions/hashtags, schedule the post,
                  then publish once platform credentials are connected.
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
                Generate post
              </button>
            </div>
          </div>
        </div>

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold" style={{ color: textColor }}>
                Automation agents
              </h2>
              <p className="mt-1 text-xs" style={{ color: mutedColor }}>
                Client-facing AI automation modules currently available in the product.
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

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_0.85fr]">
          <div>
            <div className="mb-4">
              <h2 className="text-base font-semibold" style={{ color: textColor }}>
                Social integrations
              </h2>
              <p className="mt-1 text-xs" style={{ color: mutedColor }}>
                Real publishing is available after account tokens/OAuth are configured.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {integrations.map((integration) => {
                const Icon = integration.icon;

                return (
                  <div
                    key={integration.name}
                    className="rounded-2xl border p-5"
                    style={surfaceStyle}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="rounded-2xl p-3"
                          style={{
                            background: `${integration.color}16`,
                            color: integration.color,
                            border: `1px solid ${integration.color}24`,
                          }}
                        >
                          <Icon size={19} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold" style={{ color: textColor }}>
                            {integration.name}
                          </h3>
                          <p className="text-xs" style={{ color: faintColor }}>
                            {integration.platform}
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full px-2.5 py-1 text-[11px]" style={getStatusStyle(integration.status)}>
                        {integration.status}
                      </span>
                    </div>

                    <p className="mt-4 text-xs leading-5" style={{ color: mutedColor }}>
                      {integration.description}
                    </p>

                    <div className="mt-4 space-y-2">
                      {integration.checklist.map((item) => (
                        <div key={item} className="flex items-center gap-2 text-xs" style={{ color: mutedColor }}>
                          <AlertCircle size={12} style={{ color: integration.color }} />
                          {item}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium"
                      style={{
                        borderColor: `${integration.color}33`,
                        color: integration.color,
                        background: `${integration.color}0F`,
                      }}
                    >
                      Test connection
                      <RefreshCcw size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-4">
              <h2 className="text-base font-semibold" style={{ color: textColor }}>
                Setup checklist
              </h2>
              <p className="mt-1 text-xs" style={{ color: mutedColor }}>
                Follow this flow before handing over publishing access.
              </p>
            </div>

            <div className="rounded-2xl border p-5" style={surfaceStyle}>
              <div className="space-y-4">
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
                  Social publishing needs real platform credentials. Until tokens are configured,
                  the system can generate drafts, schedules, reports, and mock-safe publish results.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
