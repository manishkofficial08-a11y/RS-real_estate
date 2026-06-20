import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Facebook,
  Filter,
  Globe,
  Instagram,
  LayoutGrid,
  Linkedin,
  List,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Twitter,
  Wand2,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import {
  createScheduledPost,
  deleteScheduledPost,
  getMyGeneratedPosts,
  getMyScheduledPosts,
  updateScheduledPost,
  type ClientGeneratedPost,
  type ClientScheduledPost,
  type ClientScheduledPostPlatform,
  type ClientScheduledPostStatus,
} from "../lib/clientApi";

interface SchedulerProps {
  darkMode: boolean;
}

type ContentType =
  | "listing"
  | "walkthrough"
  | "market_update"
  | "lead_followup"
  | "investor"
  | "luxury";

type TimeRecommendation = {
  date: Date;
  platform: ClientScheduledPostPlatform;
  contentType: ContentType;
  score: number;
  label: string;
  reason: string;
};

type ScheduleFormState = {
  generated_post_id: string;
  platform: ClientScheduledPostPlatform;
  contentType: ContentType;
  date: string;
  time: string;
};

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const platformOptions: ClientScheduledPostPlatform[] = [
  "instagram",
  "facebook",
  "linkedin",
  "twitter",
  "website",
  "other",
];

const platformMeta: Record<
  string,
  { label: string; color: string; icon: LucideIcon }
> = {
  instagram: { label: "Instagram", color: "#e1306c", icon: Instagram },
  facebook: { label: "Facebook", color: "#1877f2", icon: Facebook },
  linkedin: { label: "LinkedIn", color: "#0077b5", icon: Linkedin },
  twitter: { label: "Twitter/X", color: "#1da1f2", icon: Twitter },
  website: { label: "Website", color: "#1D4ED8", icon: Globe },
  other: { label: "Other", color: "#2563EB", icon: Youtube },
};

const statusMeta: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  scheduled: {
    label: "Scheduled",
    color: "#10b981",
    bg: "rgba(16,185,129,0.10)",
  },
  publishing: {
    label: "Publishing",
    color: "#1D4ED8",
    bg: "rgba(29,78,216,0.12)",
  },
  published: {
    label: "Published",
    color: "#14b8a6",
    bg: "rgba(20,184,166,0.10)",
  },
  failed: {
    label: "Failed",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.10)",
  },
  cancelled: {
    label: "Cancelled",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.10)",
  },
};

const contentTypeMeta: Record<
  ContentType,
  {
    label: string;
    description: string;
    defaultPlatform: ClientScheduledPostPlatform;
    timesByPlatform: Partial<Record<ClientScheduledPostPlatform, string[]>>;
  }
> = {
  listing: {
    label: "Property listing",
    description: "Best for fresh inventory, apartment posts, price/location posts.",
    defaultPlatform: "instagram",
    timesByPlatform: {
      instagram: ["18:30", "20:00", "11:30"],
      facebook: ["19:00", "21:00", "12:00"],
      linkedin: ["10:00", "13:00", "17:30"],
      twitter: ["12:30", "18:00", "21:00"],
      website: ["09:30", "14:00"],
      other: ["18:30", "20:30"],
    },
  },
  walkthrough: {
    label: "Reel / video walkthrough",
    description: "Best for Reels, Shorts, property tour clips, floor-plan videos.",
    defaultPlatform: "instagram",
    timesByPlatform: {
      instagram: ["19:30", "20:45", "11:00"],
      facebook: ["20:00", "21:15", "12:30"],
      linkedin: ["11:00", "15:30"],
      twitter: ["18:30", "21:00"],
      website: ["10:30", "16:00"],
      other: ["20:00", "21:30"],
    },
  },
  market_update: {
    label: "Market update",
    description: "Best for rate updates, locality trends, buyer education.",
    defaultPlatform: "linkedin",
    timesByPlatform: {
      linkedin: ["09:30", "12:30", "17:00"],
      twitter: ["09:00", "12:00", "18:00"],
      facebook: ["12:30", "19:30"],
      instagram: ["11:30", "18:30"],
      website: ["10:00", "15:00"],
      other: ["12:00", "18:00"],
    },
  },
  lead_followup: {
    label: "Lead follow-up",
    description: "Best for WhatsApp-like followups, reminders, site-visit nudges.",
    defaultPlatform: "other",
    timesByPlatform: {
      other: ["10:30", "16:30", "19:00"],
      website: ["10:30", "16:30"],
      facebook: ["11:00", "18:30"],
      instagram: ["13:00", "19:30"],
      linkedin: ["10:00", "15:30"],
      twitter: ["12:00", "18:00"],
    },
  },
  investor: {
    label: "Investor post",
    description: "Best for ROI, rental yield, commercial/residential investment angle.",
    defaultPlatform: "linkedin",
    timesByPlatform: {
      linkedin: ["09:15", "12:15", "16:45"],
      twitter: ["09:30", "13:00", "17:30"],
      facebook: ["12:00", "19:00"],
      instagram: ["18:00", "20:00"],
      website: ["10:00", "14:30"],
      other: ["12:00", "17:30"],
    },
  },
  luxury: {
    label: "Luxury launch",
    description: "Best for premium projects, lifestyle reels, high-ticket launches.",
    defaultPlatform: "instagram",
    timesByPlatform: {
      instagram: ["20:00", "21:15", "11:00"],
      facebook: ["20:30", "21:30", "12:00"],
      linkedin: ["11:00", "16:00"],
      twitter: ["18:30", "21:00"],
      website: ["11:30", "17:00"],
      other: ["20:30", "21:30"],
    },
  },
};

function toDateInputValue(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function toTimeInputValue(date: Date): string {
  return [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
  ].join(":");
}

function parseLocalDateTime(dateValue: string, timeValue: string): Date {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatTimeLabel(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameLocalMonth(a: Date, year: number, month: number): boolean {
  return a.getFullYear() === year && a.getMonth() === month;
}

function platformLabel(platform: string): string {
  return platformMeta[platform]?.label || "Other";
}

function platformColor(platform: string): string {
  return platformMeta[platform]?.color || "#2563EB";
}

function getGeneratedPostTitle(post?: ClientGeneratedPost): string {
  if (!post) return "Untitled generated post";

  return post.title || post.content?.slice(0, 70) || "Untitled generated post";
}

function recommendationReason(
  contentType: ContentType,
  platform: ClientScheduledPostPlatform,
  date: Date,
): string {
  const day = date.getDay();
  const hour = date.getHours();
  const isWeekend = day === 0 || day === 6;

  if (contentType === "walkthrough") {
    return "Video content usually performs better during evening scroll windows.";
  }

  if (contentType === "investor" || platform === "linkedin") {
    return "Professional audience is more active around work breaks.";
  }

  if (contentType === "lead_followup") {
    return "Follow-ups work better when people can respond between work blocks.";
  }

  if (isWeekend && ["instagram", "facebook"].includes(platform)) {
    return "Weekend discovery window is stronger for visual property posts.";
  }

  if (hour >= 19) {
    return "Evening attention window is stronger for real estate browsing.";
  }

  return "Balanced slot based on content type and platform intent.";
}

function buildRecommendations(
  now: Date,
  contentType: ContentType,
  platform: ClientScheduledPostPlatform,
  limit = 5,
): TimeRecommendation[] {
  const preferredTimes =
    contentTypeMeta[contentType].timesByPlatform[platform] ||
    contentTypeMeta[contentType].timesByPlatform.other ||
    ["18:30", "20:00"];

  const recommendations: TimeRecommendation[] = [];

  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    for (let timeIndex = 0; timeIndex < preferredTimes.length; timeIndex += 1) {
      const [hour, minute] = preferredTimes[timeIndex].split(":").map(Number);
      const candidate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + dayOffset,
        hour,
        minute,
        0,
        0,
      );

      if (candidate <= now) continue;

      const day = candidate.getDay();
      const isWeekend = day === 0 || day === 6;

      let score = 94 - dayOffset * 3 - timeIndex * 2;

      if (platform === "linkedin" && day >= 2 && day <= 4) score += 4;
      if (["instagram", "facebook"].includes(platform) && isWeekend) score += 3;
      if (contentType === "walkthrough" && candidate.getHours() >= 19) score += 3;
      if (contentType === "investor" && platform === "linkedin") score += 4;

      recommendations.push({
        date: candidate,
        platform,
        contentType,
        score: Math.min(98, Math.max(70, score)),
        label: `${formatDateLabel(candidate)} - ${formatTimeLabel(candidate)}`,
        reason: recommendationReason(contentType, platform, candidate),
      });

      if (recommendations.length >= limit) {
        return recommendations;
      }
    }
  }

  return recommendations;
}

export function Scheduler({ darkMode }: SchedulerProps) {
  const [clockNow, setClockNow] = useState(() => new Date());
  const [currentMonth, setCurrentMonth] = useState(() => clockNow.getMonth());
  const [currentYear, setCurrentYear] = useState(() => clockNow.getFullYear());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [schedules, setSchedules] = useState<ClientScheduledPost[]>([]);
  const [generatedPosts, setGeneratedPosts] = useState<ClientGeneratedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ScheduleFormState>(() => {
    const firstSuggestion = buildRecommendations(new Date(), "listing", "instagram", 1)[0];

    return {
      generated_post_id: "",
      platform: "instagram",
      contentType: "listing",
      date: toDateInputValue(firstSuggestion?.date || new Date()),
      time: toTimeInputValue(firstSuggestion?.date || new Date()),
    };
  });

  useEffect(() => {
    const id = window.setInterval(() => setClockNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const cardBase = {
    background: darkMode ? "rgba(15,23,42,0.8)" : "#ffffff",
    borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.06)",
    backdropFilter: "blur(16px)",
  };

  const textPrimary = darkMode ? "#e2e8f0" : "#0f172a";
  const textMuted = darkMode ? "#64748b" : "#64748b";
  const textSoft = darkMode ? "#94A3B8" : "#94a3b8";

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const monthStart = useMemo(
    () => new Date(currentYear, currentMonth, 1, 0, 0, 0, 0),
    [currentYear, currentMonth],
  );

  const monthEnd = useMemo(
    () => new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999),
    [currentYear, currentMonth],
  );

  const selectableGeneratedPosts = useMemo(
    () =>
      generatedPosts.filter(
        (post) =>
          post.is_active &&
          post.status !== "archived" &&
          post.status !== "published",
      ),
    [generatedPosts],
  );

  const selectedGeneratedPost = useMemo(
    () => generatedPosts.find((post) => post.id === form.generated_post_id),
    [generatedPosts, form.generated_post_id],
  );

  const recommendations = useMemo(
    () => buildRecommendations(clockNow, form.contentType, form.platform, 5),
    [clockNow, form.contentType, form.platform],
  );

  const selectedDaySchedules = useMemo(
    () =>
      schedules
        .filter((schedule) => isSameLocalDay(new Date(schedule.scheduled_at), selectedDate))
        .sort(
          (a, b) =>
            new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
        ),
    [schedules, selectedDate],
  );

  const upcomingSchedules = useMemo(
    () =>
      schedules
        .filter((schedule) => new Date(schedule.scheduled_at) >= clockNow)
        .sort(
          (a, b) =>
            new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
        )
        .slice(0, 12),
    [schedules, clockNow],
  );

  const monthSchedulesByDay = useMemo(() => {
    const map: Record<number, ClientScheduledPost[]> = {};

    schedules.forEach((schedule) => {
      const date = new Date(schedule.scheduled_at);

      if (!isSameLocalMonth(date, currentYear, currentMonth)) return;

      const day = date.getDate();
      map[day] = [...(map[day] || []), schedule];
    });

    return map;
  }, [schedules, currentMonth, currentYear]);

  const stats = useMemo(() => {
    const scheduled = schedules.filter((schedule) => schedule.status === "scheduled").length;
    const publishing = schedules.filter((schedule) => schedule.status === "publishing").length;
    const published = schedules.filter((schedule) => schedule.status === "published").length;
    const failed = schedules.filter((schedule) => schedule.status === "failed").length;

    return { scheduled, publishing, published, failed, total: schedules.length };
  }, [schedules]);

  const showMessage = (text: string, tone: "success" | "error" = "success") => {
    setMessage({ text, tone });
    window.setTimeout(() => setMessage(null), 2800);
  };

  const loadSchedulerData = async () => {
    try {
      setLoading(true);

      const [scheduledData, generatedPostData] = await Promise.all([
        getMyScheduledPosts({
          from_date: monthStart,
          to_date: monthEnd,
          limit: 200,
        }),
        getMyGeneratedPosts({ limit: 200 }),
      ]);

      setSchedules(scheduledData);
      setGeneratedPosts(generatedPostData);
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : "Failed to load scheduler data.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSchedulerData();
  }, [currentMonth, currentYear]);

  useEffect(() => {
    if (!form.generated_post_id && selectableGeneratedPosts[0]) {
      setForm((current) => ({
        ...current,
        generated_post_id: selectableGeneratedPosts[0].id,
      }));
    }
  }, [selectableGeneratedPosts, form.generated_post_id]);

  const goToPreviousMonth = () => {
    setCurrentMonth((month) => {
      if (month === 0) {
        setCurrentYear((year) => year - 1);
        setSelectedDate(new Date(currentYear - 1, 11, 1));
        return 11;
      }

      setSelectedDate(new Date(currentYear, month - 1, 1));
      return month - 1;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((month) => {
      if (month === 11) {
        setCurrentYear((year) => year + 1);
        setSelectedDate(new Date(currentYear + 1, 0, 1));
        return 0;
      }

      setSelectedDate(new Date(currentYear, month + 1, 1));
      return month + 1;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setClockNow(today);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
  };

  const openScheduleModal = (recommendation?: TimeRecommendation) => {
    const date = recommendation?.date || recommendations[0]?.date || new Date(Date.now() + 60 * 60 * 1000);
    const contentType = recommendation?.contentType || form.contentType;
    const platform = recommendation?.platform || form.platform;

    setForm((current) => ({
      ...current,
      platform,
      contentType,
      date: toDateInputValue(date),
      time: toTimeInputValue(date),
      generated_post_id: current.generated_post_id || selectableGeneratedPosts[0]?.id || "",
    }));
    setModalOpen(true);
  };

  const updateForm = <K extends keyof ScheduleFormState>(
    key: K,
    value: ScheduleFormState[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleContentTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const contentType = event.target.value as ContentType;
    const defaultPlatform = contentTypeMeta[contentType].defaultPlatform;
    const nextRecommendation = buildRecommendations(clockNow, contentType, defaultPlatform, 1)[0];

    setForm((current) => ({
      ...current,
      contentType,
      platform: defaultPlatform,
      date: toDateInputValue(nextRecommendation.date),
      time: toTimeInputValue(nextRecommendation.date),
    }));
  };

  const handlePlatformChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const platform = event.target.value as ClientScheduledPostPlatform;
    const nextRecommendation = buildRecommendations(clockNow, form.contentType, platform, 1)[0];

    setForm((current) => ({
      ...current,
      platform,
      date: toDateInputValue(nextRecommendation.date),
      time: toTimeInputValue(nextRecommendation.date),
    }));
  };

  const handleCreateSchedule = async () => {
    if (!form.generated_post_id) {
      showMessage("Select a generated post first.", "error");
      return;
    }

    const scheduledDate = parseLocalDateTime(form.date, form.time);

    if (Number.isNaN(scheduledDate.getTime())) {
      showMessage("Select a valid schedule date and time.", "error");
      return;
    }

    if (scheduledDate <= new Date()) {
      showMessage("Schedule time must be in the future.", "error");
      return;
    }

    try {
      setActionKey("create");

      await createScheduledPost({
        generated_post_id: form.generated_post_id,
        platform: form.platform,
        scheduled_at: scheduledDate.toISOString(),
        metadata_json: {
          source: "scheduler_page",
          content_type: form.contentType,
          recommended_slot_used: recommendations.some(
            (slot) => slot.date.getTime() === scheduledDate.getTime(),
          ),
          local_date: form.date,
          local_time: form.time,
        },
      });

      setModalOpen(false);
      await loadSchedulerData();
      showMessage("Post scheduled successfully.");
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : "Failed to schedule post.",
        "error",
      );
    } finally {
      setActionKey(null);
    }
  };

  const handleCancelSchedule = async (schedule: ClientScheduledPost) => {
    try {
      setActionKey(`${schedule.id}:cancel`);
      await deleteScheduledPost(schedule.id);
      await loadSchedulerData();
      showMessage("Scheduled post cancelled.");
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : "Failed to cancel schedule.",
        "error",
      );
    } finally {
      setActionKey(null);
    }
  };

  const delaySchedule = async (schedule: ClientScheduledPost, minutes: number) => {
    try {
      setActionKey(`${schedule.id}:delay`);
      const nextDate = new Date(new Date(schedule.scheduled_at).getTime() + minutes * 60_000);

      await updateScheduledPost(schedule.id, {
        scheduled_at: nextDate.toISOString(),
      });

      await loadSchedulerData();
      showMessage(`Schedule delayed by ${minutes} minutes.`);
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : "Failed to update schedule.",
        "error",
      );
    } finally {
      setActionKey(null);
    }
  };

  const copySchedule = async (schedule: ClientScheduledPost) => {
    const text = [
      schedule.generated_post_title || "Scheduled post",
      platformLabel(schedule.platform),
      formatDateTime(schedule.scheduled_at),
      schedule.status,
    ].join(" | ");

    await navigator.clipboard.writeText(text);
    showMessage("Schedule copied.");
  };

  const renderScheduleCard = (schedule: ClientScheduledPost) => {
    const meta = statusMeta[schedule.status] || statusMeta.scheduled;
    const PlatformIcon = platformMeta[schedule.platform]?.icon || Globe;

    return (
      <div
        key={schedule.id}
        className="rounded-xl border p-3"
        style={{
          background: darkMode ? "rgba(15,23,42,0.62)" : "#ffffff",
          borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
        }}
      >
        <div className="mb-2 flex items-start gap-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${platformColor(schedule.platform)}18` }}
          >
            <PlatformIcon size={14} style={{ color: platformColor(schedule.platform) }} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium" style={{ color: textPrimary }}>
              {schedule.generated_post_title || "Generated post"}
            </p>
            <p className="text-xs" style={{ color: textMuted }}>
              {platformLabel(schedule.platform)} - {formatDateTime(schedule.scheduled_at)}
            </p>
          </div>

          <span
            className="rounded-full px-2 py-1 text-[11px] font-medium"
            style={{ color: meta.color, background: meta.bg }}
          >
            {meta.label}
          </span>
        </div>

        {schedule.failure_reason && (
          <div className="mb-2 rounded-lg border p-2 text-xs" style={{ borderColor: "rgba(239,68,68,0.18)", color: "#ef4444" }}>
            {schedule.failure_reason}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {schedule.status === "scheduled" && (
            <>
              <button
                onClick={() => delaySchedule(schedule, 30)}
                disabled={actionKey === `${schedule.id}:delay`}
                className="rounded-lg border px-2 py-1 text-xs"
                style={{
                  borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
                  color: textMuted,
                }}
              >
                +30 min
              </button>

              <button
                onClick={() => handleCancelSchedule(schedule)}
                disabled={actionKey === `${schedule.id}:cancel`}
                className="rounded-lg border px-2 py-1 text-xs"
                style={{
                  borderColor: "rgba(239,68,68,0.18)",
                  color: "#ef4444",
                }}
              >
                {actionKey === `${schedule.id}:cancel` ? "Cancelling..." : "Cancel"}
              </button>
            </>
          )}

          {schedule.external_post_url && (
            <a
              href={schedule.external_post_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs"
              style={{
                borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
                color: "#1D4ED8",
              }}
            >
              Open <ExternalLink size={11} />
            </a>
          )}

          <button
            onClick={() => copySchedule(schedule)}
            className="ml-auto rounded-lg border px-2 py-1 text-xs"
            style={{
              borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
              color: textMuted,
            }}
          >
            <Copy size={11} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <div className="mb-1 flex items-center gap-3">
              <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: textPrimary }}>
                Scheduler
              </h1>
              <span
                className="rounded-full px-2 py-1 text-xs"
                style={{
                  background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
                  color: "#ffffff",
                }}
              >
                Live calendar
              </span>
            </div>
            <p className="text-sm" style={{ color: textSoft }}>
              Today: {clockNow.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} - {formatTimeLabel(clockNow)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex gap-1 rounded-xl p-1"
              style={{
                background: darkMode ? "rgba(29,78,216,0.08)" : "rgba(29,78,216,0.04)",
              }}
            >
              <button
                onClick={() => setView("calendar")}
                className="rounded-lg p-2 transition-all"
                style={{
                  background: view === "calendar" ? (darkMode ? "rgba(29,78,216,0.2)" : "#ffffff") : "transparent",
                  color: view === "calendar" ? "#1D4ED8" : textSoft,
                }}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setView("list")}
                className="rounded-lg p-2 transition-all"
                style={{
                  background: view === "list" ? (darkMode ? "rgba(29,78,216,0.2)" : "#ffffff") : "transparent",
                  color: view === "list" ? "#1D4ED8" : textSoft,
                }}
              >
                <List size={14} />
              </button>
            </div>

            <button
              onClick={() => void loadSchedulerData()}
              className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm"
              style={{
                borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
                color: textMuted,
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>

            <button
              onClick={() => openScheduleModal()}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{
                background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
                boxShadow: "0 4px 14px rgba(29,78,216,0.3)",
              }}
            >
              <Plus size={14} /> Schedule Post
            </button>
          </div>
        </motion.div>

        {message && (
          <div
            className="rounded-2xl border p-3 text-sm"
            style={{
              background:
                message.tone === "error"
                  ? "rgba(239,68,68,0.08)"
                  : "rgba(16,185,129,0.08)",
              borderColor:
                message.tone === "error"
                  ? "rgba(239,68,68,0.18)"
                  : "rgba(16,185,129,0.18)",
              color: message.tone === "error" ? "#ef4444" : "#10b981",
            }}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            { label: "Total this month", value: stats.total, color: "#1D4ED8" },
            { label: "Scheduled", value: stats.scheduled, color: "#10b981" },
            { label: "Publishing", value: stats.publishing, color: "#2563EB" },
            { label: "Published", value: stats.published, color: "#14b8a6" },
            { label: "Failed", value: stats.failed, color: "#ef4444" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border p-4"
              style={cardBase}
            >
              <p className="text-xs" style={{ color: textSoft }}>
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: item.color }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border p-4"
          style={{
            background: darkMode ? "rgba(29,78,216,0.06)" : "rgba(29,78,216,0.03)",
            borderColor: darkMode ? "rgba(29,78,216,0.15)" : "rgba(29,78,216,0.08)",
          }}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB)" }}>
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: textPrimary }}>
                  AI Optimal Times
                </p>
                <p className="text-xs" style={{ color: textSoft }}>
                  Pick content type and platform. Scheduler recommends stronger posting windows.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={form.contentType}
                onChange={handleContentTypeChange}
                className="rounded-xl border px-3 py-2 text-xs"
                style={{
                  background: darkMode ? "rgba(15,23,42,0.9)" : "#ffffff",
                  borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
                  color: textPrimary,
                }}
              >
                {Object.entries(contentTypeMeta).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>

              <select
                value={form.platform}
                onChange={handlePlatformChange}
                className="rounded-xl border px-3 py-2 text-xs"
                style={{
                  background: darkMode ? "rgba(15,23,42,0.9)" : "#ffffff",
                  borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
                  color: textPrimary,
                }}
              >
                {platformOptions.map((platform) => (
                  <option key={platform} value={platform}>
                    {platformLabel(platform)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1">
            {recommendations.map((slot, index) => (
              <button
                key={`${slot.date.toISOString()}-${index}`}
                onClick={() => openScheduleModal(slot)}
                className="min-w-[220px] rounded-2xl border p-3 text-left transition-all hover:scale-[1.01]"
                style={{
                  background: darkMode ? "rgba(15,23,42,0.82)" : "#ffffff",
                  borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
                }}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold" style={{ color: "#1D4ED8" }}>
                    {slot.score}% fit
                  </span>
                  <span className="rounded-full px-2 py-1 text-[11px]" style={{ background: `${platformColor(slot.platform)}16`, color: platformColor(slot.platform) }}>
                    {platformLabel(slot.platform)}
                  </span>
                </div>
                <p className="text-sm font-semibold" style={{ color: textPrimary }}>
                  {slot.label}
                </p>
                <p className="mt-1 line-clamp-2 text-xs" style={{ color: textMuted }}>
                  {slot.reason}
                </p>
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-5 lg:col-span-2"
            style={cardBase}
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold" style={{ color: textPrimary }}>
                  {monthNames[currentMonth]} {currentYear}
                </h3>
                <p className="text-xs" style={{ color: textSoft }}>
                  {view === "calendar" ? "Calendar view" : "Upcoming scheduled list"}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={goToToday}
                  className="rounded-lg border px-3 py-1.5 text-xs"
                  style={{
                    borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
                    color: "#1D4ED8",
                  }}
                >
                  Today
                </button>
                <button onClick={goToPreviousMonth} className="rounded-lg p-1.5 hover:bg-primary/10" style={{ color: textSoft }}>
                  <ChevronLeft size={15} />
                </button>
                <button onClick={goToNextMonth} className="rounded-lg p-1.5 hover:bg-primary/10" style={{ color: textSoft }}>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 size={22} className="animate-spin" style={{ color: "#1D4ED8" }} />
              </div>
            ) : view === "calendar" ? (
              <>
                <div className="mb-2 grid grid-cols-7">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="py-1 text-center text-xs font-medium" style={{ color: textSoft }}>
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: totalCells }).map((_, index) => {
                    const day = index - firstDay + 1;
                    const valid = day >= 1 && day <= daysInMonth;
                    const date = new Date(currentYear, currentMonth, day);
                    const isToday = valid && isSameLocalDay(date, clockNow);
                    const selected = valid && isSameLocalDay(date, selectedDate);
                    const daySchedules = valid ? monthSchedulesByDay[day] || [] : [];

                    return (
                      <button
                        key={index}
                        disabled={!valid}
                        onClick={() => valid && setSelectedDate(date)}
                        className="relative flex aspect-square flex-col items-center justify-center rounded-xl border p-1 transition-all disabled:opacity-0"
                        style={{
                          background: selected
                            ? "linear-gradient(135deg, #1D4ED8, #2563EB)"
                            : isToday
                              ? darkMode
                                ? "rgba(29,78,216,0.15)"
                                : "rgba(29,78,216,0.08)"
                              : "transparent",
                          borderColor:
                            isToday && !selected
                              ? "rgba(29,78,216,0.25)"
                              : "transparent",
                        }}
                      >
                        <span
                          className="text-xs"
                          style={{
                            color: selected ? "#ffffff" : isToday ? "#1D4ED8" : darkMode ? "#94a3b8" : "#475569",
                            fontWeight: isToday || selected ? 700 : 400,
                          }}
                        >
                          {valid ? day : ""}
                        </span>

                        {daySchedules.length > 0 && (
                          <div className="mt-1 flex gap-0.5">
                            {daySchedules.slice(0, 3).map((schedule) => (
                              <span
                                key={schedule.id}
                                className="h-1 w-1 rounded-full"
                                style={{ background: platformColor(schedule.platform) }}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {upcomingSchedules.length === 0 ? (
                  <div className="flex h-52 flex-col items-center justify-center text-center">
                    <Calendar size={28} style={{ color: textSoft }} />
                    <p className="mt-2 text-sm" style={{ color: textMuted }}>
                      No upcoming scheduled posts.
                    </p>
                    <button
                      onClick={() => openScheduleModal()}
                      className="mt-3 rounded-xl px-4 py-2 text-sm text-white"
                      style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB)" }}
                    >
                      Schedule first post
                    </button>
                  </div>
                ) : (
                  upcomingSchedules.map(renderScheduleCard)
                )}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col rounded-2xl border p-5"
            style={cardBase}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>
                  {formatDateLabel(selectedDate)}
                </h3>
                <p className="text-xs" style={{ color: textSoft }}>
                  {selectedDaySchedules.length} post{selectedDaySchedules.length !== 1 ? "s" : ""} scheduled
                </p>
              </div>

              <button
                onClick={() => openScheduleModal()}
                className="rounded-xl border p-2"
                style={{
                  borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
                  color: "#1D4ED8",
                }}
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto">
              {selectedDaySchedules.length === 0 ? (
                <div className="flex h-36 flex-col items-center justify-center text-center">
                  <Calendar size={24} style={{ color: textSoft, marginBottom: "8px" }} />
                  <p className="text-xs" style={{ color: textMuted }}>
                    No posts scheduled for this day
                  </p>
                  <button
                    onClick={() => openScheduleModal()}
                    className="mt-2 text-xs"
                    style={{ color: "#1D4ED8" }}
                  >
                    + Add post
                  </button>
                </div>
              ) : (
                selectedDaySchedules.map(renderScheduleCard)
              )}
            </div>

            <div
              className="mt-4 rounded-xl border p-3"
              style={{
                background: darkMode ? "rgba(29,78,216,0.06)" : "rgba(29,78,216,0.03)",
                borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(29,78,216,0.08)",
              }}
            >
              <div className="mb-2 flex items-center gap-2">
                <Wand2 size={13} style={{ color: "#1D4ED8" }} />
                <span className="text-xs font-semibold" style={{ color: textPrimary }}>
                  AI scheduling note
                </span>
              </div>
              <p className="text-xs" style={{ color: textMuted }}>
                {contentTypeMeta[form.contentType].description}
              </p>
            </div>
          </motion.div>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div
              className="w-full max-w-2xl rounded-2xl border p-5 shadow-2xl"
              style={{
                background: darkMode ? "rgba(15,23,42,0.98)" : "#ffffff",
                borderColor: darkMode ? "rgba(29,78,216,0.18)" : "rgba(15,23,42,0.08)",
              }}
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold" style={{ color: textPrimary }}>
                    Advanced Schedule Post
                  </h3>
                  <p className="text-xs" style={{ color: textSoft }}>
                    Select a generated post, choose content type, then use AI recommended or manual timing.
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg px-2 py-1 text-xs"
                  style={{ color: textMuted }}
                >
                  Close
                </button>
              </div>

              {selectableGeneratedPosts.length === 0 ? (
                <div
                  className="rounded-2xl border p-4 text-sm"
                  style={{
                    borderColor: "rgba(245,158,11,0.20)",
                    color: "#f59e0b",
                    background: "rgba(245,158,11,0.08)",
                  }}
                >
                  <div className="mb-2 flex items-center gap-2 font-medium">
                    <AlertTriangle size={16} />
                    No draft generated posts found
                  </div>
                  Create a Generated Post from AI Studio or Media Library first, then schedule it here.
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs" style={{ color: textSoft }}>
                      Generated Post
                    </label>
                    <select
                      value={form.generated_post_id}
                      onChange={(event) => updateForm("generated_post_id", event.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-sm"
                      style={{
                        background: darkMode ? "rgba(29,78,216,0.06)" : "#f8fafc",
                        borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
                        color: textPrimary,
                      }}
                    >
                      {selectableGeneratedPosts.map((post) => (
                        <option key={post.id} value={post.id}>
                          {getGeneratedPostTitle(post)}
                        </option>
                      ))}
                    </select>
                    {selectedGeneratedPost && (
                      <p className="mt-1 line-clamp-2 text-xs" style={{ color: textMuted }}>
                        {selectedGeneratedPost.content}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs" style={{ color: textSoft }}>
                        Content Type
                      </label>
                      <select
                        value={form.contentType}
                        onChange={handleContentTypeChange}
                        className="w-full rounded-xl border px-3 py-2 text-sm"
                        style={{
                          background: darkMode ? "rgba(29,78,216,0.06)" : "#f8fafc",
                          borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
                          color: textPrimary,
                        }}
                      >
                        {Object.entries(contentTypeMeta).map(([value, meta]) => (
                          <option key={value} value={value}>
                            {meta.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs" style={{ color: textSoft }}>
                        Platform
                      </label>
                      <select
                        value={form.platform}
                        onChange={handlePlatformChange}
                        className="w-full rounded-xl border px-3 py-2 text-sm"
                        style={{
                          background: darkMode ? "rgba(29,78,216,0.06)" : "#f8fafc",
                          borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
                          color: textPrimary,
                        }}
                      >
                        {platformOptions.map((platform) => (
                          <option key={platform} value={platform}>
                            {platformLabel(platform)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div
                    className="rounded-2xl border p-3"
                    style={{
                      background: darkMode ? "rgba(29,78,216,0.06)" : "rgba(29,78,216,0.03)",
                      borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
                    }}
                  >
                    <p className="mb-2 text-xs font-semibold" style={{ color: textPrimary }}>
                      Recommended slots
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {recommendations.slice(0, 4).map((slot) => (
                        <button
                          key={slot.date.toISOString()}
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              date: toDateInputValue(slot.date),
                              time: toTimeInputValue(slot.date),
                            }))
                          }
                          className="rounded-xl border p-2 text-left text-xs"
                          style={{
                            background: darkMode ? "rgba(15,23,42,0.70)" : "#ffffff",
                            borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
                            color: textMuted,
                          }}
                        >
                          <span className="font-semibold" style={{ color: "#1D4ED8" }}>
                            {slot.score}% - {slot.label}
                          </span>
                          <br />
                          {slot.reason}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs" style={{ color: textSoft }}>
                        Date
                      </label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(event) => updateForm("date", event.target.value)}
                        className="w-full rounded-xl border px-3 py-2 text-sm"
                        style={{
                          background: darkMode ? "rgba(29,78,216,0.06)" : "#f8fafc",
                          borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
                          color: textPrimary,
                        }}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs" style={{ color: textSoft }}>
                        Time
                      </label>
                      <input
                        type="time"
                        value={form.time}
                        onChange={(event) => updateForm("time", event.target.value)}
                        className="w-full rounded-xl border px-3 py-2 text-sm"
                        style={{
                          background: darkMode ? "rgba(29,78,216,0.06)" : "#f8fafc",
                          borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
                          color: textPrimary,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setModalOpen(false)}
                      className="flex-1 rounded-xl border px-4 py-2 text-sm"
                      style={{
                        borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
                        color: textMuted,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateSchedule}
                      disabled={actionKey === "create"}
                      className="flex-1 rounded-xl px-4 py-2 text-sm font-medium text-white"
                      style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB)" }}
                    >
                      {actionKey === "create" ? "Scheduling..." : "Schedule Post"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
