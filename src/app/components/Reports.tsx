import { useState } from "react";
import {
  FileBarChart, Download, Mail, Calendar, TrendingUp,
  Users, Eye, Target, Sparkles, ArrowUpRight, Share2,
  Clock, CheckCircle2, AlertCircle
} from "lucide-react";
import { motion } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell
} from "recharts";

const monthlyMetrics = [
  { month: "Jan", posts: 48, reach: 128000, leads: 142, revenue: 28000 },
  { month: "Feb", posts: 52, reach: 145000, leads: 168, revenue: 34000 },
  { month: "Mar", posts: 61, reach: 172000, leads: 201, revenue: 42000 },
  { month: "Apr", posts: 58, reach: 162000, leads: 189, revenue: 38000 },
  { month: "May", posts: 71, reach: 198000, leads: 243, revenue: 51000 },
  { month: "Jun", posts: 67, reach: 211000, leads: 268, revenue: 58000 },
];

const aiSummaryPoints = [
  { type: "win", text: "Engagement rate increased 28% — highest in 6 months driven by LinkedIn video content" },
  { type: "win", text: "New follower growth of 5,800 this month — 71% above target" },
  { type: "attention", text: "Email open rates dropped 12% — consider A/B testing subject lines" },
  { type: "win", text: "Lead-to-demo conversion improved to 34% — up from 22% last quarter" },
  { type: "attention", text: "YouTube subscriber growth slowed — increase posting frequency to 2x per week" },
  { type: "win", text: "ROI from AI-generated content: $4.20 per $1 spent — 3x industry average" },
];

interface ReportsProps {
  darkMode: boolean;
}

export function Reports({ darkMode }: ReportsProps) {
  const [activeReport, setActiveReport] = useState<"monthly" | "weekly" | "daily">("monthly");
  const [exporting, setExporting] = useState(false);

  const chartColor = darkMode ? "#818cf8" : "#6366f1";
  const tickColor = darkMode ? "#2d3748" : "#cbd5e1";
  const tooltipBg = darkMode ? "#0d0d28" : "#ffffff";

  const cardBase = {
    background: darkMode ? "rgba(13,13,40,0.8)" : "#ffffff",
    borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => setExporting(false), 2000);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: darkMode ? "#e2e8f0" : "#0f172a" }}>Reports</h1>
            <p className="text-sm mt-0.5" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>AI-generated executive summaries and performance reports</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: darkMode ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.04)" }}>
              {(["daily", "weekly", "monthly"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setActiveReport(r)}
                  className="px-3 py-1.5 rounded-lg text-xs capitalize transition-all"
                  style={{
                    background: activeReport === r ? darkMode ? "rgba(99,102,241,0.2)" : "#ffffff" : "transparent",
                    color: activeReport === r ? darkMode ? "#818cf8" : "#6366f1" : darkMode ? "#4a5568" : "#94a3b8",
                    boxShadow: activeReport === r && !darkMode ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs border transition-all"
              style={{ borderColor: cardBase.borderColor, color: darkMode ? "#94a3b8" : "#475569" }}
            >
              {exporting ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}><Download size={13} /></motion.div> : <Download size={13} />}
              {exporting ? "Exporting..." : "Export PDF"}
            </button>
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs border transition-all"
              style={{ borderColor: cardBase.borderColor, color: darkMode ? "#94a3b8" : "#475569" }}
            >
              <Mail size={13} /> Email Report
            </button>
          </div>
        </motion.div>

        {/* AI Executive Summary */}
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
              <span className="text-xs ml-2" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>June 2026</span>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
              <span className="text-xs" style={{ color: "#10b981" }}>Generated just now</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {aiSummaryPoints.map((point, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{
                  background: point.type === "win"
                    ? darkMode ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.05)"
                    : darkMode ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.05)",
                }}
              >
                {point.type === "win"
                  ? <CheckCircle2 size={14} style={{ color: "#10b981", flexShrink: 0, marginTop: 1 }} />
                  : <AlertCircle size={14} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }} />
                }
                <p className="text-xs leading-relaxed" style={{ color: darkMode ? "#94a3b8" : "#475569" }}>{point.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* KPI Scorecard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Reach", value: "211K", change: "+31%", icon: Eye, color: "#6366f1", sub: "this month" },
            { label: "New Leads", value: "268", change: "+40%", icon: Target, color: "#8b5cf6", sub: "this month" },
            { label: "Audience Growth", value: "+5.8K", change: "+71%", icon: Users, color: "#06b6d4", sub: "new followers" },
            { label: "AI Content ROI", value: "4.2x", change: "+120%", icon: TrendingUp, color: "#10b981", sub: "vs manual" },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border p-5"
            style={cardBase}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>Monthly Reach Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyMetrics}>
                <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)"}`, borderRadius: "12px", fontSize: "12px", color: darkMode ? "#e2e8f0" : "#0f172a" }} />
                <Bar dataKey="reach" radius={[6, 6, 0, 0]}>
                  {monthlyMetrics.map((_, i) => (
                    <Cell key={i} fill={i === monthlyMetrics.length - 1 ? "#6366f1" : darkMode ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.2)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-2xl border p-5"
            style={cardBase}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>Lead Generation Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyMetrics}>
                <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)"}`, borderRadius: "12px", fontSize: "12px", color: darkMode ? "#e2e8f0" : "#0f172a" }} />
                <Line type="monotone" dataKey="leads" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Scheduled reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border p-5"
          style={cardBase}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>Automated Report Schedule</h3>
            <button className="text-xs px-3 py-1.5 rounded-xl border transition-all hover:bg-primary/5"
              style={{ borderColor: darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)", color: darkMode ? "#818cf8" : "#6366f1" }}>
              + Add Schedule
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Daily Digest", freq: "Every day at 8:00 AM", recipients: 3, status: "active" },
              { label: "Weekly Summary", freq: "Every Monday at 9:00 AM", recipients: 7, status: "active" },
              { label: "Monthly Board Report", freq: "1st of each month", recipients: 12, status: "active" },
            ].map((schedule, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border"
                style={{
                  background: darkMode ? "rgba(99,102,241,0.04)" : "rgba(99,102,241,0.02)",
                  borderColor: darkMode ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.06)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>{schedule.label}</span>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981", boxShadow: "0 0 4px #10b981" }} />
                </div>
                <p className="text-xs mb-2" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>{schedule.freq}</p>
                <p className="text-xs" style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}>{schedule.recipients} recipients</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
