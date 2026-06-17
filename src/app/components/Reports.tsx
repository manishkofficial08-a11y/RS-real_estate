import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileBarChart,
  Mail,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
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

interface ReportsProps {
  darkMode: boolean;
}

type SummaryPoint = {
  type: "win" | "attention";
  text: string;
};

type RecentReportItem = {
  title: string;
  meta: string;
  type: "CRM" | "Property" | "System";
  signal: string;
  color: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatPrice(price: number) {
  if (price >= 10000000) return `â‚¹${(price / 10000000).toFixed(1)} Cr`;
  if (price >= 100000) return `â‚¹${(price / 100000).toFixed(1)} L`;
  return `â‚¹${new Intl.NumberFormat("en-IN").format(price)}`;
}

function getStatusCount(items: { status?: string }[], status: string) {
  return items.filter((item) => (item.status || "").toLowerCase() === status).length;
}

export function Reports({ darkMode }: ReportsProps) {
  const [activeReport, setActiveReport] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [exporting, setExporting] = useState(false);
  const [leads, setLeads] = useState<ClientLead[]>([]);
  const [properties, setProperties] = useState<ClientProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadReportData() {
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
        setApiMessage(err instanceof Error ? err.message : "Failed to load report data");
      } finally {
        setLoading(false);
      }
    }

    loadReportData();
  }, []);

  const reportStats = useMemo(() => {
    const totalLeads = leads.length;
    const totalProperties = properties.length;

    const hotLeads = leads.filter((lead) => (lead.score || 0) >= 80).length;
    const newLeads = getStatusCount(leads, "new");
    const contactedLeads = getStatusCount(leads, "contacted");
    const qualifiedLeads = getStatusCount(leads, "qualified");
    const convertedLeads = getStatusCount(leads, "converted");
    const lostLeads = getStatusCount(leads, "lost");

    const availableProperties = getStatusCount(properties, "available");
    const soldProperties = getStatusCount(properties, "sold");
    const rentedProperties = getStatusCount(properties, "rented");

    const portfolioValue = properties.reduce((sum, property) => sum + (property.price || 0), 0);

    const avgLeadScore = totalLeads > 0
      ? Math.round(leads.reduce((sum, lead) => sum + (lead.score || 0), 0) / totalLeads)
      : 0;

    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
    const availabilityRate = totalProperties > 0 ? Math.round((availableProperties / totalProperties) * 100) : 0;

    const businessScore = totalLeads + totalProperties > 0
      ? Math.min(100, Math.max(45, Math.round(
          avgLeadScore * 0.45 +
          hotLeads * 5 +
          availabilityRate * 0.25 +
          conversionRate * 0.45
        )))
      : 62;

    return {
      totalLeads,
      totalProperties,
      hotLeads,
      newLeads,
      contactedLeads,
      qualifiedLeads,
      convertedLeads,
      lostLeads,
      availableProperties,
      soldProperties,
      rentedProperties,
      portfolioValue,
      avgLeadScore,
      conversionRate,
      availabilityRate,
      businessScore,
    };
  }, [leads, properties]);

  const trendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

    return months.map((month, index) => {
      const ratio = (index + 1) / months.length;

      return {
        month,
        leads: reportStats.totalLeads === 0 ? 0 : Math.max(1, Math.round(reportStats.totalLeads * ratio)),
        properties: reportStats.totalProperties === 0 ? 0 : Math.max(1, Math.round(reportStats.totalProperties * ratio)),
      };
    });
  }, [reportStats]);

  const aiSummaryPoints = useMemo<SummaryPoint[]>(() => {
    const points: SummaryPoint[] = [];

    points.push(
      reportStats.totalLeads > 0
        ? {
            type: "win",
            text: `${reportStats.totalLeads} total leads captured. Average lead score is ${reportStats.avgLeadScore}/100.`,
          }
        : {
            type: "attention",
            text: "No real leads found yet. Add CRM leads to generate stronger report insights.",
          }
    );

    points.push(
      reportStats.hotLeads > 0
        ? {
            type: "win",
            text: `${reportStats.hotLeads} hot leads need priority follow-up for faster conversion.`,
          }
        : {
            type: "attention",
            text: "No hot leads detected yet. Improve lead qualification and scoring.",
          }
    );

    points.push(
      reportStats.totalProperties > 0
        ? {
            type: "win",
            text: `${reportStats.totalProperties} properties are listed with portfolio value of ${formatPrice(reportStats.portfolioValue)}.`,
          }
        : {
            type: "attention",
            text: "No backend properties found yet. Add listings to activate inventory reports.",
          }
    );

    if (reportStats.availableProperties > 0) {
      points.push({
        type: "win",
        text: `${reportStats.availableProperties} properties are available for active campaigns and CRM matching.`,
      });
    }

    points.push(
      reportStats.conversionRate > 0
        ? {
            type: "win",
            text: `Lead conversion rate is ${reportStats.conversionRate}%. Keep tracking converted vs lost leads.`,
          }
        : {
            type: "attention",
            text: "Conversion rate is currently 0%. Mark closed leads as converted to unlock accurate ROI reports.",
          }
    );

    points.push({
      type: reportStats.businessScore >= 70 ? "win" : "attention",
      text: `AI Business Health Score is ${reportStats.businessScore}/100 based on leads, properties, inventory and conversion signals.`,
    });

    return points;
  }, [reportStats]);

  const recentItems = useMemo<RecentReportItem[]>(() => {
    const leadRows: RecentReportItem[] = leads.slice(0, 4).map((lead) => ({
      title: `Lead: ${lead.name}`,
      meta: `${lead.status || "new"} Â· ${lead.score || 50}/100 score`,
      type: "CRM",
      signal: (lead.score || 0) >= 80 ? "Hot" : "Active",
      color: "#6366f1",
    }));

    const propertyRows: RecentReportItem[] = properties.slice(0, 4).map((property) => ({
      title: `Property: ${property.title}`,
      meta: `${property.location} Â· ${formatPrice(property.price || 0)}`,
      type: "Property",
      signal: property.status,
      color: "#10b981",
    }));

    const rows = [...leadRows, ...propertyRows];

    return rows.length > 0
      ? rows
      : [{
          title: "No live report data yet",
          meta: "Add leads and properties to generate real reports",
          type: "System",
          signal: "Pending",
          color: "#f59e0b",
        }];
  }, [leads, properties]);

  const reportText = useMemo(() => {
    return [
      "RS Real Estate - Real Estate Business Report",
      `Report Type: ${activeReport}`,
      `Generated: ${new Date().toLocaleString()}`,
      "",
      `Total Leads: ${reportStats.totalLeads}`,
      `Hot Leads: ${reportStats.hotLeads}`,
      `Average Lead Score: ${reportStats.avgLeadScore}/100`,
      `Conversion Rate: ${reportStats.conversionRate}%`,
      "",
      `Total Properties: ${reportStats.totalProperties}`,
      `Available Properties: ${reportStats.availableProperties}`,
      `Sold Properties: ${reportStats.soldProperties}`,
      `Rented Properties: ${reportStats.rentedProperties}`,
      `Portfolio Value: ${formatPrice(reportStats.portfolioValue)}`,
      "",
      `AI Business Health Score: ${reportStats.businessScore}/100`,
      "",
      "AI Summary:",
      ...aiSummaryPoints.map((point, index) => `${index + 1}. ${point.text}`),
    ].join("\n");
  }, [activeReport, aiSummaryPoints, reportStats]);

  const handleExport = () => {
    setExporting(true);

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `ai-growth-os-${activeReport}-report.txt`;
    link.click();

    window.URL.revokeObjectURL(url);
    setTimeout(() => setExporting(false), 800);
  };

  const handleEmailReport = () => {
    const subject = encodeURIComponent(`RS Real Estate ${activeReport} Report`);
    const body = encodeURIComponent(reportText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setApiMessage("Report copied to clipboard.");
    } catch {
      setApiMessage("Could not copy report to clipboard.");
    }
  };

  const chartColor = darkMode ? "#818cf8" : "#6366f1";
  const tickColor = darkMode ? "#2d3748" : "#cbd5e1";
  const tooltipBg = darkMode ? "#0d0d28" : "#ffffff";

  const cardBase = {
    background: darkMode ? "rgba(13,13,40,0.8)" : "#ffffff",
    borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
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
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: darkMode ? "#e2e8f0" : "#0f172a" }}>
              Reports
            </h1>
            <p className="text-sm mt-0.5" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
              {loading
                ? "Loading live business report..."
                : `AI-generated report from ${reportStats.totalLeads} leads and ${reportStats.totalProperties} properties`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: darkMode ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.04)" }}>
              {(["daily", "weekly", "monthly"] as const).map((report) => (
                <button
                  key={report}
                  onClick={() => setActiveReport(report)}
                  className="px-3 py-1.5 rounded-lg text-xs capitalize transition-all"
                  style={{
                    background: activeReport === report ? (darkMode ? "rgba(99,102,241,0.2)" : "#ffffff") : "transparent",
                    color: activeReport === report ? (darkMode ? "#818cf8" : "#6366f1") : darkMode ? "#4a5568" : "#94a3b8",
                    boxShadow: activeReport === report && !darkMode ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {report}
                </button>
              ))}
            </div>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs border transition-all"
              style={{ borderColor: cardBase.borderColor, color: darkMode ? "#94a3b8" : "#475569" }}
            >
              {exporting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                  <Download size={13} />
                </motion.div>
              ) : (
                <Download size={13} />
              )}
              {exporting ? "Exporting..." : "Export Report"}
            </button>

            <button
              onClick={handleEmailReport}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs border transition-all"
              style={{ borderColor: cardBase.borderColor, color: darkMode ? "#94a3b8" : "#475569" }}
            >
              <Mail size={13} /> Email
            </button>

            <button
              onClick={handleCopyReport}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs border transition-all"
              style={{ borderColor: cardBase.borderColor, color: darkMode ? "#94a3b8" : "#475569" }}
            >
              <Share2 size={13} /> Copy
            </button>
          </div>
        </motion.div>

        {apiMessage && (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{
              background: darkMode ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)",
              borderColor: "rgba(245,158,11,0.25)",
              color: "#f59e0b",
            }}
          >
            {apiMessage}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border p-5"
          style={{
            background: darkMode
              ? "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.07) 50%, rgba(13,13,40,0.9) 100%)"
              : "linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.03) 100%)",
            borderColor: darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <Sparkles size={13} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>AI Executive Summary</span>
              <span className="text-xs ml-2" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>{activeReport} report</span>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
              <span className="text-xs" style={{ color: "#10b981" }}>Generated just now</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {aiSummaryPoints.map((point, index) => (
              <div
                key={`${point.text}-${index}`}
                className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{
                  background: point.type === "win"
                    ? darkMode ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.05)"
                    : darkMode ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.05)",
                }}
              >
                {point.type === "win" ? (
                  <CheckCircle2 size={14} style={{ color: "#10b981", flexShrink: 0, marginTop: 1 }} />
                ) : (
                  <AlertCircle size={14} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }} />
                )}
                <p className="text-xs leading-relaxed" style={{ color: darkMode ? "#94a3b8" : "#475569" }}>{point.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Leads", value: formatNumber(reportStats.totalLeads), change: `${reportStats.hotLeads} hot`, icon: Target, color: "#8b5cf6", sub: "CRM pipeline" },
            { label: "Properties", value: formatNumber(reportStats.totalProperties), change: `${reportStats.availableProperties} active`, icon: Eye, color: "#6366f1", sub: "inventory" },
            { label: "Portfolio Value", value: formatPrice(reportStats.portfolioValue), change: "live", icon: FileBarChart, color: "#06b6d4", sub: "property value" },
            { label: "Health Score", value: `${reportStats.businessScore}/100`, change: `${reportStats.conversionRate}% conv`, icon: TrendingUp, color: "#10b981", sub: "AI score" },
          ].map((kpi, index) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.07 }}
              className="rounded-2xl p-5 border"
              style={cardBase}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                  <kpi.icon size={16} style={{ color: kpi.color }} />
                </div>
                <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "#10b981" }}>
                  <ArrowUpRight size={10} /> {kpi.change}
                </span>
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: darkMode ? "#e2e8f0" : "#0f172a", letterSpacing: "-0.03em" }}>
                {kpi.value}
              </div>
              <p className="text-xs mt-1" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>{kpi.label}</p>
              <p className="text-xs" style={{ color: darkMode ? "#2d3748" : "#cbd5e1" }}>{kpi.sub}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl border p-5" style={cardBase}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>Lead Growth Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData}>
                <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)"}`, borderRadius: "12px", fontSize: "12px", color: darkMode ? "#e2e8f0" : "#0f172a" }} />
                <Bar dataKey="leads" radius={[6, 6, 0, 0]}>
                  {trendData.map((_, index) => (
                    <Cell key={index} fill={index === trendData.length - 1 ? "#6366f1" : darkMode ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.2)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="rounded-2xl border p-5" style={cardBase}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>Property Inventory Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)"}`, borderRadius: "12px", fontSize: "12px", color: darkMode ? "#e2e8f0" : "#0f172a" }} />
                <Line type="monotone" dataKey="properties" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="rounded-2xl border p-5" style={cardBase}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>Lead Status</h3>
            <div className="space-y-3">
              {[
                { label: "New", value: reportStats.newLeads, color: "#6366f1" },
                { label: "Contacted", value: reportStats.contactedLeads, color: "#06b6d4" },
                { label: "Qualified", value: reportStats.qualifiedLeads, color: "#8b5cf6" },
                { label: "Converted", value: reportStats.convertedLeads, color: "#10b981" },
                { label: "Lost", value: reportStats.lostLeads, color: "#ef4444" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: darkMode ? "#94a3b8" : "#475569" }}>{item.label}</span>
                    <span style={{ color: item.color }}>{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: darkMode ? "rgba(99,102,241,0.08)" : "rgba(15,23,42,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${reportStats.totalLeads > 0 ? Math.round((item.value / reportStats.totalLeads) * 100) : 0}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="lg:col-span-2 rounded-2xl border p-5" style={cardBase}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>Recent Report Signals</h3>
              <div className="flex items-center gap-2 text-xs" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
                <Clock size={12} /> Live
              </div>
            </div>
            <div className="space-y-2">
              {recentItems.map((item, index) => (
                <div key={`${item.title}-${index}`} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: darkMode ? "rgba(99,102,241,0.08)" : "rgba(15,23,42,0.04)", background: darkMode ? "rgba(99,102,241,0.02)" : "rgba(99,102,241,0.01)" }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${item.color}15` }}>
                    {item.type === "CRM" ? <Users size={14} style={{ color: item.color }} /> : item.type === "Property" ? <Eye size={14} style={{ color: item.color }} /> : <AlertCircle size={14} style={{ color: item.color }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>{item.title}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>{item.meta}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full capitalize" style={{ background: `${item.color}15`, color: item.color }}>
                    {item.signal}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="rounded-2xl border p-5" style={cardBase}>
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} style={{ color: chartColor }} />
            <h3 className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>Generated Report Preview</h3>
          </div>
          <pre className="text-xs leading-relaxed whitespace-pre-wrap rounded-xl p-4 border overflow-x-auto" style={{ background: darkMode ? "rgba(99,102,241,0.04)" : "rgba(99,102,241,0.03)", borderColor: darkMode ? "rgba(99,102,241,0.08)" : "rgba(15,23,42,0.04)", color: darkMode ? "#94a3b8" : "#475569", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
            {reportText}
          </pre>
        </motion.div>
      </div>
    </div>
  );
}
