import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Clock,
  FileText,
  Gauge,
  Hash,
  Loader2,
  MessageSquareText,
  MoreHorizontal,
  Play,
  RefreshCcw,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Timer,
  XCircle,
} from "lucide-react";
import {
  getAIJobs,
  updateAIJob,
  type AdminAIJob,
  type AdminAIJobStatus,
} from "@/lib/adminApi";

const filters: Array<{ label: string; value: AdminAIJobStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Queued", value: "queued" },
  { label: "Running", value: "running" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
  { label: "Cancelled", value: "cancelled" },
];

const agentCatalog = [
  {
    name: "Caption Agent",
    icon: MessageSquareText,
    usage: "Real backend ready",
    color: "#6B8AFF",
  },
  {
    name: "Hashtag Agent",
    icon: Hash,
    usage: "Real backend ready",
    color: "#4ADE80",
  },
  {
    name: "Report Agent",
    icon: FileText,
    usage: "Real backend ready",
    color: "#6B8AFF",
  },
  {
    name: "Scheduler Agent",
    icon: Send,
    usage: "Real backend ready",
    color: "#4ADE80",
  },
  {
    name: "Recommendation Agent",
    icon: Sparkles,
    usage: "Real backend ready",
    color: "#FF8A5C",
  },
  {
    name: "AI Chat Agent",
    icon: Bot,
    usage: "Real backend ready",
    color: "#6B8AFF",
  },
];

const statusLabelMap: Record<string, string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

const getStatusLabel = (status: string) => statusLabelMap[status] || status;

const getStatusConfig = (
  status: string,
): { icon: ReactNode; className: string; color: string } => {
  if (status === "running") {
    return {
      icon: <Loader2 size={14} className="animate-spin" />,
      className: "badge-blue",
      color: "#6B8AFF",
    };
  }

  if (status === "completed") {
    return {
      icon: <CheckCircle2 size={14} />,
      className: "badge-green",
      color: "#4ADE80",
    };
  }

  if (status === "failed") {
    return {
      icon: <XCircle size={14} />,
      className: "badge-red",
      color: "#FF5A5A",
    };
  }

  if (status === "queued") {
    return {
      icon: <Clock size={14} />,
      className: "badge-neutral",
      color: "#FF8A5C",
    };
  }

  return {
    icon: <Clock size={14} />,
    className: "badge-neutral",
    color: "#8A8A93",
  };
};

const getJobTypeLabel = (jobType: string) => {
  const lowerType = jobType.toLowerCase();

  if (lowerType.includes("caption")) return "Caption Agent";
  if (lowerType.includes("hashtag")) return "Hashtag Agent";
  if (lowerType.includes("report")) return "Report Agent";
  if (lowerType.includes("scheduler")) return "Scheduler Agent";
  if (lowerType.includes("publisher")) return "Publisher Agent";
  if (lowerType.includes("analytics")) return "Analytics Agent";
  if (lowerType.includes("recommendation")) return "Recommendation Agent";
  if (lowerType.includes("chat")) return "AI Chat Agent";
  if (lowerType.includes("voice")) return "Voice AI Agent";
  if (lowerType.includes("orchestrator")) return "AI Orchestrator";

  return "Automation Agent";
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not started";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getRuntimeLabel = (job: AdminAIJob) => {
  if (!job.started_at) return "Waiting";

  const start = new Date(job.started_at).getTime();
  const endValue =
    job.completed_at ||
    job.failed_at ||
    job.updated_at ||
    new Date().toISOString();
  const end = new Date(endValue).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return "—";

  const diffSeconds = Math.max(0, Math.round((end - start) / 1000));

  if (diffSeconds < 60) return `${diffSeconds}s`;

  const minutes = Math.floor(diffSeconds / 60);
  const seconds = diffSeconds % 60;

  return `${minutes}m ${seconds}s`;
};

const getQueueHealth = (jobs: AdminAIJob[]) => {
  const total = jobs.length;
  const running = jobs.filter((job) => job.status === "running").length;
  const failed = jobs.filter((job) => job.status === "failed").length;
  const completed = jobs.filter((job) => job.status === "completed").length;

  const queueLoad = total
    ? Math.round(
        ((running + jobs.filter((job) => job.status === "queued").length) /
          total) *
          100,
      )
    : 0;
  const failureRisk = total ? Math.round((failed / total) * 100) : 0;
  const successRate = total ? Math.round((completed / total) * 100) : 0;

  return [
    { label: "Queue Load", value: `${queueLoad}%`, color: "#6B8AFF" },
    { label: "Failure Risk", value: `${failureRisk}%`, color: "#FF8A5C" },
    { label: "Success Rate", value: `${successRate}%`, color: "#4ADE80" },
  ];
};

export default function AIJobs() {
  const [filter, setFilter] = useState<AdminAIJobStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [jobs, setJobs] = useState<AdminAIJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedLogJob, setSelectedLogJob] = useState<AdminAIJob | null>(null);
  const [openActionsJobId, setOpenActionsJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  async function loadJobs(selectedFilter = filter, silent = false) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const data = await getAIJobs({
        status: selectedFilter,
      });

      setJobs(data);
      setLastSyncedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load AI jobs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadJobs(filter);
  }, [filter]);

  const filteredJobs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return jobs;

    return jobs.filter((job) => {
      return [
        job.title,
        job.description,
        job.business_name,
        job.created_by_name,
        job.created_by_email,
        job.job_type,
        job.status,
        job.priority,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedSearch),
        );
    });
  }, [jobs, searchTerm]);

  const queuedJobs = jobs.filter((job) => job.status === "queued").length;
  const runningJobs = jobs.filter((job) => job.status === "running").length;
  const completedJobs = jobs.filter((job) => job.status === "completed").length;
  const failedJobs = jobs.filter((job) => job.status === "failed").length;

  const queueHealth = getQueueHealth(jobs);

  const summaryCards = [
    {
      label: "Queued Jobs",
      value: queuedJobs,
      sub: "Waiting for execution",
      icon: Clock,
      color: "#FF8A5C",
    },
    {
      label: "Running Jobs",
      value: runningJobs,
      sub: "Currently processing",
      icon: Play,
      color: "#6B8AFF",
    },
    {
      label: "Completed Jobs",
      value: completedJobs,
      sub: "Finished successfully",
      icon: CheckCircle2,
      color: "#4ADE80",
    },
    {
      label: "Failed Jobs",
      value: failedJobs,
      sub: "Needs retry or review",
      icon: XCircle,
      color: "#FF5A5A",
    },
  ];

  const handleRetryJob = async (job: AdminAIJob) => {
    try {
      setActionLoadingId(job.id);
      await updateAIJob(job.id, {
        status: "queued",
        progress: 0,
        error_message: null,
      });
      await loadJobs(filter, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to retry AI job");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStartJob = async (job: AdminAIJob) => {
    try {
      setActionLoadingId(job.id);
      await updateAIJob(job.id, {
        status: "running",
        progress: Math.max(job.progress || 0, 10),
      });
      await loadJobs(filter, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start AI job");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCompleteJob = async (job: AdminAIJob) => {
    try {
      setActionLoadingId(job.id);
      await updateAIJob(job.id, {
        status: "completed",
        progress: 100,
        output_payload: {
          message: "Marked completed from founder AI Jobs console",
        },
      });
      await loadJobs(filter, true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to complete AI job",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleFailJob = async (job: AdminAIJob) => {
    try {
      setActionLoadingId(job.id);
      setOpenActionsJobId(null);
      await updateAIJob(job.id, {
        status: "failed",
        progress: job.progress || 0,
        error_message: "Marked failed from founder AI Jobs console",
      });
      await loadJobs(filter, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark AI job as failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelJob = async (job: AdminAIJob) => {
    try {
      setActionLoadingId(job.id);
      setOpenActionsJobId(null);
      await updateAIJob(job.id, {
        status: "cancelled",
        progress: job.progress || 0,
      });
      await loadJobs(filter, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel AI job");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenLogs = (job: AdminAIJob) => {
    setSelectedLogJob(job);
    setOpenActionsJobId(null);
  };

  const handleRetryFailedJobs = async () => {
    const failed = jobs.filter((job) => job.status === "failed");

    if (!failed.length) return;

    try {
      setRefreshing(true);
      setError(null);

      await Promise.all(
        failed.map((job) =>
          updateAIJob(job.id, {
            status: "queued",
            progress: 0,
            error_message: null,
          }),
        ),
      );

      await loadJobs(filter, true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to retry failed jobs",
      );
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div
            className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1"
            style={{
              background: "rgba(107, 138, 255, 0.08)",
              border: "1px solid rgba(107, 138, 255, 0.16)",
            }}
          >
            <BrainCircuit size={14} style={{ color: "#6B8AFF" }} />
            <span className="text-xs font-mono" style={{ color: "#6B8AFF" }}>
              AI Operations Console
            </span>
          </div>

          <h1
            className="font-display text-hero font-medium tracking-[-0.03em]"
            style={{ color: "#F0EDE6" }}
          >
            AI Jobs
          </h1>
          <p className="mt-1 max-w-2xl text-sm" style={{ color: "#8A8A93" }}>
            Monitor real AI automation jobs, agent queues, runtime health,
            retries, and processing status across client companies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => loadJobs(filter, true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-60"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              color: "#F0EDE6",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <RefreshCcw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh Queue
          </button>
          <button
            onClick={handleRetryFailedJobs}
            disabled={!failedJobs || refreshing}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-60"
            style={{ background: "#6B8AFF", color: "#FFFFFF" }}
          >
            <RotateCcw size={15} />
            Retry Failed Jobs
          </button>
        </div>
      </div>

      {error && (
        <div
          className="mb-6 rounded-xl p-4"
          style={{
            background: "rgba(255, 90, 90, 0.08)",
            border: "1px solid rgba(255, 90, 90, 0.18)",
          }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} style={{ color: "#FF5A5A" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "#F0EDE6" }}>
                Unable to load AI jobs
              </p>
              <p className="mt-1 text-xs" style={{ color: "#FFB4B4" }}>
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className="surface-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className="text-xs font-mono mb-2"
                    style={{ color: "#8A8A93" }}
                  >
                    {card.label}
                  </p>
                  <p
                    className="font-mono text-data font-medium"
                    style={{ color: "#F0EDE6" }}
                  >
                    {loading ? "—" : card.value}
                  </p>
                  <p className="mt-2 text-xs" style={{ color: "#55555C" }}>
                    {card.sub}
                  </p>
                </div>
                <div
                  className="rounded-xl p-2.5"
                  style={{
                    background: `${card.color}14`,
                    color: card.color,
                    border: `1px solid ${card.color}26`,
                  }}
                >
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="surface-card overflow-hidden">
          <div
            className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}
          >
            <div>
              <h2
                className="text-base font-medium"
                style={{ color: "#F0EDE6" }}
              >
                Job Queue
              </h2>
              <p className="mt-1 text-xs" style={{ color: "#8A8A93" }}>
                Live backend queue for AI agents
              </p>
            </div>

            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <Search size={14} style={{ color: "#8A8A93" }} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search jobs"
                className="w-40 bg-transparent text-xs outline-none placeholder:text-[#55555C]"
                style={{ color: "#F0EDE6" }}
              />
            </div>
          </div>

          <div
            className="flex flex-wrap gap-2 px-5 py-4"
            style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}
          >
            {filters.map((filterOption) => (
              <button
                key={filterOption.value}
                onClick={() => setFilter(filterOption.value)}
                className="rounded-full px-3 py-1.5 text-xs transition-all"
                style={{
                  background:
                    filter === filterOption.value
                      ? "rgba(107, 138, 255, 0.12)"
                      : "rgba(255, 255, 255, 0.04)",
                  color: filter === filterOption.value ? "#6B8AFF" : "#8A8A93",
                  border:
                    filter === filterOption.value
                      ? "1px solid rgba(107, 138, 255, 0.2)"
                      : "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                {filterOption.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Loader2
                size={28}
                className="animate-spin"
                style={{ color: "#6B8AFF" }}
              />
              <p className="mt-3 text-sm" style={{ color: "#8A8A93" }}>
                Loading AI jobs...
              </p>
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px]">
                <thead>
                  <tr style={{ background: "rgba(255, 255, 255, 0.03)" }}>
                    <th
                      className="text-left px-5 py-3 text-xs font-mono font-normal"
                      style={{ color: "#8A8A93" }}
                    >
                      Job
                    </th>
                    <th
                      className="text-left px-5 py-3 text-xs font-mono font-normal"
                      style={{ color: "#8A8A93" }}
                    >
                      Company
                    </th>
                    <th
                      className="text-left px-5 py-3 text-xs font-mono font-normal"
                      style={{ color: "#8A8A93" }}
                    >
                      Type
                    </th>
                    <th
                      className="text-left px-5 py-3 text-xs font-mono font-normal"
                      style={{ color: "#8A8A93" }}
                    >
                      Status
                    </th>
                    <th
                      className="text-left px-5 py-3 text-xs font-mono font-normal"
                      style={{ color: "#8A8A93" }}
                    >
                      Progress
                    </th>
                    <th
                      className="text-left px-5 py-3 text-xs font-mono font-normal"
                      style={{ color: "#8A8A93" }}
                    >
                      Runtime
                    </th>
                    <th
                      className="text-left px-5 py-3 text-xs font-mono font-normal"
                      style={{ color: "#8A8A93" }}
                    >
                      Created
                    </th>
                    <th
                      className="text-right px-5 py-3 text-xs font-mono font-normal"
                      style={{ color: "#8A8A93" }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job, index) => {
                    const statusConfig = getStatusConfig(job.status);
                    const jobType = getJobTypeLabel(job.job_type);
                    const isActionLoading = actionLoadingId === job.id;

                    return (
                      <tr
                        key={job.id}
                        className="transition-colors duration-200"
                        style={{
                          borderBottom:
                            index < filteredJobs.length - 1
                              ? "1px solid rgba(255, 255, 255, 0.04)"
                              : "none",
                        }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.background =
                            "rgba(255, 255, 255, 0.03)";
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.background = "transparent";
                        }}
                      >
                        <td className="px-5 py-4">
                          <div>
                            <p
                              className="text-sm font-medium"
                              style={{ color: "#F0EDE6" }}
                            >
                              {job.title}
                            </p>
                            <p
                              className="mt-1 text-xs font-mono"
                              style={{ color: "#55555C" }}
                            >
                              JOB-{job.id.slice(0, 8).toUpperCase()}
                            </p>
                            {job.error_message && (
                              <p
                                className="mt-1 max-w-xs truncate text-xs"
                                style={{ color: "#FF8A5C" }}
                              >
                                {job.error_message}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <span
                              className="text-sm"
                              style={{ color: "#8A8A93" }}
                            >
                              {job.business_name || "Unknown company"}
                            </span>
                            <p
                              className="mt-1 text-xs"
                              style={{ color: "#55555C" }}
                            >
                              {job.created_by_email || "No user email"}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs"
                            style={{
                              background: "rgba(107, 138, 255, 0.1)",
                              color: "#6B8AFF",
                              border: "1px solid rgba(107, 138, 255, 0.18)",
                            }}
                          >
                            {jobType}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${statusConfig.className}`}
                          >
                            {statusConfig.icon}
                            {getStatusLabel(job.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="w-28">
                            <div
                              className="mb-1 flex justify-between text-xs font-mono"
                              style={{ color: "#8A8A93" }}
                            >
                              <span>{job.progress || 0}%</span>
                            </div>
                            <div
                              className="h-1.5 overflow-hidden rounded-full"
                              style={{
                                background: "rgba(255, 255, 255, 0.08)",
                              }}
                            >
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${job.progress || 0}%`,
                                  background: statusConfig.color,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="inline-flex items-center gap-2">
                            <Timer size={13} style={{ color: "#55555C" }} />
                            <span
                              className="text-sm font-mono"
                              style={{ color: "#8A8A93" }}
                            >
                              {getRuntimeLabel(job)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="text-sm"
                            style={{ color: "#8A8A93" }}
                          >
                            {formatDateTime(job.created_at)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="relative flex items-center justify-end gap-2">
                            {job.status === "queued" && (
                              <button
                                onClick={() => handleStartJob(job)}
                                disabled={isActionLoading}
                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors disabled:opacity-60"
                                style={{
                                  background: "rgba(107, 138, 255, 0.1)",
                                  color: "#6B8AFF",
                                }}
                              >
                                {isActionLoading ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Play size={12} />
                                )}
                                Start
                              </button>
                            )}

                            {job.status === "running" && (
                              <button
                                onClick={() => handleCompleteJob(job)}
                                disabled={isActionLoading}
                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors disabled:opacity-60"
                                style={{
                                  background: "rgba(74, 222, 128, 0.1)",
                                  color: "#4ADE80",
                                }}
                              >
                                {isActionLoading ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={12} />
                                )}
                                Complete
                              </button>
                            )}

                            {job.status === "failed" && (
                              <button
                                onClick={() => handleRetryJob(job)}
                                disabled={isActionLoading}
                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors disabled:opacity-60"
                                style={{
                                  background: "rgba(107, 138, 255, 0.1)",
                                  color: "#6B8AFF",
                                }}
                              >
                                {isActionLoading ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <RotateCcw size={12} />
                                )}
                                Retry
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenLogs(job)}
                              className="inline-flex items-center gap-1.5 text-xs transition-colors"
                              style={{ color: "#8A8A93" }}
                            >
                              <FileText size={12} />
                              Logs
                            </button>

                            <button
                              onClick={() =>
                                setOpenActionsJobId(
                                  openActionsJobId === job.id ? null : job.id,
                                )
                              }
                              className="rounded-md p-1.5 transition-colors"
                              style={{ color: "#8A8A93" }}
                              title="More actions"
                            >
                              <MoreHorizontal size={15} />
                            </button>

                            {openActionsJobId === job.id && (
                              <div
                                className="absolute right-0 top-8 z-30 w-44 overflow-hidden rounded-xl"
                                style={{
                                  background: "#141418",
                                  border: "1px solid rgba(255, 255, 255, 0.10)",
                                  boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
                                }}
                              >
                                <button
                                  onClick={() => handleOpenLogs(job)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs"
                                  style={{ color: "#F0EDE6" }}
                                >
                                  <FileText size={13} />
                                  View logs
                                </button>

                                {job.status !== "running" && job.status !== "completed" && (
                                  <button
                                    onClick={() => handleStartJob(job)}
                                    disabled={isActionLoading}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs disabled:opacity-60"
                                    style={{ color: "#6B8AFF" }}
                                  >
                                    <Play size={13} />
                                    Start job
                                  </button>
                                )}

                                {job.status === "running" && (
                                  <button
                                    onClick={() => handleCompleteJob(job)}
                                    disabled={isActionLoading}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs disabled:opacity-60"
                                    style={{ color: "#4ADE80" }}
                                  >
                                    <CheckCircle2 size={13} />
                                    Mark complete
                                  </button>
                                )}

                                {job.status !== "failed" && job.status !== "completed" && (
                                  <button
                                    onClick={() => handleFailJob(job)}
                                    disabled={isActionLoading}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs disabled:opacity-60"
                                    style={{ color: "#FF8A5C" }}
                                  >
                                    <XCircle size={13} />
                                    Mark failed
                                  </button>
                                )}

                                {job.status !== "cancelled" && job.status !== "completed" && (
                                  <button
                                    onClick={() => handleCancelJob(job)}
                                    disabled={isActionLoading}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs disabled:opacity-60"
                                    style={{ color: "#8A8A93" }}
                                  >
                                    <Clock size={13} />
                                    Cancel job
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div
                className="mb-4 rounded-2xl p-4"
                style={{ background: "rgba(255, 255, 255, 0.04)" }}
              >
                <Bot size={28} style={{ color: "#8A8A93" }} />
              </div>
              <h3
                className="text-base font-medium"
                style={{ color: "#F0EDE6" }}
              >
                No AI jobs found
              </h3>
              <p className="mt-2 max-w-md text-sm" style={{ color: "#8A8A93" }}>
                AI automation jobs will appear here when clients create caption,
                report, scheduler, recommendation, and other agent tasks.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="surface-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2
                  className="text-base font-medium"
                  style={{ color: "#F0EDE6" }}
                >
                  Queue Health
                </h2>
                <p className="mt-1 text-xs" style={{ color: "#8A8A93" }}>
                  Live metrics from backend jobs
                </p>
              </div>
              <Gauge size={18} style={{ color: "#6B8AFF" }} />
            </div>

            <div className="space-y-4">
              {queueHealth.map((metric) => (
                <div key={metric.label}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span
                      className="text-xs font-mono"
                      style={{ color: "#8A8A93" }}
                    >
                      {metric.label}
                    </span>
                    <span
                      className="text-xs font-mono"
                      style={{ color: "#F0EDE6" }}
                    >
                      {metric.value}
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full"
                    style={{ background: "rgba(255, 255, 255, 0.05)" }}
                  >
                    <div
                      className="h-2 rounded-full"
                      style={{ width: metric.value, background: metric.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div
              className="mt-6 rounded-xl p-4"
              style={{
                background: "rgba(107, 138, 255, 0.06)",
                border: "1px solid rgba(107, 138, 255, 0.14)",
              }}
            >
              <div className="mb-2 flex items-center gap-2">
                <BrainCircuit size={14} style={{ color: "#6B8AFF" }} />
                <span
                  className="text-xs font-mono"
                  style={{ color: "#6B8AFF" }}
                >
                  System note
                </span>
              </div>
              <p className="text-sm leading-6" style={{ color: "#F0EDE6" }}>
                This page is now connected to the real AI Jobs backend. Actual
                worker execution and agent orchestration will be added later.
              </p>
            </div>
          </div>

          <div className="surface-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2
                  className="text-base font-medium"
                  style={{ color: "#F0EDE6" }}
                >
                  Agent Categories
                </h2>
                <p className="mt-1 text-xs" style={{ color: "#8A8A93" }}>
                  AI Business OS workers
                </p>
              </div>
              <Activity size={18} style={{ color: "#4ADE80" }} />
            </div>

            <div className="space-y-3">
              {agentCatalog.map((agent) => {
                const Icon = agent.icon;

                return (
                  <div
                    key={agent.name}
                    className="flex items-center justify-between gap-4 rounded-xl p-3"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="rounded-lg p-2"
                        style={{
                          background: `${agent.color}14`,
                          color: agent.color,
                          border: `1px solid ${agent.color}24`,
                        }}
                      >
                        <Icon size={15} />
                      </div>
                      <div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "#F0EDE6" }}
                        >
                          {agent.name}
                        </p>
                        <p
                          className="mt-1 text-xs"
                          style={{ color: "#55555C" }}
                        >
                          {agent.usage}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-xs font-mono"
                      style={{ color: "#8A8A93" }}
                    >
                      API
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedLogJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0, 0, 0, 0.72)" }}
          onClick={() => setSelectedLogJob(null)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl"
            style={{
              background: "#111114",
              border: "1px solid rgba(255, 255, 255, 0.10)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 p-5" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <div>
                <p className="text-xs font-mono" style={{ color: "#6B8AFF" }}>AI Job Logs</p>
                <h3 className="mt-1 text-lg font-medium" style={{ color: "#F0EDE6" }}>
                  {selectedLogJob.title}
                </h3>
                <p className="mt-1 text-xs" style={{ color: "#8A8A93" }}>
                  JOB-{selectedLogJob.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setSelectedLogJob(null)}
                className="rounded-lg px-3 py-1.5 text-xs"
                style={{ background: "rgba(255,255,255,0.06)", color: "#F0EDE6" }}
              >
                Close
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
              {selectedLogJob.error_message && (
                <div className="rounded-xl p-4" style={{ background: "rgba(255, 138, 92, 0.08)", border: "1px solid rgba(255, 138, 92, 0.18)" }}>
                  <p className="text-xs font-mono" style={{ color: "#FF8A5C" }}>Error message</p>
                  <p className="mt-2 text-sm" style={{ color: "#F0EDE6" }}>{selectedLogJob.error_message}</p>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-mono" style={{ color: "#8A8A93" }}>Input payload</p>
                <pre className="overflow-x-auto rounded-xl p-4 text-xs leading-6" style={{ background: "rgba(255,255,255,0.04)", color: "#F0EDE6", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {JSON.stringify(selectedLogJob.input_payload || {}, null, 2)}
                </pre>
              </div>

              <div>
                <p className="mb-2 text-xs font-mono" style={{ color: "#8A8A93" }}>Output payload</p>
                <pre className="overflow-x-auto rounded-xl p-4 text-xs leading-6" style={{ background: "rgba(255,255,255,0.04)", color: "#F0EDE6", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {JSON.stringify(selectedLogJob.output_payload || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="mt-8 flex flex-col gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderTop: "1px solid rgba(255, 255, 255, 0.04)" }}
      >
        <span className="text-xs" style={{ color: "#55555C" }}>
          MMe-AI v2.0
        </span>
        <span className="text-xs font-mono" style={{ color: "#55555C" }}>
          Last synced:{" "}
          {lastSyncedAt
            ? lastSyncedAt.toLocaleTimeString("en-IN")
            : "Not synced yet"}
        </span>
      </div>
    </div>
  );
}
