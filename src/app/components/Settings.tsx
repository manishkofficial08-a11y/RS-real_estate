import { useEffect, useMemo, useState } from "react";
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
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
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
        value: profile?.full_name || "Client User",
        color: "#6366f1",
      },
      {
        icon: Mail,
        label: "Email",
        value: profile?.email || "Email not available",
        color: "#06b6d4",
      },
      {
        icon: Building2,
        label: "Business",
        value: profile?.business_name || "RS Real Estate",
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
        value: formatLabel(profile?.business_type || "real_estate"),
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
              background: darkMode ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.06)",
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
              {getInitials(profile?.business_name || profile?.full_name)}
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
                {profile?.business_name || "RS Real Estate"}
              </h2>

              <p
                className="text-sm mt-1"
                style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
              >
                {formatLabel(profile?.business_type || "real_estate")} Ã‚Â·{" "}
                {formatLabel(profile?.plan || "free")} Plan
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: darkMode ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
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
