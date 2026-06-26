import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Eye,
  Heart,
  MousePointer,
  Download,
  Filter,
  BarChart3,
} from "lucide-react";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
  const [signalFilter, setSignalFilter] = useState<"all" | "CRM" | "Property">("all");
  const [period, setPeriod] = useState("7d");
  const [metric, setMetric] = useState<"leads" | "properties" | "score">("leads");
  const [leads, setLeads] = useState<ClientLead[]>([]);
  const [properties, setProperties] = useState<ClientProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  const periodLabelMap: Record<string, string> = {
    "7d": "7-day",
    "30d": "30-day",
    "90d": "90-day",
    "1y": "1-year",
  };
  const periodLabel = periodLabelMap[period] || period;

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
        setLeads([]);
        setProperties([]);
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
    const hasRecords = totalLeads + totalProperties > 0;

    const hotLeads = leads.filter((lead) => (lead.score || 0) >= 80).length;
    const activeLeads = leads.filter(
      (lead) => !["converted", "lost"].includes((lead.status || "").toLowerCase())
    ).length;
    const convertedLeads = leads.filter(
      (lead) => (lead.status || "").toLowerCase() === "converted"
    ).length;
    const availableProperties = properties.filter((property) => property.status === "available").length;
    const soldProperties = properties.filter((property) => property.status === "sold").length;
    const rentedProperties = properties.filter((property) => property.status === "rented").length;
    const portfolioValue = properties.reduce((sum, property) => sum + (property.price || 0), 0);
    const avgLeadScore = totalLeads > 0
      ? Math.round(leads.reduce((sum, lead) => sum + (lead.score || 0), 0) / totalLeads)
      : 0;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
    const healthScore = hasRecords
      ? Math.min(
          100,
          Math.round(avgLeadScore * 0.55 + hotLeads * 5 + availableProperties * 3 + conversionRate * 0.35)
        )
      : 0;

    return {
      totalLeads,
      totalProperties,
      hasRecords,
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
    if (!analyticsStats.hasRecords) return weeklyData;

    return weeklyData.map((row, index) => ({
      day: row.day,
      leads: Math.round((analyticsStats.totalLeads * (index + 1)) / 7),
      properties: Math.round((analyticsStats.totalProperties * (index + 1)) / 7),
      score: analyticsStats.avgLeadScore,
    }));
  }, [analyticsStats]);

  const crmSignals = useMemo(() => {
    const leadRows = leads.slice(0, 3).map((lead) => ({
      content: `Lead: ${lead.name}`,
      reach: lead.status || "new",
      eng: `${lead.score || 0}/100 score`,
      platform: "CRM",
      trend: (lead.score || 0) >= 80 ? "Hot" : "New",
    }));

    const propertyRows = properties.slice(0, 3).map((property) => ({
      content: `Property: ${property.title}`,
      reach: property.location || "No location added",
      eng: formatPrice(property.price || 0),
      platform: "Property",
      trend: property.status || "available",
    }));

    return [...leadRows, ...propertyRows];
  }, [leads, properties]);

  const filteredSignals = useMemo(() => {
    if (signalFilter === "all") return crmSignals;
    return crmSignals.filter((signal) => signal.platform === signalFilter);
  }, [crmSignals, signalFilter]);

  function handleExportAnalytics() {
    const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows: unknown[][] = [
      ["Report", "Riddhi Sidhi Real Estate Analytics"],
      ["Snapshot Window", periodLabel],
      ["Total Leads", analyticsStats.totalLeads],
      ["Hot Leads", analyticsStats.hotLeads],
      ["Total Properties", analyticsStats.totalProperties],
      ["Available Properties", analyticsStats.availableProperties],
      ["Sold Properties", analyticsStats.soldProperties],
      ["Rented Properties", analyticsStats.rentedProperties],
      ["Business Health Score", analyticsStats.healthScore],
      [],
      ["Signals"],
      ["#", "Type", "Title", "Metric", "Score / Value", "Status"],
    ];

    filteredSignals.forEach((signal, index) => {
      rows.push([index + 1, signal.platform, signal.content, signal.reach, signal.eng, signal.trend]);
    });

    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `rs-real-estate-analytics-${period}.csv`;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

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
                ? "Loading business snapshot..."
                : apiMessage
                  ? `Business analytics unavailable · ${apiMessage}`
                  : analyticsStats.hasRecords
                    ? `Current ${periodLabel} snapshot from ${analyticsStats.totalLeads} leads and ${analyticsStats.totalProperties} properties`
                    : "No CRM or property records added yet"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs" style={{ color: darkMode ? "#94A3B8" : "#64748B" }}>
              Snapshot window
            </span>
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: darkMode ? "rgba(29,78,216,0.08)" : "rgba(29,78,216,0.04)" }}>
              {["7d", "30d", "90d", "1y"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="px-3 py-1.5 rounded-lg text-xs transition-all"
                  style={{
                    background: period === p ? (darkMode ? "rgba(29,78,216,0.2)" : "#ffffff") : "transparent",
                    color: period === p ? (darkMode ? "#60A5FA" : "#1D4ED8") : (darkMode ? "#94A3B8" : "#94a3b8"),
                    boxShadow: period === p && !darkMode ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleExportAnalytics}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all hover:bg-primary/5"
              style={{ borderColor: cardBase.borderColor, color: darkMode ? "#94A3B8" : "#94a3b8" }}
              title="Download analytics CSV"
            >
              <Download size={13} />
              Export CSV
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Leads", value: formatNumber(analyticsStats.totalLeads), change: "Live", icon: Users, color: "#1D4ED8" },
            { label: "Hot Leads", value: formatNumber(analyticsStats.hotLeads), change: "Priority", icon: Heart, color: "#e1306c" },
            { label: "Properties", value: formatNumber(analyticsStats.totalProperties), change: `${analyticsStats.availableProperties} available`, icon: Eye, color: "#06b6d4" },
            { label: "Portfolio Value", value: formatPrice(analyticsStats.portfolioValue), change: "Backend", icon: MousePointer, color: "#10b981" },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl p-5 border relative overflow-hidden group"
              style={cardBase}
            >
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: `radial-gradient(circle, ${kpi.color} 0%, transparent 70%)` }} />
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                  <kpi.icon size={16} style={{ color: kpi.color }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: analyticsStats.hasRecords ? "#10b981" : "#94A3B8" }}>
                  {kpi.change}
                </span>
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.03em", color: darkMode ? "#e2e8f0" : "#0f172a", lineHeight: 1 }}>
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
                  Business Snapshot
                </h3>
                <p className="text-xs mt-0.5" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
                  {analyticsStats.hasRecords ? `${periodLabel} snapshot from current records` : "No records yet"}
                </p>
              </div>
              <div className="flex gap-1">
                {(["leads", "properties", "score"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className="px-2.5 py-1 rounded-lg text-xs capitalize transition-all"
                    style={{
                      background: metric === m ? (darkMode ? "rgba(29,78,216,0.2)" : "rgba(29,78,216,0.1)") : "transparent",
                      color: metric === m ? (darkMode ? "#60A5FA" : "#1D4ED8") : (darkMode ? "#94A3B8" : "#94a3b8"),
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
                <Area type="monotone" dataKey={metric} stroke={chartColor} strokeWidth={2.5} fill="url(#grad)" dot={false} activeDot={{ r: 5, fill: chartColor, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl p-5 border flex flex-col justify-center"
            style={cardBase}
          >
            <h3 className="text-sm font-semibold mb-1" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
              Business Health
            </h3>
            <p className="text-xs mb-6" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
              Based only on live CRM and property records
            </p>
            <div className="text-center">
              <span className="text-5xl font-bold" style={{ color: analyticsStats.hasRecords ? "#1D4ED8" : "#64748B" }}>
                {analyticsStats.healthScore}
              </span>
              <span className="text-xs ml-1" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
                / 100 health score
              </span>
            </div>
            {!analyticsStats.hasRecords && (
              <p className="text-xs text-center mt-4" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
                Add leads or properties to generate a real health score.
              </p>
            )}
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
              <span style={{ fontSize: "1.75rem", fontWeight: 700, color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                {analyticsStats.totalProperties}
              </span>
              <span className="text-xs font-semibold" style={{ color: analyticsStats.availableProperties ? "#10b981" : "#94A3B8" }}>
                {analyticsStats.availableProperties} available
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label: "Available", value: analyticsStats.availableProperties, color: "#10b981" },
                { label: "Sold", value: analyticsStats.soldProperties, color: "#ef4444" },
                { label: "Rented", value: analyticsStats.rentedProperties, color: "#1D4ED8" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border px-3 py-2" style={{ borderColor: darkMode ? "rgba(29,78,216,0.08)" : "rgba(15,23,42,0.04)", background: darkMode ? "rgba(29,78,216,0.03)" : "rgba(29,78,216,0.02)" }}>
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
              <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: darkMode ? "rgba(29,78,216,0.08)" : "rgba(29,78,216,0.04)" }}>
                {[
                  { label: "All", value: "all" },
                  { label: "Leads", value: "CRM" },
                  { label: "Properties", value: "Property" },
                ].map((option) => {
                  const isActive = signalFilter === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSignalFilter(option.value as "all" | "CRM" | "Property")}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all"
                      style={{
                        background: isActive ? (darkMode ? "rgba(29,78,216,0.28)" : "#ffffff") : "transparent",
                        color: isActive ? (darkMode ? "#93C5FD" : "#1D4ED8") : (darkMode ? "#94A3B8" : "#64748B"),
                        boxShadow: isActive && !darkMode ? "0 1px 4px rgba(15,23,42,0.08)" : "none",
                      }}
                    >
                      {option.value === "all" && <Filter size={11} />}
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {filteredSignals.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center" style={{ borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)", color: darkMode ? "#94A3B8" : "#64748B" }}>
                <BarChart3 className="mx-auto mb-3" size={24} />
                <p className="text-sm font-medium">No live signals yet</p>
                <p className="text-xs mt-1">Add real leads or properties to show CRM and property signals here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSignals.map((signal, i) => (
                  <div key={`${signal.content}-${i}`} className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:border-primary/20 cursor-pointer group" style={{ borderColor: darkMode ? "rgba(29,78,216,0.08)" : "rgba(15,23,42,0.04)", background: darkMode ? "rgba(29,78,216,0.02)" : "rgba(29,78,216,0.01)" }}>
                    <span className="text-xs font-mono" style={{ color: darkMode ? "#2d3748" : "#cbd5e1", minWidth: "16px" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                        {signal.content}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
                          {signal.reach}
                        </span>
                        <span className="text-xs" style={{ color: "#10b981" }}>
                          {signal.eng}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: platformColors[signal.platform] || "#1D4ED8" }} />
                      <span className="text-xs font-semibold capitalize" style={{ color: "#10b981" }}>
                        {signal.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
