import { useState } from "react";
import {
  TrendingUp, Users, Eye, Heart, Share2, MousePointer,
  Globe, ArrowUpRight, Download, Filter, Calendar
} from "lucide-react";
import { motion } from "motion/react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";

const weeklyData = [
  { day: "Mon", impressions: 12400, engagement: 4200, clicks: 890 },
  { day: "Tue", impressions: 18200, engagement: 5800, clicks: 1240 },
  { day: "Wed", impressions: 14900, engagement: 4900, clicks: 980 },
  { day: "Thu", impressions: 22100, engagement: 7200, clicks: 1580 },
  { day: "Fri", impressions: 26800, engagement: 8100, clicks: 1920 },
  { day: "Sat", impressions: 20200, engagement: 6400, clicks: 1340 },
  { day: "Sun", impressions: 31000, engagement: 9300, clicks: 2100 },
];

const followerGrowth = [
  { month: "Jan", followers: 28400 },
  { month: "Feb", followers: 31200 },
  { month: "Mar", followers: 33800 },
  { month: "Apr", followers: 36100 },
  { month: "May", followers: 39400 },
  { month: "Jun", followers: 42800 },
  { month: "Jul", followers: 48600 },
];

const topPosts = [
  { content: "5 AI trends reshaping B2B marketing in 2025", reach: "42.1K", eng: "8.4%", platform: "LinkedIn", trend: "+28%" },
  { content: "How we 10x'd our lead gen — full breakdown", reach: "38.7K", eng: "12.1%", platform: "Instagram", trend: "+41%" },
  { content: "Thread: The future of work is already here 🧵", reach: "29.3K", eng: "6.8%", platform: "Twitter", trend: "+17%" },
  { content: "AI Growth OS — behind the product walkthrough", reach: "24.8K", eng: "9.2%", platform: "YouTube", trend: "+33%" },
  { content: "Why 87% of marketing teams waste their ad budget", reach: "19.2K", eng: "7.6%", platform: "LinkedIn", trend: "+22%" },
];

const audienceData = [
  { subject: "Engagement", A: 88 },
  { subject: "Reach", A: 76 },
  { subject: "Retention", A: 82 },
  { subject: "Conversion", A: 64 },
  { subject: "Growth", A: 91 },
  { subject: "Loyalty", A: 73 },
];

const platformColors: Record<string, string> = {
  LinkedIn: "#0077b5",
  Instagram: "#e1306c",
  Twitter: "#1da1f2",
  YouTube: "#ff0000",
};

interface AnalyticsProps {
  darkMode: boolean;
}

export function Analytics({ darkMode }: AnalyticsProps) {
  const [period, setPeriod] = useState("7d");
  const [metric, setMetric] = useState<"impressions" | "engagement" | "clicks">("impressions");

  const chartColor = darkMode ? "#818cf8" : "#6366f1";
  const gridColor = darkMode ? "rgba(99,102,241,0.06)" : "rgba(15,23,42,0.04)";
  const tickColor = darkMode ? "#2d3748" : "#cbd5e1";
  const tooltipBg = darkMode ? "#0d0d28" : "#ffffff";

  const cardBase = {
    background: darkMode ? "rgba(13,13,40,0.8)" : "#ffffff",
    borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
    backdropFilter: "blur(16px)",
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: darkMode ? "#e2e8f0" : "#0f172a" }}>Analytics</h1>
            <p className="text-sm mt-0.5" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>Performance insights across all platforms</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: darkMode ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.04)" }}>
              {["7d", "30d", "90d", "1y"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="px-3 py-1.5 rounded-lg text-xs transition-all"
                  style={{
                    background: period === p ? darkMode ? "rgba(99,102,241,0.2)" : "#ffffff" : "transparent",
                    color: period === p ? darkMode ? "#818cf8" : "#6366f1" : darkMode ? "#4a5568" : "#94a3b8",
                    boxShadow: period === p && !darkMode ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all hover:bg-primary/5"
              style={{ borderColor: cardBase.borderColor, color: darkMode ? "#4a5568" : "#94a3b8" }}
            >
              <Download size={13} />
              Export
            </button>
          </div>
        </motion.div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Impressions", value: "145.2K", change: "+31%", icon: Eye, color: "#6366f1" },
            { label: "Total Engagement", value: "45.9K", change: "+28%", icon: Heart, color: "#e1306c" },
            { label: "Link Clicks", value: "10.1K", change: "+19%", icon: MousePointer, color: "#06b6d4" },
            { label: "New Followers", value: "+5.8K", change: "+14%", icon: Users, color: "#10b981" },
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
                <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "#10b981" }}>
                  <TrendingUp size={10} /> {kpi.change}
                </span>
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.03em", color: darkMode ? "#e2e8f0" : "#0f172a", lineHeight: 1 }}>
                {kpi.value}
              </div>
              <p className="text-xs mt-2" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Impressions Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-2xl p-5 border"
            style={cardBase}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>Traffic Overview</h3>
                <p className="text-xs mt-0.5" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>Daily breakdown</p>
              </div>
              <div className="flex gap-1">
                {(["impressions", "engagement", "clicks"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className="px-2.5 py-1 rounded-lg text-xs capitalize transition-all"
                    style={{
                      background: metric === m ? darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)" : "transparent",
                      color: metric === m ? darkMode ? "#818cf8" : "#6366f1" : darkMode ? "#4a5568" : "#94a3b8",
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)"}`, borderRadius: "12px", fontSize: "12px", color: darkMode ? "#e2e8f0" : "#0f172a" }} />
                <Area type="monotone" dataKey={metric} stroke={chartColor} strokeWidth={2.5} fill="url(#grad)" dot={false} activeDot={{ r: 5, fill: chartColor, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Audience Radar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl p-5 border"
            style={cardBase}
          >
            <h3 className="text-sm font-semibold mb-1" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>Audience Health</h3>
            <p className="text-xs mb-3" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>6 key metrics</p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={audienceData}>
                <PolarGrid stroke={darkMode ? "rgba(99,102,241,0.1)" : "rgba(15,23,42,0.06)"} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: darkMode ? "#4a5568" : "#94a3b8", fontSize: 10 }} />
                <Radar dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="mt-2 text-center">
              <span className="text-2xl font-bold" style={{ color: "#6366f1" }}>79</span>
              <span className="text-xs ml-1" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>/ 100 health score</span>
            </div>
          </motion.div>
        </div>

        {/* Follower Growth + Top Posts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Follower Growth */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 rounded-2xl p-5 border"
            style={cardBase}
          >
            <h3 className="text-sm font-semibold mb-1" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>Follower Growth</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span style={{ fontSize: "1.75rem", fontWeight: 700, color: darkMode ? "#e2e8f0" : "#0f172a" }}>48.6K</span>
              <span className="text-xs font-semibold" style={{ color: "#10b981" }}>↑ +71% YTD</span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={followerGrowth}>
                <defs>
                  <linearGradient id="followGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)"}`, borderRadius: "12px", fontSize: "12px", color: darkMode ? "#e2e8f0" : "#0f172a" }} />
                <Area type="monotone" dataKey="followers" stroke="#10b981" strokeWidth={2} fill="url(#followGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top Posts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="lg:col-span-3 rounded-2xl p-5 border"
            style={cardBase}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>Top Performing Posts</h3>
              <button className="text-xs flex items-center gap-1" style={{ color: darkMode ? "#818cf8" : "#6366f1" }}>
                <Filter size={11} /> Filter
              </button>
            </div>
            <div className="space-y-2">
              {topPosts.map((post, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:border-primary/20 cursor-pointer group"
                  style={{
                    borderColor: darkMode ? "rgba(99,102,241,0.08)" : "rgba(15,23,42,0.04)",
                    background: darkMode ? "rgba(99,102,241,0.02)" : "rgba(99,102,241,0.01)",
                  }}
                >
                  <span className="text-xs font-mono" style={{ color: darkMode ? "#2d3748" : "#cbd5e1", minWidth: "16px" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>{post.content}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>{post.reach} reach</span>
                      <span className="text-xs" style={{ color: "#10b981" }}>{post.eng} eng</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: platformColors[post.platform] || "#6366f1" }} />
                    <span className="text-xs font-semibold" style={{ color: "#10b981" }}>{post.trend}</span>
                    <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: darkMode ? "#818cf8" : "#6366f1" }} />
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
