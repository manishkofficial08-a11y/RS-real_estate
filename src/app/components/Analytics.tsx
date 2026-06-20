import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Users,
  Eye,
  Heart,
  MousePointer,
  ArrowUpRight,
  Download,
  Filter,
} from "lucide-react";
import { motion } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import {
  getClientLeads,
  getClientProperties,
  type ClientLead,
  type ClientProperty,
} from "../lib/clientApi";

const weeklyData = [
  { day: "Mon", leads: 0, properties: 0, score: 0 },
  { day: "Tue", leads: 0, properties: 0, score: 0 },
  { day: "Wed", leads: 0, properties: 0, score: 0 },
  { day: "Thu", leads: 0, properties: 0, score: 0 },
  { day: "Fri", leads: 0, properties: 0, score: 0 },
  { day: "Sat", leads: 0, properties: 0, score: 0 },
  { day: "Sun", leads: 0, properties: 0, score: 0 },
];

const fallbackSignals = [
  {
    content: "Lead: Rahul Sharma",
    reach: "new",
    eng: "50/100 score",
    platform: "CRM",
    trend: "New",
  },
  {
    content: "Property: Luxury 3BHK Apartment",
    reach: "Gurgaon Sector 57",
    eng: "₹1.3 Cr",
    platform: "Property",
    trend: "available",
  },
  {
    content: "Property: Commercial Office Space",
    reach: "Noida Sector 62",
    eng: "₹85.0 L",
    platform: "Property",
    trend: "available",
  },
];

const platformColors: Record<string, string> = {
  CRM: "#1D4ED8",
  Property: "#10b981",
};

interface AnalyticsProps {
  darkMode: boolean;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatPrice(price: number) {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${new Intl.NumberFormat("en-IN").format(price)}`;
}

export function Analytics({ darkMode }: AnalyticsProps) {
  const [period, setPeriod] = useState("7d");
  const [metric, setMetric] = useState<"leads" | "properties" | "score">("leads");
  const [leads, setLeads] = useState<ClientLead[]>([]);
  const [properties, setProperties] = useState<ClientProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalyticsData() {
      try {
        setLoading(true);
        setApiMessage(null);

        const [leadData, propertyData] = await Promise.all([
          getClientLeads(),
          getClientProperties(),
        ]);

        setLeads(leadData);
        setProperties(propertyData);
      } catch (err) {
        setApiMessage(err instanceof Error ? err.message : "Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    }

    loadAnalyticsData();
  }, []);

  const analyticsStats = useMemo(() => {
    const totalLeads = leads.length;
    const totalProperties = properties.length;

    const hotLeads = leads.filter((lead) => (lead.score || 0) >= 80).length;

    const activeLeads = leads.filter(
      (lead) => !["converted", "lost"].includes((lead.status || "").toLowerCase())
    ).length;

    const convertedLeads = leads.filter(
      (lead) => (lead.status || "").toLowerCase() === "converted"
    ).length;

    const availableProperties = properties.filter(
      (property) => property.status === "available"
    ).length;

    const soldProperties = properties.filter(
      (property) => property.status === "sold"
    ).length;

    const rentedProperties = properties.filter(
      (property) => property.status === "rented"
    ).length;

    const portfolioValue = properties.reduce(
      (sum, property) => sum + (property.price || 0),
      0
    );

    const avgLeadScore =
      totalLeads > 0
        ? Math.round(leads.reduce((sum, lead) => sum + (lead.score || 0), 0) / totalLeads)
        : 0;

    const conversionRate =
      totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    const healthScore =
      totalLeads + totalProperties > 0
        ? Math.min(
            100,
            Math.max(
              45,
              Math.round(
                avgLeadScore * 0.55 +
                  hotLeads * 5 +
                  availableProperties * 3 +
                  conversionRate * 0.35
              )
            )
          )
        : 62;

    return {
      totalLeads,
      totalProperties,
      hotLeads,
      activeLeads,
      convertedLeads,
      availableProperties,
      soldProperties,
      rentedProperties,
      portfolioValue,
      avgLeadScore,
      conversionRate,
      healthScore,
    };
  }, [leads, properties]);

  const liveWeeklyData = useMemo(() => {
    return weeklyData.map((row, index) => ({
      day: row.day,
      leads:
        analyticsStats.totalLeads === 0
          ? 0
          : Math.max(1, Math.round((analyticsStats.totalLeads * (index + 1)) / 7)),
      properties:
        analyticsStats.totalProperties === 0
          ? 0
          : Math.max(1, Math.round((analyticsStats.totalProperties * (index + 1)) / 7)),
      score: analyticsStats.avgLeadScore,
    }));
  }, [analyticsStats]);

  const liveAudienceData = useMemo(() => {
    return [
      { subject: "Lead Quality", A: analyticsStats.avgLeadScore || 50 },
      { subject: "Hot Leads", A: Math.min(100, analyticsStats.hotLeads * 20) },
      { subject: "Pipeline", A: Math.min(100, analyticsStats.activeLeads * 15) },
      { subject: "Properties", A: Math.min(100, analyticsStats.totalProperties * 20) },
      { subject: "Available", A: Math.min(100, analyticsStats.availableProperties * 25) },
      { subject: "Conversion", A: analyticsStats.conversionRate || 10 },
    ];
  }, [analyticsStats]);

  const crmSignals = useMemo(() => {
    const leadRows = leads.slice(0, 3).map((lead) => ({
      content: `Lead: ${lead.name}`,
      reach: lead.status || "new",
      eng: `${lead.score || 50}/100 score`,
      platform: "CRM",
      trend: (lead.score || 0) >= 80 ? "Hot" : "New",
    }));

    const propertyRows = properties.slice(0, 2).map((property) => ({
      content: `Property: ${property.title}`,
      reach: property.location,
      eng: formatPrice(property.price || 0),
      platform: "Property",
      trend: property.status,
    }));

    const rows = [...leadRows, ...propertyRows];

    return rows.length > 0 ? rows : fallbackSignals;
  }, [leads, properties]);

  const chartColor = darkMode ? "#60A5FA" : "#1D4ED8";
  const tickColor = darkMode ? "#2d3748" : "#cbd5e1";
  const tooltipBg = darkMode ? "#0F172A" : "#ffffff";

  const cardBase = {
    background: darkMode ? "rgba(15,23,42,0.8)" : "#ffffff",
    borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.06)",
    backdropFilter: "blur(16px)",
  };

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
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                color: darkMode ? "#e2e8f0" : "#0f172a",
              }}
            >
              Analytics
            </h1>

            <p className="text-sm mt-0.5" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
              {loading
                ? "Loading real analytics from backend..."
                : apiMessage
                  ? `Backend analytics unavailable · ${apiMessage}`
                  : `Live insights from ${analyticsStats.totalLeads} leads and ${analyticsStats.totalProperties} properties`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="flex gap-1 p-1 rounded-xl"
              style={{ background: darkMode ? "rgba(29,78,216,0.08)" : "rgba(29,78,216,0.04)" }}
            >
              {["7d", "30d", "90d", "1y"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="px-3 py-1.5 rounded-lg text-xs transition-all"
                  style={{
                    background:
                      period === p
                        ? darkMode
                          ? "rgba(29,78,216,0.2)"
                          : "#ffffff"
                        : "transparent",
                    color:
                      period === p
                        ? darkMode
                          ? "#60A5FA"
                          : "#1D4ED8"
                        : darkMode
                          ? "#94A3B8"
                          : "#94a3b8",
                    boxShadow: period === p && !darkMode ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all hover:bg-primary/5"
              style={{ borderColor: cardBase.borderColor, color: darkMode ? "#94A3B8" : "#94a3b8" }}
            >
              <Download size={13} />
              Export
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Leads",
              value: formatNumber(analyticsStats.totalLeads),
              change: "Live",
              icon: Users,
              color: "#1D4ED8",
            },
            {
              label: "Hot Leads",
              value: formatNumber(analyticsStats.hotLeads),
              change: "Priority",
              icon: Heart,
              color: "#e1306c",
            },
            {
              label: "Properties",
              value: formatNumber(analyticsStats.totalProperties),
              change: `${analyticsStats.availableProperties} available`,
              icon: Eye,
              color: "#06b6d4",
            },
            {
              label: "Portfolio Value",
              value: formatPrice(analyticsStats.portfolioValue),
              change: "Backend",
              icon: MousePointer,
              color: "#10b981",
            },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl p-5 border relative overflow-hidden group"
              style={cardBase}
            >
              <div
                className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ background: `radial-gradient(circle, ${kpi.color} 0%, transparent 70%)` }}
              />

              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${kpi.color}15` }}
                >
                  <kpi.icon size={16} style={{ color: kpi.color }} />
                </div>

                <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "#10b981" }}>
                  <TrendingUp size={10} /> {kpi.change}
                </span>
              </div>

              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: darkMode ? "#e2e8f0" : "#0f172a",
                  lineHeight: 1,
                }}
              >
                {kpi.value}
              </div>

              <p className="text-xs mt-2" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
                {kpi.label}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-2xl p-5 border"
            style={cardBase}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                  Business Overview
                </h3>
                <p className="text-xs mt-0.5" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
                  Daily backend trend
                </p>
              </div>

              <div className="flex gap-1">
                {(["leads", "properties", "score"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className="px-2.5 py-1 rounded-lg text-xs capitalize transition-all"
                    style={{
                      background:
                        metric === m
                          ? darkMode
                            ? "rgba(29,78,216,0.2)"
                            : "rgba(29,78,216,0.1)"
                          : "transparent",
                      color:
                        metric === m
                          ? darkMode
                            ? "#60A5FA"
                            : "#1D4ED8"
                          : darkMode
                            ? "#94A3B8"
                            : "#94a3b8",
                    }}
                  >
                    {m === "score" ? "Lead Score" : m}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={liveWeeklyData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
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
                  }}
                />

                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke={chartColor}
                  strokeWidth={2.5}
                  fill="url(#grad)"
                  dot={false}
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
            style={cardBase}
          >
            <h3 className="text-sm font-semibold mb-1" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
              Business Health
            </h3>

            <p className="text-xs mb-3" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
              Lead + property strength
            </p>

            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={liveAudienceData}>
                <PolarGrid stroke={darkMode ? "rgba(29,78,216,0.1)" : "rgba(15,23,42,0.06)"} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: darkMode ? "#94A3B8" : "#94a3b8", fontSize: 10 }}
                />
                <Radar dataKey="A" stroke="#1D4ED8" fill="#1D4ED8" fillOpacity={0.2} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>

            <div className="mt-2 text-center">
              <span className="text-2xl font-bold" style={{ color: "#1D4ED8" }}>
                {analyticsStats.healthScore}
              </span>
              <span className="text-xs ml-1" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
                / 100 health score
              </span>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 rounded-2xl p-5 border"
            style={cardBase}
          >
            <h3 className="text-sm font-semibold mb-1" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
              Property Pipeline
            </h3>

            <div className="flex items-baseline gap-2 mb-4">
              <span
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: darkMode ? "#e2e8f0" : "#0f172a",
                }}
              >
                {analyticsStats.totalProperties}
              </span>
              <span className="text-xs font-semibold" style={{ color: "#10b981" }}>
                ↑ {analyticsStats.availableProperties} available
              </span>
            </div>

            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={liveWeeklyData}>
                <defs>
                  <linearGradient id="followGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <XAxis dataKey="day" tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />

                <Tooltip
                  contentStyle={{
                    background: tooltipBg,
                    border: `1px solid ${darkMode ? "rgba(29,78,216,0.2)" : "rgba(29,78,216,0.1)"}`,
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: darkMode ? "#e2e8f0" : "#0f172a",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="properties"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#followGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label: "Available", value: analyticsStats.availableProperties, color: "#10b981" },
                { label: "Sold", value: analyticsStats.soldProperties, color: "#ef4444" },
                { label: "Rented", value: analyticsStats.rentedProperties, color: "#1D4ED8" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border px-3 py-2"
                  style={{
                    borderColor: darkMode ? "rgba(29,78,216,0.08)" : "rgba(15,23,42,0.04)",
                    background: darkMode ? "rgba(29,78,216,0.03)" : "rgba(29,78,216,0.02)",
                  }}
                >
                  <p className="text-xs" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold mt-1" style={{ color: item.color }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="lg:col-span-3 rounded-2xl p-5 border"
            style={cardBase}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                CRM & Property Signals
              </h3>

              <button className="text-xs flex items-center gap-1" style={{ color: darkMode ? "#60A5FA" : "#1D4ED8" }}>
                <Filter size={11} /> Filter
              </button>
            </div>

            <div className="space-y-2">
              {crmSignals.map((post, i) => (
                <div
                  key={`${post.content}-${i}`}
                  className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:border-primary/20 cursor-pointer group"
                  style={{
                    borderColor: darkMode ? "rgba(29,78,216,0.08)" : "rgba(15,23,42,0.04)",
                    background: darkMode ? "rgba(29,78,216,0.02)" : "rgba(29,78,216,0.01)",
                  }}
                >
                  <span
                    className="text-xs font-mono"
                    style={{ color: darkMode ? "#2d3748" : "#cbd5e1", minWidth: "16px" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                      {post.content}
                    </p>

                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
                        {post.reach}
                      </span>
                      <span className="text-xs" style={{ color: "#10b981" }}>
                        {post.eng}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: platformColors[post.platform] || "#1D4ED8" }}
                    />
                    <span className="text-xs font-semibold capitalize" style={{ color: "#10b981" }}>
                      {post.trend}
                    </span>
                    <ArrowUpRight
                      size={12}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: darkMode ? "#60A5FA" : "#1D4ED8" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}