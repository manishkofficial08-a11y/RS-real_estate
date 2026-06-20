import { useEffect, useMemo, useState } from "react";
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
  Loader2,
  Mail,
  Megaphone,
  Play,
  PlugZap,
  RefreshCcw,
  Settings,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  Video,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import {
  connectClientSocialAccountManual,
  deleteClientSocialAccount,
  disconnectClientSocialAccount,
  getClientSocialAccounts,
  getClientSocialReadiness,
  type ClientSocialAccount,
  type ClientSocialPlatform,
  type ClientSocialReadinessResponse,
} from "../lib/clientApi";

interface AutomationCenterProps {
  darkMode: boolean;
  onNavigate?: (screen: string) => void;
}

type ConnectFormState = {
  platform: ClientSocialPlatform;
  accountName: string;
  externalAccountId: string;
  accessToken: string;
  refreshToken: string;
  scopes: string;
  tokenExpiresAt: string;
};

const automationAgents = [
  {
    name: "Upload Agent",
    status: "Ready",
    description: "Media upload and asset preparation pipeline.",
    icon: Upload,
    color: "#1D4ED8",
    action: "Open Media Library",
    screen: "media",
  },
  {
    name: "Caption Agent",
    status: "Ready",
    description: "Generate real estate captions from assets and property context.",
    icon: Wand2,
    color: "#2563EB",
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
    status: "Live when connected",
    description: "Publishes campaigns using the client's connected social account tokens.",
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

const socialPlatforms: Array<{
  key: ClientSocialPlatform;
  name: string;
  platform: string;
  liveRequirement: string;
  usedFor: string;
  icon: typeof Play;
  color: string;
  externalIdLabel: string;
  accessTokenLabel: string;
  refreshTokenLabel?: string;
  placeholderAccount: string;
  placeholderExternalId: string;
  defaultScopes: string;
}> = [
  {
    key: "youtube",
    name: "YouTube Shorts",
    platform: "Google",
    liveRequirement: "Google account access + YouTube upload permission",
    usedFor: "Short-form property video publishing.",
    icon: Play,
    color: "#ef4444",
    externalIdLabel: "YouTube Channel ID",
    accessTokenLabel: "Access token",
    refreshTokenLabel: "Refresh token recommended",
    placeholderAccount: "RS Realty YouTube",
    placeholderExternalId: "UCxxxxxxxxxxxxxxxx",
    defaultScopes: "youtube.upload",
  },
  {
    key: "instagram",
    name: "Instagram Reels",
    platform: "Meta",
    liveRequirement: "Instagram Business account + Meta Graph permissions",
    usedFor: "Property reels, walkthrough videos, and short campaign hooks.",
    icon: Video,
    color: "#ec4899",
    externalIdLabel: "Instagram Business Account ID",
    accessTokenLabel: "Instagram/Meta access token",
    placeholderAccount: "rs_realty_instagram",
    placeholderExternalId: "17841400000000000",
    defaultScopes: "instagram_basic,instagram_content_publish,pages_show_list",
  },
  {
    key: "facebook",
    name: "Facebook Page",
    platform: "Meta",
    liveRequirement: "Facebook Page token with content publishing permission",
    usedFor: "Local awareness videos and property campaign posts.",
    icon: Share2,
    color: "#3b82f6",
    externalIdLabel: "Facebook Page ID",
    accessTokenLabel: "Facebook Page access token",
    placeholderAccount: "RS Realty Page",
    placeholderExternalId: "123456789012345",
    defaultScopes: "pages_manage_posts,pages_read_engagement,pages_show_list",
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    platform: "LinkedIn",
    liveRequirement: "LinkedIn member/page author URN + posting permission",
    usedFor: "Professional real estate updates, investor posts, and property launches.",
    icon: Link2,
    color: "#0ea5e9",
    externalIdLabel: "LinkedIn Author URN",
    accessTokenLabel: "LinkedIn access token",
    placeholderAccount: "Manish / RS Realty",
    placeholderExternalId: "urn:li:person:xxxxxxxx",
    defaultScopes: "w_member_social",
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
    description: "YouTube, Meta, and LinkedIn credentials are stored per client account.",
    screen: "automation",
    icon: Settings,
  },
  {
    title: "Publish or schedule",
    description: "Client selects connected platforms and publishes now or schedules posts.",
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
    lower.includes("expired") ||
    lower.includes("error")
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
    color: "#60A5FA",
  };
}

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function emptyForm(platform: ClientSocialPlatform): ConnectFormState {
  const config = socialPlatforms.find((item) => item.key === platform) ?? socialPlatforms[0];

  return {
    platform,
    accountName: "",
    externalAccountId: "",
    accessToken: "",
    refreshToken: "",
    scopes: config.defaultScopes,
    tokenExpiresAt: "",
  };
}

export function AutomationCenter({ darkMode, onNavigate }: AutomationCenterProps) {
  const [accounts, setAccounts] = useState<ClientSocialAccount[]>([]);
  const [readiness, setReadiness] = useState<ClientSocialReadinessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeConnectPlatform, setActiveConnectPlatform] =
    useState<ClientSocialPlatform | null>(null);
  const [form, setForm] = useState<ConnectFormState>(emptyForm("youtube"));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const surfaceStyle = {
    background: darkMode ? "rgba(15,23,42,0.82)" : "#ffffff",
    borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.06)",
  };

  const mutedColor = darkMode ? "#94a3b8" : "#64748b";
  const faintColor = darkMode ? "#94A3B8" : "#94a3b8";
  const textColor = darkMode ? "#e2e8f0" : "#0f172a";

  const accountMap = useMemo(() => {
    const map = new Map<string, ClientSocialAccount>();

    accounts.forEach((account) => {
      if (account.status === "connected" && account.is_active) {
        map.set(String(account.platform), account);
      }
    });

    return map;
  }, [accounts]);

  const connectedCount = readiness?.connected_count ?? accountMap.size;
  const totalSocialAccounts = socialPlatforms.length;
  const missingCount = Math.max(totalSocialAccounts - connectedCount, 0);

  const navigate = (screen: string) => {
    if (onNavigate) {
      onNavigate(screen);
    }
  };

  async function loadSocialAccounts() {
    try {
      setLoading(true);
      setError("");
      const [accountItems, readinessData] = await Promise.all([
        getClientSocialAccounts(),
        getClientSocialReadiness(),
      ]);
      setAccounts(accountItems);
      setReadiness(readinessData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load social accounts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSocialAccounts();
  }, []);

  function openConnect(platform: ClientSocialPlatform) {
    setActiveConnectPlatform(platform);
    setForm(emptyForm(platform));
    setMessage("");
    setError("");
  }

  async function handleConnectSubmit() {
    if (!activeConnectPlatform) return;

    const accountName = form.accountName.trim();
    const accessToken = form.accessToken.trim();
    const refreshToken = form.refreshToken.trim();
    const externalAccountId = form.externalAccountId.trim();

    if (!accountName) {
      setError("Account name is required.");
      return;
    }

    if (!accessToken && !refreshToken) {
      setError("Add at least an access token or refresh token.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const scopes = form.scopes
        .split(",")
        .map((scope) => scope.trim())
        .filter(Boolean);

      const metadata: Record<string, unknown> = {};

      if (activeConnectPlatform === "facebook" && externalAccountId) {
        metadata.page_id = externalAccountId;
      }

      if (activeConnectPlatform === "instagram" && externalAccountId) {
        metadata.instagram_business_account_id = externalAccountId;
      }

      if (activeConnectPlatform === "linkedin" && externalAccountId) {
        metadata.author_urn = externalAccountId;
      }

      await connectClientSocialAccountManual({
        platform: activeConnectPlatform,
        account_name: accountName,
        external_account_id: externalAccountId || null,
        access_token: accessToken || null,
        refresh_token: refreshToken || null,
        token_expires_at: form.tokenExpiresAt ? new Date(form.tokenExpiresAt).toISOString() : null,
        scopes,
        metadata_json: metadata,
      });

      setMessage("Social account connected successfully.");
      setActiveConnectPlatform(null);
      await loadSocialAccounts();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to connect account");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect(account: ClientSocialAccount) {
    try {
      setSaving(true);
      setError("");
      await disconnectClientSocialAccount(account.id);
      setMessage(`${account.account_name} disconnected.`);
      await loadSocialAccounts();
    } catch (disconnectError) {
      setError(
        disconnectError instanceof Error
          ? disconnectError.message
          : "Failed to disconnect account",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(account: ClientSocialAccount) {
    try {
      setSaving(true);
      setError("");
      await deleteClientSocialAccount(account.id);
      setMessage(`${account.account_name} removed.`);
      await loadSocialAccounts();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to remove account");
    } finally {
      setSaving(false);
    }
  }

  const activeConfig = activeConnectPlatform
    ? socialPlatforms.find((platform) => platform.key === activeConnectPlatform)
    : null;

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div
              className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1"
              style={{
                background: "rgba(29,78,216,0.10)",
                border: "1px solid rgba(29,78,216,0.18)",
                color: "#60A5FA",
              }}
            >
              <Zap size={14} />
              <span className="text-xs font-mono">Automation Control Center</span>
            </div>
            <h1
              style={{
                fontSize: "clamp(1.45rem, 4vw, 1.9rem)",
                fontWeight: 700,
                letterSpacing: "-0.035em",
                color: textColor,
              }}
            >
              Connected Social Accounts
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: mutedColor }}>
              Connect the client's real YouTube, Instagram, Facebook, and LinkedIn accounts.
              Campaign Studio publishing will use these connected credentials.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Accounts", value: `${connectedCount}/${totalSocialAccounts}`, color: "#1D4ED8" },
              { label: "Mode", value: readiness?.live_ready ? "Live-ready" : "Setup needed", color: readiness?.live_ready ? "#10b981" : "#f59e0b" },
              { label: "Missing", value: `${missingCount}`, color: missingCount ? "#f59e0b" : "#10b981" },
              { label: "Flow", value: "Media → Publish", color: "#06b6d4" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border px-4 py-3" style={surfaceStyle}>
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

        {(message || error) && (
          <div
            className="rounded-2xl border p-4 text-sm"
            style={{
              background: error ? "rgba(239,68,68,0.10)" : "rgba(16,185,129,0.10)",
              borderColor: error ? "rgba(239,68,68,0.24)" : "rgba(16,185,129,0.24)",
              color: error ? "#ef4444" : "#10b981",
            }}
          >
            {error || message}
          </div>
        )}

        <div
          className="rounded-2xl border p-5"
          style={{
            background: darkMode
              ? "linear-gradient(135deg, rgba(16,185,129,0.13), rgba(29,78,216,0.06))"
              : "linear-gradient(135deg, rgba(16,185,129,0.10), rgba(29,78,216,0.04))",
            borderColor: readiness?.live_ready
              ? "rgba(16,185,129,0.24)"
              : "rgba(245,158,11,0.24)",
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="rounded-2xl p-3"
                style={{
                  background: readiness?.live_ready
                    ? "rgba(16,185,129,0.16)"
                    : "rgba(245,158,11,0.16)",
                  color: readiness?.live_ready ? "#10b981" : "#f59e0b",
                }}
              >
                <ClipboardCheck size={22} />
              </div>
              <div>
                <h2 className="text-base font-semibold" style={{ color: textColor }}>
                  {readiness?.live_ready
                    ? "Live publishing is ready"
                    : "Connect social accounts before live publishing"}
                </h2>
                <p className="mt-1 text-sm leading-6" style={{ color: mutedColor }}>
                  Once accounts are connected, publishing from Campaign Studio will use the stored
                  client-specific tokens. Missing accounts will return a clear connection error.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={loadSocialAccounts}
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium"
                style={{
                  borderColor: darkMode ? "rgba(29,78,216,0.24)" : "rgba(29,78,216,0.16)",
                  color: darkMode ? "#60A5FA" : "#1D4ED8",
                }}
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCcw size={13} />}
                Refresh
              </button>
              <button
                onClick={() => navigate("ai-studio")}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
                style={{ background: "#1D4ED8", color: "#ffffff" }}
              >
                <Sparkles size={13} />
                Open Campaign Studio
              </button>
            </div>
          </div>
        </div>

        <section>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold" style={{ color: textColor }}>
                Social account connections
              </h2>
              <p className="mt-1 text-xs" style={{ color: mutedColor }}>
                Store real platform credentials per client tenant. Tokens are saved encrypted in backend.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {socialPlatforms.map((platform) => {
              const Icon = platform.icon;
              const currentAccount = accountMap.get(platform.key);

              return (
                <motion.div
                  key={platform.key}
                  className="rounded-2xl border p-5"
                  style={surfaceStyle}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.16 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="rounded-2xl p-3"
                      style={{
                        background: `${platform.color}16`,
                        color: platform.color,
                        border: `1px solid ${platform.color}24`,
                      }}
                    >
                      <Icon size={20} />
                    </div>

                    <span
                      className="rounded-full px-2.5 py-1 text-[11px]"
                      style={getStatusStyle(currentAccount ? "connected" : "not connected")}
                    >
                      {currentAccount ? "Connected" : "Not connected"}
                    </span>
                  </div>

                  <h3 className="mt-4 text-sm font-semibold" style={{ color: textColor }}>
                    {platform.name}
                  </h3>
                  <p className="text-xs" style={{ color: faintColor }}>
                    {platform.platform}
                  </p>

                  <p className="mt-3 min-h-12 text-xs leading-5" style={{ color: mutedColor }}>
                    {platform.usedFor}
                  </p>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span style={{ color: faintColor }}>Publishing mode</span>
                      <span
                        className="rounded-full px-2 py-1"
                        style={getStatusStyle(currentAccount ? "live" : "connection required")}
                      >
                        {currentAccount ? "Live credentials" : "Setup required"}
                      </span>
                    </div>

                    {currentAccount ? (
                      <>
                        <div className="leading-5" style={{ color: mutedColor }}>
                          <span style={{ color: faintColor }}>Account: </span>
                          {currentAccount.account_name}
                        </div>
                        <div className="leading-5" style={{ color: mutedColor }}>
                          <span style={{ color: faintColor }}>Connected: </span>
                          {formatDate(currentAccount.last_connected_at)}
                        </div>
                      </>
                    ) : (
                      <div className="leading-5" style={{ color: mutedColor }}>
                        <span style={{ color: faintColor }}>Requirement: </span>
                        {platform.liveRequirement}
                      </div>
                    )}
                  </div>

                  {currentAccount ? (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleDisconnect(currentAccount)}
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium"
                        style={{
                          borderColor: `${platform.color}33`,
                          color: platform.color,
                          background: `${platform.color}0F`,
                        }}
                      >
                        Disconnect
                        <X size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(currentAccount)}
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium"
                        style={{
                          borderColor: "rgba(239,68,68,0.24)",
                          color: "#ef4444",
                          background: "rgba(239,68,68,0.08)",
                        }}
                      >
                        Remove
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openConnect(platform.key)}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
                      style={{
                        color: "#ffffff",
                        background: platform.color,
                      }}
                    >
                      Connect account
                      <PlugZap size={12} />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold" style={{ color: textColor }}>
              Automation agents
            </h2>
            <p className="mt-1 text-xs" style={{ color: mutedColor }}>
              Client-facing automation modules currently available in the product.
            </p>
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
                This is the exact workflow clients will follow after account connection.
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
                        border: "1px solid rgba(29,78,216,0.10)",
                        background: darkMode ? "rgba(29,78,216,0.035)" : "rgba(29,78,216,0.025)",
                      }}
                    >
                      <div className="flex gap-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            background: "rgba(29,78,216,0.12)",
                            color: "#60A5FA",
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
                  { label: "Social accounts connected", ready: connectedCount > 0 },
                  { label: "All supported platforms ready", ready: readiness?.live_ready ?? false },
                  { label: "Publisher uses client credentials", ready: true },
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
                background: darkMode ? "rgba(6,182,212,0.08)" : "rgba(6,182,212,0.05)",
                borderColor: "rgba(6,182,212,0.18)",
              }}
            >
              <p className="text-xs leading-5" style={{ color: mutedColor }}>
                Connected credentials are required for live publishing. If a platform rejects a token
                or permission, the publish result will return a platform-specific error instead of a
                fake success.
              </p>
            </div>
          </div>
        </section>
      </div>

      {activeConnectPlatform && activeConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-2xl rounded-3xl border p-5 shadow-2xl"
            style={{
              background: darkMode ? "#0F172A" : "#ffffff",
              borderColor: darkMode ? "rgba(29,78,216,0.22)" : "rgba(15,23,42,0.10)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: textColor }}>
                  Connect {activeConfig.name}
                </h3>
                <p className="mt-1 text-xs leading-5" style={{ color: mutedColor }}>
                  Add the client's platform credentials. Tokens are stored encrypted in the backend.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveConnectPlatform(null)}
                className="rounded-xl p-2"
                style={{ color: mutedColor }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-xs font-medium" style={{ color: textColor }}>
                Account name
                <input
                  value={form.accountName}
                  onChange={(event) => setForm((prev) => ({ ...prev, accountName: event.target.value }))}
                  placeholder={activeConfig.placeholderAccount}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{
                    background: darkMode ? "rgba(255,255,255,0.04)" : "#ffffff",
                    borderColor: darkMode ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.12)",
                    color: textColor,
                  }}
                />
              </label>

              <label className="text-xs font-medium" style={{ color: textColor }}>
                {activeConfig.externalIdLabel}
                <input
                  value={form.externalAccountId}
                  onChange={(event) => setForm((prev) => ({ ...prev, externalAccountId: event.target.value }))}
                  placeholder={activeConfig.placeholderExternalId}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{
                    background: darkMode ? "rgba(255,255,255,0.04)" : "#ffffff",
                    borderColor: darkMode ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.12)",
                    color: textColor,
                  }}
                />
              </label>

              <label className="text-xs font-medium sm:col-span-2" style={{ color: textColor }}>
                {activeConfig.accessTokenLabel}
                <input
                  type="password"
                  value={form.accessToken}
                  onChange={(event) => setForm((prev) => ({ ...prev, accessToken: event.target.value }))}
                  placeholder="Paste access token"
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{
                    background: darkMode ? "rgba(255,255,255,0.04)" : "#ffffff",
                    borderColor: darkMode ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.12)",
                    color: textColor,
                  }}
                />
              </label>

              <label className="text-xs font-medium sm:col-span-2" style={{ color: textColor }}>
                {activeConfig.refreshTokenLabel || "Refresh token optional"}
                <input
                  type="password"
                  value={form.refreshToken}
                  onChange={(event) => setForm((prev) => ({ ...prev, refreshToken: event.target.value }))}
                  placeholder="Paste refresh token if available"
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{
                    background: darkMode ? "rgba(255,255,255,0.04)" : "#ffffff",
                    borderColor: darkMode ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.12)",
                    color: textColor,
                  }}
                />
              </label>

              <label className="text-xs font-medium" style={{ color: textColor }}>
                Scopes
                <input
                  value={form.scopes}
                  onChange={(event) => setForm((prev) => ({ ...prev, scopes: event.target.value }))}
                  placeholder={activeConfig.defaultScopes}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{
                    background: darkMode ? "rgba(255,255,255,0.04)" : "#ffffff",
                    borderColor: darkMode ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.12)",
                    color: textColor,
                  }}
                />
              </label>

              <label className="text-xs font-medium" style={{ color: textColor }}>
                Token expiry optional
                <input
                  type="datetime-local"
                  value={form.tokenExpiresAt}
                  onChange={(event) => setForm((prev) => ({ ...prev, tokenExpiresAt: event.target.value }))}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{
                    background: darkMode ? "rgba(255,255,255,0.04)" : "#ffffff",
                    borderColor: darkMode ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.12)",
                    color: textColor,
                  }}
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setActiveConnectPlatform(null)}
                className="rounded-xl border px-4 py-2 text-sm font-medium"
                style={{
                  borderColor: darkMode ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.12)",
                  color: mutedColor,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConnectSubmit}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
                style={{ background: activeConfig.color, color: "#ffffff" }}
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <PlugZap size={15} />}
                Save connection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
