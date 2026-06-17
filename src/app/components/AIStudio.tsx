import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Download,
  FileText,
  Hash,
  History,
  Languages,
  Loader2,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  Subtitles,
  Wand2,
  XCircle,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  createClientAIJob,
  getMyClientAIJobs,
  type ClientAIJob,
  type ClientAIJobType,
} from "../lib/clientApi";

const tools: Array<{
  id: string;
  jobType: ClientAIJobType;
  icon: typeof Sparkles;
  label: string;
  desc: string;
  color: string;
}> = [
  {
    id: "caption",
    jobType: "caption",
    icon: Sparkles,
    label: "Caption Generator",
    desc: "Create captions for listings, launches, and posts",
    color: "#6366f1",
  },
  {
    id: "hashtag",
    jobType: "hashtag",
    icon: Hash,
    label: "Hashtag Generator",
    desc: "Generate niche and platform-specific hashtags",
    color: "#8b5cf6",
  },
  {
    id: "report",
    jobType: "report",
    icon: FileText,
    label: "Report Agent",
    desc: "Create short business and campaign reports",
    color: "#06b6d4",
  },
  {
    id: "translate",
    jobType: "other",
    icon: Languages,
    label: "Translator",
    desc: "Prepare translation jobs for content",
    color: "#10b981",
  },
  {
    id: "subtitle",
    jobType: "other",
    icon: Subtitles,
    label: "Subtitle Helper",
    desc: "Prepare subtitle-generation requests",
    color: "#f59e0b",
  },
  {
    id: "optimizer",
    jobType: "recommendation",
    icon: Wand2,
    label: "Content Optimizer",
    desc: "Improve content clarity and conversion intent",
    color: "#ef4444",
  },
];

const tones = [
  "Professional",
  "Casual",
  "Luxury",
  "Investor-focused",
  "Educational",
  "Promotional",
];

const platforms = [
  "Instagram",
  "LinkedIn",
  "Twitter/X",
  "Facebook",
  "TikTok",
  "YouTube",
  "WhatsApp",
];

const templates = [
  {
    title: "New property launch",
    prompt:
      "Write a high-converting launch caption for a premium real estate property with clear CTA.",
  },
  {
    title: "Lead follow-up message",
    prompt:
      "Create a polite follow-up message for a warm real estate lead who has not replied in 7 days.",
  },
  {
    title: "Weekly performance report",
    prompt:
      "Create a short weekly report summary covering leads, properties, follow-ups, and next actions.",
  },
  {
    title: "Instagram listing post",
    prompt:
      "Write an Instagram caption for a luxury apartment listing with urgency and lifestyle positioning.",
  },
];

type GeneratedPostStatus = "draft" | "scheduled" | "published";
type GeneratedPostFilter = "all" | GeneratedPostStatus;
type GeneratedPostPlatform = "Instagram" | "LinkedIn" | "Facebook";

type GeneratedPost = {
  id: string;
  caption: string;
  platform: GeneratedPostPlatform;
  status: GeneratedPostStatus;
  createdAt: string;
};

const generatedPostFilters: Array<{ label: string; value: GeneratedPostFilter }> = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Published", value: "published" },
];

const generatedPostSeedData: GeneratedPost[] = [
  {
    id: "post-1",
    caption:
      "Discover a premium 3BHK residence designed for modern city living, with elegant interiors, smart amenities, and a location built for everyday convenience.",
    platform: "Instagram",
    status: "draft",
    createdAt: "Today, 10:30 AM",
  },
  {
    id: "post-2",
    caption:
      "Real estate growth starts with fast lead follow-up. Here are three practical ways agencies can improve conversion without adding more manual work.",
    platform: "LinkedIn",
    status: "scheduled",
    createdAt: "Yesterday, 6:15 PM",
  },
  {
    id: "post-3",
    caption:
      "Looking for a family-ready home near schools, markets, and metro connectivity? This listing brings comfort, location, and long-term value together.",
    platform: "Facebook",
    status: "published",
    createdAt: "12 Jun, 4:45 PM",
  },
];

const getGeneratedPostStatusConfig = (status: GeneratedPostStatus) => {
  if (status === "published") {
    return {
      label: "Published",
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.10)",
      border: "rgba(16, 185, 129, 0.18)",
    };
  }

  if (status === "scheduled") {
    return {
      label: "Scheduled",
      color: "#6366f1",
      bg: "rgba(99, 102, 241, 0.10)",
      border: "rgba(99, 102, 241, 0.18)",
    };
  }

  return {
    label: "Draft",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.10)",
    border: "rgba(245, 158, 11, 0.18)",
  };
};
interface AIStudioProps {
  darkMode: boolean;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "â€”";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "â€”";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusConfig = (status: string) => {
  if (status === "completed") {
    return {
      label: "Completed",
      icon: CheckCircle2,
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.10)",
      border: "rgba(16, 185, 129, 0.18)",
    };
  }

  if (status === "running") {
    return {
      label: "Running",
      icon: Loader2,
      color: "#6366f1",
      bg: "rgba(99, 102, 241, 0.10)",
      border: "rgba(99, 102, 241, 0.18)",
    };
  }

  if (status === "failed") {
    return {
      label: "Failed",
      icon: XCircle,
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.10)",
      border: "rgba(239, 68, 68, 0.18)",
    };
  }

  if (status === "cancelled") {
    return {
      label: "Cancelled",
      icon: XCircle,
      color: "#94a3b8",
      bg: "rgba(148, 163, 184, 0.10)",
      border: "rgba(148, 163, 184, 0.18)",
    };
  }

  return {
    label: "Queued",
    icon: Clock,
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.10)",
    border: "rgba(245, 158, 11, 0.18)",
  };
};

const getToolById = (toolId: string) =>
  tools.find((tool) => tool.id === toolId) || tools[0];

const getToolByJob = (job: ClientAIJob) =>
  tools.find((tool) => tool.jobType === job.job_type) || tools[0];

export function AIStudio({ darkMode }: AIStudioProps) {
  const [activeTool, setActiveTool] = useState("caption");
  const [selectedTone, setSelectedTone] = useState("Professional");
  const [selectedPlatform, setSelectedPlatform] = useState("LinkedIn");
  const [prompt, setPrompt] = useState("");
  const [jobs, setJobs] = useState<ClientAIJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ClientAIJob | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"generate" | "history" | "templates">(
    "generate",
  );

  const activeToolConfig = getToolById(activeTool);

  const cardStyle = {
    background: darkMode ? "rgba(13, 13, 40, 0.8)" : "#ffffff",
    borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
    backdropFilter: "blur(16px)",
  };

  const textPrimary = darkMode ? "#e2e8f0" : "#0f172a";
  const textMuted = darkMode ? "#64748b" : "#64748b";
  const textSoft = darkMode ? "#4a5568" : "#94a3b8";

  const stats = useMemo(() => {
    const total = jobs.length;
    const completed = jobs.filter((job) => job.status === "completed").length;
    const running = jobs.filter((job) => job.status === "running").length;
    const failed = jobs.filter((job) => job.status === "failed").length;

    return { total, completed, running, failed };
  }, [jobs]);

  const latestJobs = useMemo(() => jobs.slice(0, 8), [jobs]);

  const filteredGeneratedPosts = useMemo(() => {
    if (generatedPostFilter === "all") return generatedPosts;

    return generatedPosts.filter((post) => post.status === generatedPostFilter);
  }, [generatedPostFilter, generatedPosts]);

  const handleCreateMockGeneratedPost = () => {
    setGeneratedPosts((currentPosts) => {
      if (currentPosts.length > 0) return currentPosts;

      return generatedPostSeedData;
    });

    setGeneratedPostFilter("all");
    setGeneratedPostActionMessage("Sample generated posts added locally for preview.");

    window.setTimeout(() => {
      setGeneratedPostActionMessage(null);
    }, 2800);
  };

  const handleGeneratedPostAction = (action: string, post?: GeneratedPost) => {
    const target = post ? `${post.platform} post` : "generated posts";
    setGeneratedPostActionMessage(`${action} placeholder ready for ${target}.`);

    window.setTimeout(() => {
      setGeneratedPostActionMessage(null);
    }, 2800);
  };

  const loadJobs = async () => {
    try {
      setLoadingJobs(true);
      setError(null);
      const data = await getMyClientAIJobs();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load AI jobs");
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Prompt is required before creating an AI job.");
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const job = await createClientAIJob({
        job_type: activeToolConfig.jobType,
        title: `${activeToolConfig.label} - ${selectedPlatform}`,
        description: prompt.trim(),
        priority: activeToolConfig.jobType === "report" ? "high" : "normal",
        input_payload: {
          tool: activeToolConfig.id,
          tool_label: activeToolConfig.label,
          platform: selectedPlatform,
          tone: selectedTone,
          prompt: prompt.trim(),
          requested_from: "client_ai_studio",
        },
      });

      setSelectedJob(job);
      setPrompt("");
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create AI job");
    } finally {
      setGenerating(false);
    }
  };

  const copyJobPayload = async (job: ClientAIJob) => {
    const payload = job.output_payload || job.input_payload || {};
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-1 flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: "0 0 20px rgba(99,102,241,0.3)",
              }}
            >
              <Sparkles size={15} className="text-white" />
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: textPrimary }}>
              AI Studio
            </h1>
            <span
              className="rounded-full px-2 py-1 text-xs"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#ffffff",
              }}
            >
              Backend connected
            </span>
          </div>
          <p className="ml-11 text-sm" style={{ color: textSoft }}>
            Create AI jobs, track progress, and review generated outputs from one place.
          </p>
        </motion.div>

        {error && (
          <div
            className="flex items-start gap-3 rounded-2xl border p-4 text-sm"
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              borderColor: "rgba(239, 68, 68, 0.18)",
              color: "#ef4444",
            }}
          >
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Total AI Jobs", value: stats.total, color: "#6366f1" },
            { label: "Running", value: stats.running, color: "#8b5cf6" },
            { label: "Completed", value: stats.completed, color: "#10b981" },
            { label: "Failed", value: stats.failed, color: "#ef4444" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border p-4"
              style={{
                background: cardStyle.background,
                borderColor: cardStyle.borderColor,
              }}
            >
              <p className="text-xs" style={{ color: textSoft }}>
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {tools.map((tool, index) => (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                setActiveTool(tool.id);
                setActiveTab("generate");
              }}
              className="group relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border p-4 transition-all"
              style={{
                background:
                  activeTool === tool.id
                    ? darkMode
                      ? `${tool.color}15`
                      : `${tool.color}08`
                    : cardStyle.background,
                borderColor:
                  activeTool === tool.id
                    ? `${tool.color}40`
                    : darkMode
                      ? "rgba(99,102,241,0.1)"
                      : "rgba(15,23,42,0.06)",
                boxShadow: activeTool === tool.id ? `0 0 20px ${tool.color}20` : "none",
              }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                style={{ background: `${tool.color}15` }}
              >
                <tool.icon size={18} style={{ color: tool.color }} />
              </div>
              <span
                className="text-center text-xs font-medium leading-tight"
                style={{ color: textPrimary }}
              >
                {tool.label}
              </span>
              {activeTool === tool.id && (
                <motion.div
                  layoutId="toolIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                  style={{ background: tool.color }}
                />
              )}
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div
              className="flex gap-1 rounded-xl p-1"
              style={{
                background: darkMode
                  ? "rgba(99,102,241,0.06)"
                  : "rgba(99,102,241,0.04)",
              }}
            >
              {(["generate", "history", "templates"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 rounded-lg py-2 text-xs capitalize transition-all"
                  style={{
                    background:
                      activeTab === tab
                        ? darkMode
                          ? "rgba(99,102,241,0.2)"
                          : "#ffffff"
                        : "transparent",
                    color:
                      activeTab === tab
                        ? darkMode
                          ? "#818cf8"
                          : "#6366f1"
                        : textSoft,
                    boxShadow:
                      activeTab === tab && !darkMode
                        ? "0 1px 4px rgba(0,0,0,0.06)"
                        : "none",
                  }}
                >
                  {tab === "history" && <History size={11} className="mr-1 inline" />}
                  {tab === "templates" && <Bookmark size={11} className="mr-1 inline" />}
                  {tab}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "generate" && (
                <motion.div
                  key="generate"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div
                    className="rounded-2xl border p-4"
                    style={{ background: cardStyle.background, borderColor: cardStyle.borderColor }}
                  >
                    <div className="mb-4 flex items-start gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: `${activeToolConfig.color}18` }}
                      >
                        <activeToolConfig.icon size={18} style={{ color: activeToolConfig.color }} />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold" style={{ color: textPrimary }}>
                          {activeToolConfig.label}
                        </h2>
                        <p className="text-xs" style={{ color: textMuted }}>
                          {activeToolConfig.desc}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs" style={{ color: textSoft }}>
                          Platform
                        </label>
                        <div className="relative">
                          <select
                            value={selectedPlatform}
                            onChange={(event) => setSelectedPlatform(event.target.value)}
                            className="w-full appearance-none rounded-xl border px-3 py-2.5 pr-8 text-sm"
                            style={{
                              background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
                              borderColor: darkMode
                                ? "rgba(99,102,241,0.12)"
                                : "rgba(15,23,42,0.08)",
                              color: textPrimary,
                            }}
                          >
                            {platforms.map((platform) => (
                              <option key={platform}>{platform}</option>
                            ))}
                          </select>
                          <ChevronDown
                            size={12}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                            style={{ color: textSoft }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs" style={{ color: textSoft }}>
                          Brand Tone
                        </label>
                        <div className="relative">
                          <select
                            value={selectedTone}
                            onChange={(event) => setSelectedTone(event.target.value)}
                            className="w-full appearance-none rounded-xl border px-3 py-2.5 pr-8 text-sm"
                            style={{
                              background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
                              borderColor: darkMode
                                ? "rgba(99,102,241,0.12)"
                                : "rgba(15,23,42,0.08)",
                              color: textPrimary,
                            }}
                          >
                            {tones.map((tone) => (
                              <option key={tone}>{tone}</option>
                            ))}
                          </select>
                          <ChevronDown
                            size={12}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                            style={{ color: textSoft }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-1.5 block text-xs" style={{ color: textSoft }}>
                        Describe your AI request
                      </label>
                      <textarea
                        value={prompt}
                        onChange={(event) => setPrompt(event.target.value)}
                        placeholder="Example: Write a premium LinkedIn caption for a 3BHK luxury apartment in Gurgaon with a clear CTA."
                        rows={5}
                        className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:ring-2"
                        style={{
                          background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
                          borderColor: darkMode
                            ? "rgba(99,102,241,0.12)"
                            : "rgba(15,23,42,0.08)",
                          color: textPrimary,
                          fontFamily: "inherit",
                        }}
                      />
                    </div>

                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
                      style={{
                        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        color: "#ffffff",
                        boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                      }}
                    >
                      {generating ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Creating AI job...
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          Create AI Job
                          <Zap size={12} className="opacity-70" />
                        </>
                      )}
                    </button>
                  </div>

                  {selectedJob && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border p-4"
                      style={{
                        background: darkMode
                          ? "rgba(16,185,129,0.08)"
                          : "rgba(16,185,129,0.06)",
                        borderColor: "rgba(16,185,129,0.18)",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle2 size={18} style={{ color: "#10b981" }} />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: textPrimary }}>
                            AI job created successfully
                          </p>
                          <p className="mt-1 text-xs" style={{ color: textMuted }}>
                            Your request is now queued. Founder/admin can monitor and process it from AI Jobs.
                          </p>
                          <p className="mt-2 text-xs font-mono" style={{ color: "#10b981" }}>
                            JOB-{selectedJob.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <section
                    aria-labelledby="generated-posts-heading"
                    className="rounded-2xl border p-4"
                    style={{ background: cardStyle.background, borderColor: cardStyle.borderColor }}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-xl"
                            style={{ background: darkMode ? "rgba(99,102,241,0.16)" : "rgba(99,102,241,0.10)" }}
                          >
                            <FileText size={16} style={{ color: "#6366f1" }} />
                          </div>
                          <div>
                            <h2
                              id="generated-posts-heading"
                              className="text-sm font-semibold"
                              style={{ color: textPrimary }}
                            >
                              Generated Posts
                            </h2>
                            <p className="text-xs" style={{ color: textSoft }}>
                              Saved AI captions and post drafts will appear here.
                            </p>
                          </div>
                        </div>

                        {generatedPostActionMessage && (
                          <div
                            role="status"
                            className="mt-3 rounded-xl border px-3 py-2 text-xs"
                            style={{
                              background: darkMode
                                ? "rgba(16,185,129,0.10)"
                                : "rgba(16,185,129,0.06)",
                              borderColor: "rgba(16,185,129,0.18)",
                              color: "#10b981",
                            }}
                          >
                            {generatedPostActionMessage}
                          </div>
                        )}
                      </div>

                      <div
                        aria-label="Filter generated posts"
                        className="flex flex-wrap gap-2"
                      >
                        {generatedPostFilters.map((filter) => {
                          const active = generatedPostFilter === filter.value;

                          return (
                            <button
                              key={filter.value}
                              type="button"
                              onClick={() => setGeneratedPostFilter(filter.value)}
                              className="rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
                              style={{
                                background: active
                                  ? darkMode
                                    ? "rgba(99,102,241,0.22)"
                                    : "rgba(99,102,241,0.10)"
                                  : "transparent",
                                borderColor: active
                                  ? "rgba(99,102,241,0.36)"
                                  : cardStyle.borderColor,
                                color: active ? "#6366f1" : textMuted,
                              }}
                            >
                              {filter.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4">
                      {filteredGeneratedPosts.length === 0 ? (
                        <div
                          className="rounded-2xl border border-dashed p-6 text-center"
                          style={{
                            background: darkMode ? "rgba(99,102,241,0.04)" : "#f8fafc",
                            borderColor: darkMode
                              ? "rgba(99,102,241,0.18)"
                              : "rgba(15,23,42,0.10)",
                          }}
                        >
                          <div
                            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
                            style={{
                              background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))",
                            }}
                          >
                            <Sparkles size={18} style={{ color: "#6366f1" }} />
                          </div>
                          <p className="text-sm font-semibold" style={{ color: textPrimary }}>
                            No generated posts yet
                          </p>
                          <p className="mx-auto mt-2 max-w-md text-xs leading-5" style={{ color: textMuted }}>
                            Generate content in AI Studio and saved posts will appear here.
                          </p>
                          <button
                            type="button"
                            onClick={handleCreateMockGeneratedPost}
                            className="mt-4 rounded-xl px-4 py-2 text-xs font-medium transition-all hover:opacity-90"
                            style={{
                              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                              color: "#ffffff",
                              boxShadow: "0 4px 14px rgba(99,102,241,0.25)",
                            }}
                          >
                            Generate first post
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                          {filteredGeneratedPosts.map((post) => {
                            const statusConfig = getGeneratedPostStatusConfig(post.status);

                            return (
                              <article
                                key={post.id}
                                className="rounded-2xl border p-4"
                                style={{
                                  background: darkMode ? "rgba(99,102,241,0.04)" : "#f8fafc",
                                  borderColor: cardStyle.borderColor,
                                }}
                              >
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                  <span
                                    className="rounded-full border px-2.5 py-1 text-xs font-medium"
                                    style={{
                                      color: "#6366f1",
                                      background: darkMode
                                        ? "rgba(99,102,241,0.12)"
                                        : "rgba(99,102,241,0.08)",
                                      borderColor: "rgba(99,102,241,0.18)",
                                    }}
                                  >
                                    {post.platform}
                                  </span>
                                  <span
                                    className="rounded-full border px-2.5 py-1 text-xs font-medium"
                                    style={{
                                      color: statusConfig.color,
                                      background: statusConfig.bg,
                                      borderColor: statusConfig.border,
                                    }}
                                  >
                                    {statusConfig.label}
                                  </span>
                                  <span className="ml-auto text-xs" style={{ color: textSoft }}>
                                    {post.createdAt}
                                  </span>
                                </div>

                                <p className="text-sm leading-6" style={{ color: textPrimary }}>
                                  {post.caption}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  {(["Edit", "Copy", "Schedule", "Publish"] as const).map((action) => (
                                    <button
                                      key={action}
                                      type="button"
                                      onClick={() => handleGeneratedPostAction(action, post)}
                                      className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-all hover:scale-[1.02]"
                                      style={{
                                        background: darkMode
                                          ? "rgba(255,255,255,0.04)"
                                          : "#ffffff",
                                        borderColor: cardStyle.borderColor,
                                        color: textMuted,
                                      }}
                                      aria-label={`${action} ${post.platform} generated post`}
                                    >
                                      {action}
                                    </button>
                                  ))}
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </section>                </motion.div>
              )}

              {activeTab === "history" && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {loadingJobs ? (
                    <div className="flex items-center gap-2 p-4 text-sm" style={{ color: textMuted }}>
                      <Loader2 size={16} className="animate-spin" />
                      Loading AI jobs...
                    </div>
                  ) : latestJobs.length ? (
                    latestJobs.map((job) => {
                      const config = getStatusConfig(job.status);
                      const StatusIcon = config.icon;
                      const tool = getToolByJob(job);

                      return (
                        <button
                          key={job.id}
                          onClick={() => setSelectedJob(job)}
                          className="w-full rounded-2xl border p-4 text-left transition-all hover:scale-[1.01]"
                          style={{
                            background: cardStyle.background,
                            borderColor: cardStyle.borderColor,
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-xl"
                              style={{ background: `${tool.color}15` }}
                            >
                              <tool.icon size={17} style={{ color: tool.color }} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold" style={{ color: textPrimary }}>
                                  {job.title}
                                </p>
                                <span
                                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                                  style={{
                                    color: config.color,
                                    background: config.bg,
                                    borderColor: config.border,
                                  }}
                                >
                                  <StatusIcon
                                    size={11}
                                    className={job.status === "running" ? "animate-spin" : ""}
                                  />
                                  {config.label}
                                </span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs" style={{ color: textMuted }}>
                                {job.description || "No description provided"}
                              </p>
                              <p className="mt-2 text-xs" style={{ color: textSoft }}>
                                Created {formatDateTime(job.created_at)}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div
                      className="rounded-2xl border p-5 text-center text-sm"
                      style={{ background: cardStyle.background, borderColor: cardStyle.borderColor, color: textMuted }}
                    >
                      No AI jobs created yet.
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "templates" && (
                <motion.div
                  key="templates"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  {templates.map((template) => (
                    <button
                      key={template.title}
                      onClick={() => {
                        setPrompt(template.prompt);
                        setActiveTab("generate");
                      }}
                      className="rounded-2xl border p-4 text-left transition-all hover:scale-[1.02]"
                      style={{ background: cardStyle.background, borderColor: cardStyle.borderColor }}
                    >
                      <p className="text-sm font-semibold" style={{ color: textPrimary }}>
                        {template.title}
                      </p>
                      <p className="mt-2 text-xs leading-5" style={{ color: textMuted }}>
                        {template.prompt}
                      </p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-4">
            <div
              className="rounded-2xl border p-4"
              style={{ background: cardStyle.background, borderColor: cardStyle.borderColor }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>
                    Recent AI Jobs
                  </h3>
                  <p className="text-xs" style={{ color: textSoft }}>
                    Live backend status
                  </p>
                </div>
                <button
                  onClick={loadJobs}
                  className="rounded-xl p-2 transition-all hover:bg-primary/5"
                  style={{ color: textSoft }}
                >
                  <RefreshCw size={14} className={loadingJobs ? "animate-spin" : ""} />
                </button>
              </div>

              <div className="space-y-2">
                {latestJobs.length ? (
                  latestJobs.slice(0, 5).map((job) => {
                    const config = getStatusConfig(job.status);
                    const StatusIcon = config.icon;

                    return (
                      <button
                        key={job.id}
                        onClick={() => setSelectedJob(job)}
                        className="w-full rounded-xl border p-3 text-left"
                        style={{
                          background: darkMode ? "rgba(99,102,241,0.04)" : "#f8fafc",
                          borderColor: darkMode
                            ? "rgba(99,102,241,0.08)"
                            : "rgba(15,23,42,0.06)",
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-medium" style={{ color: textPrimary }}>
                            {job.title}
                          </p>
                          <StatusIcon
                            size={13}
                            className={job.status === "running" ? "animate-spin" : ""}
                            style={{ color: config.color }}
                          />
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${job.progress || 0}%`,
                              background: config.color,
                            }}
                          />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs" style={{ color: textMuted }}>
                    No AI jobs yet. Create your first request from the generator.
                  </p>
                )}
              </div>
            </div>

            {selectedJob && (
              <div
                className="rounded-2xl border p-4"
                style={{ background: cardStyle.background, borderColor: cardStyle.borderColor }}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>
                      Selected Job
                    </h3>
                    <p className="mt-1 text-xs font-mono" style={{ color: textSoft }}>
                      JOB-{selectedJob.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <button
                    onClick={() => copyJobPayload(selectedJob)}
                    className="rounded-xl p-2 transition-all hover:bg-primary/5"
                    style={{ color: textSoft }}
                  >
                    <Copy size={14} />
                  </button>
                </div>

                <p className="text-sm font-medium" style={{ color: textPrimary }}>
                  {selectedJob.title}
                </p>
                <p className="mt-2 text-xs leading-5" style={{ color: textMuted }}>
                  {selectedJob.description || "No description provided"}
                </p>

                <div className="mt-4 space-y-3">
                  <div>
                    <p className="mb-1 text-xs" style={{ color: textSoft }}>
                      Output payload
                    </p>
                    <pre
                      className="max-h-48 overflow-auto rounded-xl p-3 text-xs leading-5"
                      style={{
                        background: darkMode ? "rgba(255,255,255,0.04)" : "#f8fafc",
                        color: textMuted,
                        border: `1px solid ${cardStyle.borderColor}`,
                      }}
                    >
                      {JSON.stringify(selectedJob.output_payload || {}, null, 2)}
                    </pre>
                  </div>

                  {selectedJob.error_message && (
                    <div
                      className="rounded-xl border p-3 text-xs"
                      style={{
                        background: "rgba(239, 68, 68, 0.08)",
                        borderColor: "rgba(239, 68, 68, 0.18)",
                        color: "#ef4444",
                      }}
                    >
                      {selectedJob.error_message}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div
              className="rounded-2xl border p-4"
              style={{
                background: darkMode
                  ? "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))"
                  : "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))",
                borderColor: "rgba(99,102,241,0.16)",
              }}
            >
              <div className="mb-2 flex items-center gap-2">
                <Zap size={15} style={{ color: "#6366f1" }} />
                <p className="text-sm font-semibold" style={{ color: textPrimary }}>
                  Workflow Note
                </p>
              </div>
              <p className="text-xs leading-5" style={{ color: textMuted }}>
                This screen now creates real backend AI jobs. Actual AI generation worker/model execution will be added in the next phase.
              </p>
              <div className="mt-3 flex gap-2">
                <button className="rounded-lg p-2 transition-all hover:bg-primary/5" style={{ color: textSoft }}>
                  <Download size={13} />
                </button>
                <button className="rounded-lg p-2 transition-all hover:bg-primary/5" style={{ color: textSoft }}>
                  <Share2 size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
