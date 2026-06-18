import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Zap,
  Target,
  BarChart3,
  Star,
  Clock,
  ArrowRight,
  Sparkles,
  Brain,
  Globe,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Plus,
  RefreshCw,
} from "lucide-react";
import { motion } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getClientLeads, type ClientLead } from "../lib/clientApi";

const baseAreaData = [
  { day: "Mon", engagement: 4200, reach: 12000, leads: 0 },
  { day: "Tue", engagement: 5800, reach: 18000, leads: 0 },
  { day: "Wed", engagement: 4900, reach: 14500, leads: 0 },
  { day: "Thu", engagement: 7200, reach: 22000, leads: 0 },
  { day: "Fri", engagement: 8100, reach: 26000, leads: 0 },
  { day: "Sat", engagement: 6400, reach: 20000, leads: 0 },
  { day: "Sun", engagement: 9300, reach: 31000, leads: 0 },
];

const demoPlatformData = [
  { name: "Website", value: 38, color: "#6366f1" },
  { name: "Referral", value: 29, color: "#8b5cf6" },
  { name: "Social", value: 19, color: "#06b6d4" },
  { name: "Other", value: 14, color: "#f59e0b" },
];

const upcomingPosts = [
  { time: "Today 3:00 PM", platform: "Instagram", content: "New luxury apartment walkthrough reel", status: "scheduled" },
  { time: "Today 6:00 PM", platform: "LinkedIn", content: "Weekend open-house campaign update", status: "scheduled" },
  { time: "Tomorrow 9:00 AM", platform: "Twitter", content: "Buyer follow-up sequence for premium leads", status: "draft" },
  { time: "Tomorrow 2:00 PM", platform: "YouTube", content: "YouTube Shorts property tour export", status: "processing" },
];

interface DashboardProps {
  darkMode: boolean;
  onNavigate: (screen: string) => void;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function getSourceLabel(source?: string | null) {
  if (!source) return "Website";
  return source
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "LD"
  );
}

function MetricCard({
  label,
  value,
  change,
  positive,
  icon: Icon,
  color,
  darkMode,
  delay = 0,
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ElementType;
  color: string;
  darkMode: boolean;
  delay?: number;
}) {
  const floorLabel =
    label.includes("Buyer")
      ? "Lead Floor"
      : label.includes("Quality")
        ? "Scoring Floor"
        : label.includes("Pipeline")
          ? "Deal Floor"
          : "Control Floor";

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, rotateX: -6 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
      className="relative min-h-[154px] overflow-hidden rounded-[1.7rem] border p-5 group cursor-default"
      style={{
        background: darkMode
          ? "linear-gradient(145deg, rgba(15,23,42,0.90), rgba(30,41,59,0.72))"
          : "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(238,242,255,0.82))",
        borderColor: darkMode ? "rgba(129,140,248,0.20)" : "rgba(99,102,241,0.16)",
        boxShadow: darkMode
          ? "0 22px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "0 22px 50px rgba(99,102,241,0.14), inset 0 1px 0 rgba(255,255,255,0.85)",
        transformStyle: "preserve-3d",
      }}
    >
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div
        className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: color, opacity: darkMode ? 0.16 : 0.12 }}
      />

      <div
        className="absolute bottom-0 left-0 h-1.5 w-full"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div
              className="mb-3 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium"
              style={{ background: `${color}16`, color }}
            >
              {floorLabel}
            </div>

            <p className="text-xs" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
              {label}
            </p>

            <p
              className="mt-2"
              style={{
                fontSize: "2rem",
                fontWeight: 780,
                letterSpacing: "-0.055em",
                color: darkMode ? "#f8fafc" : "#0f172a",
                lineHeight: 1,
              }}
            >
              {value}
            </p>
          </div>

          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl border"
            style={{
              background: `${color}18`,
              borderColor: `${color}30`,
              boxShadow: `0 12px 28px ${color}22`,
            }}
          >
            <Icon size={20} style={{ color }} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1.5">
          {positive ? (
            <TrendingUp size={12} style={{ color: "#10b981" }} />
          ) : (
            <TrendingDown size={12} style={{ color: "#ef4444" }} />
          )}

          <span className="text-xs font-medium" style={{ color: positive ? "#10b981" : "#ef4444" }}>
            {change}
          </span>

          <span className="text-xs" style={{ color: darkMode ? "#475569" : "#94a3b8" }}>
            live
          </span>
        </div>
      </div>
    </motion.div>
  );
}



function SmartBuildingScene({
  darkMode,
  stats,
}: {
  darkMode: boolean;
  stats: { healthScore: number; activeLeads: number; hotLeads: number; conversionRate: number };
}) {
  const floors = [
    { name: "Lead Lobby", value: stats.activeLeads, color: "#6366f1" },
    { name: "Site Visit Deck", value: stats.hotLeads, color: "#06b6d4" },
    { name: "Negotiation Suite", value: stats.conversionRate, color: "#f59e0b" },
    { name: "Closing Floor", value: stats.healthScore, color: "#10b981" },
  ];

  return (
    <div
      className="relative min-h-[360px] overflow-hidden rounded-[2rem] border p-5"
      style={{
        background: darkMode
          ? "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(2,6,23,0.88))"
          : "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(224,231,255,0.72))",
        borderColor: darkMode ? "rgba(129,140,248,0.24)" : "rgba(99,102,241,0.18)",
        boxShadow: darkMode ? "0 30px 90px rgba(0,0,0,0.5)" : "0 30px 90px rgba(99,102,241,0.22)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(99,102,241,0.09) 1px, transparent 1px), linear-gradient(0deg, rgba(99,102,241,0.08) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          opacity: darkMode ? 0.28 : 0.38,
        }}
      />

      <div className="absolute left-6 top-5 z-20 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium"
        style={{
          color: darkMode ? "#a5b4fc" : "#4f46e5",
          background: darkMode ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.10)",
          borderColor: darkMode ? "rgba(129,140,248,0.24)" : "rgba(99,102,241,0.16)",
        }}
      >
        <Brain size={13} />
        AI tower live
      </div>

      <div className="relative z-10 grid h-full grid-cols-1 gap-5 pt-9 md:grid-cols-[0.72fr_1fr]">
        <div className="flex flex-col justify-end">
          <h2 className="text-xl font-semibold leading-tight" style={{ color: darkMode ? "#f8fafc" : "#0f172a" }}>
            AI Concierge Actions is moving through your sales tower.
          </h2>
          <p className="mt-3 text-xs leading-5" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
            Every floor represents a live client action: lead capture, site-visit readiness, negotiation and closing momentum.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            {floors.map((floor) => (
              <div
                key={floor.name}
                className="rounded-2xl border p-3"
                style={{
                  background: darkMode ? "rgba(15,23,42,0.58)" : "rgba(255,255,255,0.78)",
                  borderColor: darkMode ? "rgba(129,140,248,0.16)" : "rgba(99,102,241,0.12)",
                }}
              >
                <p className="text-[10px] uppercase tracking-wide" style={{ color: darkMode ? "#64748b" : "#94a3b8" }}>
                  {floor.name}
                </p>
                <p className="mt-1 text-base font-bold" style={{ color: floor.color }}>
                  {floor.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative h-[310px]">
          <div className="absolute bottom-0 left-1/2 h-[290px] w-[220px] -translate-x-1/2 rounded-t-[2.4rem] border"
            style={{
              background: darkMode
                ? "linear-gradient(180deg, rgba(30,41,59,0.94), rgba(15,23,42,0.86))"
                : "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(219,234,254,0.78))",
              borderColor: darkMode ? "rgba(129,140,248,0.25)" : "rgba(99,102,241,0.18)",
              boxShadow: darkMode ? "0 34px 90px rgba(0,0,0,0.55)" : "0 34px 90px rgba(99,102,241,0.22)",
            }}
          >
            <div className="absolute inset-x-7 top-6 grid grid-cols-3 gap-3">
              {Array.from({ length: 21 }).map((_, index) => (
                <motion.span
                  key={index}
                  className="h-5 rounded-lg"
                  animate={{ opacity: [0.22, 0.75, 0.22] }}
                  transition={{ duration: 2.8, repeat: Infinity, delay: index * 0.08 }}
                  style={{
                    background: index % 4 === 0 ? "rgba(6,182,212,0.55)" : darkMode ? "rgba(129,140,248,0.22)" : "rgba(99,102,241,0.20)",
                  }}
                />
              ))}
            </div>

            <div className="absolute left-1/2 top-5 h-[244px] w-[50px] -translate-x-1/2 rounded-full border"
              style={{
                background: darkMode ? "rgba(2,6,23,0.72)" : "rgba(255,255,255,0.66)",
                borderColor: darkMode ? "rgba(129,140,248,0.20)" : "rgba(99,102,241,0.14)",
              }}
            />

            <motion.div
              className="absolute left-1/2 top-7 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-2xl text-xs font-bold"
              animate={{ y: [0, 178, 92, 0] }}
              transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                color: "#ffffff",
                boxShadow: "0 0 36px rgba(99,102,241,0.64)",
              }}
            >
              AI
            </motion.div>
          </div>

          <motion.div
            className="absolute right-1 top-4 h-24 w-24 rounded-[2rem] border p-3"
            animate={{ y: [0, -10, 0], rotate: [0, 2, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: darkMode ? "rgba(15,23,42,0.82)" : "rgba(255,255,255,0.88)",
              borderColor: darkMode ? "rgba(129,140,248,0.24)" : "rgba(99,102,241,0.16)",
              boxShadow: darkMode ? "0 24px 70px rgba(0,0,0,0.42)" : "0 24px 70px rgba(99,102,241,0.24)",
            }}
          >
            <div className="flex h-full flex-col items-center justify-center">
              <div className="mb-1 flex gap-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#06b6d4" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#8b5cf6" }} />
              </div>
              <p className="text-[11px] font-bold" style={{ color: darkMode ? "#f8fafc" : "#0f172a" }}>BOT</p>
              <p className="text-[8px]" style={{ color: darkMode ? "#64748b" : "#94a3b8" }}>concierge</p>
            </div>
          </motion.div>

          <div className="absolute bottom-4 right-2 rounded-2xl border px-3 py-2 text-[10px] font-medium"
            style={{
              color: "#10b981",
              background: darkMode ? "rgba(16,185,129,0.10)" : "rgba(16,185,129,0.12)",
              borderColor: "rgba(16,185,129,0.22)",
            }}
          >
            Live pipeline elevator
          </div>
        </div>
      </div>
    </div>
  );
}



const platformIcons: Record<string, React.ElementType> = {
  Instagram,
  LinkedIn: Linkedin,
  Twitter,
  YouTube: Youtube,
};

const statusColors: Record<string, string> = {
  scheduled: "#10b981",
  draft: "#f59e0b",
  processing: "#6366f1",
};

export function Dashboard({ darkMode, onNavigate }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"engagement" | "reach" | "leads">("leads");
  const [leads, setLeads] = useState<ClientLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardLeads() {
      try {
        setLoadingLeads(true);
        setLeadError(null);

        const data = await getClientLeads();
        setLeads(data);
      } catch (err) {
        setLeadError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        setLoadingLeads(false);
      }
    }

    loadDashboardLeads();
  }, []);

  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const hotLeads = leads.filter((lead) => (lead.score || 0) >= 80).length;
    const warmLeads = leads.filter((lead) => (lead.score || 0) >= 60 && (lead.score || 0) < 80).length;
    const activeLeads = leads.filter((lead) => !["converted", "lost"].includes((lead.status || "").toLowerCase())).length;
    const convertedLeads = leads.filter((lead) => (lead.status || "").toLowerCase() === "converted").length;
    const avgScore =
      totalLeads > 0
        ? Math.round(leads.reduce((sum, lead) => sum + (lead.score || 0), 0) / totalLeads)
        : 0;

    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
    const healthScore =
      totalLeads > 0
        ? Math.min(100, Math.max(45, Math.round(avgScore * 0.75 + hotLeads * 4 + conversionRate * 0.25)))
        : 62;

    return {
      totalLeads,
      hotLeads,
      warmLeads,
      activeLeads,
      convertedLeads,
      avgScore,
      conversionRate,
      healthScore,
    };
  }, [leads]);

  const areaData = useMemo(() => {
    return baseAreaData.map((item, index) => {
      const leadTrend = stats.totalLeads === 0 ? 0 : Math.max(1, Math.round((stats.totalLeads * (index + 1)) / 7));

      return {
        ...item,
        leads: leadTrend,
      };
    });
  }, [stats.totalLeads]);

  const platformData = useMemo(() => {
    if (leads.length === 0) return demoPlatformData;

    const sourceCount = leads.reduce<Record<string, number>>((acc, lead) => {
      const source = getSourceLabel(lead.source);
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    const colors = ["#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981"];
    const total = leads.length;

    return Object.entries(sourceCount).map(([name, count], index) => ({
      name,
      value: Math.round((count / total) * 100),
      color: colors[index % colors.length],
    }));
  }, [leads]);

  const recentLeads = useMemo(() => {
    return leads.slice(0, 4);
  }, [leads]);

  const aiRecommendations = useMemo(() => {
    return [
      {
        icon: Target,
        text:
          stats.hotLeads > 0
            ? `${stats.hotLeads} hot leads have high intent. Call them before they cool down.`
            : "No hot leads yet. Improve lead qualification and add fresh prospects.",
        action: "View CRM",
        screen: "crm",
        color: "#06b6d4",
      },
      {
        icon: Star,
        text:
          stats.avgScore > 0
            ? `Average lead score is ${stats.avgScore}/100. Focus on leads above 70 first.`
            : "Lead score data is empty. Start capturing source, budget and requirement details.",
        action: "Open CRM",
        screen: "crm",
        color: "#8b5cf6",
      },
      {
        icon: TrendingUp,
        text: `${stats.activeLeads} active leads are currently in pipeline. Keep follow-ups tight.`,
        action: "Follow up",
        screen: "crm",
        color: "#6366f1",
      },
      {
        icon: Brain,
        text: "Next AI step: auto-generate follow-up messages from lead status and source.",
        action: "AI Studio",
        screen: "ai-studio",
        color: "#f59e0b",
      },
    ];
  }, [stats]);

  const chartColor = darkMode ? "#818cf8" : "#6366f1";
  const gridColor = darkMode ? "rgba(99,102,241,0.06)" : "rgba(15,23,42,0.04)";
  const tickColor = darkMode ? "#2d3748" : "#cbd5e1";
  const tooltipBg = darkMode ? "#0d0d28" : "#ffffff";

  return (
    <div className="h-full overflow-y-auto" style={{ perspective: "1400px" }}>
      <div className="relative p-6 max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2.4rem] border p-6"
          style={{
            background: darkMode
              ? "linear-gradient(135deg, rgba(2,6,23,0.98), rgba(15,23,42,0.94) 44%, rgba(30,41,59,0.88))"
              : "linear-gradient(135deg, #ffffff, #f8fafc 44%, #e0e7ff)",
            borderColor: darkMode ? "rgba(129,140,248,0.24)" : "rgba(99,102,241,0.16)",
            boxShadow: darkMode ? "0 34px 110px rgba(0,0,0,0.55)" : "0 34px 110px rgba(99,102,241,0.18)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, rgba(99,102,241,0.10) 1px, transparent 1px), linear-gradient(0deg, rgba(99,102,241,0.08) 1px, transparent 1px)",
              backgroundSize: "38px 38px",
              opacity: darkMode ? 0.26 : 0.38,
            }}
          />

          <div
            className="absolute -left-20 top-10 h-52 w-52 rounded-full blur-3xl"
            style={{ background: "rgba(99,102,241,0.22)" }}
          />
          <div
            className="absolute -right-20 bottom-0 h-64 w-64 rounded-full blur-3xl"
            style={{ background: "rgba(6,182,212,0.18)" }}
          />

          <div className="relative z-10 grid gap-7 xl:grid-cols-[0.86fr_1.14fr] xl:items-center">
            <div>
              <div
                className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1"
                style={{
                  background: darkMode ? "rgba(99,102,241,0.16)" : "rgba(99,102,241,0.10)",
                  border: darkMode ? "1px solid rgba(129,140,248,0.24)" : "1px solid rgba(99,102,241,0.14)",
                  color: darkMode ? "#a5b4fc" : "#4f46e5",
                }}
              >
                <Sparkles size={14} />
                <span className="text-xs font-medium">RS Real Estate Smart Tower</span>
              </div>

              <h1
                className="max-w-2xl tracking-tight"
                style={{
                  color: darkMode ? "#f8fafc" : "#0f172a",
                  fontSize: "2.45rem",
                  fontWeight: 820,
                  lineHeight: 0.98,
                  letterSpacing: "-0.06em",
                }}
              >
                Run every buyer lead like an elevator to closing.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                A real-estate command lobby for lead quality, property demand, active pipeline and campaign actions — powered by your AI assistant.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={() => onNavigate("ai-studio")}
                  className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
                    color: "#ffffff",
                    boxShadow: "0 16px 40px rgba(99,102,241,0.38)",
                  }}
                >
                  <Sparkles size={14} />
                  Create property campaign
                </button>

                <button
                  onClick={() => onNavigate("crm")}
                  className="flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm transition-all hover:bg-primary/5"
                  style={{
                    borderColor: darkMode ? "rgba(129,140,248,0.26)" : "rgba(99,102,241,0.18)",
                    color: darkMode ? "#a5b4fc" : "#4f46e5",
                    background: darkMode ? "rgba(99,102,241,0.07)" : "rgba(255,255,255,0.76)",
                  }}
                >
                  <Users size={14} />
                  Review buyer leads
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="rounded-2xl border p-2.5 transition-all hover:bg-primary/5"
                  style={{
                    borderColor: darkMode ? "rgba(129,140,248,0.22)" : "rgba(99,102,241,0.16)",
                    color: darkMode ? "#94a3b8" : "#64748b",
                    background: darkMode ? "rgba(15,23,42,0.48)" : "rgba(255,255,255,0.76)",
                  }}
                  aria-label="Refresh dashboard"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            <SmartBuildingScene darkMode={darkMode} stats={stats} />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            label="Buyer Leads"
            value={loadingLeads ? "..." : formatNumber(stats.totalLeads)}
            change={stats.totalLeads > 0 ? "Live" : "0"}
            positive={stats.totalLeads > 0}
            darkMode={darkMode}
            icon={Users}
            color="#6366f1"
            delay={0.1}
          />
          <MetricCard
            label="Hot Buyer Leads"
            value={loadingLeads ? "..." : formatNumber(stats.hotLeads)}
            change={stats.hotLeads > 0 ? "Priority" : "None"}
            positive={stats.hotLeads > 0}
            darkMode={darkMode}
            icon={Target}
            color="#8b5cf6"
            delay={0.15}
          />
          <MetricCard
            label="Lead Quality Score"
            value={loadingLeads ? "..." : `${stats.avgScore || 0}/100`}
            change={stats.avgScore >= 60 ? "Healthy" : "Needs data"}
            positive={stats.avgScore >= 60}
            darkMode={darkMode}
            icon={Star}
            color="#06b6d4"
            delay={0.2}
          />
          <MetricCard
            label="Active Deal Pipeline"
            value={loadingLeads ? "..." : formatNumber(stats.activeLeads)}
            change={stats.activeLeads > 0 ? "Follow-up" : "Empty"}
            positive={stats.activeLeads > 0}
            darkMode={darkMode}
            icon={Zap}
            color="#f59e0b"
            delay={0.25}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-2xl p-5 border"
            style={{
              background: darkMode ? "rgba(13, 13, 40, 0.8)" : "#ffffff",
              borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                  Observation Deck: Property Demand
                </h3>
                <p className="text-xs mt-0.5" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
                  Buyer enquiry, reach and campaign movement
                </p>
              </div>

              <div className="flex gap-1">
                {(["engagement", "reach", "leads"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-3 py-1.5 rounded-lg text-xs capitalize transition-all"
                    style={{
                      background:
                        activeTab === tab
                          ? darkMode
                            ? "rgba(99,102,241,0.2)"
                            : "rgba(99,102,241,0.1)"
                          : "transparent",
                      color:
                        activeTab === tab
                          ? darkMode
                            ? "#818cf8"
                            : "#6366f1"
                          : darkMode
                            ? "#4a5568"
                            : "#94a3b8",
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{
                    background: tooltipBg,
                    border: `1px solid ${darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)"}`,
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: darkMode ? "#e2e8f0" : "#0f172a",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={activeTab}
                  stroke={chartColor}
                  strokeWidth={2}
                  fill="url(#areaGrad)"
                  dot={{ fill: chartColor, r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: chartColor, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl p-5 border"
            style={{
              background: darkMode ? "rgba(13, 13, 40, 0.8)" : "#ffffff",
              borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
              backdropFilter: "blur(16px)",
            }}
          >
            <h3 className="text-sm font-semibold mb-1" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
              Source Floor: Buyer Enquiries
            </h3>
            <p className="text-xs mb-4" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
              Backend source distribution
            </p>

            <div className="flex justify-center mb-4">
              <PieChart width={140} height={140}>
                <Pie data={platformData} cx={70} cy={70} innerRadius={48} outerRadius={65} paddingAngle={3} dataKey="value">
                  {platformData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>

            <div className="space-y-2">
              {platformData.map((platform) => (
                <div key={platform.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: platform.color }} />
                    <span className="text-xs" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                      {platform.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                    {platform.value}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-5 border"
            style={{
              background: darkMode ? "rgba(13, 13, 40, 0.8)" : "#ffffff",
              borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                <Brain size={12} className="text-white" />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                AI Concierge Actions
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8" }}>
                live
              </span>
            </div>

            <div className="space-y-3">
              {aiRecommendations.map((rec, index) => (
                <div
                  key={`${rec.action}-${index}`}
                  className="flex items-start gap-3 p-3 rounded-xl border transition-all hover:border-primary/20 group cursor-pointer"
                  style={{
                    borderColor: darkMode ? "rgba(99,102,241,0.08)" : "rgba(15,23,42,0.04)",
                    background: darkMode ? "rgba(99,102,241,0.03)" : "rgba(99,102,241,0.02)",
                  }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${rec.color}15` }}>
                    <rec.icon size={13} style={{ color: rec.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed" style={{ color: darkMode ? "#94a3b8" : "#475569" }}>
                      {rec.text}
                    </p>
                  </div>

                  <button
                    onClick={() => onNavigate(rec.screen)}
                    className="text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                    style={{ background: `${rec.color}15`, color: rec.color }}
                  >
                    {rec.action}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-2xl p-5 border"
            style={{
              background: darkMode ? "rgba(13, 13, 40, 0.8)" : "#ffffff",
              borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(6,182,212,0.15)" }}>
                  <Clock size={12} style={{ color: "#06b6d4" }} />
                </div>
                <h3 className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                  Buyer Follow-up Lounge
                </h3>
              </div>

              <button
                onClick={() => onNavigate("crm")}
                className="text-xs flex items-center gap-1 transition-all hover:opacity-80"
                style={{ color: darkMode ? "#818cf8" : "#6366f1" }}
              >
                View CRM <ArrowRight size={11} />
              </button>
            </div>

            <div className="space-y-3">
              {recentLeads.length > 0 ? (
                recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-start gap-3 p-3 rounded-xl border group cursor-pointer transition-all hover:border-primary/20"
                    style={{
                      borderColor: darkMode ? "rgba(99,102,241,0.08)" : "rgba(15,23,42,0.04)",
                      background: darkMode ? "rgba(99,102,241,0.03)" : "rgba(99,102,241,0.02)",
                    }}
                    onClick={() => onNavigate("crm")}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: darkMode ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.06)", color: darkMode ? "#818cf8" : "#6366f1" }}
                    >
                      {getInitials(lead.name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                        {lead.name}
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}>
                        {lead.email || lead.phone || getSourceLabel(lead.source)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: lead.score >= 80 ? "#10b981" : "#f59e0b" }} />
                      <span className="text-xs capitalize" style={{ color: lead.score >= 80 ? "#10b981" : "#f59e0b" }}>
                        {lead.score || 50}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                upcomingPosts.slice(0, 3).map((post, index) => {
                  const PlatformIcon = platformIcons[post.platform] || Globe;
                  return (
                    <div
                      key={`${post.platform}-${index}`}
                      className="flex items-start gap-3 p-3 rounded-xl border group cursor-pointer transition-all hover:border-primary/20"
                      style={{
                        borderColor: darkMode ? "rgba(99,102,241,0.08)" : "rgba(15,23,42,0.04)",
                        background: darkMode ? "rgba(99,102,241,0.03)" : "rgba(99,102,241,0.02)",
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: darkMode ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.06)" }}
                      >
                        <PlatformIcon size={13} style={{ color: darkMode ? "#818cf8" : "#6366f1" }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                          {post.content}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}>
                          Demo fallback Â· {post.time}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColors[post.status] }} />
                        <span className="text-xs capitalize" style={{ color: statusColors[post.status] }}>
                          {post.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => onNavigate("crm")}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs transition-all hover:bg-primary/5"
              style={{
                borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                color: darkMode ? "#818cf8" : "#6366f1",
                borderStyle: "dashed",
              }}
            >
              <Plus size={12} />
              Add or manage leads
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { icon: Sparkles, label: "Generate Caption", color: "#6366f1", screen: "ai-studio" },
            { icon: BarChart3, label: "View Analytics", color: "#8b5cf6", screen: "analytics" },
            { icon: Users, label: "Check CRM", color: "#06b6d4", screen: "crm" },
            { icon: FileText, label: "Properties", color: "#f59e0b", screen: "properties" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => onNavigate(action.screen)}
              className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] group"
              style={{
                background: darkMode ? `${action.color}08` : `${action.color}05`,
                borderColor: darkMode ? `${action.color}18` : `${action.color}10`,
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                style={{ background: `${action.color}15` }}
              >
                <action.icon size={16} style={{ color: action.color }} />
              </div>

              <span className="text-sm font-medium" style={{ color: darkMode ? "#94a3b8" : "#475569" }}>
                {action.label}
              </span>
            </button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
