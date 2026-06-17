import { useState } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Clock, Instagram,
  Linkedin, Twitter, Youtube, Globe, Sparkles, MoreHorizontal,
  Play, Pause, Calendar, List, LayoutGrid, Filter
} from "lucide-react";
import { motion } from "motion/react";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const scheduledPosts: Record<number, { time: string; platform: string; content: string; status: string; color: string }[]> = {
  3: [{ time: "9:00 AM", platform: "LinkedIn", content: "Thought leadership piece on AI trends", status: "scheduled", color: "#0077b5" }],
  5: [
    { time: "2:00 PM", platform: "Instagram", content: "Behind the scenes of our product launch", status: "scheduled", color: "#e1306c" },
    { time: "6:00 PM", platform: "Twitter", content: "Thread: 10 growth hacks we discovered", status: "scheduled", color: "#1da1f2" },
  ],
  8: [{ time: "11:00 AM", platform: "YouTube", content: "Full tutorial: Getting started with RS Real Estate", status: "draft", color: "#ff0000" }],
  11: [
    { time: "9:00 AM", platform: "LinkedIn", content: "Monthly analytics report breakdown", status: "scheduled", color: "#0077b5" },
    { time: "3:00 PM", platform: "Instagram", content: "Customer success story: 300% ROI", status: "scheduled", color: "#e1306c" },
  ],
  15: [{ time: "10:00 AM", platform: "Twitter", content: "Product update announcement ðŸš€", status: "scheduled", color: "#1da1f2" }],
  18: [{ time: "4:00 PM", platform: "LinkedIn", content: "Industry report: State of B2B Marketing", status: "draft", color: "#0077b5" }],
  22: [
    { time: "9:00 AM", platform: "Instagram", content: "New feature spotlight video", status: "scheduled", color: "#e1306c" },
    { time: "12:00 PM", platform: "LinkedIn", content: "CEO interview: The future of AI in marketing", status: "scheduled", color: "#0077b5" },
    { time: "5:00 PM", platform: "Youtube", content: "Webinar recording: AI Strategy for 2025", status: "processing", color: "#ff0000" },
  ],
  25: [{ time: "11:00 AM", platform: "Twitter", content: "Q&A session announcement", status: "scheduled", color: "#1da1f2" }],
};

const platformIcons: Record<string, React.ElementType> = {
  Instagram, LinkedIn: Linkedin, Twitter, YouTube: Youtube, Youtube
};

const statusColors: Record<string, string> = {
  scheduled: "#10b981",
  draft: "#f59e0b",
  processing: "#6366f1",
};

interface SchedulerProps {
  darkMode: boolean;
}

export function Scheduler({ darkMode }: SchedulerProps) {
  const now = new Date(2026, 5, 11); // June 2026
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [view, setView] = useState<"calendar" | "list">("calendar");

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const cardBase = {
    background: darkMode ? "rgba(13,13,40,0.8)" : "#ffffff",
    borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
    backdropFilter: "blur(16px)",
  };

  const selectedDayPosts = scheduledPosts[selectedDay] || [];

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: darkMode ? "#e2e8f0" : "#0f172a" }}>Scheduler</h1>
            <p className="text-sm mt-0.5" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
              28 posts scheduled this month Â· AI suggests 3 optimal times
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: darkMode ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.04)" }}>
              <button
                onClick={() => setView("calendar")}
                className="p-2 rounded-lg transition-all"
                style={{ background: view === "calendar" ? darkMode ? "rgba(99,102,241,0.2)" : "#ffffff" : "transparent", color: view === "calendar" ? darkMode ? "#818cf8" : "#6366f1" : darkMode ? "#4a5568" : "#94a3b8" }}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setView("list")}
                className="p-2 rounded-lg transition-all"
                style={{ background: view === "list" ? darkMode ? "rgba(99,102,241,0.2)" : "#ffffff" : "transparent", color: view === "list" ? darkMode ? "#818cf8" : "#6366f1" : darkMode ? "#4a5568" : "#94a3b8" }}
              >
                <List size={14} />
              </button>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#ffffff", boxShadow: "0 4px 14px rgba(99,102,241,0.3)" }}
            >
              <Plus size={14} /> Schedule Post
            </button>
          </div>
        </motion.div>

        {/* AI Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl border flex items-center gap-4 overflow-x-auto"
          style={{
            background: darkMode ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.03)",
            borderColor: darkMode ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)",
          }}
        >
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="text-xs font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>AI Optimal Times</span>
          </div>
          {[
            { day: "Today", time: "6:00 PM", platform: "LinkedIn", reach: "+34%" },
            { day: "Tomorrow", time: "9:30 AM", platform: "Instagram", reach: "+28%" },
            { day: "Thursday", time: "12:00 PM", platform: "Twitter", reach: "+22%" },
          ].map((s, i) => (
            <button
              key={i}
              className="flex items-center gap-3 px-3 py-2 rounded-xl border flex-shrink-0 transition-all hover:border-primary/30"
              style={{
                background: darkMode ? "rgba(13,13,40,0.8)" : "#ffffff",
                borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
              }}
            >
              <div>
                <p className="text-xs font-medium" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>{s.day} Â· {s.time}</p>
                <p className="text-xs" style={{ color: "#10b981" }}>{s.platform} Â· {s.reach} reach</p>
              </div>
              <Plus size={12} style={{ color: darkMode ? "#818cf8" : "#6366f1" }} />
            </button>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 rounded-2xl border p-5"
            style={cardBase}
          >
            {/* Month Nav */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-primary/10 transition-all" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
                  <ChevronLeft size={15} />
                </button>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-primary/10 transition-all" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {daysOfWeek.map(d => (
                <div key={d} className="text-center py-1">
                  <span className="text-xs font-medium" style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}>{d}</span>
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: totalCells }).map((_, idx) => {
                const day = idx - firstDay + 1;
                const isValid = day >= 1 && day <= daysInMonth;
                const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
                const isSelected = day === selectedDay && isValid;
                const hasPosts = isValid && scheduledPosts[day];
                const postCount = hasPosts ? scheduledPosts[day].length : 0;

                return (
                  <button
                    key={idx}
                    onClick={() => isValid && setSelectedDay(day)}
                    disabled={!isValid}
                    className="relative aspect-square rounded-xl flex flex-col items-center justify-center p-1 transition-all disabled:opacity-0"
                    style={{
                      background: isSelected
                        ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                        : isToday
                          ? darkMode ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)"
                          : "transparent",
                      border: isToday && !isSelected
                        ? `1px solid ${darkMode ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.2)"}`
                        : "1px solid transparent",
                    }}
                  >
                    <span className="text-xs" style={{
                      color: isSelected ? "#ffffff" : isToday ? "#6366f1" : darkMode ? "#94a3b8" : "#475569",
                      fontWeight: isToday || isSelected ? 600 : 400,
                    }}>
                      {isValid ? day : ""}
                    </span>
                    {hasPosts && !isSelected && (
                      <div className="flex gap-0.5 mt-0.5">
                        {scheduledPosts[day].slice(0, 3).map((p, pi) => (
                          <div key={pi} className="w-1 h-1 rounded-full" style={{ background: p.color }} />
                        ))}
                      </div>
                    )}
                    {hasPosts && isSelected && (
                      <div className="w-1 h-1 rounded-full bg-white/60 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Day Detail */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl border p-5 flex flex-col"
            style={cardBase}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                  {monthNames[currentMonth]} {selectedDay}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
                  {selectedDayPosts.length} post{selectedDayPosts.length !== 1 ? "s" : ""} scheduled
                </p>
              </div>
              <button className="p-2 rounded-xl border transition-all hover:bg-primary/5" style={{ borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)", color: darkMode ? "#4a5568" : "#94a3b8" }}>
                <Plus size={13} />
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto">
              {selectedDayPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <Calendar size={24} style={{ color: darkMode ? "#2d3748" : "#cbd5e1", marginBottom: "8px" }} />
                  <p className="text-xs" style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}>No posts scheduled</p>
                  <button className="mt-2 text-xs" style={{ color: darkMode ? "#818cf8" : "#6366f1" }}>+ Add post</button>
                </div>
              ) : (
                selectedDayPosts.map((post, i) => {
                  const PlatformIcon = platformIcons[post.platform] || Globe;
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-xl border group"
                      style={{
                        borderColor: `${post.color}25`,
                        background: darkMode ? `${post.color}08` : `${post.color}04`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <PlatformIcon size={13} style={{ color: post.color }} />
                        <span className="text-xs font-medium" style={{ color: post.color }}>{post.platform}</span>
                        <span className="text-xs ml-auto" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>{post.time}</span>
                      </div>
                      <p className="text-xs" style={{ color: darkMode ? "#94a3b8" : "#475569" }}>{post.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColors[post.status] }} />
                        <span className="text-xs capitalize" style={{ color: statusColors[post.status] }}>{post.status}</span>
                        <button className="ml-auto opacity-0 group-hover:opacity-100 transition-all">
                          <MoreHorizontal size={12} style={{ color: darkMode ? "#4a5568" : "#94a3b8" }} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Queue summary */}
            <div
              className="mt-4 p-3 rounded-xl border"
              style={{
                background: darkMode ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.03)",
                borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock size={12} style={{ color: "#6366f1" }} />
                <span className="text-xs font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>Queue status</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Queued", value: "28", color: "#10b981" },
                  { label: "Draft", value: "7", color: "#f59e0b" },
                  { label: "Published", value: "184", color: "#6366f1" },
                ].map(item => (
                  <div key={item.label}>
                    <div className="font-bold text-sm" style={{ color: item.color }}>{item.value}</div>
                    <div className="text-xs" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
