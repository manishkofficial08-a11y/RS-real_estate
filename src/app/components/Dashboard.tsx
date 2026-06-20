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
  { name: "Website", value: 38, color: "#1D4ED8" },
  { name: "Referral", value: 29, color: "#2563EB" },
  { name: "Social", value: 19, color: "#06b6d4" },
  { name: "Other", value: 14, color: "#f59e0b" },
];

const upcomingPosts = [
  { time: "Today 3:00 PM", platform: "Instagram", content: "New premium residential listing campaign for Riddhi Sidhi Real Estate", status: "scheduled" },
  { time: "Today 6:00 PM", platform: "LinkedIn", content: "How we 10x'd our lead gen using AI automation", status: "scheduled" },
  { time: "Tomorrow 9:00 AM", platform: "Twitter", content: "Property buying checklist for serious home buyers", status: "draft" },
  { time: "Tomorrow 2:00 PM", platform: "YouTube", content: "Riddhi Sidhi Real Estate portal walkthrough for property teams", status: "processing" },
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative rounded-2xl p-5 border overflow-hidden group cursor-default"
      style={{
        background: darkMode ? "rgba(13, 13, 40, 0.8)" : "#ffffff",
        borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.06)",
        backdropFilter: "blur(16px)",
        boxShadow: darkMode
          ? "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)"
          : "0 1px 3px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }}
      />

      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        style={{ background: `linear-gradient(135deg, ${color}08 0%, transparent 60%)` }}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs mb-3" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
            {label}
          </p>

          <p
            className="mb-1"
            style={{
              fontSize: "1.75rem",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: darkMode ? "#e2e8f0" : "#0f172a",
              lineHeight: 1,
            }}
          >
            {value}
          </p>

          <div className="flex items-center gap-1 mt-2">
            {positive ? (
              <TrendingUp size={11} style={{ color: "#10b981" }} />
            ) : (
              <TrendingDown size={11} style={{ color: "#ef4444" }} />
            )}

            <span className="text-xs" style={{ color: positive ? "#10b981" : "#ef4444" }}>
              {change}
            </span>
          </div>
        </div>

        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, boxShadow: `0 0 12px ${color}20` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
      </div>
    </motion.div>
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
  processing: "#1D4ED8",
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

    const colors = ["#1D4ED8", "#2563EB", "#06b6d4", "#f59e0b", "#10b981"];
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
            : "No priority leads yet. Add fresh enquiries to start lead qualification.",
        action: "View CRM",
        screen: "crm",
        color: "#06b6d4",
      },
      {
        icon: Star,
        text:
          stats.avgScore > 0
            ? `Average lead score is ${stats.avgScore}/100. Focus on leads above 70 first.`
            : "Lead score data will appear after enquiries include source, budget and requirement details.",
        action: "Open CRM",
        screen: "crm",
        color: "#2563EB",
      },
      {
        icon: TrendingUp,
        text: `${stats.activeLeads} active leads are currently in pipeline. Keep follow-ups tight.`,
        action: "Follow up",
        screen: "crm",
        color: "#1D4ED8",
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

  const chartColor = darkMode ? "#60A5FA" : "#1D4ED8";
  const gridColor = darkMode ? "rgba(29,78,216,0.06)" : "rgba(15,23,42,0.04)";
  const tickColor = darkMode ? "#2d3748" : "#cbd5e1";
  const tooltipBg = darkMode ? "#0F172A" : "#ffffff";

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1
              className="tracking-tight"
              style={{ color: darkMode ? "#e2e8f0" : "#0f172a", fontSize: "1.5rem", fontWeight: 600 }}
            >
              Business Overview
            </h1>

            <p className="text-sm mt-1" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
              {loadingLeads
                ? "Loading your business dashboard..."
                : leadError
                  ? `Business data unavailable · ${leadError}`
                  : `Your business health score is ${stats.healthScore}/100 with ${stats.activeLeads} active leads requiring follow-up.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate("ai-studio")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
                color: "#ffffff",
                boxShadow: "0 4px 14px rgba(29,78,216,0.35)",
              }}
            >
              <Sparkles size={14} />
              Create with AI
            </button>

            <button
              onClick={() => window.location.reload()}
              className="p-2 rounded-xl border transition-all hover:bg-primary/5"
              style={{
                borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.06)",
                color: darkMode ? "#94A3B8" : "#94a3b8",
              }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative rounded-2xl p-5 overflow-hidden border"
          style={{
            background: darkMode
              ? "linear-gradient(135deg, rgba(29,78,216,0.12) 0%, rgba(37,99,235,0.08) 50%, rgba(6,182,212,0.06) 100%)"
              : "linear-gradient(135deg, rgba(29,78,216,0.06) 0%, rgba(37,99,235,0.04) 100%)",
            borderColor: darkMode ? "rgba(29,78,216,0.2)" : "rgba(29,78,216,0.1)",
          }}
        >
          <div
            className="absolute top-0 right-0 w-64 h-32 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 80% 20%, rgba(29,78,216,0.15) 0%, transparent 60%)",
            }}
          />

          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke={darkMode ? "rgba(29,78,216,0.15)" : "rgba(29,78,216,0.08)"}
                  strokeWidth="6"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="url(#healthGrad)"
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 34 * (stats.healthScore / 100)} ${2 * Math.PI * 34}`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1D4ED8" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: darkMode ? "#e2e8f0" : "#0f172a",
                    lineHeight: 1,
                  }}
                >
                  {stats.healthScore}
                </span>
                <span className="text-xs" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
                  / 100
                </span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-3 gap-4">
              {[
                { label: "Lead Quality", value: `${stats.avgScore || 0}%`, color: "#10b981" },
                { label: "Active Pipeline", value: `${stats.activeLeads}`, color: "#1D4ED8" },
                { label: "Conversion", value: `${stats.conversionRate}%`, color: "#f59e0b" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
                      {item.label}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: item.color }}>
                      {item.value}
                    </span>
                  </div>

                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: darkMode ? "rgba(29,78,216,0.1)" : "rgba(29,78,216,0.06)" }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width:
                          item.label === "Active Pipeline"
                            ? `${Math.min(100, stats.activeLeads * 12)}%`
                            : item.value,
                      }}
                      transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex-shrink-0">
              <button
                onClick={() => onNavigate("analytics")}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs border transition-all hover:bg-primary/5"
                style={{
                  borderColor: darkMode ? "rgba(29,78,216,0.2)" : "rgba(29,78,216,0.1)",
                  color: darkMode ? "#60A5FA" : "#1D4ED8",
                }}
              >
                Full Report <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Leads"
            value={loadingLeads ? "..." : formatNumber(stats.totalLeads)}
            change={stats.totalLeads > 0 ? "Active" : "No leads"}
            positive={stats.totalLeads > 0}
            darkMode={darkMode}
            icon={Users}
            color="#1D4ED8"
            delay={0.1}
          />
          <MetricCard
            label="Hot Leads"
            value={loadingLeads ? "..." : formatNumber(stats.hotLeads)}
            change={stats.hotLeads > 0 ? "Priority" : "No priority leads"}
            positive={stats.hotLeads > 0}
            darkMode={darkMode}
            icon={Target}
            color="#2563EB"
            delay={0.15}
          />
          <MetricCard
            label="Average Score"
            value={loadingLeads ? "..." : `${stats.avgScore || 0}/100`}
            change={stats.avgScore >= 60 ? "Healthy" : "Needs data"}
            positive={stats.avgScore >= 60}
            darkMode={darkMode}
            icon={Star}
            color="#06b6d4"
            delay={0.2}
          />
          <MetricCard
            label="Active Pipeline"
            value={loadingLeads ? "..." : formatNumber(stats.activeLeads)}
            change={stats.activeLeads > 0 ? "Follow-up" : "No active deals"}
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
              borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.06)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                  Performance Overview
                </h3>
                <p className="text-xs mt-0.5" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
                  Lead trend + marketing performance
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
                            ? "rgba(29,78,216,0.2)"
                            : "rgba(29,78,216,0.1)"
                          : "transparent",
                      color:
                        activeTab === tab
                          ? darkMode
                            ? "#60A5FA"
                            : "#1D4ED8"
                          : darkMode
                            ? "#94A3B8"
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
                    border: `1px solid ${darkMode ? "rgba(29,78,216,0.2)" : "rgba(29,78,216,0.1)"}`,
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
              borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.06)",
              backdropFilter: "blur(16px)",
            }}
          >
            <h3 className="text-sm font-semibold mb-1" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
              Lead Source Share
            </h3>
            <p className="text-xs mb-4" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
              Lead source distribution
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
              borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.06)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB)" }}>
                <Brain size={12} className="text-white" />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                AI Recommendations
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(29,78,216,0.1)", color: "#60A5FA" }}>
                live
              </span>
            </div>

            <div className="space-y-3">
              {aiRecommendations.map((rec, index) => (
                <div
                  key={`${rec.action}-${index}`}
                  className="flex items-start gap-3 p-3 rounded-xl border transition-all hover:border-primary/20 group cursor-pointer"
                  style={{
                    borderColor: darkMode ? "rgba(29,78,216,0.08)" : "rgba(15,23,42,0.04)",
                    background: darkMode ? "rgba(29,78,216,0.03)" : "rgba(29,78,216,0.02)",
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
              borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.06)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(6,182,212,0.15)" }}>
                  <Clock size={12} style={{ color: "#06b6d4" }} />
                </div>
                <h3 className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                  Recent Leads
                </h3>
              </div>

              <button
                onClick={() => onNavigate("crm")}
                className="text-xs flex items-center gap-1 transition-all hover:opacity-80"
                style={{ color: darkMode ? "#60A5FA" : "#1D4ED8" }}
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
                      borderColor: darkMode ? "rgba(29,78,216,0.08)" : "rgba(15,23,42,0.04)",
                      background: darkMode ? "rgba(29,78,216,0.03)" : "rgba(29,78,216,0.02)",
                    }}
                    onClick={() => onNavigate("crm")}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: darkMode ? "rgba(29,78,216,0.1)" : "rgba(29,78,216,0.06)", color: darkMode ? "#60A5FA" : "#1D4ED8" }}
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
                        borderColor: darkMode ? "rgba(29,78,216,0.08)" : "rgba(15,23,42,0.04)",
                        background: darkMode ? "rgba(29,78,216,0.03)" : "rgba(29,78,216,0.02)",
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: darkMode ? "rgba(29,78,216,0.1)" : "rgba(29,78,216,0.06)" }}
                      >
                        <PlatformIcon size={13} style={{ color: darkMode ? "#60A5FA" : "#1D4ED8" }} />
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
                borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(29,78,216,0.08)",
                color: darkMode ? "#60A5FA" : "#1D4ED8",
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
            { icon: Sparkles, label: "Generate Caption", color: "#1D4ED8", screen: "ai-studio" },
            { icon: BarChart3, label: "View Analytics", color: "#2563EB", screen: "analytics" },
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
