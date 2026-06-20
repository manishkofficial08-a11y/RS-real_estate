import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  RefreshCw,
  Sparkles,
  Users2,
} from "lucide-react";
import { motion } from "motion/react";
import {
  getClientBillingInvoices,
  getClientBillingPlans,
  getClientBillingSummary,
  getClientProfile,
  updateClientBillingSubscription,
  type ClientBillingCycle,
  type ClientBillingPlan,
  type ClientBillingSummary,
  type ClientInvoice,
  type ClientProfile,
  type ClientSubscriptionPlan,
} from "../lib/clientApi";

interface BillingProps {
  darkMode: boolean;
}

const usageLabels: Record<string, string> = {
  team_members: "Team members",
  media_uploads: "Media uploads",
  generated_posts: "Generated posts",
  scheduled_posts: "Scheduled posts",
  reports: "Reports",
};

const usageColors: Record<string, string> = {
  team_members: "#1D4ED8",
  media_uploads: "#06b6d4",
  generated_posts: "#2563EB",
  scheduled_posts: "#f59e0b",
  reports: "#10b981",
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function Billing({ darkMode }: BillingProps) {
  const [summary, setSummary] = useState<ClientBillingSummary | null>(null);
  const [plans, setPlans] = useState<ClientBillingPlan[]>([]);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [billingCycle, setBillingCycle] =
    useState<ClientBillingCycle>("monthly");
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const textPrimary = darkMode ? "#e2e8f0" : "#0f172a";
  const textMuted = darkMode ? "#94a3b8" : "#64748b";
  const textSoft = darkMode ? "#94A3B8" : "#94a3b8";
  const cardStyle = {
    background: darkMode ? "rgba(15,23,42,0.82)" : "#ffffff",
    borderColor: darkMode ? "rgba(29,78,216,0.13)" : "rgba(15,23,42,0.07)",
  };
  const profileRole = profile?.role === "client" ? "owner" : profile?.role;
  const canManage = profileRole === "owner" || profileRole === "admin";

  async function loadBilling(clearMessage = false) {
    try {
      setLoading(true);
      if (clearMessage) setMessage(null);
      const [summaryData, planData, invoiceData, profileData] =
        await Promise.all([
          getClientBillingSummary(),
          getClientBillingPlans(),
          getClientBillingInvoices(),
          getClientProfile(),
        ]);
      setSummary(summaryData);
      setPlans(planData);
      setInvoices(invoiceData);
      setProfile(profileData);
      setBillingCycle(summaryData.subscription.billing_cycle);
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Failed to load billing");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBilling(true);
  }, []);

  async function updateSubscription(payload: {
    plan?: ClientSubscriptionPlan;
    billing_cycle?: ClientBillingCycle;
    cancel_at_period_end?: boolean;
  }) {
    const key = payload.plan || "subscription";
    try {
      setActionKey(key);
      const result = await updateClientBillingSubscription(payload);
      setMessageTone("success");
      setMessage(result.message);
      await loadBilling();
    } catch (error) {
      setMessageTone("error");
      setMessage(
        error instanceof Error ? error.message : "Failed to update subscription",
      );
    } finally {
      setActionKey(null);
    }
  }

  const currentPlan = summary?.subscription.plan;
  const planOrder = useMemo(
    () =>
      [...plans].sort(
        (a, b) =>
          ["free", "pro", "enterprise"].indexOf(a.id) -
          ["free", "pro", "enterprise"].indexOf(b.id),
      ),
    [plans],
  );

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <CreditCard size={20} style={{ color: "#1D4ED8" }} />
              <h1 className="text-2xl font-semibold" style={{ color: textPrimary }}>
                Billing & Subscription
              </h1>
            </div>
            <p className="max-w-2xl text-sm" style={{ color: textMuted }}>
              Review your plan, workspace usage, renewal details, and invoice history.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadBilling(true)}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-xl border px-4 py-2 text-sm disabled:opacity-60"
            style={{ ...cardStyle, color: textMuted }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {message && (
          <div
            className="rounded-2xl border px-4 py-3 text-sm"
            style={{
              background:
                messageTone === "error"
                  ? "rgba(239,68,68,0.08)"
                  : "rgba(16,185,129,0.08)",
              borderColor:
                messageTone === "error"
                  ? "rgba(239,68,68,0.24)"
                  : "rgba(16,185,129,0.22)",
              color: messageTone === "error" ? "#ef4444" : "#10b981",
            }}
          >
            {message}
          </div>
        )}

        {loading && !summary ? (
          <div
            className="flex items-center justify-center gap-2 rounded-3xl border p-16 text-sm"
            style={{ ...cardStyle, color: textMuted }}
          >
            <RefreshCw size={16} className="animate-spin" />
            Loading subscription...
          </div>
        ) : summary ? (
          <>
            <section
              className="relative overflow-hidden rounded-3xl border p-5 sm:p-6"
              style={cardStyle}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-36"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(29,78,216,0.24), rgba(37,99,235,0.12), rgba(6,182,212,0.08))",
                }}
              />
              <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full border px-3 py-1 text-xs font-medium"
                      style={{
                        color: "#a5b4fc",
                        background: "rgba(29,78,216,0.12)",
                        borderColor: "rgba(29,78,216,0.25)",
                      }}
                    >
                      Current plan
                    </span>
                    <span
                      className="rounded-full px-3 py-1 text-xs capitalize"
                      style={{
                        color: "#10b981",
                        background: "rgba(16,185,129,0.10)",
                      }}
                    >
                      {summary.subscription.status}
                    </span>
                    <span
                      className="rounded-full px-3 py-1 text-xs capitalize"
                      style={{
                        color: textMuted,
                        background: darkMode
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(15,23,42,0.05)",
                      }}
                    >
                      {summary.billing_mode} billing
                    </span>
                  </div>
                  <h2
                    className="mt-5 text-3xl font-semibold"
                    style={{ color: textPrimary }}
                  >
                    {summary.plan.name}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm" style={{ color: textMuted }}>
                    {summary.message}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <div
                      className="rounded-2xl border px-4 py-3"
                      style={{ borderColor: cardStyle.borderColor }}
                    >
                      <p className="text-xs" style={{ color: textSoft }}>
                        Billing cycle
                      </p>
                      <p className="mt-1 text-sm font-medium capitalize" style={{ color: textPrimary }}>
                        {summary.subscription.billing_cycle}
                      </p>
                    </div>
                    <div
                      className="rounded-2xl border px-4 py-3"
                      style={{ borderColor: cardStyle.borderColor }}
                    >
                      <p className="text-xs" style={{ color: textSoft }}>
                        Current period ends
                      </p>
                      <p className="mt-1 text-sm font-medium" style={{ color: textPrimary }}>
                        {formatDate(summary.subscription.current_period_end)}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className="rounded-2xl border p-4"
                  style={{
                    background: darkMode
                      ? "rgba(2,6,23,0.28)"
                      : "rgba(248,250,252,0.78)",
                    borderColor: cardStyle.borderColor,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <CalendarClock size={18} style={{ color: "#f59e0b" }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: textPrimary }}>
                        Renewal preference
                      </p>
                      <p className="mt-1 text-xs leading-5" style={{ color: textMuted }}>
                        {summary.subscription.cancel_at_period_end
                          ? "The subscription is set to cancel when the current period ends."
                          : "The subscription will renew at the end of the current period."}
                      </p>
                    </div>
                  </div>
                  {canManage ? (
                    <button
                      type="button"
                      disabled={Boolean(actionKey)}
                      onClick={() =>
                        void updateSubscription({
                          cancel_at_period_end:
                            !summary.subscription.cancel_at_period_end,
                        })
                      }
                      className="mt-4 w-full rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-50"
                      style={{
                        borderColor: summary.subscription.cancel_at_period_end
                          ? "rgba(16,185,129,0.24)"
                          : "rgba(239,68,68,0.22)",
                        color: summary.subscription.cancel_at_period_end
                          ? "#10b981"
                          : "#ef4444",
                      }}
                    >
                      {summary.subscription.cancel_at_period_end
                        ? "Keep subscription active"
                        : "Cancel at period end"}
                    </button>
                  ) : (
                    <p className="mt-4 text-xs" style={{ color: textSoft }}>
                      Only workspace owners and admins can change billing.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section>
              <div className="mb-3">
                <h2 className="text-sm font-semibold" style={{ color: textPrimary }}>
                  Workspace usage
                </h2>
                <p className="mt-1 text-xs" style={{ color: textSoft }}>
                  Live counts from your tenant workspace.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {Object.entries(summary.usage).map(([key, usage]) => {
                  const unlimited = usage.limit == null;
                  const percentage = unlimited
                    ? 12
                    : Math.min(100, Math.round((usage.used / Math.max(usage.limit || 1, 1)) * 100));
                  const color = usageColors[key] || "#1D4ED8";
                  return (
                    <div key={key} className="rounded-2xl border p-4" style={cardStyle}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs" style={{ color: textSoft }}>
                          {usageLabels[key] || key}
                        </p>
                        {key === "team_members" && <Users2 size={14} style={{ color }} />}
                      </div>
                      <p className="mt-3 text-xl font-semibold" style={{ color: textPrimary }}>
                        {usage.used}
                        <span className="text-xs font-normal" style={{ color: textSoft }}>
                          {" "}/ {unlimited ? "Unlimited" : usage.limit}
                        </span>
                      </p>
                      <div
                        className="mt-3 h-1.5 overflow-hidden rounded-full"
                        style={{
                          background: darkMode
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(15,23,42,0.07)",
                        }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${percentage}%`, background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: textPrimary }}>
                    Compare plans
                  </h2>
                  <p className="mt-1 text-xs" style={{ color: textSoft }}>
                    Upgrade or downgrade locally while payment checkout remains provider-agnostic.
                  </p>
                </div>
                <div
                  className="flex w-fit rounded-xl p-1"
                  style={{
                    background: darkMode
                      ? "rgba(29,78,216,0.08)"
                      : "rgba(29,78,216,0.05)",
                  }}
                >
                  {(["monthly", "yearly"] as ClientBillingCycle[]).map((cycle) => (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setBillingCycle(cycle)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium capitalize"
                      style={{
                        background:
                          billingCycle === cycle
                            ? darkMode
                              ? "rgba(29,78,216,0.22)"
                              : "#ffffff"
                            : "transparent",
                        color:
                          billingCycle === cycle ? "#1D4ED8" : textMuted,
                      }}
                    >
                      {cycle}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {planOrder.map((plan, index) => {
                  const current = plan.id === currentPlan;
                  const currentSelection =
                    current &&
                    billingCycle === summary.subscription.billing_cycle;
                  const price =
                    billingCycle === "yearly"
                      ? plan.yearly_price
                      : plan.monthly_price;
                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative overflow-hidden rounded-3xl border p-5"
                      style={{
                        ...cardStyle,
                        borderColor: current
                          ? "rgba(29,78,216,0.40)"
                          : cardStyle.borderColor,
                        boxShadow: current
                          ? "0 14px 40px rgba(29,78,216,0.12)"
                          : "none",
                      }}
                    >
                      {current && (
                        <span
                          className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{
                            color: "#ffffff",
                            background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
                          }}
                        >
                          Current
                        </span>
                      )}
                      <Sparkles size={18} style={{ color: plan.id === "enterprise" ? "#f59e0b" : "#1D4ED8" }} />
                      <h3 className="mt-4 text-lg font-semibold" style={{ color: textPrimary }}>
                        {plan.name}
                      </h3>
                      <div className="mt-3">
                        {price == null ? (
                          <p className="text-2xl font-semibold" style={{ color: textPrimary }}>Custom</p>
                        ) : (
                          <p className="text-2xl font-semibold" style={{ color: textPrimary }}>
                            {formatMoney(price, plan.currency)}
                            <span className="text-xs font-normal" style={{ color: textSoft }}>
                              /{billingCycle === "yearly" ? "year" : "month"}
                            </span>
                          </p>
                        )}
                      </div>
                      <div className="mt-5 space-y-2.5">
                        {plan.features.map((feature) => (
                          <div key={feature} className="flex items-start gap-2 text-xs leading-5" style={{ color: textMuted }}>
                            <Check size={13} className="mt-0.5 shrink-0" style={{ color: "#10b981" }} />
                            {feature}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={
                          currentSelection || Boolean(actionKey) || !canManage
                        }
                        onClick={() => {
                          if (plan.id === "enterprise" && !current) {
                            setMessageTone("success");
                            setMessage("Enterprise checkout is a contact-sales placeholder for now.");
                            return;
                          }
                          void updateSubscription({
                            plan: plan.id,
                            billing_cycle: billingCycle,
                          });
                        }}
                        className="mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50"
                        style={{
                          background: currentSelection
                            ? darkMode
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(15,23,42,0.05)"
                            : "linear-gradient(135deg, #1D4ED8, #2563EB)",
                          color: current ? textMuted : "#ffffff",
                        }}
                      >
                        {actionKey === plan.id
                          ? "Updating..."
                          : currentSelection
                            ? "Current plan"
                            : current
                              ? `Switch to ${billingCycle}`
                            : plan.id === "enterprise"
                              ? "Contact sales"
                              : `${plan.id === "free" ? "Downgrade" : "Choose"} ${plan.name}`}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border" style={cardStyle}>
              <div className="border-b p-5" style={{ borderColor: cardStyle.borderColor }}>
                <div className="flex items-center gap-2">
                  <FileText size={16} style={{ color: "#1D4ED8" }} />
                  <h2 className="text-sm font-semibold" style={{ color: textPrimary }}>
                    Invoices
                  </h2>
                </div>
                <p className="mt-1 text-xs" style={{ color: textSoft }}>
                  Mock billing records today; Stripe or Razorpay links can plug in later.
                </p>
              </div>
              {invoices.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle2 className="mx-auto" size={25} style={{ color: "#10b981" }} />
                  <p className="mt-3 text-sm font-medium" style={{ color: textPrimary }}>
                    No invoices yet
                  </p>
                  <p className="mt-1 text-xs" style={{ color: textMuted }}>
                    Paid-plan changes in mock mode will create invoice placeholders here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px]">
                    <thead>
                      <tr style={{ background: darkMode ? "rgba(255,255,255,0.025)" : "#f8fafc" }}>
                        {["Invoice", "Amount", "Status", "Issued", "Due", "Paid", "Document"].map((label) => (
                          <th key={label} className="px-5 py-3 text-left text-xs font-medium" style={{ color: textSoft }}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-t" style={{ borderColor: cardStyle.borderColor }}>
                          <td className="px-5 py-4 text-xs font-medium" style={{ color: textPrimary }}>{invoice.invoice_number}</td>
                          <td className="px-5 py-4 text-xs" style={{ color: textPrimary }}>{formatMoney(invoice.amount, invoice.currency)}</td>
                          <td className="px-5 py-4">
                            <span className="rounded-full px-2.5 py-1 text-xs capitalize" style={{ color: invoice.status === "paid" ? "#10b981" : invoice.status === "failed" ? "#ef4444" : "#f59e0b", background: invoice.status === "paid" ? "rgba(16,185,129,0.10)" : invoice.status === "failed" ? "rgba(239,68,68,0.10)" : "rgba(245,158,11,0.10)" }}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs" style={{ color: textMuted }}>{formatDate(invoice.issued_at)}</td>
                          <td className="px-5 py-4 text-xs" style={{ color: textMuted }}>{formatDate(invoice.due_at)}</td>
                          <td className="px-5 py-4 text-xs" style={{ color: textMuted }}>{formatDate(invoice.paid_at)}</td>
                          <td className="px-5 py-4">
                            {invoice.invoice_url ? (
                              <a href={invoice.invoice_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: "#1D4ED8" }}>
                                <Download size={12} /> View
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs" style={{ color: textSoft }}>
                                <Download size={12} /> Placeholder
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="rounded-3xl border p-12 text-center" style={cardStyle}>
            <CreditCard className="mx-auto" size={28} style={{ color: textSoft }} />
            <p className="mt-3 text-sm font-medium" style={{ color: textPrimary }}>
              Billing data is unavailable
            </p>
            <p className="mt-1 text-xs" style={{ color: textMuted }}>
              Refresh the page or verify the backend billing endpoints.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
