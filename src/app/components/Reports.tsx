import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileBarChart,
  Mail,
  Megaphone,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  XCircle,
  type LucideIcon,
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
  emailReport,
  getClientLeads,
  getClientProperties,
  getMyGeneratedPosts,
  getMyScheduledPosts,
  type ClientGeneratedPost,
  type ClientLead,
  type ClientProperty,
  type ClientScheduledPost,
} from "../lib/clientApi";

interface ReportsProps {
  darkMode: boolean;
}

type ReportPeriod = "daily" | "weekly" | "monthly";
type ReportSection = "overview" | "marketing" | "scheduler" | "publisher";

type SummaryPoint = {
  type: "win" | "attention";
  text: string;
};

type RecentReportItem = {
  title: string;
  meta: string;
  type: "CRM" | "Property" | "Marketing" | "Scheduler" | "Publisher" | "System";
  signal: string;
  color: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatPrice(price: number) {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${new Intl.NumberFormat("en-IN").format(price)}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusCount(items: { status?: string }[], status: string) {
  return items.filter((item) => (item.status || "").toLowerCase() === status).length;
}

function isToday(value?: string | null) {
  if (!value) return false;

  const date = new Date(value);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function safeIsToday(value?: string | null) {
  if (!value) return false;

  const date = new Date(value);
  const now = new Date();

  if (Number.isNaN(date.getTime())) return false;

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function platformLabel(platform?: string | null) {
  const value = (platform || "other").toLowerCase();

  const labels: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    twitter: "Twitter/X",
    website: "Website",
    youtube: "YouTube",
    other: "Other",
  };

  return labels[value] || value;
}

function getGeneratedPostTitle(post: ClientGeneratedPost) {
  return post.title || post.content?.slice(0, 80) || "Generated post";
}

function extractCampaignEvents(post: ClientGeneratedPost) {
  const metadata = post.metadata_json || {};
  const campaignResults = metadata.campaign_publish_results;

  return Array.isArray(campaignResults) ? campaignResults : [];
}

function extractPublisherMode(post: ClientGeneratedPost) {
  const metadata = post.metadata_json || {};
  const publisher = metadata.publisher;

  if (publisher && typeof publisher === "object" && "mode" in publisher) {
    return String((publisher as Record<string, unknown>).mode || "");
  }

  const campaignEvents = extractCampaignEvents(post);
  const latestCampaign = campaignEvents[campaignEvents.length - 1];

  if (
    latestCampaign &&
    typeof latestCampaign === "object" &&
    "results" in latestCampaign &&
    Array.isArray((latestCampaign as Record<string, unknown>).results)
  ) {
    const result = ((latestCampaign as Record<string, unknown>).results as unknown[])[0];

    if (result && typeof result === "object" && "mode" in result) {
      return String((result as Record<string, unknown>).mode || "");
    }
  }

  return "";
}

function getScheduledWindow(period: ReportPeriod) {
  const now = new Date();
  const end = new Date(now);

  if (period === "daily") {
    end.setDate(now.getDate() + 1);
  } else if (period === "weekly") {
    end.setDate(now.getDate() + 7);
  } else {
    end.setMonth(now.getMonth() + 1);
  }

  return { now, end };
}

function withinWindow(value: string | null | undefined, start: Date, end: Date) {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  return date >= start && date <= end;
}

export function Reports({ darkMode }: ReportsProps) {
  const [activeReport, setActiveReport] = useState<ReportPeriod>("monthly");
  const [activeSection, setActiveSection] = useState<ReportSection>("overview");
  const [exporting, setExporting] = useState(false);
  const [leads, setLeads] = useState<ClientLead[]>([]);
  const [properties, setProperties] = useState<ClientProperty[]>([]);
  const [generatedPosts, setGeneratedPosts] = useState<ClientGeneratedPost[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ClientScheduledPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState("");
  const [sendCopyToMe, setSendCopyToMe] = useState(true);
  const [emailSending, setEmailSending] = useState(false);

  const cardBase = {
    background: darkMode ? "rgba(15,23,42,0.8)" : "#ffffff",
    borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.06)",
  };

  const textPrimary = darkMode ? "#e2e8f0" : "#0f172a";
  const textMuted = darkMode ? "#64748b" : "#64748b";
  const textSoft = darkMode ? "#94A3B8" : "#94a3b8";
  const chartColor = darkMode ? "#60A5FA" : "#1D4ED8";
  const tickColor = darkMode ? "#2d3748" : "#cbd5e1";
  const tooltipBg = darkMode ? "#0F172A" : "#ffffff";

  const loadReportData = async () => {
    try {
      setLoading(true);
      setApiMessage(null);

      const [leadData, propertyData, generatedPostData, scheduledPostData] =
        await Promise.all([
          getClientLeads(),
          getClientProperties(),
          getMyGeneratedPosts({ limit: 200 }),
          getMyScheduledPosts({ limit: 200 }),
        ]);

      setLeads(leadData);
      setProperties(propertyData);
      setGeneratedPosts(generatedPostData);
      setScheduledPosts(scheduledPostData);
    } catch (err) {
      setApiMessage(err instanceof Error ? err.message : "Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReportData();
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

    const avgLeadScore =
      totalLeads > 0
        ? Math.round(leads.reduce((sum, lead) => sum + (lead.score || 0), 0) / totalLeads)
        : 0;

    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
    const availabilityRate =
      totalProperties > 0 ? Math.round((availableProperties / totalProperties) * 100) : 0;

    const generatedTotal = generatedPosts.length;
    const generatedDraft = getStatusCount(generatedPosts, "draft");
    const generatedScheduled = getStatusCount(generatedPosts, "scheduled");
    const generatedPublished = getStatusCount(generatedPosts, "published");
    const generatedFailed = getStatusCount(generatedPosts, "failed");

    const scheduleTotal = scheduledPosts.length;
    const scheduleScheduled = getStatusCount(scheduledPosts, "scheduled");
    const schedulePublishing = getStatusCount(scheduledPosts, "publishing");
    const schedulePublished = getStatusCount(scheduledPosts, "published");
    const scheduleFailed = getStatusCount(scheduledPosts, "failed");
    const scheduleToday = scheduledPosts.filter((schedule) => safeIsToday(schedule.scheduled_at)).length;

    const { now, end } = getScheduledWindow(activeReport);
    const upcomingInPeriod = scheduledPosts.filter((schedule) =>
      withinWindow(schedule.scheduled_at, now, end),
    ).length;

    const mockPublished = generatedPosts.filter((post) => extractPublisherMode(post) === "mock").length;
    const realPublished = generatedPosts.filter((post) => extractPublisherMode(post) === "real").length;
    const campaignEvents = generatedPosts.flatMap(extractCampaignEvents);
    const campaignCount = campaignEvents.length;

    const businessScore =
      totalLeads + totalProperties + generatedTotal + scheduleTotal > 0
        ? Math.min(
            100,
            Math.max(
              45,
              Math.round(
                avgLeadScore * 0.32 +
                  hotLeads * 4 +
                  availabilityRate * 0.18 +
                  conversionRate * 0.38 +
                  generatedPublished * 4 -
                  generatedFailed * 4 -
                  scheduleFailed * 4,
              ),
            ),
          )
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
      generatedTotal,
      generatedDraft,
      generatedScheduled,
      generatedPublished,
      generatedFailed,
      scheduleTotal,
      scheduleScheduled,
      schedulePublishing,
      schedulePublished,
      scheduleFailed,
      scheduleToday,
      upcomingInPeriod,
      mockPublished,
      realPublished,
      campaignCount,
      businessScore,
    };
  }, [leads, properties, generatedPosts, scheduledPosts, activeReport]);

  const platformData = useMemo(() => {
    const platforms = ["instagram", "facebook", "linkedin", "twitter", "website", "youtube", "other"];

    return platforms.map((platform) => ({
      platform: platformLabel(platform),
      generated: generatedPosts.filter((post) => String(post.platform).toLowerCase() === platform).length,
      scheduled: scheduledPosts.filter((post) => String(post.platform).toLowerCase() === platform).length,
    }));
  }, [generatedPosts, scheduledPosts]);

  const trendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

    return months.map((month, index) => {
      const ratio = (index + 1) / months.length;

      return {
        month,
        leads:
          reportStats.totalLeads === 0 ? 0 : Math.max(1, Math.round(reportStats.totalLeads * ratio)),
        properties:
          reportStats.totalProperties === 0
            ? 0
            : Math.max(1, Math.round(reportStats.totalProperties * ratio)),
        posts:
          reportStats.generatedTotal === 0
            ? 0
            : Math.max(1, Math.round(reportStats.generatedTotal * ratio)),
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
            text: "No client enquiries found yet. Add leads to generate stronger business insights.",
          },
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
          },
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
          },
    );

    points.push(
      reportStats.generatedTotal > 0
        ? {
            type: "win",
            text: `${reportStats.generatedTotal} generated posts tracked: ${reportStats.generatedPublished} published, ${reportStats.generatedScheduled} scheduled, ${reportStats.generatedDraft} drafts.`,
          }
        : {
            type: "attention",
            text: "No marketing drafts found yet. Create social posts to activate marketing reports.",
          },
    );

    points.push(
      reportStats.scheduleTotal > 0
        ? {
            type: reportStats.scheduleFailed > 0 ? "attention" : "win",
            text: `${reportStats.scheduleTotal} scheduled posts tracked. ${reportStats.upcomingInPeriod} are upcoming in the selected ${activeReport} window.`,
          }
        : {
            type: "attention",
            text: "No scheduled posts yet. Use Scheduler to build the publishing calendar.",
          },
    );

    points.push(
      reportStats.generatedFailed + reportStats.scheduleFailed > 0
        ? {
            type: "attention",
            text: `${reportStats.generatedFailed + reportStats.scheduleFailed} marketing items need review due to failed publishing or scheduling status.`,
          }
        : {
            type: "win",
            text: "No failed marketing or scheduled items detected in the current report snapshot.",
          },
    );

    points.push({
      type: reportStats.businessScore >= 70 ? "win" : "attention",
      text: `Business Health Score is ${reportStats.businessScore}/100 based on CRM, inventory, generated posts, scheduler and publishing signals.`,
    });

    return points;
  }, [reportStats, activeReport]);

  const recentItems = useMemo<RecentReportItem[]>(() => {
    const leadRows: RecentReportItem[] = leads.slice(0, 3).map((lead) => ({
      title: `Lead: ${lead.name}`,
      meta: `${lead.status || "new"} · ${lead.score || 50}/100 score`,
      type: "CRM",
      signal: (lead.score || 0) >= 80 ? "Hot" : "Active",
      color: "#1D4ED8",
    }));

    const propertyRows: RecentReportItem[] = properties.slice(0, 3).map((property) => ({
      title: `Property: ${property.title}`,
      meta: `${property.location} · ${formatPrice(property.price || 0)}`,
      type: "Property",
      signal: property.status,
      color: "#10b981",
    }));

    const generatedRows: RecentReportItem[] = generatedPosts.slice(0, 3).map((post) => ({
      title: `Generated: ${getGeneratedPostTitle(post)}`,
      meta: `${platformLabel(post.platform)} · ${post.status}`,
      type: "Marketing",
      signal: post.status,
      color: "#2563EB",
    }));

    const scheduleRows: RecentReportItem[] = scheduledPosts.slice(0, 3).map((schedule) => ({
      title: `Scheduled: ${schedule.generated_post_title || schedule.generated_post_id}`,
      meta: `${platformLabel(schedule.platform)} · ${formatDateTime(schedule.scheduled_at)}`,
      type: "Scheduler",
      signal: schedule.status,
      color: "#06b6d4",
    }));

    const rows = [...leadRows, ...propertyRows, ...generatedRows, ...scheduleRows];

    return rows.length > 0
      ? rows
      : [
          {
            title: "No live report data yet",
            meta: "Add leads, properties, generated posts and schedules",
            type: "System",
            signal: "Pending",
            color: "#f59e0b",
          },
        ];
  }, [leads, properties, generatedPosts, scheduledPosts]);

  const reportText = useMemo(() => {
    return [
      "RS Real Estate - Business Intelligence Report",
      `Report Type: ${activeReport}`,
      `Generated: ${new Date().toLocaleString("en-IN")}`,
      "",
      "CRM:",
      `Total Leads: ${reportStats.totalLeads}`,
      `Hot Leads: ${reportStats.hotLeads}`,
      `Average Lead Score: ${reportStats.avgLeadScore}/100`,
      `Conversion Rate: ${reportStats.conversionRate}%`,
      "",
      "Properties:",
      `Total Properties: ${reportStats.totalProperties}`,
      `Available Properties: ${reportStats.availableProperties}`,
      `Sold Properties: ${reportStats.soldProperties}`,
      `Rented Properties: ${reportStats.rentedProperties}`,
      `Portfolio Value: ${formatPrice(reportStats.portfolioValue)}`,
      "",
      "Marketing:",
      `Generated Posts: ${reportStats.generatedTotal}`,
      `Draft Posts: ${reportStats.generatedDraft}`,
      `Scheduled Generated Posts: ${reportStats.generatedScheduled}`,
      `Published Generated Posts: ${reportStats.generatedPublished}`,
      `Failed Generated Posts: ${reportStats.generatedFailed}`,
      "",
      "Scheduler:",
      `Scheduled Queue: ${reportStats.scheduleScheduled}`,
      `Publishing Now: ${reportStats.schedulePublishing}`,
      `Published Scheduled Posts: ${reportStats.schedulePublished}`,
      `Failed Scheduled Posts: ${reportStats.scheduleFailed}`,
      `Upcoming in ${activeReport}: ${reportStats.upcomingInPeriod}`,
      "",
      "Publisher:",
      `Campaign Events: ${reportStats.campaignCount}`,
      `Mock Published: ${reportStats.mockPublished}`,
      `Real Published: ${reportStats.realPublished}`,
      "",
      `Business Health Score: ${reportStats.businessScore}/100`,
      "",
      "Report Summary:",
      ...aiSummaryPoints.map((point, index) => `${index + 1}. ${point.text}`),
    ].join("\n");
  }, [activeReport, aiSummaryPoints, reportStats]);

  const handleExport = () => {
    setExporting(true);

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `rs-real-estate-${activeReport}-business-report.txt`;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
    setTimeout(() => setExporting(false), 800);
  };

  const handleEmailReport = () => {
    setEmailModalOpen(true);
  };

  const handleSendEmailReport = async () => {
    try {
      setEmailSending(true);
      setApiMessage(null);

      const recipients = emailRecipients
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);

      if (!sendCopyToMe && recipients.length === 0) {
        setApiMessage("Add at least one recipient or keep 'Send copy to login email' enabled.");
        return;
      }

      const result = await emailReport({
        recipients,
        subject: `RS Real Estate ${activeReport} Business Report`,
        body: reportText,
        send_copy_to_me: sendCopyToMe,
      });

      setApiMessage(result.message);
      setEmailModalOpen(false);
    } catch (err) {
      setApiMessage(err instanceof Error ? err.message : "Failed to send report email.");
    } finally {
      setEmailSending(false);
    }
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setApiMessage("Report copied to clipboard.");
    } catch {
      setApiMessage("Could not copy report to clipboard.");
    }
  };

  const kpis: Array<{
    label: string;
    value: string;
    change: string;
    icon: LucideIcon;
    color: string;
    sub: string;
    section: ReportSection;
  }> = [
    {
      label: "Total Leads",
      value: formatNumber(reportStats.totalLeads),
      change: `${reportStats.hotLeads} hot`,
      icon: Target,
      color: "#2563EB",
      sub: "CRM pipeline",
      section: "overview",
    },
    {
      label: "Portfolio Value",
      value: formatPrice(reportStats.portfolioValue),
      change: `${reportStats.availableProperties} active`,
      icon: FileBarChart,
      color: "#06b6d4",
      sub: "inventory",
      section: "overview",
    },
    {
      label: "Generated Posts",
      value: formatNumber(reportStats.generatedTotal),
      change: `${reportStats.generatedPublished} published`,
      icon: Megaphone,
      color: "#1D4ED8",
      sub: "marketing",
      section: "marketing",
    },
    {
      label: "Scheduled Queue",
      value: formatNumber(reportStats.scheduleScheduled),
      change: `${reportStats.scheduleToday} today`,
      icon: CalendarClock,
      color: "#10b981",
      sub: "automation",
      section: "scheduler",
    },
    {
      label: "Campaign Events",
      value: formatNumber(reportStats.campaignCount),
      change: `${reportStats.mockPublished}/${reportStats.realPublished}`,
      icon: Send,
      color: "#f59e0b",
      sub: "mock/real",
      section: "publisher",
    },
    {
      label: "Health Score",
      value: `${reportStats.businessScore}/100`,
      change: `${reportStats.conversionRate}% conv`,
      icon: TrendingUp,
      color: "#14b8a6",
      sub: "AI score",
      section: "overview",
    },
  ];

  const sectionCards: Record<ReportSection, Array<{ label: string; value: string; color: string }>> = {
    overview: [
      { label: "New Leads", value: formatNumber(reportStats.newLeads), color: "#1D4ED8" },
      { label: "Contacted", value: formatNumber(reportStats.contactedLeads), color: "#2563EB" },
      { label: "Qualified", value: formatNumber(reportStats.qualifiedLeads), color: "#06b6d4" },
      { label: "Converted", value: formatNumber(reportStats.convertedLeads), color: "#10b981" },
      { label: "Lost", value: formatNumber(reportStats.lostLeads), color: "#ef4444" },
    ],
    marketing: [
      { label: "Drafts", value: formatNumber(reportStats.generatedDraft), color: "#f59e0b" },
      { label: "Scheduled", value: formatNumber(reportStats.generatedScheduled), color: "#1D4ED8" },
      { label: "Published", value: formatNumber(reportStats.generatedPublished), color: "#10b981" },
      { label: "Failed", value: formatNumber(reportStats.generatedFailed), color: "#ef4444" },
    ],
    scheduler: [
      { label: "Queued", value: formatNumber(reportStats.scheduleScheduled), color: "#10b981" },
      { label: "Publishing", value: formatNumber(reportStats.schedulePublishing), color: "#1D4ED8" },
      { label: "Published", value: formatNumber(reportStats.schedulePublished), color: "#14b8a6" },
      { label: "Failed", value: formatNumber(reportStats.scheduleFailed), color: "#ef4444" },
      { label: "Upcoming", value: formatNumber(reportStats.upcomingInPeriod), color: "#2563EB" },
    ],
    publisher: [
      { label: "Campaigns", value: formatNumber(reportStats.campaignCount), color: "#1D4ED8" },
      { label: "Mock Mode", value: formatNumber(reportStats.mockPublished), color: "#f59e0b" },
      { label: "Real Mode", value: formatNumber(reportStats.realPublished), color: "#10b981" },
      { label: "Failures", value: formatNumber(reportStats.generatedFailed + reportStats.scheduleFailed), color: "#ef4444" },
    ],
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
        >
          <div>
            <div className="mb-1 flex items-center gap-3">
              <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: textPrimary }}>
                Reports
              </h1>
              <span
                className="rounded-full px-2 py-1 text-xs"
                style={{
                  background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
                  color: "#ffffff",
                }}
              >
                BI v2
              </span>
            </div>
            <p className="text-sm" style={{ color: textSoft }}>
              {loading
                ? "Loading current business report..."
                : `Current report snapshot from ${reportStats.totalLeads} leads, ${reportStats.totalProperties} properties, ${reportStats.generatedTotal} posts and ${reportStats.scheduleTotal} schedules`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex gap-1 rounded-xl p-1"
              style={{
                background: darkMode ? "rgba(29,78,216,0.08)" : "rgba(29,78,216,0.04)",
              }}
            >
              {(["daily", "weekly", "monthly"] as const).map((report) => (
                <button
                  key={report}
                  onClick={() => setActiveReport(report)}
                  className="rounded-lg px-3 py-1.5 text-xs capitalize transition-all"
                  style={{
                    background:
                      activeReport === report
                        ? darkMode
                          ? "rgba(29,78,216,0.2)"
                          : "#ffffff"
                        : "transparent",
                    color:
                      activeReport === report
                        ? darkMode
                          ? "#60A5FA"
                          : "#1D4ED8"
                        : textSoft,
                    boxShadow:
                      activeReport === report && !darkMode
                        ? "0 1px 4px rgba(0,0,0,0.06)"
                        : "none",
                  }}
                >
                  {report}
                </button>
              ))}
            </div>

            <button
              onClick={() => void loadReportData()}
              className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-all"
              style={{ borderColor: cardBase.borderColor, color: textMuted }}
            >
              <RefreshCw size={13} /> Refresh
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-all"
              style={{ borderColor: cardBase.borderColor, color: textMuted }}
            >
              {exporting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                  <Download size={13} />
                </motion.div>
              ) : (
                <Download size={13} />
              )}
              {exporting ? "Exporting..." : "Export"}
            </button>

            <button
              onClick={handleEmailReport}
              className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-all"
              style={{ borderColor: cardBase.borderColor, color: textMuted }}
            >
              <Mail size={13} /> Email
            </button>

            <button
              onClick={handleCopyReport}
              className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-all"
              style={{ borderColor: cardBase.borderColor, color: textMuted }}
            >
              <Share2 size={13} /> Copy
            </button>
          </div>
        </motion.div>

        {apiMessage && (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{
              background: apiMessage.toLowerCase().includes("failed")
                ? "rgba(239,68,68,0.08)"
                : "rgba(245,158,11,0.08)",
              borderColor: apiMessage.toLowerCase().includes("failed")
                ? "rgba(239,68,68,0.20)"
                : "rgba(245,158,11,0.25)",
              color: apiMessage.toLowerCase().includes("failed") ? "#ef4444" : "#f59e0b",
            }}
          >
            {apiMessage}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {kpis.map((kpi, index) => (
            <motion.button
              key={kpi.label}
              onClick={() => setActiveSection(kpi.section)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + index * 0.05 }}
              className="rounded-2xl border p-5 text-left transition-all hover:scale-[1.01]"
              style={{
                ...cardBase,
                borderColor:
                  activeSection === kpi.section
                    ? `${kpi.color}55`
                    : cardBase.borderColor,
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: `${kpi.color}15` }}
                >
                  <kpi.icon size={16} style={{ color: kpi.color }} />
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#10b981" }}>
                  <ArrowUpRight size={10} /> {kpi.change}
                </span>
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 700, color: textPrimary, letterSpacing: "-0.03em" }}>
                {kpi.value}
              </div>
              <p className="mt-1 text-xs" style={{ color: textSoft }}>
                {kpi.label}
              </p>
              <p className="text-xs" style={{ color: darkMode ? "#2d3748" : "#cbd5e1" }}>
                {kpi.sub}
              </p>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border p-5"
          style={{
            background: darkMode
              ? "linear-gradient(135deg, rgba(29,78,216,0.1) 0%, rgba(37,99,235,0.07) 50%, rgba(15,23,42,0.9) 100%)"
              : "linear-gradient(135deg, rgba(29,78,216,0.05) 0%, rgba(37,99,235,0.03) 100%)",
            borderColor: darkMode ? "rgba(29,78,216,0.2)" : "rgba(29,78,216,0.1)",
          }}
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB)" }}>
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold" style={{ color: textPrimary }}>
                AI Executive Summary
              </span>
              <span className="ml-2 text-xs" style={{ color: textSoft }}>
                {activeReport} report · current snapshot
              </span>
            </div>
            {loading && <LoaderBadge />}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {aiSummaryPoints.map((point, index) => (
              <div
                key={`${point.text}-${index}`}
                className="flex items-start gap-2.5 rounded-xl p-3"
                style={{
                  background:
                    point.type === "win"
                      ? darkMode
                        ? "rgba(16,185,129,0.08)"
                        : "rgba(16,185,129,0.05)"
                      : darkMode
                        ? "rgba(245,158,11,0.08)"
                        : "rgba(245,158,11,0.05)",
                }}
              >
                {point.type === "win" ? (
                  <CheckCircle2 size={14} style={{ color: "#10b981", flexShrink: 0, marginTop: 1 }} />
                ) : (
                  <AlertCircle size={14} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }} />
                )}
                <p className="text-xs leading-relaxed" style={{ color: darkMode ? "#94a3b8" : "#475569" }}>
                  {point.text}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {sectionCards[activeSection].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border p-4 text-center"
              style={cardBase}
            >
              <p className="text-xl font-semibold" style={{ color: item.color }}>
                {item.value}
              </p>
              <p className="mt-1 text-xs" style={{ color: textSoft }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-5"
            style={cardBase}
          >
            <h3 className="mb-4 text-sm font-semibold" style={{ color: textPrimary }}>
              Business Growth Trend
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData}>
                <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{
                    background: tooltipBg,
                    border: `1px solid ${darkMode ? "rgba(29,78,216,0.2)" : "rgba(29,78,216,0.1)"}`,
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: textPrimary,
                  }}
                />
                <Bar dataKey="leads" radius={[6, 6, 0, 0]}>
                  {trendData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={index === trendData.length - 1 ? "#1D4ED8" : darkMode ? "rgba(29,78,216,0.3)" : "rgba(29,78,216,0.2)"}
                    />
                  ))}
                </Bar>
                <Bar dataKey="posts" radius={[6, 6, 0, 0]}>
                  {trendData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={index === trendData.length - 1 ? "#10b981" : darkMode ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.2)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-5"
            style={cardBase}
          >
            <h3 className="mb-4 text-sm font-semibold" style={{ color: textPrimary }}>
              Platform Activity
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={platformData}>
                <XAxis dataKey="platform" tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                <Tooltip
                  contentStyle={{
                    background: tooltipBg,
                    border: `1px solid ${darkMode ? "rgba(29,78,216,0.2)" : "rgba(29,78,216,0.1)"}`,
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: textPrimary,
                  }}
                />
                <Line type="monotone" dataKey="generated" stroke={chartColor} strokeWidth={3} dot={{ fill: chartColor, r: 4 }} />
                <Line type="monotone" dataKey="scheduled" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-5"
            style={cardBase}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>
                Recent Signals
              </h3>
              <span className="text-xs" style={{ color: textSoft }}>
                CRM + properties + marketing
              </span>
            </div>

            <div className="space-y-3">
              {recentItems.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className="flex items-center gap-3 rounded-xl border p-3"
                  style={{
                    borderColor: darkMode ? "rgba(29,78,216,0.08)" : "rgba(15,23,42,0.06)",
                    background: darkMode ? "rgba(29,78,216,0.03)" : "#f8fafc",
                  }}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${item.color}15` }}>
                    <FileBarChart size={15} style={{ color: item.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: textPrimary }}>
                      {item.title}
                    </p>
                    <p className="text-xs" style={{ color: textMuted }}>
                      {item.meta}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px]" style={{ color: item.color }}>
                      {item.signal}
                    </p>
                    <p className="text-[10px]" style={{ color: textSoft }}>
                      {item.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-5"
            style={cardBase}
          >
            <h3 className="mb-4 text-sm font-semibold" style={{ color: textPrimary }}>
              Recommended Next Actions
            </h3>

            <div className="space-y-3">
              {[
                reportStats.hotLeads > 0
                  ? `Follow up with ${reportStats.hotLeads} hot lead(s) before end of day.`
                  : "Create lead scoring rules and add fresh CRM leads.",
                reportStats.generatedDraft > 0
                  ? `Schedule ${reportStats.generatedDraft} draft generated post(s) from AI Studio.`
                  : "Create new generated posts for upcoming campaigns.",
                reportStats.scheduleFailed > 0
                  ? `Review ${reportStats.scheduleFailed} failed scheduled post(s).`
                  : "Keep scheduler queue active for weekly content consistency.",
                reportStats.campaignCount > 0
                  ? "Compare campaign performance by platform once real credentials are connected."
                  : "Use Publish Everywhere to create campaign reporting signals.",
              ].map((action, index) => (
                <div
                  key={action}
                  className="flex items-start gap-3 rounded-xl p-3"
                  style={{
                    background: darkMode ? "rgba(29,78,216,0.06)" : "rgba(29,78,216,0.04)",
                  }}
                >
                  <div
                    className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB)" }}
                  >
                    {index + 1}
                  </div>
                  <p className="text-sm" style={{ color: textMuted }}>
                    {action}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {emailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div
              className="w-full max-w-lg rounded-2xl border p-5 shadow-2xl"
              style={{
                background: darkMode ? "rgba(15,23,42,0.98)" : "#ffffff",
                borderColor: darkMode ? "rgba(29,78,216,0.18)" : "rgba(15,23,42,0.08)",
              }}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold" style={{ color: textPrimary }}>
                    Email Report
                  </h3>
                  <p className="mt-1 text-xs" style={{ color: textSoft }}>
                    Login email gets a copy by default. Add extra recipients for owner, sales, marketing or accounts team.
                  </p>
                </div>
                <button
                  onClick={() => setEmailModalOpen(false)}
                  className="rounded-lg px-2 py-1 text-xs"
                  style={{ color: textMuted }}
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm" style={{ color: textMuted }}>
                  <input
                    type="checkbox"
                    checked={sendCopyToMe}
                    onChange={(event) => setSendCopyToMe(event.target.checked)}
                  />
                  Send copy to login email
                </label>

                <div>
                  <label className="mb-1 block text-xs" style={{ color: textSoft }}>
                    Extra recipients
                  </label>
                  <input
                    value={emailRecipients}
                    onChange={(event) => setEmailRecipients(event.target.value)}
                    placeholder="owner@company.com, sales@company.com"
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    style={{
                      background: darkMode ? "rgba(29,78,216,0.06)" : "#f8fafc",
                      borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
                      color: textPrimary,
                    }}
                  />
                  <p className="mt-1 text-xs" style={{ color: textSoft }}>
                    Use comma-separated emails.
                  </p>
                </div>

                <div
                  className="rounded-xl border p-3 text-xs"
                  style={{
                    background: darkMode ? "rgba(29,78,216,0.06)" : "rgba(29,78,216,0.04)",
                    borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
                    color: textMuted,
                  }}
                >
                  <strong style={{ color: textPrimary }}>Subject:</strong> RS Real Estate {activeReport} Business Report
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setEmailModalOpen(false)}
                    className="flex-1 rounded-xl border px-4 py-2 text-sm"
                    style={{
                      borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.08)",
                      color: textMuted,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEmailReport}
                    disabled={emailSending}
                    className="flex-1 rounded-xl px-4 py-2 text-sm font-medium text-white"
                    style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB)" }}
                  >
                    {emailSending ? "Sending..." : "Send Report"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function LoaderBadge() {
  return (
    <span className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs" style={{ color: "#1D4ED8", background: "rgba(29,78,216,0.10)" }}>
      <Clock size={11} /> Loading
    </span>
  );
}
