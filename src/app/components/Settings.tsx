import { useEffect, useMemo, useState } from "react";
import { CLIENT_BRANDING } from "../lib/clientBranding";
import {
  Building2,
  CheckCircle2,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  User,
  WalletCards,
} from "lucide-react";
import { motion } from "motion/react";
import {
  clearClientSession,
  getClientProfile,
  type ClientProfile,
} from "../lib/clientApi";

interface SettingsProps {
  darkMode: boolean;
}

function formatLabel(value?: string | null) {
  if (!value) return "Not set";
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitials(name?: string | null) {
  if (!name) return "RS";

  return (
    name
      .trim()
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "RS"
  );
}

const socialIntegrationCards = [
  {
    name: "Instagram Business",
    description:
      "Connect a professional Instagram account for reels, posts, and listing creatives.",
    status: "Setup required",
    requiredInfo: ["Instagram Business Account ID", "Facebook Page ID"],
    buttonLabel: "Connect after backend setup",
    color: "#e879f9",
  },
  {
    name: "Facebook Page",
    description:
      "Prepare a business Page connection for automated property and campaign publishing.",
    status: "Token needed",
    requiredInfo: ["Facebook Page ID", "Page access token"],
    buttonLabel: "Coming soon",
    color: "#3b82f6",
  },
  {
    name: "LinkedIn",
    description:
      "Enable company or profile publishing for professional real estate updates.",
    status: "Ready after deployment",
    requiredInfo: ["LinkedIn Author URN"],
    buttonLabel: "Connect after backend setup",
    color: "#06b6d4",
  },
  {
    name: "YouTube",
    description:
      "Prepare video publishing for walkthroughs, shorts, and property showcase content.",
    status: "Ready after deployment",
    requiredInfo: ["YouTube Channel access"],
    buttonLabel: "Coming soon",
    color: "#ef4444",
  },
  {
    name: "Twitter/X",
    description:
      "Prepare short-form publishing for listing announcements and campaign updates.",
    status: "Token needed",
    requiredInfo: ["Twitter/X API credentials"],
    buttonLabel: "Connect after backend setup",
    color: "#94a3b8",
  },
];

export function Settings({ darkMode }: SettingsProps) {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const cardBase = {
    background: darkMode ? "rgba(13,13,40,0.8)" : "#ffffff",
    borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
  };

  async function loadProfile() {
    try {
      setLoading(true);
      setMessage(null);

      const data = await getClientProfile();
      setProfile(data);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const profileCards = useMemo(
    () => [
      {
        icon: User,
        label: "User Name",
        value: CLIENT_BRANDING.ownerName,
        color: "#6366f1",
      },
      {
        icon: Mail,
        label: "Email",
        value: CLIENT_BRANDING.ownerEmail,
        color: "#06b6d4",
      },
      {
        icon: Building2,
        label: "Business",
        value: CLIENT_BRANDING.businessName,
        color: "#8b5cf6",
      },
      {
        icon: ShieldCheck,
        label: "Role",
        value: formatLabel(profile?.role || "client"),
        color: "#10b981",
      },
      {
        icon: WalletCards,
        label: "Plan",
        value: formatLabel(profile?.plan || "free"),
        color: "#f59e0b",
      },
      {
        icon: CheckCircle2,
        label: "Business Type",
        value: CLIENT_BRANDING.businessType,
        color: "#ef4444",
      },
    ],
    [profile],
  );

  function handleLogout() {
    clearClientSession();
    window.location.reload();
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                color: darkMode ? "#e2e8f0" : "#0f172a",
              }}
            >
              Settings
            </h1>

            <p
              className="text-sm mt-1"
              style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}
            >
              Manage your business profile, account identity and portal details.
            </p>
          </div>

          <button
            onClick={loadProfile}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border disabled:opacity-60"
            style={{
              background: darkMode ? "rgba(99,102,241,0.04)" : "#ffffff",
              borderColor: cardBase.borderColor,
              color: darkMode ? "#94a3b8" : "#64748b",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {message && (
          <div
            className="rounded-2xl border px-4 py-3 text-sm"
            style={{
              background: darkMode
                ? "rgba(239,68,68,0.08)"
                : "rgba(239,68,68,0.06)",
              borderColor: "rgba(239,68,68,0.25)",
              color: "#ef4444",
            }}
          >
            {message}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border p-6 overflow-hidden relative"
          style={{
            background: cardBase.background,
            borderColor: cardBase.borderColor,
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-28 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.12), rgba(6,182,212,0.10))",
            }}
          />

          <div className="relative flex flex-col md:flex-row md:items-center gap-5">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-xl font-semibold"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#ffffff",
                boxShadow: "0 18px 42px rgba(99,102,241,0.35)",
              }}
            >
              <img
                src={CLIENT_BRANDING.logoUrl}
                alt={`${CLIENT_BRANDING.businessName} logo`}
                className="h-full w-full rounded-3xl object-contain bg-white p-1"
              />
            </div>

            <div className="flex-1">
              <p
                className="text-xs uppercase tracking-[0.2em] mb-2"
                style={{ color: darkMode ? "#818cf8" : "#6366f1" }}
              >
                Workspace
              </p>

              <h2
                className="text-2xl font-semibold"
                style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
              >
                {CLIENT_BRANDING.businessName}
              </h2>

              <p
                className="text-sm mt-1"
                style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
              >
                {CLIENT_BRANDING.businessType} · {CLIENT_BRANDING.planLabel}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: darkMode
                  ? "rgba(239,68,68,0.12)"
                  : "rgba(239,68,68,0.08)",
                color: "#ef4444",
              }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {profileCards.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-2xl border p-5"
              style={{
                background: cardBase.background,
                borderColor: cardBase.borderColor,
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `${item.color}18`,
                    color: item.color,
                  }}
                >
                  <item.icon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="text-xs"
                    style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}
                  >
                    {item.label}
                  </p>

                  <p
                    className="text-sm font-medium mt-1 truncate"
                    style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                    title={item.value}
                  >
                    {item.value}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div
          className="rounded-2xl border p-5"
          style={{
            background: cardBase.background,
            borderColor: cardBase.borderColor,
          }}
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h3
                className="text-sm font-semibold"
                style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
              >
                Social Integrations
              </h3>
              <p
                className="mt-1 max-w-2xl text-sm"
                style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
              >
                Prepare platform connections for automated publishing. Live
                OAuth connection will be enabled after publisher backend setup.
              </p>
            </div>

            <span
              className="w-fit rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                background: darkMode
                  ? "rgba(99,102,241,0.10)"
                  : "rgba(99,102,241,0.08)",
                borderColor: "rgba(99,102,241,0.22)",
                color: darkMode ? "#a5b4fc" : "#6366f1",
              }}
            >
              Readiness preview
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {socialIntegrationCards.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + index * 0.04 }}
                className="rounded-2xl border p-4"
                style={{
                  background: darkMode ? "rgba(99,102,241,0.04)" : "#f8fafc",
                  borderColor: darkMode
                    ? "rgba(99,102,241,0.10)"
                    : "rgba(15,23,42,0.06)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4
                      className="text-sm font-semibold"
                      style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                    >
                      {platform.name}
                    </h4>
                    <p
                      className="mt-2 text-xs leading-5"
                      style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                    >
                      {platform.description}
                    </p>
                  </div>

                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold"
                    style={{
                      background: `${platform.color}18`,
                      color: platform.color,
                    }}
                  >
                    {platform.name.charAt(0)}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full border px-2 py-1 text-xs font-medium"
                    style={{
                      background: `${platform.color}12`,
                      borderColor: `${platform.color}35`,
                      color: platform.color,
                    }}
                  >
                    {platform.status}
                  </span>
                  <span
                    className="rounded-full border px-2 py-1 text-xs"
                    style={{
                      background: darkMode
                        ? "rgba(255,255,255,0.04)"
                        : "#ffffff",
                      borderColor: cardBase.borderColor,
                      color: darkMode ? "#64748b" : "#94a3b8",
                    }}
                  >
                    No OAuth yet
                  </span>
                </div>

                <div
                  className="mt-4 rounded-xl border p-3"
                  style={{
                    background: darkMode ? "rgba(13,13,40,0.45)" : "#ffffff",
                    borderColor: cardBase.borderColor,
                  }}
                >
                  <p
                    className="text-xs font-medium"
                    style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                  >
                    Information needed
                  </p>
                  <div className="mt-2 space-y-2">
                    {platform.requiredInfo.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 text-xs"
                        style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: platform.color }}
                        />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  className="mt-4 w-full rounded-xl px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70"
                  style={{
                    background: darkMode
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(15,23,42,0.05)",
                    color: darkMode ? "#94a3b8" : "#64748b",
                  }}
                >
                  {platform.buttonLabel}
                </button>
              </motion.div>
            ))}
          </div>

          <p
            className="mt-4 text-xs"
            style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
          >
            This section is UI-only. It does not collect secrets, store tokens,
            or start a real OAuth flow.
          </p>
        </div>

        <div
          className="rounded-2xl border p-5"
          style={{
            background: cardBase.background,
            borderColor: cardBase.borderColor,
          }}
        >
          <h3
            className="text-sm font-semibold mb-2"
            style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
          >
            Connected modules
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {[
              "Client authentication is active",
              "Business profile is loaded from backend",
              "CRM leads are backend connected",
              "Properties are backend connected",
              "Analytics and reports use real data",
              "Profile editing and password change are planned next",
            ].map((text) => (
              <div
                key={text}
                className="flex items-center gap-2 text-sm"
                style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
              >
                <CheckCircle2 size={15} style={{ color: "#10b981" }} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
